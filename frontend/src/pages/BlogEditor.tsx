import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import { Save, Send, AlertCircle } from 'lucide-react';
import client from '../api/client';

interface Category {
  id: number;
  name: string;
}

export const BlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [autoSaveTimer, setAutoSaveTimer] = useState<number | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isTeacherOrAdmin = user.role === 'teacher' || user.role === 'admin';

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchPost();
    }
  }, [id]);

  // 自动保存
  useEffect(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    if (title || content) {
      const timer = setTimeout(() => {
        if (id) {
          autoSaveDraft();
        }
      }, 30000); // 30秒自动保存

      setAutoSaveTimer(timer);
    }

    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [title, content, categoryId, tags]);

  const fetchCategories = async () => {
    try {
      const response = await client.get('/blog/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('获取分类失败:', err);
    }
  };

  const fetchPost = async () => {
    try {
      const response = await client.get(`/blog/posts/${id}`);
      const post = response.data;
      
      // 检查是否是当前用户的文章
      if (post.author.id !== user.id && user.role !== 'admin') {
        setError('您无权编辑此文章');
        setTimeout(() => navigate('/blog/my'), 2000);
        return;
      }
      
      setTitle(post.title);
      setContent(post.content);
      setCategoryId(post.category?.id || null);
      setTags(post.tags?.map((t: any) => t.name) || []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || '加载文章失败';
      setError(errorMsg);
      
      // 如果是权限错误，2秒后跳转到我的文章
      if (err.response?.status === 403) {
        setTimeout(() => navigate('/blog/my'), 2000);
      }
    }
  };

  const autoSaveDraft = async () => {
    try {
      await client.put(`/blog/posts/${id}`, {
        title,
        content,
        categoryId,
        tags,
      });
      setSaveStatus('自动保存成功');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err: any) {
      // 如果是权限错误，停止自动保存并提示用户
      if (err.response?.status === 403) {
        setError('无权编辑此文章');
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer);
          setAutoSaveTimer(null);
        }
      } else {
        console.error('自动保存失败:', err);
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setError('请输入文章标题');
      return;
    }

    if (!content.trim()) {
      setError('请输入文章内容');
      return;
    }

    if (title.length > 100) {
      setError('标题不能超过100个字符');
      return;
    }

    if (content.length > 5000) {
      setError('内容不能超过5000个字符');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (id) {
        await client.put(`/blog/posts/${id}`, {
          title,
          content,
          categoryId,
          tags,
        });
        setSaveStatus('保存成功');
      } else {
        const response = await client.post('/blog/posts', {
          title,
          content,
          categoryId,
          tags,
        });
        // 创建成功后跳转到编辑页面，使用replace避免返回到空白编辑页
        navigate(`/blog/editor/${response.data.id}`, { replace: true });
        setSaveStatus('保存成功');
      }
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || '保存失败';
      setError(errorMsg);
      
      // 如果是权限错误，提示并跳转
      if (err.response?.status === 403) {
        setTimeout(() => {
          navigate('/blog/my');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('请填写标题和内容');
      return;
    }

    if (title.length > 100 || content.length > 5000) {
      setError('标题或内容超出长度限制');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let postId = id;

      // 如果是新文章，先保存
      if (!postId) {
        const response = await client.post('/blog/posts', {
          title,
          content,
          categoryId,
          tags,
        });
        postId = response.data.id;
      } else {
        // 更新文章
        await client.put(`/blog/posts/${postId}`, {
          title,
          content,
          categoryId,
          tags,
        });
      }

      // 提交审核或发布
      await client.post(`/blog/posts/${postId}/submit`);

      if (isTeacherOrAdmin) {
        alert('文章已发布！');
        navigate('/blog/my');
      } else {
        alert('文章已提交审核，请等待管理员审核。');
        navigate('/blog/my');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {id ? '编辑文章' : '创建新文章'}
            </h1>
            {saveStatus && (
              <p className="mt-2 text-sm text-green-600">{saveStatus}</p>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* 标题输入 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文章标题 <span className="text-red-500">*</span>
              <span className="text-gray-500 font-normal ml-2">
                ({title.length}/100)
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入文章标题..."
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 分类和标签 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文章分类
              </label>
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">未分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签 (最多5个)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="输入标签后回车"
                  disabled={tags.length >= 5}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
                <button
                  onClick={handleAddTag}
                  disabled={tags.length >= 5 || !tagInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  添加
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Markdown编辑器 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文章内容 <span className="text-red-500">*</span>
              <span className="text-gray-500 font-normal ml-2">
                ({content.length}/5000)
              </span>
            </label>
            <div data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                height={500}
                preview="live"
                className="rounded-lg"
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              保存草稿
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
              {isTeacherOrAdmin ? '发布文章' : '提交审核'}
            </button>

            <button
              onClick={() => navigate('/blog/my')}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
