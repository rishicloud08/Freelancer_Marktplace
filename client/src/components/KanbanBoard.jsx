import React, { useState, useEffect } from 'react';
import { 
  FiPlus, 
  FiTrash2, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiCpu,
  FiArrowRight,
  FiArrowLeft
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

const COLUMNS = [
  { id: 'backlog', title: '📌 Backlog', bg: 'bg-slate-500/10', border: 'border-slate-300/40', text: 'text-slate-700' },
  { id: 'in-progress', title: '⚡ In Progress', bg: 'bg-blue-500/10', border: 'border-blue-300/40', text: 'text-blue-700' },
  { id: 'ai-review', title: '🧠 AI Quality Audit', bg: 'bg-purple-500/10', border: 'border-purple-300/40', text: 'text-purple-700' },
  { id: 'done', title: '✅ Approved / Done', bg: 'bg-emerald-500/10', border: 'border-emerald-300/40', text: 'text-emerald-700' }
];

export default function KanbanBoard({ projectId, milestones = [] }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    storyPoints: 3,
    milestoneId: ''
  });

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const res = await api.tasks.getProjectTasks(projectId);
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log('Tasks load note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Task title is required');

    try {
      await api.tasks.createTask({
        projectId,
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        storyPoints: Number(taskForm.storyPoints),
        milestoneId: taskForm.milestoneId || (milestones[0]?._id || null)
      });
      toast.success('Sprint task created!');
      setShowNewTaskForm(false);
      setTaskForm({ title: '', description: '', priority: 'medium', storyPoints: 3, milestoneId: '' });
      fetchTasks();
    } catch (err) {
      toast.error('Failed to create sprint task');
    }
  };

  const handleMoveTask = async (taskId, newStatus) => {
    try {
      await api.tasks.updateTaskStatus(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      toast.error('Failed to move task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.tasks.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task removed');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-red-200">Urgent</span>;
      case 'high':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">High</span>;
      default:
        return <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-indigo-100">Medium</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/60 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Sprint Kanban Board</h3>
          <p className="text-xs text-gray-500">Track and progress agile sprint deliverables between client and freelancer.</p>
        </div>

        <button
          onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <FiPlus /> {showNewTaskForm ? 'Cancel' : 'Add Sprint Task'}
        </button>
      </div>

      {/* New Task Form */}
      {showNewTaskForm && (
        <form onSubmit={handleCreateTask} className="glass p-5 rounded-3xl border border-indigo-200 space-y-4 animate-in fade-in duration-150">
          <h4 className="font-bold text-xs text-gray-900">Create Sprint Task</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              type="text"
              placeholder="Task Title (e.g. Implement JWT Refresh Tokens)"
              className="p-2.5 rounded-xl glass-input text-xs"
              value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
            />
            <select
              className="p-2.5 rounded-xl glass-input text-xs"
              value={taskForm.priority}
              onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent Priority</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="number"
              min="1"
              max="13"
              placeholder="Story Points (e.g. 3)"
              className="p-2.5 rounded-xl glass-input text-xs"
              value={taskForm.storyPoints}
              onChange={e => setTaskForm({ ...taskForm, storyPoints: e.target.value })}
            />
            <select
              className="p-2.5 rounded-xl glass-input text-xs"
              value={taskForm.milestoneId}
              onChange={e => setTaskForm({ ...taskForm, milestoneId: e.target.value })}
            >
              <option value="">Attach to Milestone (optional)</option>
              {milestones.map(m => (
                <option key={m._id} value={m._id}>{m.title}</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Sub-task details and acceptance notes..."
            rows={2}
            className="w-full p-2.5 rounded-xl glass-input text-xs"
            value={taskForm.description}
            onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
              Add Task to Sprint
            </button>
          </div>
        </form>
      )}

      {/* 4 Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col, colIdx) => {
          const colTasks = tasks.filter(t => t.status === col.id);

          return (
            <div 
              key={col.id}
              className={`glass rounded-3xl p-4 border ${col.border} flex flex-col min-h-[420px]`}
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/60">
                <span className={`text-xs font-black tracking-wide ${col.text}`}>{col.title}</span>
                <span className="bg-white/80 text-gray-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-gray-200 shadow-2xs">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-6 text-center text-gray-400 text-xs italic">
                    No tasks
                  </div>
                ) : (
                  colTasks.map(task => (
                    <div 
                      key={task._id}
                      className="glass-card p-4 rounded-2xl border border-white/80 shadow-2xs space-y-2.5 group hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-gray-900 leading-snug">{task.title}</h4>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{task.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-gray-100/60 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          {getPriorityBadge(task.priority)}
                          <span className="text-gray-400 font-semibold">{task.storyPoints || 3} pts</span>
                        </div>
                      </div>

                      {/* Move Column Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        {colIdx > 0 ? (
                          <button
                            onClick={() => handleMoveTask(task._id, COLUMNS[colIdx - 1].id)}
                            className="text-[10px] font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer"
                          >
                            <FiArrowLeft /> Prev
                          </button>
                        ) : <div></div>}

                        {colIdx < COLUMNS.length - 1 && (
                          <button
                            onClick={() => handleMoveTask(task._id, COLUMNS[colIdx + 1].id)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 ml-auto cursor-pointer"
                          >
                            Next <FiArrowRight />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
