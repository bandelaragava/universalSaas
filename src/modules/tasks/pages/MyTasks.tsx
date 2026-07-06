/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { Task } from '../types';
import {
  UserCheck,
  Calendar,
  AlertTriangle,
  CheckCircle,
  List,
  Kanban,
  Check,
  MessageSquare,
  ChevronDown,
  Clock,
  Play,
  Pause,
  XCircle,
  AlertOctagon,
  Eye,
  Send,
  X
} from 'lucide-react';

export default function MyTasks() {
  const { 
    tasks, 
    currentUser, 
    updateStatus, 
    addComment, 
    navigateToDetails 
  } = useTasks();

  // View Toggle State: 'list' or 'kanban'
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  
  // Comment Modal state
  const [commentingTaskId, setCommentingTaskId] = useState<string | null>(null);
  const [quickCommentText, setQuickCommentText] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Helper to determine if a task is overdue
  const checkOverdue = (task: Task) => {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    if (task.status === 'overdue') return true;
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date(today);
  };

  // Filter tasks assigned to Current User
  const myAssignedTasks = useMemo(() => {
    return tasks.filter(t => t.assignedTo?.id === currentUser?.id && !t.archived);
  }, [tasks, currentUser]);

  // Widgets calculations
  const totalAssigned = myAssignedTasks.length;
  const dueToday = myAssignedTasks.filter(t => t.dueDate === today && t.status !== 'completed').length;
  const overdue = myAssignedTasks.filter(checkOverdue).length;
  const completed = myAssignedTasks.filter(t => t.status === 'completed').length;

  // Mini-Kanban Columns definition
  const columns: { id: Task['status'] | 'overdue'; title: string; icon: any; color: string }[] = [
    { id: 'pending', title: 'Pending', icon: Clock, color: 'border-t-amber-400 bg-amber-500/5 text-amber-500' },
    { id: 'inProgress', title: 'In Progress', icon: Play, color: 'border-t-blue-500 bg-blue-500/5 text-blue-500' },
    { id: 'completed', title: 'Completed', icon: CheckCircle, color: 'border-t-emerald-500 bg-emerald-500/5 text-emerald-500' },
    { id: 'overdue', title: 'Overdue', icon: AlertOctagon, color: 'border-t-red-500 bg-red-500/5 text-red-500' }
  ];

  const getTasksByColumn = (columnId: Task['status'] | 'overdue') => {
    return myAssignedTasks.filter(task => {
      const isTaskOverdue = checkOverdue(task);
      if (columnId === 'overdue') {
        return isTaskOverdue;
      }
      if (isTaskOverdue) return false;
      return task.status === columnId;
    });
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.currentTarget.classList.add('opacity-40');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-40');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-accent/40');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-accent/40');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnId: Task['status'] | 'overdue') => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-accent/40');
    
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const newStatus = targetColumnId === 'overdue' ? 'overdue' : targetColumnId;
    updateStatus(taskId, newStatus);
  };

  // Status mapping
  const statusStyleMap: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    inProgress: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    onHold: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    high: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    urgent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
  };

  const getTaskStatusLabel = (task: Task) => {
    const isTaskOverdue = checkOverdue(task);
    if (isTaskOverdue) return { label: 'Overdue', style: statusStyleMap.overdue };
    
    const labelMap: Record<string, string> = {
      pending: 'Pending',
      inProgress: 'In Progress',
      completed: 'Completed',
      onHold: 'On Hold',
      cancelled: 'Cancelled'
    };
    return { label: labelMap[task.status] || 'Pending', style: statusStyleMap[task.status] || statusStyleMap.pending };
  };

  // Quick Comment Submission
  const handleQuickCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCommentText.trim() || !commentingTaskId) return;
    addComment(commentingTaskId, quickCommentText);
    setQuickCommentText('');
    setCommentingTaskId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">My Workspace</h2>
          <p className="text-xs text-muted-foreground font-medium">Personal assignments queue and quick actions dashboard</p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-xl shadow-soft">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <List size={13} />
            List View
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-blue-600 text-white'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <Kanban size={13} />
            Kanban View
          </button>
        </div>
      </div>

      {/* Grid of My Stats widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Assigned */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-soft flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
            <UserCheck size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Tasks</span>
            <span className="text-lg font-black text-foreground">{totalAssigned}</span>
          </div>
        </div>

        {/* Due Today */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-soft flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
            <Calendar size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Due Today</span>
            <span className="text-lg font-black text-foreground">{dueToday}</span>
          </div>
        </div>

        {/* Overdue */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-soft flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500">
            <AlertTriangle size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Overdue Items</span>
            <span className="text-lg font-black text-foreground">{overdue}</span>
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-soft flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Completed Tasks</span>
            <span className="text-lg font-black text-foreground">{completed}</span>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {totalAssigned === 0 ? (
        <div className="p-16 rounded-2xl bg-card border border-border shadow-soft text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground mb-4">
            <UserCheck size={20} />
          </div>
          <h3 className="text-sm font-bold text-foreground">No Tasks Assigned</h3>
          <p className="text-xs text-muted-foreground mt-1">Excellent! You are all caught up. No assignments are pending on your queue.</p>
        </div>
      ) : viewMode === 'list' ? (
        /* List View (Table styled specifically for currentUser) */
        <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50">
                  <th className="py-4 px-6 min-w-[200px]">Task Description</th>
                  <th className="py-4 px-3 w-32">Status</th>
                  <th className="py-4 px-3 w-28">Priority</th>
                  <th className="py-4 px-3 w-28">Due Date</th>
                  <th className="py-4 pr-6 pl-2 w-44 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {myAssignedTasks.map((task) => {
                  const statusInfo = getTaskStatusLabel(task);

                  return (
                    <tr key={task.id} className="group hover:bg-accent/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex flex-col gap-0.5 max-w-xs sm:max-w-sm">
                          <span 
                            onClick={() => navigateToDetails(task.id)}
                            className="font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors line-clamp-1"
                          >
                            {task.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            ID: <span className="font-mono">{task.id}</span> • {task.relatedModule}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${statusInfo.style}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${priorityColors[task.priority] || priorityColors.medium}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-muted-foreground">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-3.5 pr-6 pl-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Navigate details */}
                          <button
                            onClick={() => navigateToDetails(task.id)}
                            title="View details"
                            className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Eye size={12} />
                          </button>

                          {/* Quick Add Comment */}
                          <button
                            onClick={() => setCommentingTaskId(task.id)}
                            title="Add comment"
                            className="p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <MessageSquare size={12} />
                          </button>

                          {/* Quick status dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveDropdownId(activeDropdownId === task.id ? null : task.id)}
                              className="flex items-center gap-0.5 px-2 py-1.5 border border-border rounded-lg text-[10px] font-bold text-muted-foreground hover:bg-accent cursor-pointer"
                            >
                              Status
                              <ChevronDown size={10} />
                            </button>
                            {activeDropdownId === task.id && (
                              <div className="absolute right-0 mt-1.5 w-36 bg-card border border-border rounded-xl shadow-soft-lg z-20 py-1.5 text-left animate-fade-in">
                                {[
                                  { id: 'pending', label: 'Pending', icon: Clock, style: 'text-amber-500 hover:bg-amber-500/5' },
                                  { id: 'inProgress', label: 'In Progress', icon: Play, style: 'text-blue-500 hover:bg-blue-500/5' },
                                  { id: 'completed', label: 'Completed', icon: Check, style: 'text-emerald-500 hover:bg-emerald-500/5' },
                                  { id: 'onHold', label: 'On Hold', icon: Pause, style: 'text-orange-500 hover:bg-orange-500/5' },
                                  { id: 'cancelled', label: 'Cancelled', icon: XCircle, style: 'text-rose-500 hover:bg-rose-500/5' }
                                ].map((opt) => {
                                  const OptIcon = opt.icon;
                                  return (
                                    <button
                                      key={opt.id}
                                      onClick={() => {
                                        updateStatus(task.id, opt.id as any);
                                        setActiveDropdownId(null);
                                      }}
                                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${opt.style}`}
                                    >
                                      <OptIcon size={12} />
                                      {opt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Board (Aggregated columns) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {columns.map((col) => {
            const colTasks = getTasksByColumn(col.id);
            const ColIcon = col.icon;

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex flex-col rounded-2xl border border-border min-h-[400px] overflow-hidden ${col.color} border-t-4 transition-colors`}
              >
                <div className="flex items-center justify-between p-3.5 border-b border-border bg-card/60 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <ColIcon size={14} />
                    <span className="text-[11px] font-bold text-foreground">{col.title}</span>
                  </div>
                  <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-muted rounded-full text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border/80 rounded-xl">
                      <span className="text-[9px] font-bold text-muted-foreground">Empty Column</span>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => navigateToDetails(task.id)}
                        className="group relative bg-card border border-border hover:border-blue-500/40 rounded-xl p-3.5 shadow-soft cursor-grab active:cursor-grabbing hover:shadow-soft-lg transition-all"
                      >
                        <div className="space-y-2">
                          <span className="text-[8px] font-mono font-bold text-muted-foreground block">{task.id}</span>
                          <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                            {task.title}
                          </h4>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-border mt-2.5">
                            <span className="text-[9px] text-muted-foreground font-semibold">
                              Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
                            </span>
                            <span className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase ${priorityColors[task.priority] || priorityColors.medium}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Comment dialog box */}
      {commentingTaskId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-5 shadow-soft-lg animate-fade-in">
            <div className="flex items-center justify-between pb-3.5 border-b border-border mb-3.5">
              <h3 className="text-xs font-bold text-foreground">Add Quick Comment</h3>
              <button
                onClick={() => setCommentingTaskId(null)}
                className="p-1 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleQuickCommentSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-muted-foreground">Comment Content</label>
                <textarea
                  value={quickCommentText}
                  onChange={(e) => setQuickCommentText(e.target.value)}
                  placeholder="Share updates, issues or status summaries..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-foreground placeholder:text-muted-foreground"
                  required
                  autoFocus
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCommentingTaskId(null)}
                  className="px-3.5 py-2 border border-border hover:bg-accent text-muted-foreground rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  <Send size={11} />
                  Submit Comment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




