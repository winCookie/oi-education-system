import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface Schedule {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location?: string;
  link?: string;
  color?: string;
}

interface ScheduleCalendarProps {
  schedules: Schedule[];
  onEventClick: (schedule: Schedule) => void;
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ schedules, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 获取当前月份的天数
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // 获取当前月份第一天是星期几
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // 切换月份
  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  // 检查日期是否在日程范围内
  const getSchedulesForDate = (day: number) => {
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    dateToCheck.setHours(0, 0, 0, 0);

    return schedules.filter((schedule) => {
      const start = new Date(schedule.startTime);
      const end = new Date(schedule.endTime);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return dateToCheck >= start && dateToCheck <= end;
    });
  };

  // 生成日历网格
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // 填充空白格子
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[100px] bg-gray-50/50 border border-gray-100" />
      );
    }

    // 填充日期格子
    for (let day = 1; day <= daysInMonth; day++) {
      const daySchedules = getSchedulesForDate(day);
      const isToday =
        day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`min-h-[100px] border border-gray-100 p-2 relative transition-all hover:shadow-md ${
            isToday ? 'bg-blue-50 border-blue-200' : 'bg-white'
          }`}
        >
          <div
            className={`text-sm font-bold mb-1 ${
              isToday ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
          <div className="space-y-1">
            {daySchedules.map((schedule, idx) => {
              // 检查是否是事件的第一天
              const start = new Date(schedule.startTime);
              const isFirstDay =
                start.getDate() === day &&
                start.getMonth() === currentDate.getMonth() &&
                start.getFullYear() === currentDate.getFullYear();

              return (
                <button
                  key={`${schedule.id}-${idx}`}
                  onClick={() => onEventClick(schedule)}
                  className="w-full text-left text-[10px] font-bold px-2 py-1 rounded transition-all hover:scale-105 hover:shadow-md truncate"
                  style={{
                    backgroundColor: schedule.color || '#3B82F6',
                    color: 'white',
                    opacity: isFirstDay ? 1 : 0.6,
                  }}
                  title={schedule.title}
                >
                  {isFirstDay ? schedule.title : '...'}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 日历头部 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6" />
          <h3 className="text-lg font-bold">
            {currentDate.getFullYear()} 年 {monthNames[currentDate.getMonth()]}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-blue-400 rounded-lg transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 hover:bg-blue-400 rounded-lg transition text-sm font-bold"
          >
            今天
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-blue-400 rounded-lg transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-bold text-gray-600 border-r border-gray-100 last:border-r-0"
          >
            星期{day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7">{renderCalendar()}</div>
    </div>
  );
};
