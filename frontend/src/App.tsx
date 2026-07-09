import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function LoginPage() {
  return <div className="p-8 text-2xl">Login Page (placeholder)</div>;
}

function DashboardPage() {
  return <div className="p-8 text-2xl">Dashboard Page (placeholder)</div>;
}

function ProjectPage() {
  return <div className="p-8 text-2xl">Project Page (placeholder)</div>;
}

function RunPage() {
  return <div className="p-8 text-2xl">Run Page (placeholder)</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects/:projectId" element={<ProjectPage />} />
        <Route path="/runs/:runId" element={<RunPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;