import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toast } from './components/Toast';
import { Navbar } from './components/Layout/Navbar';
import { Home } from './pages/Home';
import { GroupPoints } from './pages/GroupPoints';
import { KnowledgeCenter } from './pages/KnowledgeCenter';
import { AdminCenter } from './pages/AdminCenter';
import { Others } from './pages/Others';
import { PointDetail } from './pages/PointDetail';
import { Login } from './pages/Login';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { Profile } from './pages/Profile';
import { UserManagement } from './pages/UserManagement';
import { ReportEditor } from './components/Reports/ReportEditor';
import { TeacherReportsList } from './components/Reports/TeacherReportsList';
import { StudentReportsList } from './components/Reports/StudentReportsList';
import { ReportView } from './components/Reports/ReportView';
import { BlogHome } from './pages/BlogHome';
import { BlogDetail } from './pages/BlogDetail';
import { BlogEditor } from './pages/BlogEditor';
import { MyBlogs } from './pages/MyBlogs';
import { BlogReview } from './pages/BlogReview';
import { BlogCategoryManage } from './pages/BlogCategoryManage';
import { ProfileEdit } from './pages/ProfileEdit';
import { LuoguAnalysis } from './pages/LuoguAnalysis';

function App() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const handleToast = (event: any) => {
      setToast(event.detail);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/knowledge" element={<KnowledgeCenter />} />
            <Route path="/knowledge/:id" element={<PointDetail />} />
            <Route path="/others" element={<Others />} />
            <Route path="/admin-center" element={<AdminCenter />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/search" element={<GroupPoints isSearch />} />
            <Route path="/luogu" element={<LuoguAnalysis />} />
            {/* Report routes */}
            <Route path="/teacher-reports" element={<TeacherReportsList />} />
            <Route path="/student-reports" element={<StudentReportsList />} />
            <Route path="/report-editor" element={<ReportEditor />} />
            <Route path="/report-editor/:id" element={<ReportEditor />} />
            <Route path="/report-view/:id" element={<ReportView />} />
            {/* Blog routes */}
            <Route path="/blog" element={<BlogHome />} />
            <Route path="/blog/:id" element={<BlogDetail />} />
            <Route path="/blog/editor" element={<BlogEditor />} />
            <Route path="/blog/editor/:id" element={<BlogEditor />} />
            <Route path="/blog/my" element={<MyBlogs />} />
            <Route path="/blog/review" element={<BlogReview />} />
            <Route path="/blog/manage" element={<BlogCategoryManage />} />
            {/* Legacy routes for compatibility */}
            <Route path="/group/:group" element={<GroupPoints />} />
            <Route path="/admin" element={<TeacherDashboard />} />
            <Route path="/users" element={<UserManagement />} />
          </Routes>
        </main>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Router>
  );
}

export default App;
