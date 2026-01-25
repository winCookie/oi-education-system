import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../../api/client';
import { Radar, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Save, Send, Plus, X } from 'lucide-react';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

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

interface KnowledgeModule {
  name: string;
  score: number;
}

export const ReportEditor: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  
  // Basic Info
  const [studentId, setStudentId] = useState<number | null>(null);
  const [studentName, setStudentName] = useState('');
  const [stage, setStage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupType, setGroupType] = useState<string>('');

  // Knowledge Modules
  const [knowledgeModules, setKnowledgeModules] = useState<KnowledgeModule[]>([]);
  const [newModuleName, setNewModuleName] = useState('');

  // Training Data
  const [trainingData, setTrainingData] = useState<number[]>(Array(PROBLEM_DIFFICULTIES.length).fill(0));

  // Ability Scores
  const [abilityScores, setAbilityScores] = useState<number[]>(Array(ABILITY_MODULES.length).fill(0));

  // Coach Comments
  const [coachComments, setCoachComments] = useState('');

  useEffect(() => {
    fetchStudents();
    if (id) {
      fetchReport();
    }
  }, [id]);

  const fetchStudents = async () => {
    try {
      const response = await client.get('/reports/students');
      setStudents(response.data);
    } catch (error) {
      console.error('获取学生列表失败', error);
    }
  };

  const fetchReport = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await client.get(`/reports/${id}`);
      const report = response.data;
      
      setStudentId(report.student.id);
      setStudentName(report.studentName);
      setStage(report.stage || '');
      setStartDate(report.startDate || '');
      setEndDate(report.endDate || '');
      setGroupType(report.groupType || '');
      setKnowledgeModules(report.knowledgeModules || []);
      
      if (report.trainingData && report.trainingData.length > 0) {
        setTrainingData(report.trainingData.map((item: any) => item.count));
      }
      
      if (report.abilityScores && report.abilityScores.length > 0) {
        setAbilityScores(report.abilityScores.map((item: any) => item.score));
      }
      
      setCoachComments(report.coachComments || '');
    } catch (error) {
      console.error('获取报告失败', error);
      alert('获取报告失败');
    } finally {
      setLoading(false);
    }
  };

  const addKnowledgeModule = () => {
    if (!newModuleName.trim()) {
      alert('请输入模块名称');
      return;
    }
    if (knowledgeModules.some(m => m.name === newModuleName.trim())) {
      alert('该模块已存在');
      return;
    }
    setKnowledgeModules([...knowledgeModules, { name: newModuleName.trim(), score: 0 }]);
    setNewModuleName('');
  };

  const removeKnowledgeModule = (index: number) => {
    setKnowledgeModules(knowledgeModules.filter((_, i) => i !== index));
  };

  const updateKnowledgeScore = (index: number, score: number) => {
    const updated = [...knowledgeModules];
    updated[index].score = score;
    setKnowledgeModules(updated);
  };

  const saveReport = async (shouldSend = false) => {
    if (!studentId) {
      alert('请选择学生');
      return;
    }

    const reportData = {
      studentId,
      studentName,
      stage,
      startDate,
      endDate,
      groupType,
      knowledgeModules,
      trainingData: trainingData.map((count, index) => ({
        difficulty: PROBLEM_DIFFICULTIES[index].name,
        count,
      })),
      abilityScores: abilityScores.map((score, index) => ({
        module: ABILITY_MODULES[index],
        score,
      })),
      coachComments,
    };

    try {
      setLoading(true);
      if (id) {
        await client.put(`/reports/${id}`, reportData);
        if (shouldSend) {
          await client.post(`/reports/${id}/send`);
          alert('报告已发送！');
          navigate('/teacher-reports');
        } else {
          alert('报告已保存！');
        }
      } else {
        const response = await client.post('/reports', reportData);
        if (shouldSend) {
          await client.post(`/reports/${response.data.id}/send`);
          alert('报告已创建并发送！');
          navigate('/teacher-reports');
        } else {
          alert('报告已创建！');
          navigate(`/report-editor/${response.data.id}`);
        }
      }
    } catch (error: any) {
      console.error('保存报告失败', error);
      alert(error.response?.data?.message || '保存报告失败');
    } finally {
      setLoading(false);
    }
  };

  const knowledgeChartData = {
    labels: knowledgeModules.map(m => m.name),
    datasets: [{
      label: '知识模块评分',
      data: knowledgeModules.map(m => m.score),
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
      data: trainingData,
      backgroundColor: PROBLEM_DIFFICULTIES.map(d => d.color),
    }]
  };

  const abilityChartData = {
    labels: ABILITY_MODULES,
    datasets: [{
      label: '综合能力评分',
      data: abilityScores,
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

  if (loading) {
    return <div className="text-center p-8">加载中...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {id ? '编辑学情报告' : '创建学情报告'}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => saveReport(false)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            保存草稿
          </button>
          <button
            onClick={() => saveReport(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            发送报告
          </button>
        </div>
      </div>

      {/* Section 1: Basic Info */}
      <section className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-teal-700">1. 学员基本信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">学员</label>
            <select
              value={studentId || ''}
              onChange={(e) => {
                const sid = parseInt(e.target.value);
                setStudentId(sid);
                const student = students.find(s => s.id === sid);
                if (student) {
                  setStudentName(student.realName || student.username);
                }
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            >
              <option value="">请选择学员</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.realName || student.username} ({student.username})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">学员姓名</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              placeholder="例如：张三"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">阶段</label>
            <input
              type="text"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              placeholder="例如：基础阶段"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            />
          </div>
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">组别</label>
            <div className="flex flex-wrap gap-6">
              {['CSP-J 入门组', 'CSP-S 提高组', 'NOIP 省选'].map(group => (
                <label key={group} className="flex items-center">
                  <input
                    type="radio"
                    name="groupType"
                    value={group}
                    checked={groupType === group}
                    onChange={(e) => setGroupType(e.target.value)}
                    className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">{group}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Knowledge Modules */}
      <section className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-teal-700">2. 知识模块评估 (0-10分)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="space-y-4 mb-4">
              {knowledgeModules.map((module, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-md bg-teal-50">
                  <span className="text-sm text-gray-700 flex-grow">{module.name}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={module.score}
                      onChange={(e) => updateKnowledgeScore(index, parseFloat(e.target.value) || 0)}
                      className="w-20 rounded-md border-gray-300 text-sm text-center"
                    />
                    <button
                      onClick={() => removeKnowledgeModule(index)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded-md"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKnowledgeModule()}
                placeholder="输入新的知识模块名称..."
                className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
              <button
                onClick={addKnowledgeModule}
                className="flex items-center gap-1 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                <Plus className="h-4 w-4" />
                添加
              </button>
            </div>
          </div>
          <div className="h-80">
            {knowledgeModules.length > 0 && <Radar data={knowledgeChartData} options={radarOptions} />}
          </div>
        </div>
      </section>

      {/* Section 3: Training Data */}
      <section className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-teal-700">3. 题目训练量数据统计</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {PROBLEM_DIFFICULTIES.map((difficulty, index) => (
            <div key={index} className="flex items-center justify-between">
              <label
                className="text-sm text-white px-2 py-1 rounded"
                style={{ backgroundColor: difficulty.color }}
              >
                {difficulty.name}
              </label>
              <input
                type="number"
                min="0"
                value={trainingData[index]}
                onChange={(e) => {
                  const updated = [...trainingData];
                  updated[index] = parseInt(e.target.value) || 0;
                  setTrainingData(updated);
                }}
                className="w-20 rounded-md border-gray-300 text-sm text-center"
              />
            </div>
          ))}
        </div>
        <div className="h-80">
          <Bar data={trainingChartData} options={barOptions} />
        </div>
      </section>

      {/* Section 4: Ability Scores */}
      <section className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-teal-700">4. 综合能力评估 (0-10分)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {ABILITY_MODULES.map((ability, index) => (
              <div key={index} className="flex items-center justify-between">
                <label className="text-sm text-gray-700">{ability}</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={abilityScores[index]}
                  onChange={(e) => {
                    const updated = [...abilityScores];
                    updated[index] = parseFloat(e.target.value) || 0;
                    setAbilityScores(updated);
                  }}
                  className="w-20 rounded-md border-gray-300 text-sm text-center"
                />
              </div>
            ))}
          </div>
          <div className="h-80">
            <Radar data={abilityChartData} options={radarOptions} />
          </div>
        </div>
      </section>

      {/* Section 5: Coach Comments */}
      <section className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-teal-700">5. 教练评语</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">评语内容（支持 Markdown）</label>
          <textarea
            value={coachComments}
            onChange={(e) => setCoachComments(e.target.value)}
            rows={8}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            placeholder="请输入对学员的综合评价..."
          />
        </div>
      </section>
    </div>
  );
};
