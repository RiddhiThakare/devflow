import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';

function DashboardPage() {
  return <div className="p-8 text-2xl text-white bg-gray-950 min-h-screen">Dashboard (coming next)</div>;
}

function ProjectPage() {
  return <div className="p-8 text-2xl text-white bg-gray-950 min-h-screen">Project Page (coming next)</div>;
}

function RunPage() {
  return <div className="p-8 text-2xl text-white bg-gray-950 min-h-screen">Run Page (coming next)</div>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/projects/:projectId" element={
            <ProtectedRoute><ProjectPage /></ProtectedRoute>
          } />
          <Route path="/runs/:runId" element={
            <ProtectedRoute><RunPage /></ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;