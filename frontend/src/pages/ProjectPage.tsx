import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

interface Pipeline {
  id: string;
  name: string;
  createdAt: string;
}

interface Run {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  triggeredAt: string;
  finishedAt: string | null;
}

const statusColors = {
  PENDING: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
  RUNNING: 'bg-blue-900/40 text-blue-400 border-blue-700',
  SUCCESS: 'bg-green-900/40 text-green-400 border-green-700',
  FAILED: 'bg-red-900/40 text-red-400 border-red-700',
};

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [pipelineName, setPipelineName] = useState('');
  const [yamlConfig, setYamlConfig] = useState(
    'name: My Pipeline\nrepo: https://github.com/octocat/Hello-World.git\nsteps:\n  - name: List files\n    run: ls -la'
  );
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    fetchPipelines();
  }, [projectId]);

  useEffect(() => {
    if (selectedPipeline) fetchRuns(selectedPipeline.id);
  }, [selectedPipeline]);

  async function fetchPipelines() {
    const res = await api.get(`/projects/${projectId}/pipelines`);
    setPipelines(res.data);
    if (res.data.length > 0) setSelectedPipeline(res.data[0]);
  }

  async function fetchRuns(pipelineId: string) {
    const res = await api.get(`/pipelines/${pipelineId}/runs`);
    setRuns(res.data);
  }

  async function createPipeline() {
    if (!pipelineName.trim()) return;
    await api.post(`/projects/${projectId}/pipelines`, {
      name: pipelineName,
      yamlConfig,
    });
    setPipelineName('');
    setShowCreate(false);
    fetchPipelines();
  }

  async function triggerRun() {
    if (!selectedPipeline) return;
    setTriggering(true);
    try {
      const res = await api.post(`/pipelines/${selectedPipeline.id}/trigger`);
      navigate(`/runs/${res.data.id}`);
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Pipelines</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + New Pipeline
          </button>
        </div>

        {showCreate && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-white font-medium mb-4">Create Pipeline</h2>
            <div className="space-y-3">
              <input
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="Pipeline name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <textarea
                value={yamlConfig}
                onChange={(e) => setYamlConfig(e.target.value)}
                rows={8}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={createPipeline}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Create
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

        <div className="grid grid-cols-3 gap-6">
          {/* Pipeline list */}
          <div className="col-span-1 space-y-2">
            {pipelines.length === 0 ? (
              <p className="text-gray-500 text-sm">No pipelines yet.</p>
            ) : (
              pipelines.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPipeline(p)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedPipeline?.id === p.id
                      ? 'bg-blue-900/30 border-blue-700 text-white'
                      : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <p className="font-medium text-sm">{p.name}</p>
                </div>
              ))
            )}
          </div>

          {/* Runs list */}
          <div className="col-span-2">
            {selectedPipeline && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-medium">{selectedPipeline.name}</h2>
                  <button
                    onClick={triggerRun}
                    disabled={triggering}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {triggering ? 'Triggering...' : '▶ Run Pipeline'}
                  </button>
                </div>

                {runs.length === 0 ? (
                  <p className="text-gray-500 text-sm">No runs yet. Trigger one above.</p>
                ) : (
                  <div className="space-y-2">
                    {runs.map((run) => (
                      <div
                        key={run.id}
                        onClick={() => navigate(`/runs/${run.id}`)}
                        className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="text-gray-300 text-sm font-mono">
                            {run.id.slice(0, 8)}...
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(run.triggeredAt).toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded border ${statusColors[run.status]}`}>
                          {run.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}