import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
// Mock modules and tags removed
const TAGS: string[] = [];
const RELATED_MODULES: string[] = [];
import { Task, TaskHistory, Member } from '../types';
import {
  ArrowLeft,
  FileText,
  CalendarDays,
  Briefcase,
  Tags,
  Paperclip,
  Trash2
} from 'lucide-react';

export default function CreateTask({ onClose }: { onClose?: () => void } = {}) {
  const {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    setActivePage,
    currentUser,
    addTask,
    updateTask,
    members
  } = useTasks();

  const isEditMode = selectedTaskId !== null;
  const existingTask = tasks.find(t => t.id === selectedTaskId);

  // Form states
  const [title, setTitle] = useState(() => existingTask?.title || '');
  const [description, setDescription] = useState(() => existingTask?.description || '');
  const [startDate, setStartDate] = useState(() => {
    if (isEditMode && existingTask) return existingTask.startDate || '';
    return new Date().toISOString().split('T')[0];
  });
  const [dueDate, setDueDate] = useState(() => {
    if (isEditMode && existingTask) return existingTask.dueDate || '';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [assignedToId, setAssignedToId] = useState(() => existingTask?.assignedTo?.id || members[0]?.id || '');
  const [assignedById, setAssignedById] = useState(() => existingTask?.assignedBy?.id || currentUser?.id || members[0]?.id || '');
  const [status, setStatus] = useState<Task['status']>(() => existingTask?.status || 'pending');
  const [priority, setPriority] = useState<Task['priority']>(() => existingTask?.priority || 'medium');
  const [relatedModule, setRelatedModule] = useState(() => existingTask?.relatedModule || RELATED_MODULES[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>(() => existingTask?.tags || []);
  const [attachments, setAttachments] = useState<{ id: string; name: string; size: string }[]>(() => existingTask?.attachments || []);
  const [newAttachmentName, setNewAttachmentName] = useState('');

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleAddAttachment = () => {
    if (!newAttachmentName.trim()) return;
    const sizeMap = ['124 KB', '4.2 MB', '12 KB', '98 KB', '1.1 MB'];
    const randomSize = sizeMap[Math.floor(Math.random() * sizeMap.length)];
    const newAtt = {
      id: `att-${Math.random().toString(36).substr(2, 9)}`,
      name: newAttachmentName.trim(),
      size: randomSize
    };
    setAttachments(prev => [...prev, newAtt]);
    setNewAttachmentName('');
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleCancel = () => {
    setSelectedTaskId(null);
    if (onClose) {
      onClose();
    } else {
      setActivePage('tasks-list');
    }
  };

  const handleSubmit = (e: React.FormEvent | null, forceDraft = false) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      alert('Please provide a task title.');
      return;
    }

    const selectedAssignee = members.find(m => m.id === assignedToId) || members[0];
    const selectedCreator = members.find(m => m.id === assignedById) || members[0];

    const taskData: Omit<Task, 'id' | 'history'> & {
      assignedTo: Member;
      assignedBy: Member;
    } = {
      title: title.trim(),
      description: description.trim(),
      startDate,
      dueDate,
      assignedTo: {
        id: selectedAssignee.id,
        name: selectedAssignee.name,
        role: selectedAssignee.role,
        email: selectedAssignee.email || '',
        avatar: selectedAssignee.avatar
      },
      assignedBy: {
        id: selectedCreator.id,
        name: selectedCreator.name,
        role: selectedCreator.role || 'Staff Member',
        email: selectedCreator.email || 'staff@company.com',
        avatar: selectedCreator.avatar
      },
      status: forceDraft ? 'pending' : status,
      priority,
      relatedModule,
      tags: selectedTags,
      attachments: attachments.map(att => ({
        id: att.id,
        name: att.name,
        size: att.size,
        type: 'file',
        url: ''
      })),
    };

    if (isEditMode && existingTask) {
      // Create history entry
      const changes: string[] = [];
      if (existingTask.title !== taskData.title) changes.push('Title changed');
      if (existingTask.status !== taskData.status) changes.push(`Status to ${taskData.status}`);
      if (existingTask.priority !== taskData.priority) changes.push(`Priority to ${taskData.priority}`);
      if (existingTask.assignedTo?.id !== taskData.assignedTo.id) changes.push(`Assignee changed to ${taskData.assignedTo.name}`);

      const newHistory: TaskHistory = {
        id: `h-${Math.random().toString(36).substr(2, 9)}`,
        user: currentUser?.name || 'Staff',
        action: 'Task Updated',
        details: changes.length > 0 ? changes.join(', ') : 'Updated settings & configuration',
        timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      updateTask({
        ...existingTask,
        ...taskData,
        history: [...(existingTask.history || []), newHistory]
      });
    } else {
      // Create new task without sending history (it is initialized by backend/context contextually)
      addTask(taskData);
    }

    setSelectedTaskId(null);
    if (onClose) {
      onClose();
    } else {
      setActivePage('tasks-list');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      {!onClose && (
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-card border border-border shadow-soft">
          <button
            type="button"
            onClick={handleCancel}
            className="p-2 hover:bg-accent border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors shadow-soft cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isEditMode ? 'Modify Task Details' : 'Publish New Database Task'}
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              {isEditMode ? `Updating database configuration for ID: ${existingTask?.id}` : 'Deploy assignments, priorities and attachments logs'}
            </p>
          </div>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={(e) => handleSubmit(e, false)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Basic Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} className="text-blue-500" />
              Basic Information
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Task Title</label>
                <input
                  type="text"
                  placeholder="Summarize the action or issue..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-3 bg-muted border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Description / Instructions</label>
                <textarea
                  placeholder="Provide detailed logs, steps to reproduce, or workflow requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-3.5 py-3 bg-muted border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-foreground placeholder:text-muted-foreground resize-y leading-relaxed"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dates & Assignment */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <CalendarDays size={14} className="text-blue-500" />
              Timeline & Assignment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-foreground"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-foreground"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Assigned To</label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-foreground bg-card"
                >
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Assigned By</label>
                <select
                  value={assignedById}
                  onChange={(e) => setAssignedById(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-foreground bg-card"
                >
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Task Settings, Modules, Tags & Attachments */}
        <div className="space-y-6">
          
          {/* Settings Section */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Briefcase size={14} className="text-blue-500" />
              Task Context
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Task['status'])}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-foreground bg-card"
                >
                  <option value="pending">Pending</option>
                  <option value="inProgress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="onHold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Task['priority'])}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-foreground bg-card"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Related System Module</label>
                <select
                  value={relatedModule}
                  onChange={(e) => setRelatedModule(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-foreground bg-card"
                >
                  {[] /* No mock modules */ .map(mod => (
                    <option key={mod} value={mod}>{mod}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tags Configuration */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Tags size={14} className="text-blue-500" />
              Categorization Tags
            </h3>

            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10'
                        : 'bg-muted border-border text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attachments Section */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Paperclip size={14} className="text-blue-500" />
              Attachments (Upload Simulation)
            </h3>

            {/* Input field to simulate file attachment */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Filename e.g. error_log.png"
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/25 text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-3.5 py-2 bg-muted hover:bg-accent text-foreground border border-border rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Attachment List */}
            {attachments.length > 0 && (
              <div className="space-y-2 border-t border-border pt-3 mt-3">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className="text-muted-foreground" />
                      <div className="flex flex-col truncate">
                        <span className="text-[10px] font-semibold text-foreground truncate">{att.name}</span>
                        <span className="text-[8px] text-muted-foreground">{att.size}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-600 rounded cursor-pointer animate-fade-in"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Action Buttons Footer */}
        <div className="lg:col-span-3 flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:w-32 py-3 border border-border hover:bg-accent text-muted-foreground rounded-xl text-xs font-semibold cursor-pointer text-center transition-all bg-card"
          >
            Cancel
          </button>
          
          {!isEditMode && (
            <button
              type="button"
              onClick={() => handleSubmit(null, true)}
              className="w-full sm:w-36 py-3 bg-muted hover:bg-accent text-foreground rounded-xl text-xs font-bold cursor-pointer transition-all border border-border"
            >
              Save Draft
            </button>
          )}

          <button
            type="submit"
            className="w-full sm:w-44 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-lg transition-all cursor-pointer"
          >
            {isEditMode ? 'Update Database Task' : 'Save & Publish Task'}
          </button>
        </div>

      </form>
    </div>
  );
}


