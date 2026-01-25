import { useState } from 'react';
import { ScheduleList } from '../components/Others/ScheduleList';
import { StudentProgressDashboard } from '../components/Others/StudentProgressDashboard';
import { Calendar, TrendingUp } from 'lucide-react';

export const Others = () => {
  const [activeTab, setActiveTab] = useState<'progress' | 'schedules'>('progress');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex items-center gap-2 w-fit">
        {(user?.role === 'parent' || user?.role === 'admin' || user?.role === 'teacher') && (
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'progress'
                ? 'bg-green-600 text-white shadow-lg shadow-green-100'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            学生练习看板
          </button>
        )}
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'schedules'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Calendar className="h-5 w-5" />
          竞赛日程安排
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        {activeTab === 'progress' && (user?.role === 'parent' || user?.role === 'admin' || user?.role === 'teacher') ? (
          <StudentProgressDashboard />
        ) : (
          <ScheduleList />
        )}
      </div>
    </div>
  );
};
