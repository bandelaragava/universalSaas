// import React, { useMemo, useState } from 'react';
// import { CheckCircle2, Loader2, Search } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { useGetFollowUpsQuery, useGetLeadsQuery, useUpdateFollowUpMutation } from '@/modules/leads/services/leadsApi';
// import { formatDateTime, getLeadName, statusClass } from '@/modules/leads/utils/leadUi';
// import { useToast } from '@/context/ToastContext';

// const splitNote = (note = '') => {
//   const match = note.match(/^\[(.+?)\]\s*(.*)$/);
//   return {
//     method: match?.[1] || 'Call',
//     body: match?.[2] || note,
//   };
// };

// export default function LeadFollowups() {
//   const toast = useToast();
//   const [search, setSearch] = useState('');
//   const { data: leads = [], isLoading: leadsLoading } = useGetLeadsQuery();
//   const { data: followups = [], isLoading: followupsLoading } = useGetFollowUpsQuery();
//   const [updateFollowUp, { isLoading: updating }] = useUpdateFollowUpMutation();

//   const leadById = useMemo(() => {
//     const lookup = {};
//     leads.forEach((lead) => {
//       lookup[String(lead.id)] = lead;
//     });
//     return lookup;
//   }, [leads]);

//   const rows = useMemo(() => {
//     const query = search.trim().toLowerCase();
//     return followups
//       .map((followup) => ({ ...followup, lead: leadById[String(followup.lead_id)] }))
//       .filter((followup) => {
//         if (!query) return true;
//         const note = splitNote(followup.note);
//         return [getLeadName(followup.lead), followup.lead?.email, note.body, note.method]
//           .some((value) => String(value || '').toLowerCase().includes(query));
//       })
//       .sort((a, b) => {
//         if (a.completed !== b.completed) return a.completed ? 1 : -1;
//         return new Date(a.scheduled_at || a.created_at || 0) - new Date(b.scheduled_at || b.created_at || 0);
//       });
//   }, [followups, leadById, search]);

//   const complete = async (followup) => {
//     try {
//       await updateFollowUp({ id: followup.id, completed: true }).unwrap();
//       toast.success('Completed', 'Follow-up marked as completed.');
//     } catch (err) {
//       toast.error('Error', err?.data?.detail || 'Could not update follow-up.');
//     }
//   };

//   const loading = leadsLoading || followupsLoading;

//   return (
//     <div className="space-y-7">
//       <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-slate-950">Follow Ups</h1>
//           <p className="mt-2 text-slate-500">Tracks scheduled lead conversations and pending counselor actions.</p>
//         </div>
//         <label className="relative w-full md:w-96">
//           <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//           <input
//             value={search}
//             onChange={(event) => setSearch(event.target.value)}
//             placeholder="Search follow ups..."
//             className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
//           />
//         </label>
//       </div>

//       {loading ? (
//         <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
//           <Loader2 className="h-5 w-5 animate-spin" />
//           Loading follow ups...
//         </div>
//       ) : rows.length === 0 ? (
//         <Card className="rounded-3xl bg-white p-16 text-center text-slate-400">No follow ups found.</Card>
//       ) : (
//         <div className="space-y-5">
//           {rows.map((followup) => {
//             const note = splitNote(followup.note);
//             const lead = followup.lead;
//             return (
//               <Card key={followup.id} className="rounded-3xl bg-white p-7 shadow-sm">
//                 <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
//                   <div>
//                     <div className="flex flex-wrap items-center gap-3">
//                       <h2 className="text-xl font-bold text-slate-900">{getLeadName(lead)}</h2>
//                       <Badge variant="outline" className={`gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusClass(lead?.status)}`}>
//                         <span className="h-1.5 w-1.5 rounded-full bg-current" />
//                         {lead?.status || 'New'}
//                       </Badge>
//                     </div>
//                     <p className="mt-2 text-slate-500">{lead?.email || 'No email'}</p>
//                     <p className="mt-5 text-lg font-semibold text-slate-700">[{note.method}] {note.body}</p>
//                   </div>
//                   <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
//                     <span className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase ${followup.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
//                       {followup.completed ? 'Completed' : 'Pending'}
//                     </span>
//                     <span className="text-lg font-bold text-slate-400">{formatDateTime(followup.scheduled_at || followup.created_at)}</span>
//                     {!followup.completed && (
//                       <Button disabled={updating} onClick={() => complete(followup)} className="gap-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
//                         <CheckCircle2 className="h-4 w-4" />
//                         Complete
//                       </Button>
//                     )}
//                   </div>
//                 </div>
//               </Card>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Loader2, Search, Calendar, Mail, Phone, MessageCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useGetFollowUpsQuery, useGetLeadsQuery, useUpdateFollowUpMutation } from '@/modules/leads/services/leadsApi';
import { formatDateTime, getLeadName, statusClass } from '@/modules/leads/utils/leadUi';
import { useToast } from '@/context/ToastContext';

