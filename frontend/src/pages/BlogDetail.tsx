import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Heart, Bookmark, Share2, Calendar, User, Tag, MessageCircle, Send } from 'lucide-react';
import client from '../api/client';
import { CodeBlock } from '../components/CodeBlock';
import { TableOfContents } from '../components/TableOfContents';

interface Post {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    username: string;
    nickname?: string;
    bio?: string;
  };
  category?: {
    id: number;
    name: string;
  };
  tags: { id: number; name: string }[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  isOfficial: boolean;
  isTeacher: boolean;
  publishedAt: string;
  isLiked?: boolean;
  isFavorited?: boolean;
}

interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    nickname?: string;
  };
  createdAt: string;
  likeCount: number;
  replies?: Comment[];
}

export const BlogDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
      fetchRelatedPosts();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await client.get(`/blog/posts/${id}`);
      setPost(response.data);
    } catch (err) {
      console.error('获取文章失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await client.get(`/blog/posts/${id}/comments`);
      setComments(response.data.comments);
    } catch (err) {
      console.error('获取评论失败:', err);
    }
  };

  const fetchRelatedPosts = async () => {
    try {
      const response = await client.get(`/blog/posts/${id}/related`);
      setRelatedPosts(response.data);
    } catch (err) {
      console.error('获取相关文章失败:', err);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      const response = await client.post(`/blog/posts/${id}/like`);
      setPost((prev) => prev ? { ...prev, isLiked: response.data.liked, likeCount: response.data.likeCount } : null);
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      const response = await client.post(`/blog/posts/${id}/favorite`);
      setPost((prev) => prev ? { ...prev, isFavorited: response.data.favorited, favoriteCount: response.data.favoriteCount } : null);
    } catch (err) {
      console.error('收藏失败:', err);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('链接已复制到剪贴板');
  };

  const handleCommentSubmit = async (parentId?: number) => {
    if (!user) {
      alert('请先登录');
      return;
    }
    if (!commentContent.trim()) return;

    try {
      await client.post(`/blog/posts/${id}/comments`, {
        content: commentContent,
        parentCommentId: parentId,
      });
      setCommentContent('');
      setReplyingTo(null);
      fetchComments();
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 });
      }
    } catch (err) {
      console.error('发表评论失败:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">文章不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 主内容区 */}
        <div className="lg:col-span-3">
          {/* 文章头部 */}
          <article className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {post.isOfficial && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                  官方
                </span>
              )}
              {post.isTeacher && !post.isOfficial && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  教师
                </span>
              )}
              {post.category && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  {post.category.name}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author.nickname || post.author.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(post.publishedAt).toLocaleDateString('zh-CN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{post.viewCount} 阅读</span>
              </div>
            </div>

            {post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    <Tag className="h-3 w-3" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 文章内容 */}
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <CodeBlock language={match[1]}>
                      {String(children).replace(/\n$/, '')}
                    </CodeBlock>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* 互动按钮 */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                post.isLiked
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
              <span>{post.likeCount} 点赞</span>
            </button>

            <button
              onClick={handleFavorite}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                post.isFavorited
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Bookmark className={`h-5 w-5 ${post.isFavorited ? 'fill-yellow-600' : ''}`} />
              <span>{post.favoriteCount} 收藏</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Share2 className="h-5 w-5" />
              分享
            </button>
          </div>
        </article>

        {/* 评论区 */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            评论 ({post.commentCount})
          </h2>

          {user && (
            <div className="mb-8">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="写下你的评论..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => handleCommentSubmit()}
                  disabled={!commentContent.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  发表评论
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {comment.author.nickname || comment.author.username}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{comment.content}</p>
                    {user && (
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        回复
                      </button>
                    )}

                    {replyingTo === comment.id && (
                      <div className="mt-4">
                        <textarea
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          placeholder={`回复 ${comment.author.nickname || comment.author.username}...`}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleCommentSubmit(comment.id)}
                            disabled={!commentContent.trim()}
                            className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300"
                          >
                            发表
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setCommentContent('');
                            }}
                            className="px-4 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}

                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 pl-6 border-l-2 border-gray-200 space-y-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 text-sm">
                                {reply.author.nickname || reply.author.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.createdAt).toLocaleString('zh-CN')}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 相关文章 */}
        {relatedPosts.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">相关文章</h2>
            <div className="space-y-4">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.id}`}
                  className="block p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 hover:text-blue-600 mb-2">
                    {relatedPost.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{relatedPost.viewCount} 阅读</span>
                    <span>{relatedPost.likeCount} 点赞</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* 侧边栏 - 目录 */}
        <div className="hidden lg:block lg:col-span-1">
          <TableOfContents content={post.content} />
        </div>
      </div>
      </div>
    </div>
  );
};
