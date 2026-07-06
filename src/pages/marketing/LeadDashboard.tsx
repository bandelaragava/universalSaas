import React, { useState, useEffect } from 'react';
import { getLeads } from '@/services/marketing';
import { usePermissions } from '@/auth/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users, RefreshCw } from 'lucide-react';

interface LeadType {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  courseInterest?: string;
  utmSource?: string;
  source?: string;
  utmCampaign?: string;
  createdAt: string;
}

export default function LeadDashboard() {
  const { hasPermission } = usePermissions();
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await getLeads();
      const leadList = res?.content || (Array.isArray(res) ? res : res?.data || []);
      setLeads(Array.isArray(leadList) ? leadList : []);
    } catch (err) {
      console.error('Failed to fetch leads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(l =>
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.courseInterest?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="text-cyan-500" size={18} /> Marketing Lead Registry
          </CardTitle>
          <p className="text-xs text-muted-foreground">Monitor and manage leads captured from active campaigns and landing pages</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLeads} className="flex items-center gap-1">
          <RefreshCw size={14} /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads by name, email, or course interest..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b bg-slate-900/40 text-muted-foreground font-semibold">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Interest</th>
                <th className="px-6 py-3">UTM Source</th>
                <th className="px-6 py-3">Campaign</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-cyan-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-slate-900/10">
                    <td className="px-6 py-4 font-bold text-foreground">{lead.name}</td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{lead.email}</div>
                      {lead.phone && <div className="text-[10px] text-muted-foreground">{lead.phone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px] font-bold">
                        {lead.courseInterest || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{lead.utmSource || lead.source || 'DIRECT'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{lead.utmCampaign || '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {hasPermission('USER_CREATE') && (
                        <a
                          href={`/users/create?name=${encodeURIComponent(lead.name)}&email=${encodeURIComponent(lead.email)}&role=Student&phone=${encodeURIComponent(lead.phone || '')}`}
                          className="inline-flex items-center justify-center rounded-md text-xs font-semibold h-8 px-3 border border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400"
                        >
                          Create Account
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}


