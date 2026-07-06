import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, RefreshCw, Search } from 'lucide-react';
import { getEmailCampaigns, createEmailCampaign } from '@/services/marketing';
import CampaignBuilder from './CampaignBuilder';
import { usePermissions } from '@/auth/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CampaignType {
  campaignId?: string | number;
  id?: string | number;
  campaignName?: string;
  title?: string;
  subject: string;
  moduleType?: string;
  audienceSource?: string;
  channel?: string;
  status?: string;
  emailCampaignStatus?: string;
  sentCount?: number;
  failedCount?: number;
}

export default function UniversalCampaignManager() {
  const { hasPermission } = usePermissions();
  const [view, setView] = useState<'LIST' | 'BUILDER'>('LIST');
  const [campaigns, setCampaigns] = useState<CampaignType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ moduleType: 'ALL', status: 'ALL' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getEmailCampaigns();
      const list = res?.data || res || [];
      setCampaigns(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load campaigns:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleSaveCampaign = async (payload: {
    campaignName: string;
    subject: string;
    content: string;
    status: string;
    recipients: string[];
  }) => {
    try {
      await createEmailCampaign(payload);
      setView('LIST');
      loadData();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      alert('Failed to save campaign: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    }
  };

  const filtered = campaigns.filter(c => {
    const name = c.campaignName || c.title || '';
    if (searchTerm && !name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    const modType = c.moduleType || 'CRM';
    if (filters.moduleType !== 'ALL' && modType !== filters.moduleType) return false;

    const stat = c.status || c.emailCampaignStatus || 'DRAFT';
    if (filters.status !== 'ALL' && stat !== filters.status) return false;

    return true;
  });

  return (
    <div className="space-y-4">
      {view === 'LIST' ? (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Megaphone className="text-cyan-500" size={18} /> Email Campaign Registry
              </CardTitle>
              <p className="text-xs text-muted-foreground">Manage and dispatch email campaigns across different modules</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={loadData} className="flex items-center gap-1">
                <RefreshCw size={14} /> Sync
              </Button>
              {hasPermission('MARKETING_CREATE') && (
                <Button size="sm" onClick={() => setView('BUILDER')} className="flex items-center gap-1">
                  <Plus size={14} /> New Campaign
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row gap-3 p-4 border-b">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-xs h-9"
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="input-field text-xs bg-background border-border text-foreground px-3 py-1.5 rounded-md"
                  value={filters.moduleType}
                  onChange={e => setFilters({ ...filters, moduleType: e.target.value })}
                >
                  <option value="ALL">All Modules</option>
                  <option value="CRM">CRM</option>
                  <option value="HRMS">HRMS</option>
                  <option value="LMS">LMS</option>
                </select>
                <select
                  className="input-field text-xs bg-background border-border text-foreground px-3 py-1.5 rounded-md"
                  value={filters.status}
                  onChange={e => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="DRAFT">Draft</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b bg-slate-900/40 text-muted-foreground font-semibold">
                    <th className="px-6 py-3">Campaign Name</th>
                    <th className="px-6 py-3">Target</th>
                    <th className="px-6 py-3">Channel</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Performance</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-cyan-500 mx-auto" />
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        No campaigns found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(c => {
                      const status = c.status || c.emailCampaignStatus || 'DRAFT';
                      return (
                        <tr key={c.campaignId || c.id} className="border-b hover:bg-slate-900/10">
                          <td className="px-6 py-4">
                            <div className="font-bold text-foreground">{c.campaignName || c.title || 'Untitled'}</div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{c.subject}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-muted-foreground">{c.moduleType || 'CRM'}</span>
                              <span className="px-2 py-0.5 rounded bg-cyan-950 text-[10px] font-bold text-cyan-400">{c.audienceSource || 'Custom'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-muted-foreground">{c.channel || 'EMAIL'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                status === 'ACTIVE' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                  'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-foreground">Sent: <span className="font-semibold">{c.sentCount || 0}</span></div>
                            <div className="text-[10px] text-muted-foreground">Failed: {c.failedCount || 0}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <CampaignBuilder onSave={handleSaveCampaign} onCancel={() => setView('LIST')} />
      )}
    </div>
  );
}