const splitNote = (note) => {
  if (!note) return { method: 'Call', body: '' };
  const match = String(note).match(/^\[(.+?)\]\s*(.*)$/);
  return {
    method: match?.[1] || 'Call',
    body: match?.[2] || note,
  };
};

const getMethodIcon = (method) => {
  const m = String(method).toLowerCase();
  if (m.includes('whatsapp') || m.includes('message')) return <MessageCircle className="h-4 w-4" />;
  if (m.includes('email') || m.includes('mail')) return <Mail className="h-4 w-4" />;
  if (m.includes('call') || m.includes('phone')) return <Phone className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
};

export default function LeadFollowups() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data: leads = [], isLoading: leadsLoading } = useGetLeadsQuery();
  const { data: followups = [], isLoading: followupsLoading } = useGetFollowUpsQuery();
  const [updateFollowUp, { isLoading: updating }] = useUpdateFollowUpMutation();

  const leadById = useMemo(() => {
    const lookup = {};
    leads.forEach((lead) => {
      lookup[String(lead.id)] = lead;
    });
    return lookup;
  }, [leads]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return followups
      .map((followup) => ({ ...followup, lead: leadById[String(followup.lead_id)] }))
      .filter((followup) => {
        const completed = followup.completed === true || followup.completed === 1 || followup.completed === '1' || followup.completed === 'true';
        if (statusFilter === 'pending' && completed) return false;
        if (statusFilter === 'completed' && !completed) return false;
        if (!query) return true;
        const note = splitNote(followup.note);
        return [getLeadName(followup.lead), followup.lead?.email, note.body, note.method]
          .some((value) => String(value || '').toLowerCase().includes(query));
      })
      .sort((a, b) => {
        const aCompleted = a.completed === true || a.completed === 1 || a.completed === '1' || a.completed === 'true';
        const bCompleted = b.completed === true || b.completed === 1 || b.completed === '1' || b.completed === 'true';
        if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
        return new Date(a.scheduled_at || a.created_at || 0) - new Date(b.scheduled_at || b.created_at || 0);
      });
  }, [followups, leadById, search, statusFilter]);

  const complete = async (followup) => {
    try {
      await updateFollowUp({ id: followup.id, completed: true }).unwrap();
      toast.success('Completed', 'Follow-up marked as completed.');
    } catch (err) {
      toast.error('Error', err?.data?.detail || 'Could not update follow-up.');
    }
  };

  const loading = leadsLoading || followupsLoading;

  const [portalNode, setPortalNode] = useState(null);
  useEffect(() => {
    setPortalNode(document.getElementById('crm-header-portal'));
  }, []);

  const headerContent = (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Follow Ups</h1>
        <p className="mt-2 text-muted-foreground">Tracks scheduled lead conversations and pending counselor actions.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-7">
      {portalNode ? createPortal(headerContent, portalNode) : headerContent}

      <Card className="rounded-3xl bg-card text-card-foreground p-6 shadow-sm border-border">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr]">
          <label className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search follow ups..."
              className="h-12 w-full rounded-xl border border-border bg-background text-foreground pl-12 pr-4 text-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100/30"
            />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-12 rounded-xl border border-border bg-background text-foreground px-4 text-sm">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="mt-7 text-sm font-bold uppercase text-muted-foreground">Found {rows.length} Follow Ups</div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading follow ups...
        </div>
      ) : rows.length === 0 ? (
        <Card className="rounded-3xl bg-card text-card-foreground p-16 text-center text-muted-foreground border-border">No follow ups found.</Card>
      ) : (
        <div className="space-y-5">
          {rows.map((followup) => {
            const note = splitNote(followup.note);
            const lead = followup.lead;
            const isCompleted = followup.completed === true || followup.completed === 1 || followup.completed === '1' || followup.completed === 'true';
            return (
              <Card key={followup.id} className="rounded-xl bg-card text-card-foreground p-5 shadow-sm border-border hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 border border-border mt-1">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {String(getLeadName(lead)).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-lg font-bold text-foreground leading-tight">{getLeadName(lead)}</h2>
                        <Badge variant="outline" className={`gap-1 rounded-full px-2 py-0 text-[10px] uppercase font-bold border ${statusClass(lead?.status)}`}>
                          {lead?.status || 'New'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {lead?.email || 'No email provided'}
                      </div>
                      
                      <div className="mt-3.5 flex items-start gap-2.5 bg-muted/30 p-3 rounded-lg border border-border/50">
                        <div className="mt-0.5 text-primary">
                          {getMethodIcon(note.method)}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{note.method}</p>
                          <p className="text-sm font-semibold text-foreground/90 mt-0.5">{note.body}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-2.5 lg:items-end lg:min-w-[160px]">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase border tracking-wider ${isCompleted ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                      {isCompleted ? 'Completed' : 'Pending'}
                    </span>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateTime(followup.scheduled_at || followup.created_at)}
                    </div>
                    {!isCompleted && (
                      <Button disabled={updating} onClick={() => complete(followup)} size="sm" className="w-full lg:w-auto mt-1 gap-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complete Follow Up
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}