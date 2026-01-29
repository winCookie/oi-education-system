import { useState, useEffect } from 'react';
import { Check, X, Eye, User, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import client from '../api/client';

interface Post {
  id: number;
  title: string;
  content: string;
  summary: string;
  author: {
    username: string;
    nickname?: string;
  };
  category?: { name: string };
  tags: { name: string }[];
  submittedAt: string;
}

export const BlogReview = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  const fetchPendingPosts = async () => {
    setLoading(true);
    try {
      const response = await client.get('/blog/posts/pending');
      setPosts(response.data);
    } catch (err) {
      console.error('获取待审核文章失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('确定通过审核吗？')) return;

    try {
      await client.post(`/blog/posts/${id}/approve`);
      alert('审核通过！');
      fetchPendingPosts();
      setSelectedPost(null);
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleReject = async () => {
    if (!selectedPost) return;
    if (!rejectReason.trim()) {
      alert('请输入拒绝原因');
      return;
    }

    try {
      await client.post(`/blog/posts/${selectedPost.id}/reject`, { reason: rejectReason });
      alert('已拒绝！');
      fetchPendingPosts();
      setSelectedPost(null);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">文章审核</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                待审核文章 ({posts.length})
              </h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : posts.length === 0 ? (
                <p className="text-gray-600 text-center py-8">暂无待审核文章</p>
              ) : (
                <div className="space-y-2">
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedPost?.id === post.id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-gray-900 line-clamp-2 mb-1">
                        {post.title}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {post.author.nickname || post.author.username}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(post.submittedAt).toLocaleString('zh-CN')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧预览 */}
          <div className="lg:col-span-2">
            {selectedPost ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedPost.title}</h2>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {selectedPost.author.nickname || selectedPost.author.username}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedPost.submittedAt).toLocaleString('zh-CN')}
                    </div>
                    {selectedPost.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {selectedPost.category.name}
                      </span>
                    )}
                  </div>

                  {selectedPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedPost.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="prose prose-sm max-w-none mb-6">
                  <ReactMarkdown>{selectedPost.content}</ReactMarkdown>
                </div>

                <div className="pt-6 border-t border-gray-200 flex gap-4">
                  <button
                    onClick={() => handleApprove(selectedPost.id)}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Check className="h-5 w-5" />
                    通过
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <X className="h-5 w-5" />
                    拒绝
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">请选择一篇文章进行审核</p>
              </div>
            )}
          </div>
        </div>

        {/* 拒绝原因模态框 */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">拒绝原因</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="mt-4 flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  确认拒绝
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
