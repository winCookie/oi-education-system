import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
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
            <Route path="/search" element={<GroupPoints isSearch />} />
            {/* Legacy routes for compatibility */}
            <Route path="/group/:group" element={<GroupPoints />} />
            <Route path="/admin" element={<TeacherDashboard />} />
            <Route path="/users" element={<UserManagement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
