/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from 'react';
import { Search, Loader2, MessageSquare, AlertCircle, RefreshCw, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/auth/usePermissions';
import { supportTicketsService, Ticket, TicketType, TicketSummary } from '@/services/supportTickets';
import CreateTicket from './CreateTicket';
import toast from 'react-hot-toast';

const priorities = ['low', 'medium', 'high', 'urgent'] as const;
const statuses = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'reopened'] as const;

const priorityRank: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

const priorityVariant = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'info',
  low: 'secondary',
} as const;

const statusVariant = {
  open: 'destructive',
  in_progress: 'warning',
  waiting_user: 'info',
  resolved: 'success',
  closed: 'secondary',
  reopened: 'outline',
} as const;

function formatLabel(value: string) {
  return String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function timeAgo(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function TicketsPage() {
  const { hasPermission } = usePermissions();

  const canRaise = hasPermission('SUPPORT_TICKETS_RAISE_SUPPORT_TICKET');
  const canTrack = hasPermission('SUPPORT_TICKETS_VIEW_SUPPORT_TICKETS');
  const canManage = hasPermission('SUPPORT_TICKETS_MANAGE_SUPPORT_TICKETS');
  const canManageTypes = hasPermission('manage_support_ticket_types') || hasPermission('SUPPORT_TICKETS_MANAGE_SUPPORT_TICKETS');

  const [tab, setTab] = useState<'raise' | 'my' | 'all' | 'types'>(
    canRaise ? 'raise' : canManage ? 'all' : 'my'
  );

  const [types, setTypes] = useState<TicketType[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [selected, setSelected] = useState<Ticket | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [savingType, setSavingType] = useState(false);
  const [disablingTypeId, setDisablingTypeId] = useState<string | number | null>(null);

  // Filters & Search
  const [filters, setFilters] = useState({ status: '', priority: '', issue_type: '' });
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketSort, setTicketSort] = useState('latest');

  // Form states
  const [form, setForm] = useState({ issue_type: '', priority: 'medium', subject: '', description: '' });
  const [typeForm, setTypeForm] = useState({ name: '', code: '', description: '' });

  // Executive Action Form states
  const [action, setAction] = useState('note');
  const [note, setNote] = useState('');
  const [internal, setInternal] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [typeRes, summaryRes] = await Promise.all([
        supportTicketsService.getTypes(),
        supportTicketsService.summary(),
      ]);
      setTypes(typeRes.data || []);
      setSummary(summaryRes.data || null);

      if (canTrack) {
        const myRes = await supportTicketsService.myTickets();
        setMyTickets(myRes.data || []);
      }
      if (canManage) {
        const allRes = await supportTicketsService.allTickets(filters);
        setAllTickets(allRes.data || []);
      }
    } catch {
      toast.error('Could not load support ticket data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!canManage) return;
    supportTicketsService.allTickets(filters)
      .then((res) => setAllTickets(res.data || []))
      .catch(() => toast.error('Could not load filtered tickets'));
  }, [filters.status, filters.priority, filters.issue_type, canManage]);

  const visibleTickets = useMemo(() => {
    const search = ticketSearch.trim().toLowerCase();
    const source = tab === 'all' ? allTickets : myTickets;
    const filtered = search
      ? source.filter((ticket) =>
          [
            ticket.ticket_no,
            ticket.subject,
            ticket.description,
            ticket.issue_type_name,
            ticket.status,
            ticket.priority,
            ticket.requester_name,
          ].some((value) => String(value || '').toLowerCase().includes(search))
        )
      : source;

    return [...filtered].sort((first, second) => {
      if (ticketSort === 'oldest') return new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
      if (ticketSort === 'priority') return (priorityRank[second.priority] || 0) - (priorityRank[first.priority] || 0);
      if (ticketSort === 'updated') return new Date(second.updated_at || second.created_at).getTime() - new Date(first.updated_at || first.created_at).getTime();
      return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
    });
  }, [tab, allTickets, myTickets, ticketSearch, ticketSort]);

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.issue_type || !form.subject.trim() || !form.description.trim()) {
      toast.error('Issue type, subject, and description are required');
      return;
    }
    try {
      setSubmitting(true);
      await supportTicketsService.raise(form);
      toast.success('Ticket submitted successfully');
      setForm({ issue_type: '', priority: 'medium', subject: '', description: '' });
      setTab(canTrack ? 'my' : 'raise');
      await loadData(true);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || 'Could not submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingType) return;
    if (!typeForm.name.trim() || !typeForm.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
      try {
        setSavingType(true);
        await supportTicketsService.createType(typeForm);
        toast.success('Issue type added successfully');
        setTypeForm({ name: '', code: '', description: '' });
        // Refresh the issue types list immediately
        const typeRes = await supportTicketsService.getTypes();
        setTypes(typeRes.data || []);
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        toast.error(axiosError.response?.data?.detail || 'Could not add issue type');
      } finally {
        setSavingType(false);
      }
  };

  const handleUpdateTicket = async () => {
    if (!selected || updating) return;
    if (['resolve', 'close', 'reopen', 'waiting_user', 'in_progress'].includes(action) && !note.trim()) {
      toast.error('A tracking note is required for this action');
      return;
    }
    if (!canManage) {
      toast.error('Only support managers can update tickets');
      return;
    }
    try {
      setUpdating(true);
      const payload = { action, note, is_internal: internal };
      const res = await supportTicketsService.action(selected.id, payload);
      setSelected(res.data);
      toast.success('Ticket updated successfully');
      setNote('');
      setInternal(false);
      await loadData(true);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || 'Could not update ticket');
    } finally {
      setUpdating(false);
    }
  };

  const tabsList = [
    { key: 'raise', label: 'Raise Ticket', show: canRaise },
    { key: 'my', label: 'My Tracking', show: canTrack },
    { key: 'all', label: 'All Tickets', show: canManage },
    { key: 'types', label: 'Issue Types', show: canManageTypes },
  ].filter((item) => item.show) as Array<{ key: 'raise' | 'my' | 'all' | 'types'; label: string }>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Raise, track, resolve, close, and reopen support requests."
        actions={
          <Button
            size="sm"
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      {/* Summary KPI Widgets */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {(['total', 'open', 'in_progress', 'waiting_user', 'resolved', 'closed'] as const).map((key) => (
            <Card key={key} className="hover:border-border/60 transition-colors">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {summary.scope === 'all' ? formatLabel(key) : `My ${formatLabel(key)}`}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">{summary[key] ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      {tabsList.length > 1 && (
        <div className="flex p-1 bg-muted rounded-xl w-fit border border-border">
          {tabsList.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setTab(item.key);
                setSelected(null);
              }}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95',
                tab === item.key
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Tab 1: Raise Ticket Form */}
          {tab === 'raise' && (
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="text-base">File a New Support Ticket</CardTitle>
              </CardHeader>
              <CardContent>
                <CreateTicket onSuccess={async () => { setTab('my'); await loadData(true); }} />
              </CardContent>
            </Card>
          )}

          {/* Tab 2 & 3: Ticket Directory & Table Lists */}
          {(tab === 'my' || tab === 'all') && (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-4">
                  <CardTitle className="text-base">
                    {tab === 'all' ? 'All Queue Tickets' : 'My Raised Tickets'}
                  </CardTitle>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full sm:w-48">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                        placeholder="Search tickets..."
                        className="pl-8 text-xs"
                      />
                    </div>

                    <select
                      value={ticketSort}
                      onChange={(e) => setTicketSort(e.target.value)}
                      className="bg-background border border-input text-foreground rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                    >
                      <option value="latest">Latest First</option>
                      <option value="updated">Recently Updated</option>
                      <option value="priority">High Priority First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </CardHeader>

                {tab === 'all' && (
                  <div className="px-6 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-1.5 focus:outline-none text-xs"
                    >
                      <option value="">All Statuses</option>
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {formatLabel(s)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
                      className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-1.5 focus:outline-none text-xs"
                    >
                      <option value="">All Priorities</option>
                      {priorities.map((p) => (
                        <option key={p} value={p}>
                          {formatLabel(p)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filters.issue_type}
                      onChange={(e) => setFilters((prev) => ({ ...prev, issue_type: e.target.value }))}
                      className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-1.5 focus:outline-none text-xs"
                    >
                      <option value="">All Issue Categories</option>
                      {(Array.isArray(types) ? types : []).map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <CardContent className="p-0 overflow-x-auto">
                  {visibleTickets.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      No support tickets found.
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left">Ticket</th>
                          <th className="px-4 py-3 text-left">Subject</th>
                          <th className="px-4 py-3 text-left">Category</th>
                          <th className="px-4 py-3 text-left">Priority</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTickets.map((t) => (
                          <tr
                            key={t.id}
                            className={cn(
                              'cursor-pointer border-b hover:bg-muted/30 transition-colors',
                              selected?.id === t.id && 'bg-muted/40 border-l-2 border-l-primary'
                            )}
                            onClick={() => {
                              setSelected(t);
                              setAction('note');
                              setNote('');
                            }}
                          >
                            <td className="px-4 py-3 font-mono font-bold">{t.ticket_no}</td>
                            <td className="px-4 py-3 font-medium">{t.subject}</td>
                            <td className="px-4 py-3 text-muted-foreground">{t.issue_type_name}</td>
                            <td className="px-4 py-3">
                              <Badge variant={priorityVariant[t.priority] ?? 'secondary'}>
                                {formatLabel(t.priority)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={statusVariant[t.status] ?? 'outline'}>
                                {formatLabel(t.status)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{timeAgo(t.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>

              {/* Dynamic Side Details Panel */}
              <div className="space-y-4">
                {selected ? (
                  <Card className="border-border">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 border-b">
                      <div>
                        <CardTitle className="text-base">{selected.ticket_no}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{selected.issue_type_name}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Badge variant={statusVariant[selected.status] ?? 'outline'}>
                          {formatLabel(selected.status)}
                        </Badge>
                        <Badge variant={priorityVariant[selected.priority] ?? 'secondary'}>
                          {formatLabel(selected.priority)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4 space-y-6 text-xs">
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Subject</p>
                        <p className="text-foreground font-medium text-sm">{selected.subject}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Description</p>
                        <div className="bg-muted/30 border p-3 rounded-lg text-foreground text-xs whitespace-pre-wrap">
                          {selected.description}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-y py-3 border-border">
                        <div>
                          <p className="text-muted-foreground font-semibold">Requester</p>
                          <p className="text-foreground">{selected.requester_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-semibold">Assignee</p>
                          <p className="text-foreground">{selected.assigned_to_name || 'Unassigned'}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-muted-foreground font-semibold">Resolved By</p>
                          <p className="text-foreground">{selected.resolved_by_name || '-'}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-muted-foreground font-semibold">Created</p>
                          <p className="text-foreground">{new Date(selected.created_at).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Notes Timeline */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-foreground flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4" />
                          Tracking History
                        </h4>
                        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                          {(selected.notes || []).length === 0 ? (
                            <p className="text-muted-foreground text-center py-4 text-[11px]">
                              No tracking history notes.
                            </p>
                          ) : (
                            (selected.notes || []).map((n) => (
                              <div
                                key={n.id}
                                className={cn(
                                  'border-l-2 p-2 rounded-lg text-[11px]',
                                  n.is_internal
                                    ? 'bg-amber-500/5 border-amber-500/30'
                                    : 'bg-primary/5 border-primary/30'
                                )}
                              >
                                <div className="flex justify-between items-center text-muted-foreground text-[10px] mb-1">
                                  <strong className="text-foreground">{n.author_name}</strong>
                                  <span>{new Date(n.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-foreground whitespace-pre-wrap">{n.note}</p>
                                {n.status_to && (
                                  <div className="mt-1 flex items-center gap-1 text-[9px] text-emerald-500 font-semibold">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Status updated: {formatLabel(n.status_from || 'new')} → {formatLabel(n.status_to)}
                                  </div>
                                )}
                                {n.is_internal && (
                                  <div className="mt-1 flex items-center gap-1 text-[9px] text-amber-500 font-semibold">
                                    <ShieldAlert className="h-3 w-3" />
                                    Internal Note
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Actions Panel */}
                      {canManage ? (
                        <div className="border-t pt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="font-semibold text-muted-foreground">Action</label>
                              <select
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                                className="w-full bg-background border border-input text-foreground rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                                disabled={updating}
                              >
                                <option value="note">Add Note</option>
                                {tab === 'all' && (
                                  <>
                                    <option value="assign">Assign to Me</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="waiting_user">Waiting on User</option>
                                    <option value="resolve">Resolve</option>
                                  </>
                                )}
                                <option value="close">Close Ticket</option>
                                <option value="reopen">Reopen Ticket</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="font-semibold text-muted-foreground">Note / Comment</label>
                              <Input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Action update summary..."
                                disabled={updating}
                              />
                            </div>
                          </div>

                          {tab === 'all' && (
                            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={internal}
                                onChange={(e) => setInternal(e.target.checked)}
                                className="rounded border-input text-primary focus:ring-0"
                                disabled={updating}
                              />
                              <span>Internal Agent Note Only</span>
                            </label>
                          )}

                          <Button
                            onClick={handleUpdateTicket}
                            disabled={updating}
                            className="w-full flex items-center justify-center gap-1.5"
                            size="sm"
                          >
                            {updating && <Loader2 className="h-3 w-3 animate-spin" />}
                            Submit Update
                          </Button>
                        </div>
                      ) : (
                        <div className="border-t pt-4 text-xs text-muted-foreground">
                          Ticket tracking is read-only for requesters. Support managers can assign, resolve, close, or add internal notes from the all-tickets queue.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed border-2 flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-xs">Select a support ticket from the list to view its timeline history and submit resolution updates.</p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Issue Types config */}
          {tab === 'types' && (
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-base">Add New Support Issue Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateType} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-muted-foreground">Issue Name *</label>
                      <Input
                        value={typeForm.name}
                        onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Database Sync Failure"
                        disabled={savingType}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-muted-foreground">Code Identifier *</label>
                      <Input
                        value={typeForm.code}
                        onChange={(e) =>
                          setTypeForm((prev) => ({
                            ...prev,
                            code: e.target.value.toLowerCase().replaceAll(' ', '_'),
                          }))
                        }
                        placeholder="e.g. database_sync"
                        disabled={savingType}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-muted-foreground">Description</label>
                      <textarea
                        value={typeForm.description}
                        onChange={(e) => setTypeForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                        placeholder="Short summary of this classification..."
                        disabled={savingType}
                      />
                    </div>

                    <Button type="submit" disabled={savingType} className="w-full">
                      {savingType ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Create Issue Type'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Configured Support Classifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {types.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No issue classifications configured yet.
                    </p>
                  ) : (
                    <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-1">
                      {(Array.isArray(types) ? types : []).map((type) => (
                        <div
                          key={type.id}
                          className="border p-4 rounded-xl flex items-start justify-between gap-4 bg-muted/20"
                        >
                          <div className="text-xs space-y-1">
                            <p className="font-bold text-foreground text-sm">{type.name}</p>
                            <p className="font-mono text-muted-foreground text-[10px]">
                              system_code: {type.code}
                            </p>
                            {type.description && (
                              <p className="text-muted-foreground text-[11px] mt-1">
                                {type.description}
                              </p>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={Boolean(disablingTypeId)}
                            onClick={async () => {
                              try {
                                setDisablingTypeId(type.id);
                                await supportTicketsService.deleteType(type.id);
                                toast.success('Issue type disabled successfully');
                                await loadData(true);
                              } catch {
                                toast.error('Could not disable issue type');
                              } finally {
                                setDisablingTypeId(null);
                              }
                            }}
                            className="flex items-center gap-1 active:scale-95 transition-transform"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Disable
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TicketsPage;


