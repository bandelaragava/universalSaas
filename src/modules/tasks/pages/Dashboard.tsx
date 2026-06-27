import React from 'react';
import { useTasks } from '../context/TaskContext';
import { Task } from '../types';
import { usePermissions } from '@/auth/usePermissions';
import {
  ListTodo,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  UserCheck,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Tag
} from 'lucide-react';

export default function Dashboard() {
  const { tasks, currentUser, setActivePage, navigateToDetails } = useTasks();
  const { permissions, hasPermission } = usePermissions();
  const hasExplicitTaskPermissions = permissions.some((permission) => ['TASKS_VIEW_TASKS', 'TASKS_VIEW_TASKS', 'TASKS_CREATE_TASK', 'TASKS_EDIT_TASK', 'TASKS_DELETE_TASK', 'TASKS_ASSIGN_TASK'].includes(String(permission || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')));

  const activeTasks = Array.isArray(tasks) ? tasks.filter(t => !t.archived) : [];

  // Helper to determine if a task is overdue
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = (task: Task) => {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    if (task.status === 'overdue') return true;
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date(today);
  };

  // Metrics Calculations
  const totalTasksCount = activeTasks.length;
  const pendingCount = activeTasks.filter(t => t.status === 'pending' && !isOverdue(t)).length;
  const inProgressCount = activeTasks.filter(t => t.status === 'inProgress' && !isOverdue(t)).length;
  const completedCount = activeTasks.filter(t => t.status === 'completed').length;
  const overdueCount = activeTasks.filter(isOverdue).length;
  const dueTodayCount = activeTasks.filter(t => t.dueDate === today && t.status !== 'completed').length;
  const myAssignedCount = activeTasks.filter(t => t.assignedTo?.id === currentUser?.id).length;

  // Group status values
  const statuses: Task['status'][] = ['pending', 'inProgress', 'completed', 'onHold', 'cancelled'];
  const statusCounts = activeTasks.reduce((acc, t) => {
    const statusKey = isOverdue(t) ? 'overdue' : t.status;
    acc[statusKey] = (acc[statusKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group priority values
  const priorities: Task['priority'][] = ['low', 'medium', 'high', 'urgent'];
  const priorityCounts = activeTasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get recent 5 tasks
  const recentTasks = [...activeTasks]
    .sort((a, b) => {
      const aDate = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const bDate = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, 5);

  // Get upcoming 4 deadlines (excluding completed/cancelled)
  const upcomingDeadlines = activeTasks
    .filter(t => t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate)
    .sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return aDate - bDate;
    })
    .slice(0, 4);

  // Styles mapping helper
  const statusStyleMap: Record<string, { bg: string; label: string }> = {
    pending: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', label: 'Pending' },
    inProgress: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', label: 'In Progress' },
    completed: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', label: 'Completed' },
    onHold: { bg: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400', label: 'On Hold' },
    cancelled: { bg: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400', label: 'Cancelled' },
    overdue: { bg: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', label: 'Overdue' }
  };

  const priorityStyleMap: Record<string, { bg: string; label: string }> = {
    low: { bg: 'bg-muted text-muted-foreground', label: 'Low' },
    medium: { bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', label: 'Medium' },
    high: { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', label: 'High' },
    urgent: { bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-405', label: 'Urgent' }
  };

  const getTaskStatusInfo = (task: Task) => {
    if (isOverdue(task)) return statusStyleMap.overdue;
    return statusStyleMap[task.status] || statusStyleMap.pending;
  };

  const statCards = [
    {
      label: 'Total Tasks',
      value: totalTasksCount,
      icon: ListTodo,
      color: 'from-violet-500 to-indigo-500',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500 dark:text-violet-400',
    },
    {
      label: 'Pending Tasks',
      value: pendingCount,
      icon: Clock,
      color: 'from-amber-400 to-yellow-500',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500 dark:text-amber-400',
    },
    {
      label: 'In Progress',
      value: inProgressCount,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500 dark:text-blue-400',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
    },
    {
      label: 'Overdue Tasks',
      value: overdueCount,
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-500',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500 dark:text-red-400',
    },
    {
      label: 'Due Today',
      value: dueTodayCount,
      icon: CalendarDays,
      color: 'from-orange-500 to-amber-500',
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-500 dark:text-orange-400',
    },
    {
      label: 'My Tasks',
      value: myAssignedCount,
      icon: UserCheck,
      color: 'from-indigo-500 to-purple-500',
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-500 dark:text-indigo-400',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-soft">
        <div className="flex items-center gap-4">
          <img 
            src={currentUser?.avatar ?? 'https://i.pravatar.cc/150?img=default'} 
            alt={currentUser?.name ?? 'User'}
            className="w-14 h-14 rounded-full border-2 border-blue-500 shadow-md object-cover"
          />
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              Welcome back, {currentUser?.name ?? 'User'}! <span className="text-xl">👋</span>
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
                Role: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{currentUser?.role ?? ''}</span> • Educational CRM & Staff Portal
            </p>
          </div>
        </div>
        {( !hasExplicitTaskPermissions || hasPermission('TASKS_CREATE_TASK')) && (
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setActivePage('create-task')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 transition-all hover:scale-[1.02] cursor-pointer"
            >
              Create New Task
              <ArrowUpRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx}
              className="group relative overflow-hidden rounded-2xl bg-card border border-border p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
            >
              {/* Decorative side accent gradient */}
              <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${card.color}`} />
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                  {card.label}
                </span>
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${card.iconBg} group-hover:scale-110 transition-transform duration-200 shrink-0`}>
                  <Icon size={17} className={card.iconColor} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Interactive Statistics Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Distribution */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-card border border-border shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-foreground">Status Distribution Overview</h3>
              <p className="text-[11px] text-muted-foreground">Live summary of tasks categorized by progress status</p>
            </div>
            <Sparkles size={16} className="text-indigo-500" />
          </div>

          <div className="space-y-4">
            {statuses.map((statusKey) => {
              const count = statusCounts[statusKey] || 0;
              const percentage = totalTasksCount ? Math.round((count / totalTasksCount) * 100) : 0;
              
              const barColors: Record<string, string> = {
                pending: 'bg-amber-500',
                inProgress: 'bg-blue-500',
                completed: 'bg-emerald-500',
                onHold: 'bg-orange-500',
                cancelled: 'bg-rose-500',
                overdue: 'bg-red-500'
              };

              const labelMap: Record<string, string> = {
                pending: 'Pending',
                inProgress: 'In Progress',
                completed: 'Completed',
                onHold: 'On Hold',
                cancelled: 'Cancelled',
                overdue: 'Overdue'
              };

              return (
                <div key={statusKey} className="group/bar">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-foreground">
                      {labelMap[statusKey]}
                    </span>
                    <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                      <span className="font-bold text-foreground">{count}</span>
                      <span>({percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${barColors[statusKey]} rounded-full transition-all duration-1000 ease-out group-hover/bar:brightness-110`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Distribution Chart */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-card border border-border shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-foreground">Priority Levels Allocation</h3>
                <p className="text-[11px] text-muted-foreground">Distribution of urgent vs backlog work</p>
              </div>
            </div>

            {/* Custom Pie/Donut Chart Simulation using beautiful Stacked Ring or Segments */}
            <div className="flex items-center justify-center py-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* SVG Ring representation */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Gray background track */}
                  <path
                    className="text-muted/40"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Segment calculation */}
                  {(() => {
                    let cumulativePercent = 0;
                    return priorities.map((p) => {
                      const count = priorityCounts[p] || 0;
                      const percent = totalTasksCount ? (count / totalTasksCount) * 100 : 0;
                      const normalizedPercent = percent > 100 ? 100 : percent;
                      const dashArray = `${normalizedPercent} ${100 - normalizedPercent}`;
                      const dashOffset = 100 - cumulativePercent;
                      cumulativePercent += normalizedPercent;

                      const colors: Record<string, string> = {
                        low: 'text-muted-foreground',
                        medium: 'text-blue-500',
                        high: 'text-amber-500',
                        urgent: 'text-rose-500'
                      };

                      return normalizedPercent > 0 ? (
                        <path
                          key={p}
                          className={`${colors[p]} transition-all duration-500`}
                          stroke="currentColor"
                          strokeWidth="3.8"
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      ) : null;
                    });
                  })()}
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-foreground">
                    {totalTasksCount}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Color Labels */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {priorities.map((p) => {
              const labelColors: Record<string, string> = {
                low: 'bg-muted-foreground',
                medium: 'bg-blue-500',
                high: 'bg-amber-500',
                urgent: 'bg-red-500'
              };
              const labelMap: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
              const count = priorityCounts[p] || 0;

              return (
                <div key={p} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full ${labelColors[p]}`} />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-foreground">{labelMap[p]}</span>
                    <span className="text-[9px] font-semibold text-muted-foreground">{count} Tasks</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Tasks & Upcoming Deadlines Widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Recent Tasks Table */}
        <div className="xl:col-span-8 p-6 rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-foreground">Recent Task Submissions</h3>
              <p className="text-[11px] text-muted-foreground">Overview of newly logged CRM actions and issues</p>
            </div>
            <button 
              onClick={() => setActivePage('tasks-list')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View all
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 pr-2">Task Details</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3">Assignee</th>
                  <th className="pb-3 px-3 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {recentTasks.map((task) => {
                  const statusInfo = getTaskStatusInfo(task);
                  const priorityInfo = priorityStyleMap[task.priority] || priorityStyleMap.low;
                  
                  return (
                    <tr 
                      key={task.id} 
                      onClick={() => navigateToDetails(task.id)}
                      className="group hover:bg-accent/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 pr-2">
                        <div className="flex flex-col gap-1 max-w-[240px] sm:max-w-sm">
                          <span className="font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                            {task.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            ID: <span className="font-mono">{task.id}</span> • {task.relatedModule}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${statusInfo.bg}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityInfo.bg}`}>
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <img 
                            src={task.assignedTo?.avatar} 
                            alt={task.assignedTo?.name}
                            className="w-5.5 h-5.5 rounded-full border border-border object-cover"
                          />
                          <span className="font-medium text-muted-foreground hidden sm:inline">
                            {task.assignedTo?.name.split(' ')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-muted-foreground">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Deadlines Widget */}
        <div className="xl:col-span-4 p-6 rounded-2xl bg-card border border-border shadow-soft">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-foreground">Upcoming Deadlines</h3>
            <p className="text-[11px] text-muted-foreground">Critical items requiring immediate attention</p>
          </div>

          <div className="space-y-3.5">
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">
                No upcoming active deadlines! 🎉
              </div>
            ) : (
              upcomingDeadlines.map((task) => {
                const isTaskOverdue = isOverdue(task);
                const isDueToday = task.dueDate === today;
                
                let flagColor = "text-muted-foreground";
                let flagBg = "bg-muted";
                let dateBadgeText = task.dueDate ? new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
                
                if (isTaskOverdue) {
                  flagColor = "text-rose-600 dark:text-rose-400";
                  flagBg = "bg-rose-500/10";
                  dateBadgeText = "Overdue";
                } else if (isDueToday) {
                  flagColor = "text-amber-600 dark:text-amber-400";
                  flagBg = "bg-amber-500/10";
                  dateBadgeText = "Today";
                }

                return (
                  <div 
                    key={task.id}
                    onClick={() => navigateToDetails(task.id)}
                    className="group flex items-center justify-between p-3.5 rounded-xl border border-border hover:border-blue-500/30 hover:bg-accent/50 cursor-pointer transition-all"
                  >
                    <div className="flex flex-col gap-1 max-w-[70%]">
                      <span className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Tag size={10} className="text-muted-foreground" />
                        <span className="truncate">{task.tags?.[0] || 'Task'}</span>
                      </div>
                    </div>

                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${flagBg} ${flagColor} transition-colors border border-transparent group-hover:border-current`}>
                      {dateBadgeText}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


