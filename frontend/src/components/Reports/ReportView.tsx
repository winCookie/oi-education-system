import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { Radar, Bar } from 'react-chartjs-2';
import { ArrowLeft, Calendar, User, Award } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ABILITY_MODULES = [
  '课堂专注度', '笔记工整&完整程度', '代码调试速度',
  '课堂积极性', '课堂纪律性', '课堂参与度', '实战代码质量'
];

const PROBLEM_DIFFICULTIES = [
  { name: '入门', color: '#eb5a65' },
  { name: '普及-', color: '#e7a03c' },
  { name: '普及/提高-', color: '#f6c347' },
  { name: '普及+/提高', color: '#72c240' },
  { name: '提高+/省选-', color: '#5296d5' },
  { name: '省选/NOI-', color: '#9243c8' },
  { name: 'NOI/NOI+/CTSC', color: '#111d65' }
];

export const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await client.get(`/reports/${id}`);
      setReport(response.data);
    } catch (error: any) {
      console.error('获取报告失败', error);
      alert(error.response?.data?.message || '获取报告失败');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">加载中...</div>;
  }

  if (!report) {
    return <div className="text-center p-8">报告不存在</div>;
  }

  const knowledgeChartData = {
    labels: (report.knowledgeModules || []).map((m: any) => m.name),
    datasets: [{
      label: '知识模块评分',
      data: (report.knowledgeModules || []).map((m: any) => m.score),
      fill: true,
      backgroundColor: 'rgba(20, 184, 166, 0.2)',
      borderColor: 'rgb(13, 148, 136)',
      pointBackgroundColor: 'rgb(13, 148, 136)',
      pointBorderColor: '#fff',
    }]
  };

  const trainingChartData = {
    labels: PROBLEM_DIFFICULTIES.map(d => d.name),
    datasets: [{
      label: '完成题目数量',
      data: (report.trainingData || []).map((item: any) => item.count),
      backgroundColor: PROBLEM_DIFFICULTIES.map(d => d.color),
    }]
  };

  const abilityChartData = {
    labels: ABILITY_MODULES,
    datasets: [{
      label: '综合能力评分',
      data: (report.abilityScores || []).map((item: any) => item.score),
      fill: true,
      backgroundColor: 'rgba(79, 70, 229, 0.2)',
      borderColor: 'rgb(79, 70, 229)',
      pointBackgroundColor: 'rgb(79, 70, 229)',
      pointBorderColor: '#fff',
    }]
  };

  const radarOptions = {
    scales: {
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: 10,
      }
    },
    maintainAspectRatio: false,
  };

  const barOptions = {
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        title: { display: true, text: '完成题目数量' }
      },
      y: {
        title: { display: true, text: '题目难度' }
      }
    },
    maintainAspectRatio: false,
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </button>

      <div className="bg-white rounded-xl shadow-md p-8 space-y-8">
        {/* Header */}
        <div className="text-center border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">信息学竞赛学情分析报告</h1>
          <div className="flex justify-center gap-8 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>学员：{report.studentName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                评估日期：{formatDate(report.startDate)} ~ {formatDate(report.endDate)}
              </span>
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>组别：{report.groupType}</span>
            </div>
            <div>
              <span>阶段：{report.stage}</span>
            </div>
          </div>
        </div>

        {/* Knowledge Modules */}
        {report.knowledgeModules && report.knowledgeModules.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-teal-700">知识模块评估</h2>
            <div className="h-96 flex justify-center">
              <div className="w-full max-w-2xl">
                <Radar data={knowledgeChartData} options={radarOptions} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {report.knowledgeModules.map((module: any, index: number) => (
                <div key={index} className="bg-teal-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-700">{module.name}</div>
                  <div className="text-xl font-bold text-teal-600">{module.score}/10</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Training Data */}
        {report.trainingData && report.trainingData.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-teal-700">题目训练量统计</h2>
            <div className="h-96">
              <Bar data={trainingChartData} options={barOptions} />
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {report.trainingData.map((item: any, index: number) => (
                <div
                  key={index}
                  className="p-3 rounded-lg text-white"
                  style={{ backgroundColor: PROBLEM_DIFFICULTIES.find(d => d.name === item.difficulty)?.color }}
                >
                  <div className="text-sm">{item.difficulty}</div>
                  <div className="text-xl font-bold">{item.count} 题</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ability Scores */}
        {report.abilityScores && report.abilityScores.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-teal-700">综合能力评估</h2>
            <div className="h-96 flex justify-center">
              <div className="w-full max-w-2xl">
                <Radar data={abilityChartData} options={radarOptions} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {report.abilityScores.map((item: any, index: number) => (
                <div key={index} className="bg-indigo-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-700">{item.module}</div>
                  <div className="text-xl font-bold text-indigo-600">{item.score}/10</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Coach Comments */}
        {report.coachComments && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-teal-700">教练评语</h2>
            <div className="prose max-w-none bg-gray-50 p-6 rounded-lg">
              <ReactMarkdown>{report.coachComments}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-6 border-t">
          <p>创建时间：{formatDate(report.createdAt)}</p>
          <p className="mt-1">教师：{report.teacher.username}</p>
        </div>
      </div>
    </div>
  );
};
