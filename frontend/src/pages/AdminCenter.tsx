import { useState } from 'react';
import { TeacherDashboard } from './TeacherDashboard';
import { UserManagement } from './UserManagement';
import { TeacherReportsList } from '../components/Reports/TeacherReportsList';
import { LuoguAnalysis } from './LuoguAnalysis';
import { BookOpen, Users, FileText, BarChart2 } from 'lucide-react';

export const AdminCenter = () => {
  const [activeTab, setActiveTab] = useState<'content' | 'users' | 'reports' | 'luogu'>('content');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex flex-wrap items-center gap-2 w-fit">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'content'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <BookOpen className="h-5 w-5" />
          教研管理
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Users className="h-5 w-5" />
          成员管理
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'reports'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-100'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <FileText className="h-5 w-5" />
          学情报告
        </button>
        <button
          onClick={() => setActiveTab('luogu')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'luogu'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-100'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <BarChart2 className="h-5 w-5" />
          洛谷分析
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'content' ? (
          <TeacherDashboard />
        ) : activeTab === 'users' ? (
          <UserManagement />
        ) : activeTab === 'reports' ? (
          <TeacherReportsList />
        ) : (
          <LuoguAnalysis />
        )}
      </div>
    </div>
  );
};
