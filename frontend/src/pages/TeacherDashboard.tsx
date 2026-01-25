import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { uploadVideoInChunks } from '../api/upload';
import { LayoutGrid, FileText, Send, CheckCircle, Eye, PlusCircle, Pencil, Trash2, X, Search, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export const TeacherDashboard = () => {
  const [title, setTitle] = useState('');
  const [group, setGroup] = useState('入门组');
  const [category, setCategory] = useState('数据结构');
  const [contentMd, setContentMd] = useState('');
  const [status, setStatus] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Problem form state
  const [knowledgePoints, setKnowledgePoints] = useState<any[]>([]);
  const [selectedKpId, setSelectedKpId] = useState('');
  const [problemTitle, setProblemTitle] = useState('');
  const [problemContent, setProblemContent] = useState('');
  const [templateCpp, setTemplateCpp] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [problemStatus, setProblemStatus] = useState('');

  // Editing state
  const [editingKp, setEditingKp] = useState<any>(null);
  const [editingProblem, setEditingProblem] = useState<any>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const [kpProblems, setKpProblems] = useState<any[]>([]);

  useEffect(() => {
    fetchKPs();
  }, []);

  useEffect(() => {
    if (selectedKpId) {
      fetchProblemsForKp(parseInt(selectedKpId));
    } else {
      setKpProblems([]);
    }
  }, [selectedKpId]);

  const fetchKPs = async () => {
    try {
      const res = await client.get('/knowledge');
      setKnowledgePoints(res.data);
    } catch (err) {
      console.error('Failed to fetch KPs');
    }
  };

  const fetchProblemsForKp = async (kpId: number) => {
    try {
      const res = await client.get(`/knowledge/${kpId}`);
      setKpProblems(res.data.problems || []);
    } catch (err) {
      console.error('Failed to fetch problems');
    }
  };

  const handleCreateKP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKp) {
        await client.patch(`/knowledge/${editingKp.id}`, { title, group, category, contentMd });
        setStatus('知识点更新成功！');
        setEditingKp(null);
      } else {
        await client.post('/knowledge', { title, group, category, contentMd });
        setStatus('知识点创建成功！');
      }
      setTitle('');
      setContentMd('');
      setCategory('数据结构');
      setGroup('入门组');
      fetchKPs();
    } catch (err) {
      setStatus(editingKp ? '更新失败，请检查权限。' : '创建失败，请检查权限。');
    }
  };

  const handleEditKP = (kp: any) => {
    setEditingKp(kp);
    setTitle(kp.title);
    setGroup(kp.group);
    setCategory(kp.category);
    // Note: We need full content for editing, let's fetch it
    fetchFullKP(kp.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchFullKP = async (id: number) => {
    try {
      const res = await client.get(`/knowledge/${id}`);
      setContentMd(res.data.contentMd || '');
    } catch (err) {
      console.error('Failed to fetch full KP');
    }
  };

  const handleDeleteKP = async (id: number) => {
    if (!window.confirm('确定要删除这个知识点吗？相关的所有例题也会被删除。')) return;
    try {
      await client.delete(`/knowledge/${id}`);
      fetchKPs();
    } catch (err) {
      alert('删除失败，请检查权限。');
    }
  };

  const cancelEdit = () => {
    setEditingKp(null);
    setTitle('');
    setContentMd('');
    setCategory('数据结构');
    setGroup('入门组');
  };

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKpId) return;
    try {
      let videoUrl = editingProblem?.videoUrl || '';
      if (videoFile) {
        setProblemStatus('准备上传...');
        setUploadPercent(1);
        videoUrl = await uploadVideoInChunks(videoFile, (percent) => {
          setUploadPercent(percent);
          if (percent === 100) {
            setIsProcessing(true);
            setProblemStatus('视频分片上传完成，正在合并转码 HLS (请勿刷新)...');
          } else {
            setProblemStatus(`视频分片上传中 (${percent}%)...`);
          }
        });
        setIsProcessing(false);
      }

      setProblemStatus('视频处理完成，正在保存题目信息...');

      if (editingProblem) {
        await client.patch(`/knowledge/problems/${editingProblem.id}`, {
          title: problemTitle,
          contentMd: problemContent,
          templateCpp,
          videoUrl
        });
        setProblemStatus('例题更新成功！');
        setEditingProblem(null);
      } else {
        await client.post(`/knowledge/${selectedKpId}/problems`, {
          title: problemTitle,
          contentMd: problemContent,
          templateCpp,
          videoUrl
        });
        setProblemStatus('例题添加成功！');
      }

      setProblemTitle('');
      setProblemContent('');
      setTemplateCpp('');
      setVideoFile(null);
      setUploadPercent(0);
      // Reset file input
      const fileInput = document.getElementById('video-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchProblemsForKp(parseInt(selectedKpId));
    } catch (err) {
      setProblemStatus('操作失败，请检查输入或权限。');
      setUploadPercent(0);
      setIsProcessing(false);
    }
  };

  const handleEditProblem = (prob: any) => {
    setEditingProblem(prob);
    setProblemTitle(prob.title);
    setProblemContent(prob.contentMd);
    setTemplateCpp(prob.templateCpp || '');
    setVideoFile(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleDeleteProblem = async (id: number) => {
    if (!window.confirm('确定要删除这个例题吗？')) return;
    try {
      await client.delete(`/knowledge/problems/${id}`);
      if (selectedKpId) fetchProblemsForKp(parseInt(selectedKpId));
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleRemoveVideo = async () => {
    if (!editingProblem) return;
    if (!window.confirm('确定要删除当前例题的视频吗？')) return;
    try {
      await client.patch(`/knowledge/problems/${editingProblem.id}`, { videoUrl: null });
      setEditingProblem({ ...editingProblem, videoUrl: null });
      setProblemStatus('视频已移除');
      if (selectedKpId) fetchProblemsForKp(parseInt(selectedKpId));
    } catch (err) {
      alert('删除失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <LayoutGrid className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">教研管理后台</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" /> {editingKp ? '编辑知识点' : '发布新知识点'}
            </h2>
            <div className="flex gap-2">
              {editingKp && (
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                >
                  <X className="h-4 w-4" /> 取消编辑
                </button>
              )}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full transition ${showPreview ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Eye className="h-4 w-4" /> {showPreview ? '编辑内容' : '实时预览'}
              </button>
            </div>
          </div>

          {showPreview ? (
            <div className="prose prose-blue max-w-none p-4 bg-gray-50 rounded-lg border min-h-[400px]">
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                {contentMd || '*还没有输入任何内容...*'}
              </ReactMarkdown>
            </div>
          ) : (
            <form onSubmit={handleCreateKP} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">标题</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="如：线段树进阶"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">分类</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="如：图论"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">组别</label>
                <select
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                >
                  <option value="入门组">入门组</option>
                  <option value="提高组">提高组</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Markdown 内容</label>
                <textarea
                  className="w-full h-96 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  value={contentMd}
                  onChange={(e) => setContentMd(e.target.value)}
                  placeholder="支持 Markdown 和 LaTeX 语法，如 $E = mc^2$ 或 $$\sum_{i=1}^n i$$..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100"
              >
                <Send className="h-5 w-5" /> {editingKp ? '保存修改' : '发布内容'}
              </button>
            </form>
          )}

          {status && (
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <CheckCircle className="h-4 w-4" /> {status}
            </div>
          )}

          <div className="border-t pt-8 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-gray-400" /> 知识点管理
              </h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索知识点..."
                  className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {knowledgePoints
                .filter(kp =>
                  kp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  kp.category.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((kp) => (
                  <div key={kp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 group">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{kp.category}</span>
                        <h3 className="font-bold text-gray-900">{kp.title}</h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{kp.group}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleEditKP(kp)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition"
                        title="编辑"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteKP(kp.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-full transition"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="border-t pt-8 mt-8">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <PlusCircle className="h-5 w-5 text-gray-400" /> {editingProblem ? '编辑例题' : '为知识点添加例题'}
            </h2>
            <form onSubmit={handleCreateProblem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">所属知识点</label>
                <select
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                  value={selectedKpId}
                  onChange={(e) => setSelectedKpId(e.target.value)}
                  disabled={!!editingProblem}
                  required
                >
                  <option value="">请选择知识点...</option>
                  {knowledgePoints.map((kp) => (
                    <option key={kp.id} value={kp.id}>
                      {kp.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">例题标题</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={problemTitle}
                  onChange={(e) => setProblemTitle(e.target.value)}
                  placeholder="如：P3372 【模板】线段树 1"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">题目描述 (Markdown)</label>
                <textarea
                  className="w-full h-48 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  value={problemContent}
                  onChange={(e) => setProblemContent(e.target.value)}
                  placeholder="输入题目描述、输入输出格式、样例等..."
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">模板代码 (C++)</label>
                <textarea
                  className="w-full h-48 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  value={templateCpp}
                  onChange={(e) => setTemplateCpp(e.target.value)}
                  placeholder="提供标准的 C++ 代码模板或参考答案..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">讲解视频 (MP4/WebM)</label>
                <div className="flex items-center gap-4">
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {editingProblem?.videoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="text-xs text-red-600 hover:underline"
                    >
                      删除现有视频
                    </button>
                  )}
                </div>
                {editingProblem?.videoUrl && !videoFile && (
                  <p className="text-xs text-gray-400 mt-1">当前视频: {editingProblem.videoUrl}</p>
                )}
                
                {uploadPercent > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-blue-600">
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {isProcessing ? '后台合并转码中，请耐心等待...' : `视频分片上传中 (${uploadPercent}%)`}
                      </span>
                      <span>{isProcessing ? '处理中' : `${uploadPercent}%`}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                      <div 
                        className={`h-full transition-all duration-300 ease-out ${isProcessing ? 'bg-orange-500 animate-pulse' : 'bg-blue-600'}`}
                        style={{ width: isProcessing ? '100%' : `${uploadPercent}%` }}
                      />
                    </div>
                    {isProcessing && (
                      <p className="text-[10px] text-gray-400 italic">大文件转码可能需要 1-2 分钟，请勿关闭页面</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={(uploadPercent > 0 && uploadPercent < 100) || isProcessing}
                  className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-lg ${
                    (uploadPercent > 0 && uploadPercent < 100) || isProcessing
                      ? 'bg-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-green-100'
                  }`}
                >
                  <PlusCircle className="h-5 w-5" /> {editingProblem ? '保存例题修改' : '添加例题'}
                </button>
                {editingProblem && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProblem(null);
                      setProblemTitle('');
                      setProblemContent('');
                      setTemplateCpp('');
                      setVideoFile(null);
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition"
                  >
                    取消
                  </button>
                )}
              </div>
            </form>
            {problemStatus && (
              <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" /> {problemStatus}
              </div>
            )}

            {kpProblems.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="font-bold text-gray-900 border-l-4 border-green-500 pl-3">该知识点下的例题管理</h3>
                <div className="space-y-2">
                  {kpProblems.map(prob => (
                    <div key={prob.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-700">{prob.title}</span>
                        {prob.videoUrl && (
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">有视频</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditProblem(prob)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProblem(prob.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-600 rounded-xl p-6 text-white space-y-4">
            <h3 className="font-bold text-lg">教学小贴士</h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              发布知识点时，请尽量使用结构化的 Markdown 标题。如果标题中包含“线段树”字样，系统将自动在详情页启用交互式演示器。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
