import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileCode, Book, PlayCircle, CheckCircle, Video, Lock } from 'lucide-react';
import { SegmentTreeVisualizer } from '../components/Visualizer/SegmentTree';
import Hls from 'hls.js';

interface Problem {
  id: number;
  title: string;
  contentMd: string;
  templateCpp: string;
  videoUrl?: string;
  videoUpdatedAt?: string;
}

interface Point {
  id: number;
  title: string;
  category: string;
  contentMd: string;
  problems: Problem[];
}

export const PointDetail = () => {
  const { id } = useParams();
  const [point, setPoint] = useState<Point | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'visualizer' | 'problems'>('content');
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const canWatchVideo = user && (user.role === 'student' || user.role === 'teacher' || user.role === 'admin');

  useEffect(() => {
    const fetchPoint = async () => {
      try {
        const res = await client.get(`/knowledge/${id}`);
        setPoint(res.data);
        // Default to visualizer if it's segment tree
        if (res.data.title.includes('线段树')) {
          setActiveTab('visualizer');
        }

        // Check completion status if logged in
        const token = localStorage.getItem('token');
        if (token) {
          const progressRes = await client.get('/progress');
          const completed = progressRes.data.some((p: any) => p.knowledgePoint.id === Number(id));
          setIsCompleted(completed);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPoint();
  }, [id]);

  const handleMarkAsCompleted = async () => {
    if (isCompleted || completing) return;
    setCompleting(true);
    try {
      await client.post(`/progress/${id}/complete`);
      setIsCompleted(true);
    } catch (err) {
      console.error('Failed to mark as completed');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!point) return <div>未找到该内容</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
          <span>{point.category}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{point.title}</h1>
          <button
            onClick={handleMarkAsCompleted}
            disabled={isCompleted || completing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${isCompleted
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md active:transform active:scale-95'
              }`}
          >
            <CheckCircle className={`h-5 w-5 ${isCompleted ? 'text-green-600' : 'text-white'}`} />
            {isCompleted ? '已掌握' : completing ? '提交中...' : '标记为已掌握'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'content' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Book className="h-4 w-4" /> 知识详解
          </button>
          {point.title.includes('线段树') && (
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'visualizer' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <PlayCircle className="h-4 w-4" /> 互动演示
            </button>
          )}
          <button
            onClick={() => setActiveTab('problems')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'problems' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <FileCode className="h-4 w-4" /> 例题与代码
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm min-h-[400px]">
        {activeTab === 'content' && (
          <article className="prose prose-blue max-w-none">
            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
              {point.contentMd || '暂无内容'}
            </ReactMarkdown>
          </article>
        )}

        {activeTab === 'visualizer' && (
          <SegmentTreeVisualizer />
        )}

        {activeTab === 'problems' && (
          <div className="space-y-12">
            {point.problems.length > 0 ? (
              point.problems.map((prob) => (
                <div key={prob.id} className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-blue-600 pl-4">{prob.title}</h3>
                  <div className="prose prose-blue max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {prob.contentMd}
                    </ReactMarkdown>
                  </div>

                  {prob.videoUrl && (
                    <div className="space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <Video className="h-4 w-4 text-blue-600" /> 讲解视频
                          {prob.videoUpdatedAt && (
                            <span className="text-[10px] font-normal text-gray-400 ml-2">
                              更新于: {new Date(prob.videoUpdatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {!canWatchVideo && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                            <Lock className="h-3 w-3" /> 仅限学生账号
                          </span>
                        )}
                      </div>
                      
                      {canWatchVideo ? (
                        <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
                          {prob.videoUrl.endsWith('.m3u8') ? (
                            <HlsPlayer src={`http://localhost:3000${prob.videoUrl}`} />
                          ) : (
                            <video 
                              src={`http://localhost:3000${prob.videoUrl}`} 
                              controls 
                              className="w-full h-full"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video rounded-xl bg-gray-200 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300">
                          <div className="bg-white p-3 rounded-full shadow-sm">
                            <Lock className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-sm font-bold text-gray-500">视频仅限学生账号观看</p>
                          <Link to="/login" className="text-xs text-blue-600 hover:underline">立即登录</Link>
                        </div>
                      )}
                    </div>
                  )}

                  {prob.templateCpp && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Code className="h-4 w-4" /> 模板代码 (C++)
                      </div>
                      <SyntaxHighlighter language="cpp" style={oneLight} className="rounded-lg border">
                        {prob.templateCpp}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">暂无相关例题</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Code = ({ className, children }: any) => <code className={className}>{children}</code>;

const HlsPlayer = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => {
        hls.destroy();
      };
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      className="w-full h-full"
      playsInline
    />
  );
};
