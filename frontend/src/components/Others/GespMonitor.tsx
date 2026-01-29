import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import { Settings, Play, RefreshCw, Terminal, CheckCircle, AlertCircle, Loader2, MapPin } from 'lucide-react';

export const GespMonitor = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdminOrTeacher = user?.role === 'admin' || user?.role === 'teacher';

  const [config, setConfig] = useState<any>({
    cookie: '',
    student_info: {
        name: '', id_type: '身份证', id_card: '', grade: '', language: '', level: '', province: '', city: ''
    },
    cron_interval_minutes: 60
  });
  const [results, setResults] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isAdminOrTeacher) fetchConfig();
    fetchResults();
    if (isAdminOrTeacher) {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }
  }, [isAdminOrTeacher]);

  useEffect(() => {
    if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const fetchConfig = async () => {
    try {
      const res = await client.get('/gesp/config');
      if (res.data) setConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch config');
    }
  };

  const fetchResults = async () => {
    try {
      const res = await client.get('/gesp/results');
      setResults(res.data);
    } catch (err) {
      console.error('Failed to fetch results');
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await client.get('/gesp/log');
      if (Array.isArray(res.data)) setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch logs');
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/gesp/config', config);
      setStatus({ message: '配置已保存', type: 'success' });
      setTimeout(() => setStatus({ message: '', type: '' }), 3000);
    } catch (err) {
      setStatus({ message: '保存失败', type: 'error' });
    }
  };

  const handleRunCheck = async () => {
    if (!window.confirm('确定要立即运行 GESP 考位检查吗？这将占用服务器资源。')) return;
    
    setFetching(true);
    setLogs(['正在启动检查任务...']);
    setStatus({ message: '任务已启动，请查看日志', type: 'success' });

    fetchLogs();
    pollingRef.current = setInterval(fetchLogs, 2000);

    try {
      await client.post('/gesp/check');
      await fetchLogs();
      fetchResults();
      setStatus({ message: '检查完成', type: 'success' });
    } catch (err: any) {
      setStatus({ message: '检查失败: ' + (err.response?.data?.message || err.message), type: 'error' });
    } finally {
      setFetching(false);
      if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
      }
    }
  };

  const toggleLoop = async (enable: boolean) => {
      const newConfig = { ...config, cron_interval_minutes: enable ? 30 : 0 };
      try {
          await client.post('/gesp/config', newConfig);
          setConfig(newConfig);
          setStatus({ message: enable ? '已开启每 30 分钟自动检测' : '已停止自动检测', type: 'success' });
      } catch (err) {
          setStatus({ message: '设置失败', type: 'error' });
      }
  };

  return (
    <div className="space-y-8 p-4">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-orange-600" /> GESP 考位监控
        </h2>
        {isAdminOrTeacher && (
            <div className="flex gap-2">
                {config.cron_interval_minutes > 0 ? (
                    <button
                        onClick={() => toggleLoop(false)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-red-100 text-red-600 hover:bg-red-200 transition"
                    >
                        <RefreshCw className="h-4 w-4" /> 停止循环 (每 {config.cron_interval_minutes} 分)
                    </button>
                ) : (
                    <button
                        onClick={() => toggleLoop(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-green-100 text-green-600 hover:bg-green-200 transition"
                    >
                        <RefreshCw className="h-4 w-4" /> 开启循环 (30分钟/次)
                    </button>
                )}
                <button
                onClick={handleRunCheck}
                disabled={fetching}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition shadow-lg ${
                    fetching ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100'
                }`}
                >
                {fetching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                {fetching ? '检查中...' : '立即检查'}
                </button>
            </div>
        )}
      </div>

      <div className={`grid grid-cols-1 ${isAdminOrTeacher ? 'lg:grid-cols-3' : ''} gap-8`}>
        {/* Left: Config (Only for Admin/Teacher) */}
        {isAdminOrTeacher && (
            <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-gray-700">
                <Settings className="h-5 w-5" /> 监控配置
                </h3>
                <form onSubmit={handleUpdateConfig} className="space-y-4 text-sm">
                <div>
                    <label className="block text-gray-700 mb-1">Cookie (必填)</label>
                    <textarea
                    className="w-full px-3 py-2 border rounded-lg h-24 text-xs font-mono"
                    value={config.cookie || ''}
                    onChange={(e) => setConfig({ ...config, cookie: e.target.value })}
                    placeholder="Paste raw cookie string here..."
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-gray-700 mb-1">考生姓名</label>
                        <input type="text" className="w-full px-3 py-2 border rounded-lg"
                            value={config.student_info?.name || ''}
                            onChange={(e) => setConfig({...config, student_info: {...config.student_info, name: e.target.value}})}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">证件号码</label>
                        <input type="text" className="w-full px-3 py-2 border rounded-lg"
                            value={config.student_info?.id_card || ''}
                            onChange={(e) => setConfig({...config, student_info: {...config.student_info, id_card: e.target.value}})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-gray-700 mb-1">省份</label>
                        <input type="text" className="w-full px-3 py-2 border rounded-lg"
                            value={config.student_info?.province || ''}
                            onChange={(e) => setConfig({...config, student_info: {...config.student_info, province: e.target.value}})}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">城市</label>
                        <input type="text" className="w-full px-3 py-2 border rounded-lg"
                            value={config.student_info?.city || ''}
                            onChange={(e) => setConfig({...config, student_info: {...config.student_info, city: e.target.value}})}
                        />
                    </div>
                </div>

                <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-black transition">
                    保存配置
                </button>
                </form>
                {status.message && (
                <div className={`flex items-center gap-2 text-xs font-medium ${
                    status.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                    {status.type === 'success' ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {status.message}
                </div>
                )}
            </div>
            </div>
        )}

        {/* Right: Results & Logs */}
        <div className={`${isAdminOrTeacher ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
            {/* Logs (Only for Admin/Teacher) */}
            {isAdminOrTeacher && (
                <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                        <div className="flex items-center gap-2 text-gray-400 text-sm font-mono">
                        <Terminal className="h-4 w-4" />
                        <span>运行日志</span>
                        </div>
                    </div>
                    <div 
                        ref={logContainerRef}
                        className="p-4 h-48 overflow-y-auto font-mono text-xs text-gray-300 space-y-1 scrollbar-thin scrollbar-thumb-gray-700"
                    >
                        {logs.map((log, index) => (
                        <div key={index} className="break-all whitespace-pre-wrap">{log}</div>
                        ))}
                        {logs.length === 0 && <p className="text-gray-500 italic">暂无日志...</p>}
                    </div>
                </div>
            )}

            {/* Results Table (Visible to All) */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">考位情况</h3>
                    {results && <span className="text-xs text-gray-500">更新时间: {new Date(results.timestamp).toLocaleString()}</span>}
                </div>
                
                {results && results.status === 'success' && results.sites ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">考点名称</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态信息</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">判定</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {results.sites.map((site: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{site.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{site.raw_text}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {site.available ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">有余位</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">已满</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">暂无数据或上次获取失败</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};