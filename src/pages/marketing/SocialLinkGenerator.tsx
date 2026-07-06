import React, { useState, useEffect, useMemo } from 'react';
import { getLandingPages, getTrackedLinks, createTrackedLink, deleteTrackedLink, getCoupons } from '@/services/marketing';
import { usePermissions } from '@/auth/usePermissions';
import {
  MessageCircle,
  Link2,
  Copy,
  Trash2,
  ExternalLink,
  Rocket
} from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width="16" height="16">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width="16" height="16">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width="16" height="16">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} width="16" height="16">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LandingPageType {
  id: string | number;
  title: string;
  slug: string;
  adBudget?: number;
  campaignName?: string;
  couponCode?: string;
}

interface TrackedLinkType {
  id: string | number;
  landingSlug: string;
  source: string;
  medium: string;
  campaign: string;
  generatedLink: string;
  adBudget?: number;
  clicks?: number;
  views?: number;
  signups?: number;
  timestamp: string;
}

export default function SocialLinkGenerator() {
  const { hasPermission } = usePermissions();
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(['instagram']));
  const [config, setConfig] = useState({
    landingSlug: '',
    campaignName: '',
    couponCode: '',
    adBudget: 0
  });
  const [landingPages, setLandingPages] = useState<LandingPageType[]>([]);
  const [generatedLinks, setGeneratedLinks] = useState<TrackedLinkType[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linkHistory, setLinkHistory] = useState<TrackedLinkType[]>([]);
  const [copiedHistoryItemId, setCopiedHistoryItemId] = useState<string | number | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const autoSlug = queryParams.get('slug');

    const fetchData = async () => {
      try {
        setLoading(true);
        const [pagesRes, historyRes] = await Promise.all([
          getLandingPages(),
          getTrackedLinks()
        ]);
        const pages = (pagesRes?.data || pagesRes || []) as LandingPageType[];
        setLandingPages(pages);

        if (autoSlug) {
          setConfig(prev => ({ ...prev, landingSlug: autoSlug }));
        } else if (pages.length > 0) {
          setConfig(prev => ({ ...prev, landingSlug: pages[0].slug }));
        }

        setLinkHistory((historyRes?.data || historyRes || []) as TrackedLinkType[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sources = [
    { id: 'instagram', name: 'Instagram', icon: InstagramIcon, color: 'text-pink-500' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-500' },
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon, color: 'text-blue-600' },
    { id: 'youtube', name: 'YouTube', icon: YoutubeIcon, color: 'text-red-500' },
    { id: 'twitter', name: 'Twitter/X', icon: TwitterIcon, color: 'text-sky-400' }
  ];

  const groupedHistory = useMemo(() => {
    const groups: Record<string, {
      slug: string;
      links: TrackedLinkType[];
      totalClicks: number;
      totalViews: number;
      totalSignups: number;
      totalBudget: number;
      lastGenerated: string;
    }> = {};

    linkHistory.forEach(link => {
      const slug = link.landingSlug || 'unknown';
      if (!groups[slug]) {
        groups[slug] = {
          slug: slug,
          links: [],
          totalClicks: 0,
          totalViews: 0,
          totalSignups: 0,
          totalBudget: 0,
          lastGenerated: link.timestamp || new Date().toISOString()
        };
      }
      groups[slug].links.push(link);
      groups[slug].totalClicks += (link.clicks || 0);
      groups[slug].totalViews += (link.views || 0);
      groups[slug].totalSignups += (link.signups || 0);
      groups[slug].totalBudget = Math.max(groups[slug].totalBudget, link.adBudget || 0);
      if (new Date(link.timestamp) > new Date(groups[slug].lastGenerated)) {
        groups[slug].lastGenerated = link.timestamp;
      }
    });
    return Object.values(groups).sort((a, b) => new Date(b.lastGenerated).getTime() - new Date(a.lastGenerated).getTime());
  }, [linkHistory]);

  const toggleSource = (sourceId: string) => {
    const newSet = new Set(selectedSources);
    if (newSet.has(sourceId)) {
      if (newSet.size > 1) newSet.delete(sourceId);
    } else {
      newSet.add(sourceId);
    }
    setSelectedSources(newSet);
  };

  const toggleAllSources = () => {
    if (selectedSources.size === sources.length) {
      setSelectedSources(new Set(['instagram']));
    } else {
      setSelectedSources(new Set(sources.map(s => s.id)));
    }
  };

  const generateLinks = async () => {
    const selectedPage = landingPages.find(p => p.slug === config.landingSlug);
    if (!selectedPage) return;

    const baseUrl = window.location.origin;
    const results: TrackedLinkType[] = [];
    const finalCampaign = selectedPage.campaignName ? selectedPage.campaignName.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'promo';
    
    try {
      setLoading(true);
      for (const sourceId of selectedSources) {
        let link = `${baseUrl}/landing/${config.landingSlug}?utm_source=${sourceId}&utm_medium=social&utm_campaign=${finalCampaign}`;
        if (selectedPage.couponCode) link += `&coupon=${encodeURIComponent(selectedPage.couponCode)}`;

        const payload = {
          landingSlug: config.landingSlug,
          source: sourceId,
          medium: 'social',
          campaign: finalCampaign,
          generatedLink: link,
          adBudget: selectedPage.adBudget || 0
        };
        const saved = await createTrackedLink(payload);
        results.push(saved?.data || saved);
      }
      setGeneratedLinks(results);
      setLinkHistory(prev => [...results, ...prev]);
      setCopied(false);
    } catch (err) {
      console.error(err);
      alert('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (linkText: string, id: string | number | null = null) => {
    navigator.clipboard.writeText(linkText);
    if (id) {
      setCopiedHistoryItemId(id);
      setTimeout(() => setCopiedHistoryItemId(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const deleteGroup = async (slug: string) => {
    if (!window.confirm(`Delete all tracking links for /${slug}?`)) return;
    const toDelete = linkHistory.filter(l => l.landingSlug === slug);
    try {
      for (const item of toDelete) {
        await deleteTrackedLink(item.id);
      }
      setLinkHistory(prev => prev.filter(l => l.landingSlug !== slug));
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  if (loading && landingPages.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Rocket className="text-cyan-500" size={16} /> Bulk Link Generator
            </CardTitle>
            <p className="text-xs text-muted-foreground">Generate multi-channel tracking links instantly</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">1. Target Landing Page</label>
              <select
                className="input-field w-full text-sm bg-background border-border text-foreground px-3 py-2 rounded-md"
                value={config.landingSlug}
                onChange={(e) => handleConfigChange('landingSlug', e.target.value)}
              >
                {landingPages.map(p => <option key={p.slug} value={p.slug}>{p.title} (/{p.slug})</option>)}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">2. Select Platforms</label>
                <button className="text-xs font-bold text-cyan-500 hover:underline cursor-pointer" onClick={toggleAllSources}>
                  {selectedSources.size === sources.length ? 'Reset' : 'Select All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sources.map(s => {
                  const Icon = s.icon;
                  const active = selectedSources.has(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSource(s.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${active
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                          : 'bg-slate-800/40 border-slate-700/50 text-muted-foreground hover:bg-slate-800'
                        }`}
                    >
                      <Icon className={active ? s.color : 'text-muted-foreground'} size={14} />
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {hasPermission('MARKETING_CREATE') && (
              <Button
                onClick={generateLinks}
                disabled={loading || !config.landingSlug || selectedSources.size === 0}
                className="w-full mt-4"
              >
                Generate Links <Rocket className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Generated Success Batch</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-y-auto">
            {generatedLinks.length > 0 ? (
              <div className="space-y-3">
                {generatedLinks.map((l, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-slate-900/35">
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 uppercase">{l.source}</span>
                        {copied && <span className="text-[10px] text-green-500 font-bold">Copied!</span>}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground truncate">{l.generatedLink}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <a href={l.generatedLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium cursor-pointer text-foreground">
                        <ExternalLink size={12} /> Open
                      </a>
                      <button className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-650 hover:bg-cyan-600 text-xs font-medium cursor-pointer text-white" onClick={() => copyToClipboard(l.generatedLink)}>
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2">
                <Link2 size={36} className="text-slate-600" />
                <p className="text-xs font-semibold">No batch generated yet</p>
                <p className="text-[10px]">Select platforms and configure tracking to start</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-sm font-semibold">Link Tracking & Performance</CardTitle>
            <p className="text-xs text-muted-foreground">Real-time engagement metrics for your campaigns</p>
          </div>
          <span className="text-xs bg-cyan-550/15 text-cyan-400 px-3 py-1 rounded-full font-bold border border-cyan-500/20">
            {groupedHistory.length} Pages Active
          </span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b bg-slate-900/40 text-muted-foreground font-semibold">
                <th className="px-6 py-3">Landing Page Target</th>
                <th className="px-6 py-3">Connected Channels</th>
                <th className="px-6 py-3 text-center">Total Imp.</th>
                <th className="px-6 py-3 text-center">Conversion</th>
                <th className="px-6 py-3">Budget Allocation</th>
                <th className="px-6 py-3 text-right">Manage</th>
              </tr>
            </thead>
            <tbody>
              {groupedHistory.map(group => (
                <tr key={group.slug} className="border-b hover:bg-slate-900/10">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">/{group.slug}</div>
                    <div className="text-[10px] text-muted-foreground">Generated: {new Date(group.lastGenerated).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {group.links.map(link => {
                        const sInfo = sources.find(s => s.id === link.source) || { icon: Link2, color: 'text-muted-foreground' };
                        const SIcon = sInfo.icon;
                        const itemCopied = copiedHistoryItemId === link.id;
                        return (
                          <button
                            key={link.id}
                            onClick={() => copyToClipboard(link.generatedLink, link.id)}
                            className={`p-1.5 rounded bg-slate-800 border hover:bg-slate-700 transition-colors ${itemCopied ? 'border-green-500' : 'border-slate-700'}`}
                            title={`Copy ${link.source} link`}
                          >
                            <SIcon className={itemCopied ? 'text-green-500' : sInfo.color} size={14} />
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-foreground">{group.totalViews}</td>
                  <td className="px-6 py-4 text-center font-bold text-green-500">{group.totalSignups}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold">
                      ₹{group.totalBudget}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <a href={`/landing/${group.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-cyan-400">
                        <ExternalLink size={14} />
                      </a>
                      {hasPermission('MARKETING_DELETE') && (
                        <button className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-red-400 cursor-pointer" onClick={() => deleteGroup(group.slug)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {groupedHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Link2 size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-xs">No tracking data available</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>


    </div>
  );
}


