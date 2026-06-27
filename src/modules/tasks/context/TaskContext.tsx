/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { usePermissions } from '@/auth/usePermissions';
import { Member, Task, Notification, TaskComment } from '../types';
// Mock data import removed; using empty defaults
import { tasksService } from '../services/tasksService';

export interface TaskContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  currentUser: Member | null;
  setCurrentUser: (member: Member | null) => void;
  members: Member[];
  tasks: Task[];
  notifications: Notification[];
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  errorState: string | null;
  setErrorState: (err: string | null) => void;
  addTask: (task: Omit<Task, 'id' | 'createdDate' | 'archived' | 'comments' | 'history'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  updateStatus: (taskId: string, newStatus: Task['status']) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  duplicateTask: (taskId: string) => void;
  archiveTask: (taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  deleteComment: (taskId: string, commentId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => Promise<void>;
  navigateToDetails: (taskId: string) => void;
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | null>(null);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
};

interface TaskProviderProps {
  children: React.ReactNode;
}

const TASK_PERMISSION_KEYS = ['TASKS_VIEW_TASKS', 'TASKS_VIEW_TASKS', 'TASKS_CREATE_TASK', 'TASKS_EDIT_TASK', 'TASKS_DELETE_TASK', 'TASKS_ASSIGN_TASK'];

function normalizePermission(value: string) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const { user, token } = useAuth();
  const { can } = usePermissions();

  const hasTaskViewPermission =
    can('TASKS_VIEW_TASKS') ||
    can('TASKS_VIEW_TASKS') ||
    can('TASKS_EDIT_TASK') ||
    can('TASKS_VIEW_TASKS');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('task-theme');
    return saved ? saved === 'dark' : false;
  });
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('task-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('task-theme', 'light');
    }
  }, [darkMode]);

  const normalizeMember = (member: any): Member => {
    const firstName = member.firstName || member.first_name || '';
    const lastName = member.lastName || member.last_name || '';
    const nameStr = member.name || member.full_name || member.username || `${firstName} ${lastName}`.trim() || member.email || 'User';
    return {
      id: String(member.id || member.userId || member.employeeId || member.email),
      name: nameStr,
      role: member.role || member.roleName || 'Staff Member',
      email: member.email || '',
      avatar: member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameStr)}&background=6366f1&color=fff`,
    };
  };

  const extractArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.content)) return value.content;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.results)) return value.results;
    return [];
  };

  const normalizeTaskForApi = (task: any): Record<string, any> => ({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    startDate: task.startDate,
    dueDate: task.dueDate,
    assigned_to_id: task.assignedTo?.email ? undefined : task.assignedTo?.id || task.assignedToId,
    assigned_to_email: task.assignedTo?.email || '',
    tags: task.tags || [],
    attachments: task.attachments || [],
    relatedModule: task.relatedModule || '',
    archived: !!task.archived,
  });

  const normalizeTaskFromApi = (task: any): Task => ({
    ...task,
    id: String(task.id),
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    startDate: task.startDate || task.start_date || '',
    dueDate: task.dueDate || task.due_date || '',
    assignedTo: task.assignedTo || (task.assigned_to ? {
      id: String(task.assigned_to.id || task.assigned_to),
      name: task.assigned_to.name || task.assigned_to.email || task.assigned_to_email || 'User',
      email: task.assigned_to.email || task.assigned_to_email || '',
      avatar: `https://ui-avatars.com/api/?name=User&background=6366f1&color=fff`
    } : undefined),
    tags: task.tags || [],
    attachments: task.attachments || [],
    relatedModule: task.relatedModule || '',
    archived: !!task.archived,
    createdDate: task.createdDate || task.created_date || task.created_at || '',
    comments: extractArray(task.comments || task.task_comments),
    history: extractArray(task.history || task.task_history),
  });

  const loadTaskData = async () => {
    if (!hasTaskViewPermission) {
      setIsLoading(true);
      setTimeout(() => {
        setTasks([]);
        setMembers([]);
        setNotifications([]);
        if (user) {
          setCurrentUser({
            id: String(user.id),
            name: localStorage.getItem('name') || user.email.split('@')[0] || 'User',
            role: String(user.role || 'Staff').replace(/_/g, ' '),
            email: user.email || '',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}&background=6366f1&color=fff`
          });
        } else {
          setCurrentUser(null);
        }
        setErrorState(null);
        setIsLoading(false);
      }, 300);
      return;
    }

    setIsLoading(true);
    try {
      const [tasksRes, membersRes, notificationsRes] = await Promise.allSettled([
        tasksService.getTasks(),
        tasksService.getMembers(),
        tasksService.getNotifications(),
      ]);

      let nextMembers: Member[] = [];
      if (membersRes.status === 'fulfilled') {
        const remoteMembers = extractArray(membersRes.value.data).map(normalizeMember);
        if (remoteMembers.length > 0) {
          nextMembers = remoteMembers;
        }
      }
      setMembers(nextMembers);

      if (tasksRes.status === 'fulfilled') {
        const data = tasksRes.value.data;
        const tasksArray = Array.isArray(data) ? data : (data?.tasks || []);
        setTasks(tasksArray.map(normalizeTaskFromApi));
      }
      if (notificationsRes.status === 'fulfilled') {
        setNotifications(notificationsRes.value.data || []);
      }

      const loggedInId = user?.id ? String(user.id) : null;
      const loggedInUser = nextMembers.find((member) => String(member.id) === loggedInId);
      if (loggedInUser) {
        setCurrentUser(loggedInUser);
      } else if (user) {
        setCurrentUser({
          id: String(user.id),
          name: localStorage.getItem('name') || user.email.split('@')[0] || 'User',
          role: String(user.role || 'Staff').replace(/_/g, ' '),
          email: user.email || '',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}&background=6366f1&color=fff`
        });
      } else if (nextMembers[0]) {
        setCurrentUser(nextMembers[0]);
      }
      setErrorState(null);
    } catch (error) {
      console.error('[Tasks] Backend sync failed:', error);
      setErrorState('Task backend is not reachable.');
      // clear state on failure
      setTasks([]);
      setMembers([]);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadTaskData();
    }
  }, [token, user?.id, hasTaskViewPermission]);

  const triggerLoading = (callback: () => void) => {
    setIsLoading(true);
    setTimeout(() => {
      callback();
      setIsLoading(false);
    }, 450);
  };

  const addTask = async (newTask: Omit<Task, 'id' | 'createdDate' | 'archived' | 'comments' | 'history'>) => {
    if (!hasTaskViewPermission) {
      setIsLoading(true);
      setTimeout(() => {
        const createdTask: Task = {
          ...newTask,
          id: `TSK-${Math.floor(1000 + Math.random() * 9000)}`,
          createdDate: new Date().toISOString().split('T')[0],
          archived: false,
          comments: [],
          history: [{
            id: `h-${Math.random().toString(36).substring(2, 11)}`,
            user: currentUser?.name || 'User',
            action: 'Task Created',
            details: `Task created locally`,
            timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        };
        setTasks(prev => [createdTask, ...prev]);
        setIsLoading(false);
      }, 300);
      return;
    }

    setIsLoading(true);
    try {
      const res = await tasksService.createTask(normalizeTaskForApi(newTask));
      setTasks(prev => [normalizeTaskFromApi(res.data), ...prev]);
      const notificationsRes = await tasksService.getNotifications();
      setNotifications(notificationsRes.data || []);
    } catch (error: any) {
      setErrorState(error?.response?.data?.detail || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (updatedTask: Task) => {
    if (!hasTaskViewPermission) {
      setIsLoading(true);
      setTimeout(() => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        setIsLoading(false);
      }, 300);
      return;
    }

    setIsLoading(true);
    try {
      const res = await tasksService.updateTask(updatedTask.id, normalizeTaskForApi(updatedTask));
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? res.data : t));
    } catch (error: any) {
      setErrorState(error?.response?.data?.detail || 'Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await updateTask({ ...task, status: newStatus });
  };

  const deleteTask = async (taskId: string) => {
    if (!hasTaskViewPermission) {
      setIsLoading(true);
      setTimeout(() => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (selectedTaskId === taskId) {
          setSelectedTaskId(null);
          setActivePage('tasks-list');
        }
        setIsLoading(false);
      }, 300);
      return;
    }

    setIsLoading(true);
    try {
      await tasksService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
        setActivePage('tasks-list');
      }
    } catch (error: any) {
      setErrorState(error?.response?.data?.detail || 'Failed to delete task');
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateTask = (taskId: string) => {
    triggerLoading(() => {
      const target = tasks.find(t => t.id === taskId);
      if (target) {
        const copy: Task = {
          ...target,
          id: `TSK-${Math.floor(1000 + Math.random() * 9000)}`,
          title: `${target.title} (Copy)`,
          createdDate: new Date().toISOString().split('T')[0],
          history: [{
            id: `h-${Math.random().toString(36).substring(2, 11)}`,
            user: currentUser?.name || 'User',
            action: 'Task Duplicated',
            details: `Duplicated from ${target.id}`,
            timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        };
        setTasks(prev => {
          const idx = prev.findIndex(t => t.id === taskId);
          const arr = [...prev];
          arr.splice(idx + 1, 0, copy);
          return arr;
        });
      }
    });
  };

  const archiveTask = async (taskId: string) => {
    if (!hasTaskViewPermission) {
      setTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        archived: true,
        history: [...(t.history || []), {
          id: `h-${Math.random().toString(36).substring(2, 11)}`,
          user: currentUser?.name || 'User',
          action: 'Task Archived',
          details: 'Archived task locally',
          timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]
      } : t));
      return;
    }

    try {
      const res = await tasksService.archiveTask(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
    } catch (error: any) {
      setErrorState(error?.response?.data?.detail || 'Failed to archive task');
    }
  };

  const addComment = async (taskId: string, content: string) => {
    if (!content.trim()) return;
    if (!hasTaskViewPermission) {
      const newComment: TaskComment = {
        id: `c-${Math.random().toString(36).substring(2, 11)}`,
        author: currentUser || { id: '0', name: 'User', role: 'User', email: '', avatar: '' },
        content,
        timestamp: 'Just now'
      };
      setTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        comments: [...(t.comments || []), newComment],
        history: [...(t.history || []), {
          id: `h-${Math.random().toString(36).substring(2, 11)}`,
          user: currentUser?.name || 'User',
          action: 'Comment Added',
          details: 'Added a discussion comment locally',
          timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]
      } : t));
      return;
    }

    try {
      const res = await tasksService.addComment(taskId, content);
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
    } catch (error: any) {
      setErrorState(error?.response?.data?.detail || 'Failed to add comment');
    }
  };

  const deleteComment = (taskId: string, commentId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t,
      comments: (t.comments || []).filter(c => c.id !== commentId)
    } : t));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = async () => {
    if (!hasTaskViewPermission) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      return;
    }

    try {
      await tasksService.markNotificationsRead();
    } catch (error) {
      console.warn('Could not notify backend of notifications read status');
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const navigateToDetails = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActivePage('task-details');
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <TaskContext.Provider
      value={{
        darkMode,
        toggleDarkMode,
        activePage,
        setActivePage,
        selectedTaskId,
        setSelectedTaskId,
        currentUser,
        setCurrentUser,
        members,
        tasks,
        notifications,
        isLoading,
        setIsLoading,
        errorState,
        setErrorState,
        addTask,
        updateTask,
        updateStatus,
        deleteTask,
        duplicateTask,
        archiveTask,
        addComment,
        deleteComment,
        markNotificationRead,
        markAllNotificationsRead,
        navigateToDetails,
        refreshTasks: loadTaskData
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};


