/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { Task, TaskComment, TaskHistory } from '../types';
import {
  ArrowLeft,
  Edit,
  Calendar,
  Paperclip,
  MessageSquare,
  History,
  Link,
  Trash2,
  FileText,
  Download,
  Send,
  AlertTriangle,
  ChevronRight,
  Edit2
} from 'lucide-react';

export default function TaskDetails() {
  const {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    setActivePage,
    currentUser,
    addComment,
    deleteComment,
    updateTask
  } = useTasks();

  const task = tasks.find(t => t.id === selectedTaskId);
  
  // Local comment edit states
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={40} className="text-rose-500 mb-4" />
        <h3 className="text-sm font-bold text-foreground">Task Not Found</h3>
        <p className="text-xs text-muted-foreground mt-1">This task might have been deleted or archived.</p>
        <button
          onClick={() => setActivePage('tasks-list')}
          className="mt-4 px-4 py-2 bg-muted hover:bg-accent text-foreground rounded-xl text-xs font-semibold cursor-pointer"
        >
          Back to List
        </button>
      </div>
    );
  }

  // Styles map
  const statusStyleMap: Record<string, string> = {
    pending:    'bg-amber-100  text-amber-700  dark:bg-amber-500/20  dark:text-amber-400',
    inProgress: 'bg-blue-100   text-blue-700   dark:bg-blue-500/20   dark:text-blue-400',
    completed:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    onHold:     'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    cancelled:  'bg-rose-100   text-rose-700   dark:bg-rose-500/20   dark:text-rose-400',
    overdue:    'bg-red-100    text-red-700    dark:bg-red-500/20    dark:text-red-400'
  };

  const priorityStyleMap: Record<string, string> = {
    low:    'bg-slate-100 text-slate-600  dark:bg-slate-700/40 dark:text-slate-300',
    medium: 'bg-blue-100  text-blue-700   dark:bg-blue-500/20  dark:text-blue-400',
    high:   'bg-amber-100 text-amber-700  dark:bg-amber-500/20 dark:text-amber-400',
    urgent: 'bg-rose-100  text-rose-700   dark:bg-rose-500/20  dark:text-rose-400'
  };

  const getStatusLabel = () => {
    const today = new Date().toISOString().split('T')[0];
    const isTaskOverdue = task.status !== 'completed' && task.status !== 'cancelled' && task.dueDate && new Date(task.dueDate) < new Date(today);
    
    if (isTaskOverdue) return { label: 'Overdue', style: statusStyleMap.overdue };
    
    const labelMap: Record<string, string> = {
      pending: 'Pending',
      inProgress: 'In Progress',
      completed: 'Completed',
      onHold: 'On Hold',
      cancelled: 'Cancelled'
    };

    return { 
      label: labelMap[task.status] || 'Pending', 
      style: statusStyleMap[task.status] || statusStyleMap.pending 
    };
  };

  const statusLabel = getStatusLabel();

  // Comments handlers
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(task.id, commentText);
    setCommentText('');
  };

  const handleEditCommentInit = (comment: TaskComment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const handleSaveEditedComment = (commentId: string) => {
    if (!editCommentText.trim()) return;

    const updatedComments = (task.comments || []).map(c => 
      c.id === commentId ? { ...c, content: editCommentText } : c
    );

    const historyEntry: TaskHistory = {
      id: `h-${Math.random().toString(36).substr(2, 9)}`,
      user: currentUser?.name || 'Staff',
      action: 'Comment Updated',
      details: 'Edited a discussion comment',
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    updateTask({
      ...task,
      comments: updatedComments,
      history: [...(task.history || []), historyEntry]
    });

    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteComment(task.id, commentId);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-soft">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedTaskId(null);
              setActivePage('tasks-list');
            }}
            className="p-2 hover:bg-accent border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors shadow-soft cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                {task.id}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${statusLabel.style}`}>
                {statusLabel.label}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                priorityStyleMap[task.priority] || priorityStyleMap.medium
              }`}>
                {task.priority} Priority
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {task.title}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setActivePage('create-task');
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-muted hover:bg-accent border border-border rounded-xl text-xs font-semibold text-foreground transition-all hover:scale-[1.02] cursor-pointer shadow-soft"
        >
          <Edit size={14} />
          Edit Task Details
        </button>
      </div>

      {/* Grid Layout: Left is Main Info & Discussion, Right is Metadata Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Full Description Card */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-foreground border-b border-border pb-3">
              Task Description
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-normal whitespace-pre-wrap">
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* Attachments Section */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <Paperclip size={14} className="text-muted-foreground" />
              Attachments ({task.attachments?.length || 0})
            </h3>
            
            {(!task.attachments || task.attachments.length === 0) ? (
              <div className="text-xs text-muted-foreground py-2">
                No attachments uploaded. Edit the task to upload assets.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {task.attachments.map(att => (
                  <div 
                    key={att.id} 
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/40 group hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <FileText size={16} />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-bold text-foreground truncate">{att.name}</span>
                        <span className="text-[9px] text-muted-foreground font-semibold">{att.size}</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      title="Download file"
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <MessageSquare size={14} className="text-muted-foreground" />
              Discussion Comments ({task.comments?.length || 0})
            </h3>

            {/* Comments List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {(!task.comments || task.comments.length === 0) ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No comments yet. Start the discussion below!
                </div>
              ) : (
                task.comments.map((comment) => {
                  const isOwnComment = comment.author?.id === currentUser?.id;
                  const isEditing = editingCommentId === comment.id;

                  return (
                    <div key={comment.id} className="flex items-start gap-3.5 group/comment">
                      {comment.author?.avatar && (
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.name}
                          className="w-8 h-8 rounded-full border border-border object-cover mt-0.5"
                        />
                      )}
                      
                      <div className="flex-1 bg-muted/50 p-3.5 rounded-2xl border border-border">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-foreground">
                              {comment.author?.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-semibold">
                              {comment.timestamp}
                            </span>
                          </div>

                          {isOwnComment && !isEditing && (
                            <div className="opacity-0 group-hover/comment:opacity-100 flex items-center gap-1 transition-opacity">
                              <button
                                onClick={() => handleEditCommentInit(comment)}
                                className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <Edit2 size={11} />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-950/20 rounded text-muted-foreground hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-foreground"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-2.5 py-1 border border-border hover:bg-accent text-muted-foreground rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEditedComment(comment.id)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground leading-relaxed font-normal whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-3 pt-3 border-t border-border">
              {currentUser?.avatar && (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border border-border object-cover hidden sm:block"
                />
              )}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type a comment... Use @ to mention assignees"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 bg-muted/50 border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
                >
                  <Send size={12} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: 4 Columns - Metadata & Timeline */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Assignment & Details Panel */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-soft space-y-5">
            <h3 className="text-xs font-bold text-foreground border-b border-border pb-3 uppercase tracking-wider">
              Task Details Context
            </h3>

            <div className="space-y-4 text-xs">
              {/* Assignee */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned To</span>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 border border-border">
                  {task.assignedTo?.avatar && (
                    <img
                      src={task.assignedTo.avatar}
                      alt={task.assignedTo.name}
                      className="w-8 h-8 rounded-full border border-border object-cover"
                    />
                  )}
                  <div className="flex flex-col truncate">
                    <span className="font-bold text-foreground truncate">{task.assignedTo?.name || 'Unassigned'}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold truncate">{task.assignedTo?.role || 'Staff'}</span>
                  </div>
                </div>
              </div>

              {/* Assigner */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned By</span>
                <div className="flex items-center gap-3">
                  {task.assignedBy?.avatar && (
                    <img
                      src={task.assignedBy.avatar}
                      alt={task.assignedBy.name}
                      className="w-7 h-7 rounded-full border border-border object-cover"
                    />
                  )}
                  <div className="flex flex-col truncate">
                    <span className="font-semibold text-foreground truncate">{task.assignedBy?.name || 'Staff'}</span>
                    <span className="text-[9px] text-muted-foreground truncate">{task.assignedBy?.email || ''}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border my-4" />

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Start Date</span>
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <Calendar size={12} className="text-muted-foreground" />
                    {task.startDate || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Due Date</span>
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <Calendar size={12} className="text-muted-foreground" />
                    {task.dueDate || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Related module */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Related CRM Module</span>
                <span className="font-bold text-foreground flex items-center gap-1.5 capitalize">
                  <Link size={12} className="text-blue-500" />
                  {task.relatedModule || 'None'}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-muted border border-border text-muted-foreground text-[9px] font-bold rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Related Records Panel */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <Link size={13} className="text-indigo-500" />
              Related Records
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-1 hover:border-indigo-400/40 transition-colors cursor-pointer">
                <span className="text-[8px] font-extrabold uppercase text-indigo-500">Student Enrollment</span>
                <div className="font-bold text-foreground hover:underline flex items-center justify-between">
                  <span>Batch of Summer 2026 Intake</span>
                  <ChevronRight size={12} />
                </div>
              </div>
              <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-1 hover:border-emerald-400/40 transition-colors cursor-pointer">
                <span className="text-[8px] font-extrabold uppercase text-emerald-500">Academic Term Calendar</span>
                <div className="font-bold text-foreground hover:underline flex items-center justify-between">
                  <span>Term II Evaluation Plan</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline Stream */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <History size={14} className="text-muted-foreground" />
              Activity History
            </h3>

            <div className="relative border-l border-border ml-2.5 pl-4 space-y-4 max-h-[300px] overflow-y-auto">
              {(!task.history || task.history.length === 0) ? (
                <div className="text-xs text-muted-foreground py-1">No activities logged yet.</div>
              ) : (
                task.history.map((hist, idx) => (
                  <div key={hist.id || idx} className="relative group/history">
                    {/* Timeline bullet indicator */}
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-muted-foreground/30 group-hover/history:bg-blue-500 transition-colors border-2 border-card" />
                    
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-foreground">
                          {hist.user}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-muted text-[8px] font-bold text-muted-foreground border border-border uppercase">
                          {hist.action}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {hist.details}
                      </p>
                      <span className="text-[8px] text-muted-foreground font-semibold block pt-0.5">
                        {hist.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}




