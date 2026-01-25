import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { Calendar, Clock, MapPin, Link as LinkIcon, Plus, Trash2, Pencil, List, CalendarDays } from 'lucide-react';
import { ScheduleCalendar } from './ScheduleCalendar';
import { ScheduleDetailModal } from './ScheduleDetailModal';

export const ScheduleList = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [editingId, setEditingId] = useState<number | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdminOrTeacher = user?.role === 'admin' || user?.role === 'teacher';

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await client.get('/schedules');
      setSchedules(res.data);
    } catch (err) {
      console.error('Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { title, description, startTime, endTime, location, link, color };
    try {
      if (editingId) {
        await client.patch(`/schedules/${editingId}`, data);
      } else {
        await client.post('/schedules', data);
      }
      resetForm();
      fetchSchedules();
    } catch (err) {
      alert('保存失败');
    }
  };

  const handleEdit = (s: any) => {
    setTitle(s.title);
    setDescription(s.description);
    setStartTime(new Date(s.startTime).toISOString().slice(0, 16));
    setEndTime(new Date(s.endTime).toISOString().slice(0, 16));
    setLocation(s.location || '');
    setLink(s.link || '');
    setColor(s.color || '#3B82F6');
    setEditingId(s.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除吗？')) return;
    try {
      await client.delete(`/schedules/${id}`);
      fetchSchedules();
    } catch (err) {
      alert('删除失败');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setLink('');
    setColor('#3B82F6');
    setEditingId(null);
    setShowAddForm(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">加载中...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          信息学奥赛日程安排
        </h2>
        <div className="flex items-center gap-3">
          {/* 视图切换按钮 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
              列表
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition ${
                viewMode === 'calendar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              日历
            </button>
          </div>
          {isAdminOrTeacher && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition text-sm"
            >
              <Plus className="h-4 w-4" /> 发布日程
            </button>
          )}
        </div>
      </div>

      {showAddForm && isAdminOrTeacher && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">标题</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="如：2025 CSP-J1 初赛"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">地点</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="如：线上或指定考点"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">开始时间</label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">结束时间</label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg h-24"
              placeholder="日程详细描述..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">相关链接</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">日历颜色</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 rounded-lg border cursor-pointer"
              />
              <div className="flex gap-2">
                {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
                      color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600">取消</button>
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
              {editingId ? '更新' : '发布'}
            </button>
          </div>
        </form>
      )}

      {/* 日历视图 */}
      {viewMode === 'calendar' ? (
        <>
          {schedules.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
              暂无日程安排
            </div>
          ) : (
            <ScheduleCalendar
              schedules={schedules}
              onEventClick={(schedule) => setSelectedSchedule(schedule)}
            />
          )}
        </>
      ) : (
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
              暂无日程安排
            </div>
          ) : (
            schedules.map((s) => (
            <div 
              key={s.id} 
              className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm hover:shadow-md transition group cursor-pointer"
              onClick={() => setSelectedSchedule(s)}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1 h-12 rounded-full"
                      style={{ backgroundColor: s.color || '#3B82F6' }}
                    />
                    <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-blue-500" />
                      {new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleTimeString()}
                    </div>
                    {s.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-red-400" />
                        {s.location}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{s.description}</p>
                  {s.link && (
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-bold hover:underline"
                    >
                      <LinkIcon className="h-4 w-4" /> 相关链接
                    </a>
                  )}
                </div>
                {isAdminOrTeacher && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(s); }} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        </div>
      )}

      {/* 详情模态框 */}
      <ScheduleDetailModal
        schedule={selectedSchedule}
        onClose={() => setSelectedSchedule(null)}
      />
    </div>
  );
};
