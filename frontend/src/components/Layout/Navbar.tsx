import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, GraduationCap, Menu, X, User, LogOut } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload(); // Refresh to clear state
  };

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">OI 教学系统</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link to="/knowledge" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">知识与交互</Link>
              <Link to="/others" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">其他</Link>
              {user && (user.role === 'teacher' || user.role === 'admin') && (
                <Link to="/admin-center" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">管理后台</Link>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="搜索知识点..."
                className="bg-gray-100 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </form>

            {user ? (
              <div className="flex items-center gap-4">
                <NotificationCenter />
                <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition">
                  <div className="bg-blue-50 p-1.5 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium">{user.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="退出登录"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition">登录</Link>
            )}
          </div>

          <div className="sm:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white border-t px-4 pt-2 pb-4 space-y-1">
          <Link to="/knowledge" className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50">知识与交互</Link>
          <Link to="/others" className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50">其他</Link>
          {user && (user.role === 'teacher' || user.role === 'admin') && (
            <Link to="/admin-center" className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50">管理后台</Link>
          )}
          {user ? (
            <>
              <Link to="/profile" className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-gray-50">个人中心 ({user.username})</Link>
              <button
                onClick={handleLogout}
                className="w-full text-left block px-3 py-2 text-base font-medium text-red-500 hover:bg-gray-50"
              >
                退出登录
              </button>
            </>
          ) : (
            <Link to="/login" className="block px-3 py-2 text-base font-medium text-blue-600">登录</Link>
          )}
        </div>
      )}
    </nav>
  );
};
