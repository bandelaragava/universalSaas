// import React, { useMemo, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { Download, Loader2, Plus, Search, Users } from 'lucide-react';
// import { useDispatch } from 'react-redux';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import LeadTable from '@/modules/leads/components/LeadTable';
// import { useLeads } from '@/modules/leads/hooks/useLeads';
// import { leadsApi, useGetLeadOptionsQuery, useGetLeadUsersQuery } from '@/modules/leads/services/leadsApi';
// import {
//   getLeadCounselor,
//   getLeadCourse,
//   getLeadName,
//   getLeadSource,
//   optionLabel,
//   optionValue,
// } from '@/modules/leads/utils/leadUi';

// const exportCsv = (leads) => {
//   const rows = [
//     ['Student Name', 'Email', 'Phone', 'Course', 'Counselor', 'Source', 'Status', 'Created'],
//     ...leads.map((lead) => [
//       getLeadName(lead),
//       lead.email || '',
//       lead.phone || '',
//       getLeadCourse(lead),
//       getLeadCounselor(lead),
//       getLeadSource(lead),
//       lead.status || 'New',
//       lead.created_at || '',
//     ]),
//   ];
//   const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
//   const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
//   const anchor = document.createElement('a');
//   anchor.href = url;
//   anchor.download = 'leads.csv';
//   anchor.click();
//   URL.revokeObjectURL(url);
// };

// export default function LeadsList() {
//   const dispatch = useDispatch();
//   const { data: leads = [], isLoading, isError } = useLeads();
//   const { data: options } = useGetLeadOptionsQuery();
//   const { data: users = [] } = useGetLeadUsersQuery();
//   const [search, setSearch] = useState('');
//   const [status, setStatus] = useState('');
//   const [course, setCourse] = useState('');
//   const [counselor, setCounselor] = useState('');

//   const statuses = options?.statuses || [];
//   const courses = useMemo(() => [...new Set(leads.map(getLeadCourse).filter((item) => item && item !== 'N/A'))], [leads]);

//   const filteredLeads = useMemo(() => {
//     const query = search.trim().toLowerCase();
//     return leads.filter((lead) => {
//       const matchesSearch = !query || [
//         getLeadName(lead),
//         lead.email,
//         lead.phone,
//         getLeadCourse(lead),
//         getLeadSource(lead),
//       ].some((value) => String(value || '').toLowerCase().includes(query));
//       const matchesStatus = !status || lead.status === status;
//       const matchesCourse = !course || getLeadCourse(lead) === course;
//       const matchesCounselor = !counselor || String(lead.counselor?.id || lead.counselor_id || '') === counselor;
//       return matchesSearch && matchesStatus && matchesCourse && matchesCounselor;
//     });
//   }, [course, counselor, leads, search, status]);

//   const cards = useMemo(() => {
//     const statusCards = statuses.map((item) => {
//       const value = optionValue(item);
//       return {
//         label: optionLabel(item),
//         count: leads.filter((lead) => (lead.status || 'New') === value).length,
//       };
//     });
//     return [{ label: 'All Leads', count: leads.length, active: true }, ...statusCards];
//   }, [leads, statuses]);

//   const refresh = () => dispatch(leadsApi.util.invalidateTags(['Leads']));

//   return (
//     <div className="space-y-8">
//       <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-normal text-slate-950">Leads Directory</h1>
//           <p className="mt-2 text-slate-500">Manage, filter, and schedule discussions for all registered student queries.</p>
//         </div>
//         <div className="flex gap-3">
//           <Button variant="outline" className="gap-2 rounded-xl bg-white" onClick={() => exportCsv(filteredLeads)}>
//             <Download className="h-4 w-4" />
//             Export CSV
//           </Button>
//           <Link to="/leads/add-lead">
//             <Button className="gap-2 rounded-xl bg-violet-600 px-5 text-white hover:bg-violet-700">
//               <Plus className="h-4 w-4" />
//               Add Lead
//             </Button>
//           </Link>
//         </div>
//       </div>

