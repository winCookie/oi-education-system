import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { Eye, FileText, Calendar, User } from 'lucide-react';

interface Report {
  id: number;
  studentName: string;
  stage: string;
  startDate: string;
  endDate: string;
  groupType: string;
  status: string;
  createdAt: string;
  teacher: {
    id: number;
    username: string;
  };
  student: {
    id: number;
    username: string;
  };
}

export const StudentReportsList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isParent = user.role === 'parent';

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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return <div className="text-center p-8">加载中...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {isParent ? '孩子的学情报告' : '我的学情报告'}
      </h1>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无学情报告</p>
          <p className="text-sm text-gray-400 mt-2">
            {isParent ? '教师会定期发送孩子的学情分析报告' : '教师会定期发送学情分析报告'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
              onClick={() => navigate(`/report-view/${report.id}`)}
            >
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4">
                <h3 className="text-white font-bold text-lg">{report.stage || '学情报告'}</h3>
                <p className="text-teal-100 text-sm">{report.groupType}</p>
              </div>
              
              <div className="p-6 space-y-3">
                {isParent && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg -mt-2 mb-3">
                    <User className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-900">学生</div>
                      <div className="text-blue-700">{report.studentName}</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-700">评估周期</div>
                    <div>
                      {formatDate(report.startDate)} - {formatDate(report.endDate)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-700">教师</div>
                    <div>{report.teacher.username}</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/report-view/${report.id}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    查看详情
                  </button>
                </div>
              </div>
              
              <div className="px-6 pb-4 text-xs text-gray-400">
                发送时间：{formatDate(report.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
