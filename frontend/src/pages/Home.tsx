import { Link } from 'react-router-dom';
import { BookOpen, Code, Layers } from 'lucide-react';

export const Home = () => {
  return (
    <div className="space-y-12 py-8">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-6xl">
          开启你的 <span className="text-blue-600">信息学奥赛</span> 之旅
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          专为 OI 选手设计的交互式教学系统。从线段树到动态规划，通过可视化与实时交互掌握核心算法。
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link to="/group/入门组" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
            入门组课程
          </Link>
          <Link to="/group/提高组" className="bg-white text-blue-600 border border-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
            提高组进阶
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">交互式可视化</h3>
          <p className="text-gray-600">不再死记硬背。通过动态图示直观理解复杂数据结构的运行原理。</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center text-green-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">系统化知识树</h3>
          <p className="text-gray-600">覆盖入门到提高组的核心考点，结构清晰，进度可追踪。</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center text-purple-600">
            <Code className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">实战模板库</h3>
          <p className="text-gray-600">精选例题与标准 C++ 代码实现，助你快速提升编码能力。</p>
        </div>
      </section>
    </div>
  );
};
