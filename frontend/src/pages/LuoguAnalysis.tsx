import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { LayoutGrid, Settings, Download, Play, RefreshCw, FileText, CheckCircle, AlertCircle, Loader2, Terminal } from 'lucide-react';

export const LuoguAnalysis = () => {
  const [config, setConfig] = useState<any>({
    team_id: '',
    cookies: { __client_id: '', _uid: '' }
  });
  const [reports, setReports] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [isTesting, setIsTesting] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchConfig();
    fetchReports();
    // Clear interval on unmount
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Auto-scroll logs and parse progress
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
    
    // Parse logs for progress: [5/120]
    if (logs.length > 0) {
      for (let i = logs.length - 1; i >= 0; i--) {
        const match = logs[i].match(/\[(\d+)\/(\d+)\]/);
        if (match) {
          const current = parseInt(match[1]);
          const total = isTesting ? 3 : parseInt(match[2]);
          setProgress({ current, total });
          break;
        }
      }
    }
  }, [logs, isTesting]);

  const fetchConfig = async () => {
    try {
      const res = await client.get('/luogu/config');
      setConfig(res.data);
    } catch (err) {
      console.error('Failed to fetch Luogu config');
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await client.get('/luogu/reports');
      setReports(res.data);
    } catch (err) {
      console.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await client.get('/luogu/log');
      if (Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch logs');
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/luogu/config', config);
      setStatus({ message: '配置保存成功', type: 'success' });
      setTimeout(() => setStatus({ message: '', type: '' }), 3000);
    } catch (err) {
      setStatus({ message: '保存配置失败', type: 'error' });
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const response = await client.get(`/luogu/download/${filename}`, {
        responseType: 'blob',
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up and remove the link
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setStatus({ message: '下载失败，请检查登录状态', type: 'error' });
    }
  };

  const handleTriggerFetch = async (isTest: boolean = false) => {
    if (!window.confirm(isTest ? '将只抓取前 3 名成员数据用于测试配置，确定吗？' : '开始抓取洛谷数据可能需要几分钟时间，确定开始吗？')) return;
    
    setFetching(true);
    setIsTesting(isTest);
    setProgress({ current: 0, total: isTest ? 3 : 0 });
    setLogs(['准备开始任务...', '正在连接后台...']);
    setStatus({ message: isTest ? '正在执行测试抓取...' : '正在抓取洛谷团队数据，请稍候...', type: 'success' });
    
    // Start polling logs
    fetchLogs(); // Initial fetch
    pollingRef.current = setInterval(fetchLogs, 2000);

    try {
      if (isTest) {
        await client.post('/luogu/fetch-test', { limit: 3 });
      } else {
        await client.post('/luogu/fetch');
      }
      setStatus({ message: '数据抓取完成', type: 'success' });
      // Final log fetch
      await fetchLogs();
      fetchReports();
    } catch (err: any) {
      setStatus({ message: `抓取失败: ${err.response?.data?.message || err.message}`, type: 'error' });
    } finally {
      setFetching(false);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">洛谷学情分析系统</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleTriggerFetch(true)}
            disabled={fetching}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition shadow-lg ${
              fetching ? 'bg-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm'
            }`}
          >
            {fetching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            {fetching ? '运行中...' : '测试抓取 (3人)'}
          </button>
          <button
            onClick={() => handleTriggerFetch(false)}
            disabled={fetching}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition shadow-lg ${
              fetching ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
            }`}
          >
            {fetching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            {fetching ? '正在抓取...' : '立即抓取数据'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {fetching && (
        <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              正在抓取数据...
            </h3>
            <span className="text-2xl font-bold text-blue-600 font-mono">
              {progress.current} <span className="text-gray-400 text-lg">/ {progress.total}</span>
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">
            进度: {Math.round((progress.current / Math.max(progress.total, 1)) * 100)}%
          </p>
        </div>
      )}

      {/* Log Terminal Display */}
      {(fetching || logs.length > 0) && (
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm font-mono">
              <Terminal className="h-4 w-4" />
              <span>运行日志 (Tail 50 lines)</span>
            </div>
          </div>
          <div 
            ref={logContainerRef}
            className="p-4 h-64 overflow-y-auto font-mono text-xs md:text-sm text-gray-300 space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
          >
            {logs.map((log, index) => (
              <div key={index} className="break-all whitespace-pre-wrap hover:bg-gray-800/50 p-0.5 rounded">
                {log || <br/>}
              </div>
            ))}
            {logs.length === 0 && <p className="text-gray-500 italic">等待日志输出...</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-400" /> 插件配置
            </h2>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p>请填写洛谷 Cookie 中的关键字段：</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>打开洛谷官网 &rarr; F12 &rarr; Application &rarr; Cookies</li>
                <li>找到 <strong>__client_id</strong> 和 <strong>_uid</strong> 并填入下方</li>
              </ul>
            </div>
            <form onSubmit={handleUpdateConfig} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">团队 ID</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.team_id}
                  onChange={(e) => setConfig({ ...config, team_id: e.target.value })}
                  placeholder="如：55654"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">__client_id</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.cookies?.__client_id}
                  onChange={(e) => setConfig({
                    ...config,
                    cookies: { ...config.cookies, __client_id: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">_uid</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={config.cookies?._uid}
                  onChange={(e) => setConfig({
                    ...config,
                    cookies: { ...config.cookies, _uid: e.target.value }
                  })}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition"
              >
                保存配置
              </button>
            </form>
            {status.message && (
              <div className={`flex items-center gap-2 text-sm font-medium ${
                status.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {status.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {status.message}
              </div>
            )}
          </div>

          <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
            <h3 className="text-orange-800 font-bold text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> 使用提示
            </h3>
            <p className="text-orange-700 text-xs leading-relaxed">
              1. Cookie 通常有效期为 30 天，失效后需重新获取。<br/>
              2. 建议每月月初抓取一次数据以生成增长报告。<br/>
              3. 抓取过程请勿关闭或刷新页面。
            </p>
          </div>
        </div>

        {/* Right Column: Reports List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" /> 分析报告
              </h2>
              <button
                onClick={fetchReports}
                className="p-2 text-gray-400 hover:text-blue-600 transition"
                title="刷新列表"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-4">
              {loading && reports.length === 0 ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" />
                  <p className="text-gray-400 text-sm mt-2">加载报告列表中...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                  <FileText className="h-12 w-12 mx-auto text-gray-200" />
                  <p className="text-gray-400 text-sm mt-2">暂无报告，请先执行抓取</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {reports.map((report) => (
                    <div
                      key={report.name}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-blue-200 hover:bg-blue-50/30 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg border shadow-sm ${report.isTest ? 'bg-orange-50 border-orange-100' : 'bg-white'}`}>
                          <Download className={`h-5 w-5 ${report.isTest ? 'text-orange-500' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition">
                              {report.name}
                            </h3>
                            {report.isTest && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full border border-orange-200">
                                测试数据
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            生成时间: {new Date(report.mtime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(report.name)}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:border-blue-600 hover:text-blue-600 transition shadow-sm"
                      >
                        下载 Excel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
