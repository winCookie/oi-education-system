import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import client from '../api/client';
import { ChevronRight, ChevronDown, Folder, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export const GroupPoints = ({ isSearch = false }) => {
  const { group } = useParams();
  const [searchParams] = useSearchParams();
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
          isSearch 
            ? client.get(`/knowledge/search?q=${searchParams.get('q')}`)
            : client.get(`/knowledge/group/${group}`),
          user ? client.get('/progress/stats') : Promise.resolve({ data: null }),
          user ? client.get('/progress') : Promise.resolve({ data: [] })
        ]);

        setPoints(pointsRes.data);
        if (statsRes.data) setProgress(statsRes.data);
        if (completedRes.data) {
          setCompletedIds(completedRes.data.map((p: any) => p.knowledgePoint.id));
        }
        
        // Default to opening the first category
        const categories = Array.from(new Set(pointsRes.data.map((p: Point) => p.category))) as string[];
        if (categories.length > 0) {
          setOpenCategories([categories[0]]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [group, searchParams, isSearch]);

  const groupedPoints = useMemo(() => {
    return points.reduce((acc, point) => {
      const cat = point.category || '未分类';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(point);
      return acc;
    }, {} as Record<string, Point[]>);
  }, [points]);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const title = isSearch ? `搜索结果: ${searchParams.get('q')}` : group;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-500">共 {points.length} 个知识点</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedPoints).length > 0 ? (
            Object.entries(groupedPoints).map(([category, items]) => {
              const isOpen = openCategories.includes(category);
              
              // If in group view, show progress for THAT group. If in search view, show global category progress.
              const catProgress = !isSearch && group
                ? progress?.groups?.[group]?.[category]
                : progress?.categories?.[category];
                
              const percent = catProgress?.percent || 0;

              return (
                <div key={category} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
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
                                className={`h-full ${percent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
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
            <div className="text-center py-12 text-gray-500">
              未找到相关内容
            </div>
          )}
        </div>
      )}
    </div>
  );
};
