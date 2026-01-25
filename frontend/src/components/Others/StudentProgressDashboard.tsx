import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { Search, User, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Profile } from '../../pages/Profile'; // We can reuse the Profile component logic if we adapt it

export const StudentProgressDashboard = () => {
  const [studentUsername, setStudentUsername] = useState('');
  const [studentId, setStudentId] = useState<number | null>(null);
  const [boundStudents, setBoundStudents] = useState<any[]>([]);
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    // If parent, check for bound student
    if (user?.role === 'parent') {
      fetchBoundStudent();
    }
  }, []);

  const fetchBoundStudent = async () => {
    try {
      const res = await client.get('/auth/profile');
      if (res.data.boundStudents && res.data.boundStudents.length > 0) {
        setBoundStudents(res.data.boundStudents);
        // Default to first student if none selected
        if (!studentId) {
          setStudentId(res.data.boundStudents[0].id);
          setStudentName(res.data.boundStudents[0].username);
        }
      }
    } catch (err) {
      console.error('Failed to fetch bound student');
    }
  };

  const handleBind = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await client.post('/notifications/binding-request', { studentUsername });
      setSuccessMsg('绑定申请已发送，请联系孩子在页面右上角通知中心同意申请。');
      setStudentUsername('');
    } catch (err: any) {
      setError(err.response?.data?.message || '绑定失败，请检查学生账号是否正确');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await client.get(`/users`);
      const student = res.data.find((u: any) => u.username === studentUsername);
      if (student && student.role === 'student') {
        setStudentId(student.id);
        setStudentName(student.username);
      } else {
        setError('未找到该学生账号');
      }
    } catch (err) {
      setError('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-green-600" />
          学生练习看板
        </h2>
      </div>

      {user?.role === 'parent' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mr-4">
            <User className="h-4 w-4 text-blue-600" /> 我的孩子:
          </div>
          {boundStudents.map(s => (
            <button
              key={s.id}
              onClick={() => { setStudentId(s.id); setStudentName(s.username); }}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                studentId === s.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s.username}
            </button>
          ))}
          <button
            onClick={() => { setStudentId(null); setStudentName(''); }}
            className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 border-dashed transition-all ${
              !studentId 
                ? 'border-blue-600 text-blue-600 bg-blue-50' 
                : 'border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-400'
            }`}
          >
            + 绑定更多
          </button>
        </div>
      )}

      {user?.role === 'parent' && !studentId && (
        <div className="bg-blue-50 border border-blue-100 p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">绑定您的孩子</h3>
          <p className="text-sm text-gray-600">输入学生账号（用户名）以查看其学习进度和练习情况。</p>
          <form onSubmit={handleBind} className="flex gap-2">
            <input
              type="text"
              placeholder="学生用户名"
              className="flex-1 px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
              value={studentUsername}
              onChange={(e) => setStudentUsername(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              {loading ? '绑定中...' : '立即绑定'}
            </button>
          </form>
          {error && <p className="text-sm text-red-500 flex items-center justify-center gap-1"><AlertCircle className="h-4 w-4" /> {error}</p>}
          {successMsg && <p className="text-sm text-green-600 flex items-center justify-center gap-1 font-medium"><CheckCircle className="h-4 w-4" /> {successMsg}</p>}
        </div>
      )}

      {(user?.role === 'admin' || user?.role === 'teacher') && (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <form onSubmit={handleSearchAdmin} className="flex gap-4 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-gray-700">搜索学生进度</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="输入学生用户名..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={studentUsername}
                  onChange={(e) => setStudentUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-900 transition h-[42px]"
            >
              查看进度
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )}

      {studentId && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="bg-green-100 p-2 rounded-lg text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">正在查看学生</p>
              <p className="text-lg font-bold text-gray-900">{studentName || studentUsername}</p>
            </div>
            {user?.role === 'admin' && (
              <button 
                onClick={() => { setStudentId(null); setStudentUsername(''); }}
                className="ml-auto text-sm text-gray-400 hover:text-gray-600"
              >
                清除查看
              </button>
            )}
          </div>
          
          {/* We reuse the Profile component by passing a studentId prop */}
          <Profile overrideStudentId={studentId} />
        </div>
      )}
    </div>
  );
};
