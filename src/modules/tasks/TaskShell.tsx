import React, { useEffect, useMemo, useState } from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import Kanban from './pages/Kanban';
import CalendarView from './pages/CalendarView';
import CreateTask from './pages/CreateTask';
import TaskDetails from './pages/TaskDetails';
import MyTasks from './pages/MyTasks';
import NotificationsPage from './pages/NotificationsPage';
import { Member } from './types';
import {
  Sun, Moon, Bell, ChevronDown, AlertOctagon,
  Loader2, Sparkles
} from 'lucide-react';
import { usePermissions } from '@/auth/usePermissions';

function TaskAppContent() {
  const {
    darkMode, toggleDarkMode, activePage, setActivePage,
    currentUser, setCurrentUser, members, notifications,
    isLoading, setIsLoading, errorState, setErrorState, tasks
  } = useTasks();
  const { can } = usePermissions();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showDemoTools, setShowDemoTools] = useState(false);

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;
  const navItems = useMemo(() => ([
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tasks-list', label: 'Task List', permissions: ['TASKS_VIEW_TASKS', 'TASKS_VIEW_TASKS', 'TASKS_VIEW_TASKS', 'TASKS_EDIT_TASK'] },
    { id: 'kanban', label: 'Kanban', permissions: ['TASKS_VIEW_TASKS', 'TASKS_EDIT_TASK'] },
    { id: 'calendar', label: 'Calendar', permissions: ['TASKS_VIEW_TASKS', 'TASKS_VIEW_TASKS', 'TASKS_VIEW_TASKS', 'TASKS_EDIT_TASK'] },
    // { id: 'my-tasks', label: 'My Tasks', permissions: ['TASKS_VIEW_TASKS', 'TASKS_VIEW_TASKS'] },
    { id: 'create-task', label: 'Create Task', permissions: ['TASKS_CREATE_TASK'] },
    { id: 'notifications', label: 'Notifications', badge: unreadCount, permissions: ['TASKS_VIEW_TASKS', 'TASKS_VIEW_TASKS', 'TASKS_VIEW_TASKS', 'TASKS_EDIT_TASK'] },
  ]), [unreadCount]);

  const visibleNavItems = useMemo(() => {
    const hasTaskView = can('TASKS_VIEW_TASKS') || can('TASKS_VIEW_TASKS') || can('TASKS_EDIT_TASK') || can('TASKS_VIEW_TASKS');

    if (!hasTaskView) {
      return [];
    }

    return navItems.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) return true;
      return item.permissions.some((permission) => can(permission));
    });
  }, [can, navItems]);

  useEffect(() => {
    if (!visibleNavItems.some((item) => item.id === activePage) && activePage !== 'task-details') {
      setActivePage(visibleNavItems[0]?.id || 'dashboard');
    }
  }, [activePage, setActivePage, visibleNavItems]);

  const renderActivePage = () => {
    if (visibleNavItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-2xl p-8 shadow-soft max-w-lg mx-auto">
          <AlertOctagon size={48} className="text-rose-500 mb-4 animate-bounce" />
          <h2 className="text-lg font-extrabold text-foreground">Access Denied</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            You do not have the required permissions to view the Tasks workspace. Please contact your administrator.
          </p>
        </div>
      );
    }
    if (errorState) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-2xl p-8 shadow-soft max-w-lg mx-auto">
          <AlertOctagon size={48} className="text-rose-500 mb-4 animate-bounce" />
          <h2 className="text-lg font-extrabold text-foreground">Critical System Error</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{errorState}</p>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setErrorState(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer">Dismiss Alert</button>
            <button type="button" onClick={() => { setErrorState(null); window.location.reload(); }} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">Reload System</button>
          </div>
        </div>
      );
    }
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'tasks-list': return <TaskList />;
      case 'kanban': return <Kanban />;
      case 'calendar': return <CalendarView />;
      case 'my-tasks': return <MyTasks />;
      case 'create-task': return <CreateTask />;
      case 'notifications': return <NotificationsPage />;
      case 'task-details': return <TaskDetails />;
      default: return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Task Dashboard';
      case 'tasks-list': return 'Task Repository';
      case 'kanban': return 'Workflow Kanban';
      case 'calendar': return 'Academic Schedule';
      case 'my-tasks': return 'My Tasks';
      case 'create-task': return 'Create Task';
      case 'notifications': return 'Task Alerts';
      case 'task-details': return 'Task Workspace';
      default: return 'Tasks';
    }
  };

  return (
    <div className="min-h-full bg-background font-sans transition-colors duration-300">
      <div className="flex min-h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {/* Task Module Topbar */}
        <header className="flex-shrink-0 z-30 border-b border-border/80 bg-card/80 px-4 py-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-base font-extrabold text-foreground tracking-tight hidden sm:block">{getPageTitle()}</h1>


          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {visibleNavItems.map((item) => {
              const active = activePage === item.id || (item.id === 'tasks-list' && activePage === 'task-details');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePage(item.id)}
                  className={`relative flex-shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${active
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                >
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[10px] font-black text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Loading overlay */}
        {/* {false && isLoading && (
          <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-xs flex items-center justify-center">
            <div className="bg-card p-5 rounded-2xl border border-border shadow-soft-lg flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-xs font-bold text-foreground">Synchronizing database...</span>
            </div>
          </div>
        )} */}

        {/* Page content */}
        <main className="bg-background p-4 sm:p-6 md:p-8">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

function TaskShell() {
  return (
    <TaskProvider>
      <TaskAppContent />
    </TaskProvider>
  );
}

export default TaskShell;
