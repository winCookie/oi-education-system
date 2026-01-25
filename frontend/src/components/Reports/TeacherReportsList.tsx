import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { Plus, Edit, Trash2, Eye, Send, FileText } from 'lucide-react';

interface Report {
  id: number;
  studentName: string;
  stage: string;
  startDate: string;
  endDate: string;
  groupType: string;
  status: string;
  createdAt: string;
  student: {
    id: number;
    username: string;
  };
}

export const TeacherReportsList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await client.get('/reports/my-reports');
      setReports(response.data);
    } catch (error) {
      console.error('获取报告列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这份报告吗？')) return;
    
    try {
      await client.delete(`/reports/${id}`);
      alert('报告已删除');
      fetchReports();
    } catch (error: any) {
      alert(error.response?.data?.message || '删除失败');
    }
  };

  const handleSend = async (id: number) => {
    if (!confirm('确定要发送这份报告吗？发送后学生和家长将收到通知。')) return;
    
    try {
      await client.post(`/reports/${id}/send`);
      alert('报告已发送！');
      fetchReports();
    } catch (error: any) {
      alert(error.response?.data?.message || '发送失败');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return <div className="text-center p-8">加载中...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">学情报告管理</h1>
        <Link
          to="/report-editor"
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          创建新报告
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">还没有创建任何学情报告</p>
          <Link
            to="/report-editor"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            创建第一份报告
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  学员
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  阶段
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  组别
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  评估周期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{report.studentName}</div>
                    <div className="text-sm text-gray-500">@{report.student.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.stage || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.groupType || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.startDate && report.endDate
                      ? `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {report.status === 'sent' ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        已发送
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        草稿
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(report.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/report-view/${report.id}`)}
                        className="text-blue-600 hover:text-blue-800"
                        title="查看"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/report-editor/${report.id}`)}
                        className="text-teal-600 hover:text-teal-800"
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {report.status === 'draft' && (
                        <button
                          onClick={() => handleSend(report.id)}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="发送"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="text-red-600 hover:text-red-800"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
