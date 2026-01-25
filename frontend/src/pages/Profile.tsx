import { useEffect, useState } from 'react';
import client from '../api/client';
import { User, BookOpen, CheckCircle, Clock, Award, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CategoryStat {
  total: number;
  completed: number;
  percent: number;
}

interface ProgressStats {
  groups: Record<string, Record<string, { total: number; completed: number; percent: number }>>;
  categories: Record<string, CategoryStat>;
  totalKPs: number;
  totalCompleted: number;
  overallPercent: number;
  recentKPs: Array<{
    id: number;
    title: string;
    completedAt: string;
  }>;
}

export const Profile = ({ overrideStudentId }: { overrideStudentId?: number }) => {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = overrideStudentId 
          ? `/progress/stats/${overrideStudentId}`
          : '/progress/stats';
        const res = await client.get(url);
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [overrideStudentId]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!user) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">请先登录以查看个人中心</p>
      <Link to="/login" className="text-blue-600 font-bold hover:underline">去登录</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* User Header */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6">
        <div className="bg-blue-600 p-4 rounded-2xl text-white">
          <User className="h-12 w-12" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{user.username}</h1>
          <p className="text-gray-500">
            {user.role === 'parent' ? '家长账户 · 关注孩子成长' : 'OI 探索者 · 开启竞赛之旅'}
          </p>
        </div>
        {user.role !== 'parent' && (
          <div className="ml-auto flex gap-8">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">已掌握知识点</p>
              <p className="text-2xl font-black text-gray-900">{stats?.totalCompleted || 0}</p>
            </div>
            <div className="text-center border-l pl-8 border-gray-100">
              <p className="text-sm text-gray-400 mb-1">总进度</p>
              <p className="text-2xl font-black text-blue-600">{stats?.overallPercent || 0}%</p>
            </div>
          </div>
        )}
      </div>

      {user.role === 'parent' && !overrideStudentId ? (
        <div className="bg-blue-50 p-12 rounded-3xl border border-blue-100 text-center space-y-6">
          <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <TrendingUp className="h-10 w-10 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">欢迎，家长</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              您目前的账号为家长身份，系统将不会统计您的个人训练进度。
              请前往“其他”页面绑定您的孩子，即可实时查看他们的学习情况。
            </p>
          </div>
          <Link 
            to="/others" 
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
          >
            去查看孩子进度
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Progress Bars */}
          <div className="md:col-span-2 space-y-12">
            {stats && stats.groups && Object.entries(stats.groups).map(([groupName, categories]) => (
              <div key={groupName} className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-4">
                  <h2 className="text-xl font-bold text-gray-900">{groupName} 进度看板</h2>
                  <span className="text-sm font-medium text-gray-400">
                    已掌握 {Object.values(categories).reduce((acc, c) => acc + c.completed, 0)} / {Object.values(categories).reduce((acc, c) => acc + c.total, 0)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(categories).map(([cat, data]) => (
                    <div key={cat} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-1 inline-block uppercase tracking-wider">{cat}</span>
                          <h3 className="font-bold text-gray-900 text-sm">掌握进度</h3>
                        </div>
                        <span className="text-lg font-black text-gray-900">{data.percent}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${data.percent === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                          style={{ width: `${data.percent}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-gray-400">已完成 {data.completed} / {data.total} 个知识点</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {(!stats || !stats.groups || Object.keys(stats.groups).length === 0) && (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400">
                暂无学习进度数据
              </div>
            )}
          </div>

          {/* Right Column: Recent Activity */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" /> 最近完成
            </h2>
            
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
              {stats?.recentKPs && stats.recentKPs.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentKPs.map(kp => (
                    <Link 
                      key={kp.id} 
                      to={`/knowledge/${kp.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition border border-transparent hover:border-gray-100 group"
                    >
                      <div className="bg-green-100 p-2 rounded-full text-green-600">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition truncate">{kp.title}</p>
                        <p className="text-[10px] text-gray-400">{new Date(kp.completedAt).toLocaleDateString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 space-y-2">
                  <BookOpen className="h-8 w-8 mx-auto opacity-20" />
                  <p className="text-sm">还没有完成的课程</p>
                  <Link to="/" className="text-xs text-blue-600 hover:underline">现在去学习</Link>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl text-white space-y-4">
              <Award className="h-8 w-8" />
              <h3 className="font-bold">OI 段位：探索者</h3>
              <p className="text-blue-100 text-xs leading-relaxed">继续努力掌握更多知识点，解锁更高等级的勋章！</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