//       <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
//         {cards.map((card, index) => (
//           <Card key={`${card.label}-${index}`} className={`min-h-44 rounded-2xl p-5 shadow-sm ${card.active ? 'bg-slate-950 text-white' : 'bg-white'}`}>
//             <div className="mb-8 flex items-center justify-between">
//               <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.active ? 'bg-white/10' : 'bg-indigo-50 text-indigo-600'}`}>
//                 <Users className="h-5 w-5" />
//               </span>
//               <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${card.active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`}>
//                 {card.active ? 'Active' : 'View'}
//               </span>
//             </div>
//             <div className="text-3xl font-bold">{isLoading ? '...' : card.count}</div>
//             <div className={`mt-2 font-bold ${card.active ? 'text-white' : 'text-slate-950'}`}>{card.label}</div>
//             <div className={`mt-1 text-sm ${card.active ? 'text-white/70' : 'text-slate-400'}`}>{card.active ? 'Complete directory' : 'Current status'}</div>
//           </Card>
//         ))}
//       </div>

//       <Card className="rounded-3xl bg-white p-6 shadow-sm">
//         <div className="grid gap-4 xl:grid-cols-[2fr_1fr_1fr_1fr]">
//           <label className="relative">
//             <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//             <input
//               value={search}
//               onChange={(event) => setSearch(event.target.value)}
//               placeholder="Search leads..."
//               className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
//             />
//           </label>
//           <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm">
//             <option value="">All Statuses</option>
//             {statuses.map((item) => <option key={optionValue(item)} value={optionValue(item)}>{optionLabel(item)}</option>)}
//           </select>
//           <select value={course} onChange={(event) => setCourse(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm">
//             <option value="">All Courses</option>
//             {courses.map((item) => <option key={item} value={item}>{item}</option>)}
//           </select>
//           <select value={counselor} onChange={(event) => setCounselor(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm">
//             <option value="">All Counselors</option>
//             {users.map((user) => <option key={user.id} value={user.id}>{user.full_name || user.email}</option>)}
//           </select>
//         </div>
//         <div className="mt-7 text-sm font-bold uppercase text-slate-400">Found {filteredLeads.length} Leads</div>
//       </Card>

//       <Card className="overflow-hidden rounded-3xl bg-white shadow-sm">
//         {isLoading ? (
//           <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
//             <Loader2 className="h-5 w-5 animate-spin" />
//             Loading leads...
//           </div>
//         ) : isError ? (
//           <div className="py-16 text-center">
//             <p className="font-semibold text-rose-600">Failed to fetch lead records.</p>
//             <Button variant="outline" className="mt-4" onClick={refresh}>Retry</Button>
//           </div>
//         ) : (
//           <LeadTable leads={filteredLeads} />
//         )}
//       </Card>
//     </div>
//   );
// }


import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Download, Loader2, Plus, Search, Users } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import LeadTable from '@/modules/leads/components/LeadTable';
import { useLeads } from '@/modules/leads/hooks/useLeads';
import { leadsApi, useGetLeadOptionsQuery, useGetLeadUsersQuery } from '@/modules/leads/services/leadsApi';
import { usePermissions } from '@/auth/usePermissions';
import {
  getLeadCounselor,
  getLeadCourse,
  getLeadName,
  getLeadSource,
  optionLabel,
  optionValue,
} from '@/modules/leads/utils/leadUi';

