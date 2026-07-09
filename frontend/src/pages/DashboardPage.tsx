import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post('/projects', { name, description });
      setName('');
      setDescription('');
      setShowCreate(false);
      fetchProjects();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + New Project
          </button>
        </div>

        {showCreate && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-white font-medium mb-4">Create Project</h2>
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={createProject}
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-gray-400 hover:text-white px-4 py-2 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-gray-400">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No projects yet. Create your first one.
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 cursor-pointer transition-colors"
              >
                <h3 className="text-white font-medium">{project.name}</h3>
                {project.description && (
                  <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                )}
                <p className="text-gray-600 text-xs mt-2">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}