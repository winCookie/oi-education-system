import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface TreeNode {
  id: string;
  l: number;
  r: number;
  val: number;
  lazy?: number; // Added Lazy Tag support
  children: TreeNode[];
  isActive?: boolean;
  isHighlighted?: boolean;
}

interface Step {
  tree: TreeNode;
  description: string;
  currentCodeLine?: number;
}

export const SegmentTreeVisualizer = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [array] = useState<number[]>([1, 5, 4, 2, 3]);
  const [targetRange] = useState({ l: 1, r: 3 }); // 1-indexed for students
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // For Time Travel
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeOp, setActiveOp] = useState<'query' | 'update' | 'rangeUpdate'>('query');

  // Build the initial tree
  const buildTree = (l: number, r: number, arr: number[]): TreeNode => {
    const id = `${l}-${r}`;
    if (l === r) {
      return { id, l, r, val: arr[l - 1], lazy: 0, children: [] };
    }
    const mid = Math.floor((l + r) / 2);
    const left = buildTree(l, mid, arr);
    const right = buildTree(mid + 1, r, arr);
    return {
      id,
      l,
      r,
      val: left.val + right.val,
      lazy: 0,
      children: [left, right],
    };
  };

  const treeData = useMemo(() => buildTree(1, array.length, array), [array]);

  // Generate steps for query or update
  useEffect(() => {
    const generatedSteps: Step[] = [];
    const recordStep = (currentTree: TreeNode, nodeId: string, line: number, desc: string, highlightIds: string[] = []) => {
      const markActive = (n: TreeNode): TreeNode => ({
        ...n,
        isActive: n.id === nodeId,
        isHighlighted: highlightIds.includes(n.id) || n.id === nodeId,
        children: n.children.map(markActive),
      });
      generatedSteps.push({
        tree: markActive(currentTree),
        description: desc,
        currentCodeLine: line,
      });
    };

    if (activeOp === 'query') {
      const runQuery = (node: TreeNode, L: number, R: number) => {
        recordStep(treeData, node.id, 1, `开始查询节点 [${node.l}, ${node.r}]`);
        if (L <= node.l && node.r <= R) {
          recordStep(treeData, node.id, 2, `节点 [${node.l}, ${node.r}] 完全包含在查询区间 [${L}, ${R}] 内，返回结果！`, [node.id]);
          return;
        }
        recordStep(treeData, node.id, 3, `计算中间点 mid = ${Math.floor((node.l + node.r) / 2)}`);
        const mid = Math.floor((node.l + node.r) / 2);
        if (L <= mid) runQuery(node.children[0], L, R);
        if (R > mid) runQuery(node.children[1], L, R);
        recordStep(treeData, node.id, 4, `节点 [${node.l}, ${node.r}] 的子树查询完成`);
      };
      runQuery(treeData, 1, 3);
    } else if (activeOp === 'update') {
      // Point Update logic (e.g., set index 3 to value 10)
      const targetIdx = 3;
      const newVal = 10;

      const runUpdate = (node: TreeNode): TreeNode => {
        recordStep(node, node.id, 1, `访问节点 [${node.l}, ${node.r}] 以更新索引 ${targetIdx}`);
        if (node.l === node.r) {
          const updatedNode = { ...node, val: newVal };
          recordStep(updatedNode, node.id, 2, `到达叶子节点，将值修改为 ${newVal}`);
          return updatedNode;
        }

        recordStep(node, node.id, 3, `计算中间点 mid = ${Math.floor((node.l + node.r) / 2)}`);
        const mid = Math.floor((node.l + node.r) / 2);
        let left = node.children[0];
        let right = node.children[1];

        if (targetIdx <= mid) {
          left = runUpdate(node.children[0]);
        } else {
          right = runUpdate(node.children[1]);
        }

        const updatedParent = {
          ...node,
          val: left.val + right.val,
          children: [left, right]
        };
        recordStep(updatedParent, node.id, 4, `回溯更新节点 [${node.l}, ${node.r}] 的值为子节点之和 ${updatedParent.val}`);
        return updatedParent;
      };
      runUpdate(treeData);
    } else if (activeOp === 'rangeUpdate') {
      // Range Update logic (e.g., add 2 to range [2, 4])
      const L = 2, R = 4, val = 2;

      const runRangeUpdate = (node: TreeNode): TreeNode => {
        recordStep(node, node.id, 1, `区间修改 [${L}, ${R}]: 访问节点 [${node.l}, ${node.r}]`);

        if (L <= node.l && node.r <= R) {
          const updatedNode = {
            ...node,
            val: node.val + (node.r - node.l + 1) * val,
            lazy: (node.lazy || 0) + val
          };
          recordStep(updatedNode, node.id, 2, `节点完全包含！更新节点值并打上 Lazy Tag: ${updatedNode.lazy}`, [node.id]);
          return updatedNode;
        }

        recordStep(node, node.id, 3, `下推 Lazy Tag (Pushdown) 并递归子节点`);
        const mid = Math.floor((node.l + node.r) / 2);
        let left = node.children[0];
        let right = node.children[1];

        if (L <= mid) left = runRangeUpdate(left);
        if (R > mid) right = runRangeUpdate(right);

        const updatedParent = {
          ...node,
          val: left.val + right.val,
          children: [left, right]
        };
        recordStep(updatedParent, node.id, 4, `回溯合并子节点信息`);
        return updatedParent;
      };
      runRangeUpdate(treeData);
    }

    setSteps(generatedSteps);
    setCurrentStepIdx(0);
    setIsPlaying(false);
  }, [treeData, activeOp]);

  const currentStep = steps[currentStepIdx] || { tree: treeData, description: '准备开始...', currentCodeLine: 0 };

  // Auto-play
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  // Handle D3 Rendering
  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', 'translate(40, 40)');

    const treeLayout = d3.tree<TreeNode>().size([width - 80, height - 100]);
    const root = d3.hierarchy(currentStep.tree);
    const nodes = treeLayout(root);

    // Links
    g.selectAll('.link')
      .data(nodes.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkVertical<any, any>().x(d => d.x).y(d => d.y))
      .attr('fill', 'none')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 2);

    // Nodes
    const nodeGroup = g.selectAll('.node')
      .data(nodes.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        const id = d.data.id;
        setSelectedNodes(prev =>
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
      });

    nodeGroup.append('circle')
      .attr('r', 25)
      .attr('fill', d => {
        if (d.data.isActive) return '#fef08a'; // Yellow for current active
        if (selectedNodes.includes(d.data.id)) return '#3b82f6';
        if (d.data.isHighlighted) return '#dbeafe'; // Light blue for visited
        return '#fff';
      })
      .attr('stroke', d => d.data.isActive ? '#eab308' : (selectedNodes.includes(d.data.id) ? '#2563eb' : '#3b82f6'))
      .attr('stroke-width', d => d.data.isActive ? 4 : 2);

    nodeGroup.append('text')
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('class', 'text-sm font-bold')
      .attr('fill', d => selectedNodes.includes(d.data.id) ? '#fff' : '#1e293b')
      .text(d => d.data.val);

    nodeGroup.append('text')
      .attr('dy', '2.5em')
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[10px] fill-gray-400')
      .text(d => `[${d.data.l}, ${d.data.r}]`);

    // Lazy Tag Badge
    const lazyNodes = nodeGroup.filter(d => !!d.data.lazy);
    lazyNodes.append('rect')
      .attr('x', 15)
      .attr('y', -35)
      .attr('width', 30)
      .attr('height', 16)
      .attr('rx', 8)
      .attr('fill', '#ef4444');

    lazyNodes.append('text')
      .attr('x', 30)
      .attr('y', -24)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-[9px] font-bold fill-white')
      .text(d => `+${d.data.lazy}`);

  }, [currentStep, selectedNodes]);

  const checkAnswer = () => {
    // Correct nodes for range query [L, R] are the canonical nodes
    const getCanonicalNodes = (node: TreeNode, L: number, R: number): string[] => {
      if (node.l >= L && node.r <= R) return [node.id];
      const mid = Math.floor((node.l + node.r) / 2);
      let result: string[] = [];
      if (L <= mid && node.children[0]) result = result.concat(getCanonicalNodes(node.children[0], L, R));
      if (R > mid && node.children[1]) result = result.concat(getCanonicalNodes(node.children[1], L, R));
      return result;
    };

    const correctIds = getCanonicalNodes(treeData, targetRange.l, targetRange.r);
    const isCorrect = correctIds.length === selectedNodes.length && correctIds.every(id => selectedNodes.includes(id));

    if (isCorrect) {
      setFeedback({ type: 'success', msg: '回答正确！你已经掌握了区间查询的节点选择。' });
    } else {
      setFeedback({ type: 'error', msg: '不对哦，请检查是否选择了最简（最大）的覆盖区间。' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-800">互动练习：标记分值区间</p>
          <p className="text-lg font-bold text-blue-900">请在下图中点击选中所有能完美覆盖区间 <span className="underline">[{targetRange.l}, {targetRange.r}]</span> 的节点。</p>
        </div>
        <button
          onClick={checkAnswer}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-md"
        >
          提交反馈
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-medium">{feedback.msg}</span>
        </div>
      )}

      <div className="relative bg-white border rounded-xl overflow-hidden shadow-inner h-[450px] flex items-center justify-center">
        <svg ref={svgRef} width="800" height="400" className="mx-auto" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-blue-600" /> 算法过程溯源 (Time Travel)
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setActiveOp('query')}
                className={`text-xs px-3 py-1 rounded-full border transition ${activeOp === 'query' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
              >
                区间查询 [1, 3]
              </button>
              <button
                onClick={() => setActiveOp('update')}
                className={`text-xs px-3 py-1 rounded-full border transition ${activeOp === 'update' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
              >
                点更新 (idx: 3, val: 10)
              </button>
              <button
                onClick={() => setActiveOp('rangeUpdate')}
                className={`text-xs px-3 py-1 rounded-full border transition ${activeOp === 'rangeUpdate' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
              >
                区间修改 [2, 4] (+2)
              </button>
            </div>
            <p className="text-sm text-gray-500">{currentStep.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStepIdx(0)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <RotateCcw className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-full ${isPlaying ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>
            <button
              onClick={() => setCurrentStepIdx(Math.min(steps.length - 1, currentStepIdx + 1))}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300">
          {activeOp === 'query' ? (
            <>
              <div className={`flex gap-4 ${currentStep.currentCodeLine === 1 ? 'bg-blue-900/50 text-blue-200 border-l-2 border-blue-500' : ''}`}>
                <div className="text-gray-600 text-right w-8">1</div>
                <div>void query(int node, int l, int r, int L, int R) {'{'}</div>
              </div>
              <div className={`flex gap-4 ${currentStep.currentCodeLine === 2 ? 'bg-blue-900/50 text-blue-200 border-l-2 border-blue-500' : ''}`}>
                <div className="text-gray-600 text-right w-8">2</div>
                <div>    if (L {'<='} l && r {'<='} R) return tree[node];</div>
              </div>
              <div className={`flex gap-4 ${currentStep.currentCodeLine === 3 ? 'bg-blue-900/50 text-blue-200 border-l-2 border-blue-500' : ''}`}>
                <div className="text-gray-600 text-right w-8">3</div>
                <div>    int mid = (l + r) / 2;</div>
              </div>
              <div className={`flex gap-4 ${currentStep.currentCodeLine === 4 ? 'bg-blue-900/50 text-blue-200 border-l-2 border-blue-500' : ''}`}>
                <div className="text-gray-600 text-right w-8">4</div>
                <div>    // ... 递归逻辑 ...</div>
              </div>
            </>
          ) : activeOp === 'update' ? (
            <>
              <div className={`flex gap-4 ${currentStep.currentCodeLine === 1 ? 'bg-blue-900/50 text-blue-200 border-l-2 border-blue-500' : ''}`}>
                <div className="text-gray-600 text-right w-8">1</div>
                <div>void update(int node, int l, int r, int idx, int val) {'{'}</div>
              </div>
              <div className={`flex gap-4 ${currentStep.currentCodeLine === 2 ? 'bg-blue-900/50 text-blue-200 border-l-2 border-blue-500' : ''}`}>
                <div className="text-gray-600 text-right w-8">2</div>
                <div>    if (l == r) {'{'} tree[node] = val; return; {'}'}</div>
              </div>
              <div className={`flex gap-4 ${currentStep.currentCodeLine === 3 ? 'bg-blue-900/50 text-blue-200 border-l-2 border-blue-500' : ''}`}>
                <div className="text-gray-600 text-right w-8">3</div>
                <div>    int mid = (l + r) / 2;</div>
              </div>
              <div className={`flex gap-4 ${currentStep.currentCodeLine === 4 ? 'bg-blue-900/50 text-blue-200 border-l-2 border-blue-500' : ''}`}>
                <div className="text-gray-600 text-right w-8">4</div>
                <div>    tree[node] = tree[lc] + tree[rc];</div>
              </div>
            </>
          ) : (
            <>
              <div className={`flex gap-4 ${currentStep.currentCodeLine === 1 ? 'bg-blue-900/50 text-blue-200 border-l-2 border-blue-500' : ''}`}>
                <div className="text-gray-600 text-right w-8">1</div>
                <div>void update(int node, int l, int r, int L, int R, int val) {'{'}</div>
              </div>
              <div className={`flex gap-4 ${currentStep.currentCodeLine === 2 ? 'bg-blue-900/50 text-blue-200 border-l-2 border-blue-500' : ''}`}>
                <div className="text-gray-600 text-right w-8">2</div>
                <div>    if (L {'<='} l && r {'<='} R) {'{'} tree[node].val += (r-l+1)*val; tree[node].lazy += val; return; {'}'}</div>
              </div>
              <div className={`flex gap-4 ${currentStep.currentCodeLine === 3 ? 'bg-blue-900/50 text-blue-200 border-l-2 border-blue-500' : ''}`}>
                <div className="text-gray-600 text-right w-8">3</div>
                <div>    pushdown(node); int mid = (l+r)/2; update(lc, l, mid, L, R, val); ...</div>
              </div>
              <div className={`flex gap-4 ${currentStep.currentCodeLine === 4 ? 'bg-blue-900/50 text-blue-200 border-l-2 border-blue-500' : ''}`}>
                <div className="text-gray-600 text-right w-8">4</div>
                <div>    pushup(node);</div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
    <input
      type="range"
      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      min="0"
      max={steps.length - 1}
      value={currentStepIdx}
      onChange={(e) => setCurrentStepIdx(parseInt(e.target.value))}
    />
    <span className="text-xs font-mono text-gray-500 w-12 text-right">
      {currentStepIdx + 1} / {steps.length}
    </span>
  </div>
      </div >
    </div >
  );
};

const AlertCircle = ({ className }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);

const PlayCircle = ({ className }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
);