const exportCsv = (leads) => {
  const rows = [
    ['Student Name', 'Email', 'Phone', 'Course', 'Counselor', 'Source', 'Status', 'Created'],
    ...leads.map((lead) => [
      getLeadName(lead),
      lead.email || '',
      lead.phone || '',
      getLeadCourse(lead),
      getLeadCounselor(lead),
      getLeadSource(lead),
      lead.status || 'New',
      lead.created_at || '',
    ]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'leads.csv';
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function LeadsList() {
  const dispatch = useDispatch();
  const { can } = usePermissions();
  const { data: leads = [], isLoading, isError } = useLeads();
  const { data: options } = useGetLeadOptionsQuery();
  const { data: users = [] } = useGetLeadUsersQuery();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [course, setCourse] = useState('');
  const [counselor, setCounselor] = useState('');

  const statuses = options?.statuses || [];
  const courses = useMemo(() => [...new Set(leads.map(getLeadCourse).filter((item) => item && item !== 'N/A'))], [leads]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesSearch = !query || [
        getLeadName(lead),
        lead.email,
        lead.phone,
        getLeadCourse(lead),
        getLeadSource(lead),
      ].some((value) => String(value || '').toLowerCase().includes(query));
      const matchesStatus = !status || lead.status === status;
      const matchesCourse = !course || getLeadCourse(lead) === course;
      const matchesCounselor = !counselor || String(lead.counselor?.id || lead.counselor_id || '') === counselor;
      return matchesSearch && matchesStatus && matchesCourse && matchesCounselor;
    });
  }, [course, counselor, leads, search, status]);

  const cards = useMemo(() => {
    const statusCards = statuses.map((item) => {
      const value = optionValue(item);
      return {
        label: optionLabel(item),
        count: leads.filter((lead) => (lead.status || 'New') === value).length,
      };
    });
    return [{ label: 'All Leads', count: leads.length, active: true }, ...statusCards];
  }, [leads, statuses]);

  const refresh = () => dispatch(leadsApi.util.invalidateTags(['Leads']));

  const [portalNode, setPortalNode] = useState(null);
  useEffect(() => {
    setPortalNode(document.getElementById('crm-header-portal'));
  }, []);

  const headerContent = (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-normal text-foreground">Leads Directory</h1>
        <p className="mt-2 text-muted-foreground">Manage, filter, and schedule discussions for all registered student queries.</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2 rounded-xl bg-background text-foreground border-border" onClick={() => exportCsv(filteredLeads)}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        {can('LEADS_CREATE_LEAD') && (
          <Link to="/leads/add-lead">
            <Button className="gap-2 rounded-xl bg-violet-600 px-5 text-white hover:bg-violet-700">
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {portalNode ? createPortal(headerContent, portalNode) : headerContent}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-2">
        {cards.map((card, index) => (
          <Card key={`${card.label}-${index}`} className={`rounded-xl p-4 shadow-sm border-border ${card.active ? 'bg-zinc-950 text-white dark:bg-zinc-900 border-zinc-800' : 'bg-card text-card-foreground'}`}>
            <div className="mb-4 flex items-center justify-between">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.active ? 'bg-white/10' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'}`}>
                <Users className="h-4 w-4" />
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${card.active ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                {card.active ? 'Active' : 'View'}
              </span>
            </div>
            <div className="text-2xl font-bold">{isLoading ? '...' : card.count}</div>
            <div className={`mt-1 font-semibold text-sm ${card.active ? 'text-white' : 'text-foreground'}`}>{card.label}</div>
            <div className={`mt-0.5 text-xs ${card.active ? 'text-white/70' : 'text-muted-foreground'}`}>{card.active ? 'Complete directory' : 'Current status'}</div>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl bg-card text-card-foreground p-6 shadow-sm border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <label className="relative sm:col-span-2 lg:col-span-3">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search leads..."
              className="h-9 w-full rounded-lg border border-border bg-background text-foreground pl-10 pr-4 text-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-400/20"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 w-full rounded-lg border border-border bg-background text-foreground px-3 text-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-400/20 cursor-pointer lg:col-span-1">
            <option value="">All Statuses</option>
            {statuses.map((item) => <option key={optionValue(item)} value={optionValue(item)}>{optionLabel(item)}</option>)}
          </select>
          <select value={course} onChange={(event) => setCourse(event.target.value)} className="h-9 w-full rounded-lg border border-border bg-background text-foreground px-3 text-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-400/20 cursor-pointer lg:col-span-1">
            <option value="">All Courses</option>
            {courses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={counselor} onChange={(event) => setCounselor(event.target.value)} className="h-9 w-full rounded-lg border border-border bg-background text-foreground px-3 text-sm outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-400/20 cursor-pointer lg:col-span-1">
            <option value="">All Counselors</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.full_name || user.email}</option>)}
          </select>
        </div>
        <div className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
          Found {filteredLeads.length} Leads
        </div>
      </Card>

      <Card className="overflow-hidden rounded-3xl bg-card text-card-foreground shadow-sm border-border">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading leads...
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-rose-600">Failed to fetch lead records.</p>
            <Button variant="outline" className="mt-4" onClick={refresh}>Retry</Button>
          </div>
        ) : (
          <LeadTable leads={filteredLeads} />
        )}
      </Card>
    </div>
  );
}