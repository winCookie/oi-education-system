import React from 'react';
import { X, Clock, MapPin, Link as LinkIcon, Calendar } from 'lucide-react';

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

interface ScheduleDetailModalProps {
  schedule: Schedule | null;
  onClose: () => void;
}

export const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({ schedule, onClose }) => {
  if (!schedule) return null;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = () => {
    const start = new Date(schedule.startTime);
    const end = new Date(schedule.endTime);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days > 1 ? `${days} 天` : '单日活动';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
        {/* 头部 */}
        <div
          className="p-6 text-white relative"
          style={{ backgroundColor: schedule.color || '#3B82F6' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{schedule.title}</h2>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <span className="px-2 py-1 bg-white/20 rounded-lg">{getDuration()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 时间信息 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">开始时间</p>
                <p className="font-bold text-gray-900">{formatDateTime(schedule.startTime)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">结束时间</p>
                <p className="font-bold text-gray-900">{formatDateTime(schedule.endTime)}</p>
              </div>
            </div>
          </div>

          {/* 地点 */}
          {schedule.location && (
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-red-100 rounded-lg">
                <MapPin className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">活动地点</p>
                <p className="font-bold text-gray-900">{schedule.location}</p>
              </div>
            </div>
          )}

          {/* 描述 */}
          {schedule.description && (
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-2">活动描述</p>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {schedule.description}
              </p>
            </div>
          )}

          {/* 相关链接 */}
          {schedule.link && (
            <a
              href={schedule.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition group"
            >
              <div className="p-2 bg-blue-100 group-hover:bg-blue-200 rounded-lg transition">
                <LinkIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-600 font-bold">相关链接</p>
                <p className="text-xs text-blue-500 truncate">{schedule.link}</p>
              </div>
            </a>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-6 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
