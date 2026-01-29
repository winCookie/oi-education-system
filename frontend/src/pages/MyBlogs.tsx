import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit, Trash2, Eye, Send, FileText } from 'lucide-react';
import client from '../api/client';

interface Post {
  id: number;
  title: string;
  status: string;
  category?: { name: string };
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  rejectReason?: string;
}

export const MyBlogs = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = activeTab ? { status: activeTab } : {};
      const response = await client.get('/blog/posts/my', { params });
      setPosts(response.data);
    } catch (err) {
      console.error('获取文章列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这篇文章吗？')) return;

    try {
      await client.delete(`/blog/posts/${id}`);
      fetchPosts();
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  const handleSubmit = async (id: number) => {
    if (!confirm('确定要提交审核吗？')) return;

    try {
      await client.post(`/blog/posts/${id}/submit`);
      fetchPosts();
      alert('提交成功！');
    } catch (err: any) {
      alert(err.response?.data?.message || '提交失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; className: string } } = {
      draft: { text: '草稿', className: 'bg-gray-100 text-gray-700' },
      pending: { text: '待审核', className: 'bg-yellow-100 text-yellow-700' },
      published: { text: '已发布', className: 'bg-green-100 text-green-700' },
      rejected: { text: '已拒绝', className: 'bg-red-100 text-red-700' },
      archived: { text: '已下架', className: 'bg-gray-100 text-gray-500' },
    };

    const badge = statusMap[status] || statusMap.draft;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">我的文章</h1>
          <Link
            to="/blog/editor"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit className="h-5 w-5" />
            写文章
          </Link>
        </div>

        {/* 选项卡 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['', 'draft', 'pending', 'published', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab === '' ? '全部' : tab === 'draft' ? '草稿' : tab === 'pending' ? '待审核' : tab === 'published' ? '已发布' : '已拒绝'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">还没有文章</p>
            <Link
              to="/blog/editor"
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="h-5 w-5" />
              创建第一篇文章
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    统计
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{post.title}</div>
                        {post.category && (
                          <div className="text-sm text-gray-500">{post.category.name}</div>
                        )}
                        {post.rejectReason && (
                          <div className="mt-1 text-sm text-red-600">
                            拒绝原因：{post.rejectReason}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(post.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>{post.viewCount} 阅读</div>
                        <div>{post.likeCount} 点赞</div>
                        <div>{post.commentCount} 评论</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {post.status === 'published' ? (
                          <Link
                            to={`/blog/${post.id}`}
                            className="text-blue-600 hover:text-blue-700"
                            title="查看"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                        ) : (
                          <>
                            <button
                              onClick={() => navigate(`/blog/editor/${post.id}`)}
                              className="text-blue-600 hover:text-blue-700"
                              title="编辑"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            {post.status === 'draft' && (
                              <button
                                onClick={() => handleSubmit(post.id)}
                                className="text-green-600 hover:text-green-700"
                                title="提交审核"
                              >
                                <Send className="h-5 w-5" />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600 hover:text-red-700"
                          title="删除"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
