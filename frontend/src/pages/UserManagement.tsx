import { useEffect, useState } from 'react';
import client from '../api/client';
import { Users, Shield, UserCog, Trash2, CheckCircle, Search, AlertTriangle, UserPlus, Info } from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('');
  
  // Batch add state
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchData, setBatchData] = useState('');
  const [batchRole, setBatchRole] = useState('student');
  const [batchStatus, setBatchStatus] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await client.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchData.trim()) return;

    // Parse data: one line per user, format: username,password or just username (pwd will be same as username)
    const lines = batchData.trim().split('\n');
    const userList = lines.map(line => {
      const [username, password] = line.split(/[,\s]+/).map(s => s.trim());
      return {
        username,
        password: password || username, // Default password to username if not provided
        role: batchRole
      };
    }).filter(u => u.username);

    if (currentUser.role === 'teacher' && userList.length > 200) {
      alert('教师单次最多只能批量添加 200 个账号。');
      return;
    }

    try {
      setBatchStatus('正在创建...');
      await client.post('/users/batch', { users: userList });
      setBatchStatus(`成功创建 ${userList.length} 个账号！`);
      setBatchData('');
      setShowBatchForm(false);
      fetchUsers();
      setTimeout(() => setBatchStatus(''), 5000);
    } catch (err: any) {
      setBatchStatus(`创建失败: ${err.response?.data?.message || '未知错误'}`);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await client.patch(`/users/${userId}`, { role: newRole });
      setStatus('角色更新成功！');
      fetchUsers();
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      alert('更新失败，权限不足。');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('确定要永久删除该用户吗？此操作不可逆。')) return;
    try {
      await client.delete(`/users/${userId}`);
      setStatus('用户已删除。');
      fetchUsers();
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      alert('删除失败，可能无法删除自己或权限不足。');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) {
    return (
      <div className="text-center py-20 text-red-500 flex flex-col items-center gap-4">
        <AlertTriangle className="h-12 w-12" />
        <p className="text-xl font-bold">越权访问：仅限管理员或教师</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">系统成员管理</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索用户..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowBatchForm(!showBatchForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md text-sm"
          >
            <UserPlus className="h-4 w-4" /> 批量添加用户
          </button>
        </div>
      </div>

      {batchStatus && (
        <div className={`p-4 rounded-lg flex items-center gap-2 border ${batchStatus.includes('失败') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
          <Info className="h-5 w-5" />
          <span className="font-medium">{batchStatus}</span>
        </div>
      )}

      {showBatchForm && (
        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-lg animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-600" /> 批量导入账号
          </h2>
          <form onSubmit={handleBatchCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">默认角色</label>
                <select
                  value={batchRole}
                  onChange={(e) => setBatchRole(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="student">学生 (Student)</option>
                  <option value="parent">家长 (Parent)</option>
                  <option value="guest">访客 (Guest)</option>
                  {currentUser.role === 'admin' && <option value="teacher">教师 (Teacher)</option>}
                </select>
              </div>
              <div className="text-xs text-gray-500 flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <Info className="h-4 w-4 mr-2 text-indigo-400 shrink-0" />
                每行一个账号，格式：<code className="bg-white px-1 rounded mx-1">用户名,密码</code>。如果不写密码，则默认密码与用户名相同。
              </div>
            </div>
            <textarea
              value={batchData}
              onChange={(e) => setBatchData(e.target.value)}
              placeholder="user01,pwd123&#10;user02,pwd456&#10;user03"
              className="w-full h-40 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBatchForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
              >
                开始导入
              </button>
            </div>
          </form>
        </div>
      )}

      {status && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 border border-green-100">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">{status}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">用户</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">当前角色</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">注册时间</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right text-gray-400">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-gray-900">{user.username}</span>
                    {user.id === currentUser.userId && (
                      <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">你自己</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={currentUser.role !== 'admin' && user.role === 'admin'}
                    className={`text-sm font-bold px-3 py-1 rounded-full border-none focus:ring-2 focus:ring-indigo-500 outline-none ${
                      user.role === 'admin' ? 'bg-indigo-50 text-indigo-700' :
                      user.role === 'teacher' ? 'bg-orange-50 text-orange-700' :
                      user.role === 'parent' ? 'bg-green-50 text-green-700' :
                      user.role === 'guest' ? 'bg-purple-50 text-purple-700' :
                      'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <option value="student">学生 (Student)</option>
                    <option value="teacher">教师 (Teacher)</option>
                    <option value="parent">家长 (Parent)</option>
                    <option value="guest">访客 (Guest)</option>
                    {currentUser.role === 'admin' && <option value="admin">管理员 (Admin)</option>}
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.id === currentUser.userId || (currentUser.role !== 'admin' && user.role === 'admin')}
                    className={`p-2 rounded-lg transition ${
                      user.id === currentUser.userId || (currentUser.role !== 'admin' && user.role === 'admin')
                        ? 'text-gray-200 cursor-not-allowed' 
                        : 'text-red-400 hover:bg-red-50 hover:text-red-600'
                    }`}
                    title="删除用户"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            未找到匹配的用户
          </div>
        )}
      </div>

      <div className="bg-indigo-600 rounded-2xl p-8 text-white flex items-center justify-between shadow-lg shadow-indigo-100">
        <div className="space-y-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6" /> 管理员权限说明
          </h2>
          <p className="text-indigo-100 text-sm max-w-2xl">
            作为管理员，您可以批量添加用户。普通管理员单次上限为 200 人。您可以将成员设为学生、家长或访客。只有超级管理员可以调整教师及其他管理员的权限。
          </p>
        </div>
      </div>
    </div>
  );
};
