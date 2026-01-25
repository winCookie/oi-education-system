import { useEffect, useState, useMemo } from 'react';
import client from '../api/client';
import { ChevronRight, ChevronDown, Folder, CheckCircle, BookOpen, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Point {
  id: number;
  title: string;
  category: string;
  group: string;
}

interface ProgressStats {
  groups: Record<string, Record<string, { total: number; completed: number; percent: number }>>;
  categories: Record<string, { total: number; completed: number; percent: number }>;
  totalKPs: number;
  totalCompleted: number;
  overallPercent: number;
}

export const KnowledgeCenter = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [progress, setProgress] = useState<ProgressStats | null>(null);
  const [completedIds, setCompletedIds] = useState<number[]>([]);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pointsRes, statsRes, completedRes] = await Promise.all([
          client.get('/knowledge'),
          user ? client.get('/progress/stats') : Promise.resolve({ data: null }),
          user ? client.get('/progress') : Promise.resolve({ data: [] })
        ]);

        setPoints(pointsRes.data);
        if (statsRes.data) setProgress(statsRes.data);
        if (completedRes.data) {
          setCompletedIds(completedRes.data.map((p: any) => p.knowledgePoint.id));
        }
        
        // Auto-open first category of each group if possible
        const categories = Array.from(new Set(pointsRes.data.map((p: Point) => `${p.group}-${p.category}`))) as string[];
        if (categories.length > 0) {
          setOpenCategories(categories.slice(0, 1));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const groupedByGroupAndCategory = useMemo(() => {
    return points.reduce((acc, point) => {
      const g = point.group || '入门组';
      const cat = point.category || '未分类';
      if (!acc[g]) acc[g] = {};
      if (!acc[g][cat]) acc[g][cat] = [];
      acc[g][cat].push(point);
      return acc;
    }, {} as Record<string, Record<string, Point[]>>);
  }, [points]);

  const toggleCategory = (group: string, category: string) => {
    const key = `${group}-${category}`;
    setOpenCategories(prev =>
      prev.includes(key)
        ? prev.filter(c => c !== key)
        : [...prev, key]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const groups = ['入门组', '提高组'];

  return (
    <div className="space-y-12 pb-20">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">知识与交互中心</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          系统化的信息学奥赛知识体系，支持入门组和提高组的全方位学习。
        </p>
      </div>

      {groups.map((groupName) => (
        <section key={groupName} className="space-y-6">
          <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-4 py-1">
            {groupName === '入门组' ? (
              <BookOpen className="h-6 w-6 text-blue-600" />
            ) : (
              <Star className="h-6 w-6 text-blue-600" />
            )}
            <h2 className="text-2xl font-bold text-gray-900">{groupName}</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {groupedByGroupAndCategory[groupName] ? (
              Object.entries(groupedByGroupAndCategory[groupName]).map(([category, items]) => {
                const key = `${groupName}-${category}`;
                const isOpen = openCategories.includes(key);
                const catProgress = progress?.groups?.[groupName]?.[category];
                const percent = catProgress?.percent || 0;

                return (
                  <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleCategory(groupName, category)}
                      className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-2.5 rounded-xl ${groupName === '入门组' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                          <Folder className="h-6 w-6" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-gray-900">{category}</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                              {user && progress 
                                ? `${catProgress?.completed || 0} / ${items.length}`
                                : items.length
                              }
                            </span>
                          </div>
                          {user && progress && (
                            <div className="mt-2 flex items-center gap-3 max-w-md">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  className={`h-full ${percent === 100 ? 'bg-green-500' : (groupName === '入门组' ? 'bg-blue-500' : 'bg-purple-500')}`}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
                                掌握 {percent}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="px-5 pb-5 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-gray-50 bg-gray-50/20">
                            {items.map((point) => {
                              const isCompleted = completedIds.includes(point.id);
                              return (
                                <Link
                                  key={point.id}
                                  to={`/knowledge/${point.id}`}
                                  className={`group p-4 rounded-xl border transition-all ${
                                    isCompleted 
                                      ? 'bg-green-50/30 border-green-100 hover:border-green-300 hover:bg-green-50/50' 
                                      : 'bg-white border-gray-100 hover:border-blue-400 hover:shadow-md'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      {isCompleted && (
                                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                      )}
                                      <h4 className={`text-sm font-bold transition ${
                                        isCompleted ? 'text-green-700' : 'text-gray-700 group-hover:text-blue-600'
                                      }`}>
                                        {point.title}
                                      </h4>
                                    </div>
                                    <ChevronRight className={`h-4 w-4 transition ${
                                      isCompleted ? 'text-green-300' : 'text-gray-300 group-hover:text-blue-500'
                                    }`} />
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                该组别暂无知识点
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
};
