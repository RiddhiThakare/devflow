import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { io, Socket } from 'socket.io-client';

interface Run {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  logs: string;
  triggeredAt: string;
  finishedAt: string | null;
  pipeline: {
    name: string;
    project: {
      name: string;
    };
  };
}

const statusColors = {
  PENDING: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
  RUNNING: 'bg-blue-900/40 text-blue-400 border-blue-700 animate-pulse',
  SUCCESS: 'bg-green-900/40 text-green-400 border-green-700',
  FAILED: 'bg-red-900/40 text-red-400 border-red-700',
};

export default function RunPage() {
  const { runId } = useParams();
  const [run, setRun] = useState<Run | null>(null);
  const [logs, setLogs] = useState('');
  const [status, setStatus] = useState<Run['status']>('PENDING');
  const [connected, setConnected] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // auto-scroll to bottom as logs come in
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // fetch initial run data
  useEffect(() => {
    if (!runId) return;

    api.get(`/runs/${runId}`).then((res) => {
      setRun(res.data);
      setStatus(res.data.status);

      // if already finished, show saved logs — no need for socket
      if (res.data.status === 'SUCCESS' || res.data.status === 'FAILED') {
        setLogs(res.data.logs);
        return;
      }

      // run is still in progress — connect to socket for live logs
      setLogs(res.data.logs); // show whatever logs exist so far
      connectSocket(runId);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [runId]);

  function connectSocket(runId: string) {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-run', runId);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('log-line', (line: string) => {
      setLogs((prev) => prev + line);
    });

    socket.on('status-update', (data: { status: Run['status'] }) => {
      setStatus(data.status);

      // disconnect socket once run is done
      if (data.status === 'SUCCESS' || data.status === 'FAILED') {
        socket.disconnect();
        setConnected(false);
      }
    });
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-8 text-gray-400">
          Loading run...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <p className="text-gray-500 text-sm mb-1">
            {run.pipeline.project.name} / {run.pipeline.name}
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white font-mono">
              Run {runId?.slice(0, 8)}...
            </h1>
            <span className={`text-xs px-2 py-1 rounded border ${statusColors[status]}`}>
              {status}
            </span>
            {connected && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse inline-block" />
                Live
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Started {new Date(run.triggeredAt).toLocaleString()}
            {run.finishedAt && (
              <> · Finished {new Date(run.finishedAt).toLocaleString()}</>
            )}
          </p>
        </div>

        {/* Log viewer */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950">
            <span className="text-gray-500 text-xs font-mono">logs</span>
            {connected && (
              <span className="text-gray-500 text-xs">streaming live...</span>
            )}
          </div>
          <div className="p-4 h-[500px] overflow-y-auto font-mono text-sm">
            {logs ? (
              <>
                <pre className="text-green-400 whitespace-pre-wrap break-words">
                  {logs}
                </pre>
                <div ref={logsEndRef} />
              </>
            ) : (
              <p className="text-gray-600">
                {status === 'PENDING'
                  ? 'Waiting for worker to pick up job...'
                  : 'No logs yet...'}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}