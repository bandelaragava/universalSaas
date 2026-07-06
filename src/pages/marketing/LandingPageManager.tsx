/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { getLandingPages, createLandingPage, updateLandingPage, deleteLandingPage, getTrackedLinks, getCoupons } from '@/services/marketing';
import { Plus, Eye, Search, Pencil, Trash2, Link as LinkIcon, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { usePermissions } from '@/auth/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LandingPageType {
  id: string | number;
  title: string;
  slug: string;
  description: string;
  ctaText?: string;
  status: string;
  adBudget?: number;
  campaignName?: string;
  couponCode?: string;
}

interface TrackedLinkType {
  id: string | number;
  landingSlug: string;
  source: string;
  generatedLink: string;
  views?: number;
  signups?: number;
}

export default function LandingPageManager() {
  const { hasPermission } = usePermissions();
  const [pages, setPages] = useState<LandingPageType[]>([]);
  const [trackedLinks, setTrackedLinks] = useState<TrackedLinkType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPage, setEditingPage] = useState<LandingPageType | null>(null);
  const [expandedPages, setExpandedPages] = useState<Set<string | number>>(new Set());
  const [activeCoupons, setActiveCoupons] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    ctaText: '',
    status: 'DRAFT',
    adBudget: 0,
    campaignName: '',
    couponCode: ''
  });

  const fetchPages = async () => {
    setLoading(true);
    try {
      const [lpRes, tlRes, couponsRes] = await Promise.all([
        getLandingPages(),
        getTrackedLinks(),
        getCoupons()
      ]);
      setPages((lpRes?.data || lpRes || []) as LandingPageType[]);
      setTrackedLinks((tlRes?.data || tlRes || []) as TrackedLinkType[]);
      const allCoupons = (couponsRes?.data || couponsRes || []);
      setActiveCoupons(allCoupons.filter((c: any) => c.status === 'ACTIVE'));
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPages();
  }, []);

  const toggleExpand = (pageId: string | number) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  const filteredPages = pages.filter(p =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (page: LandingPageType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPage(page);
    setFormData({
      title: page.title || '',
      slug: page.slug || '',
      description: page.description || '',
      ctaText: page.ctaText || '',
      status: page.status || 'ACTIVE',
      adBudget: page.adBudget || 0,
      campaignName: page.campaignName || '',
      couponCode: page.couponCode || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this landing page?')) {
      try {
        await deleteLandingPage(id);
        fetchPages();
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slugToRedirect = formData.slug;
      if (editingPage) {
        await updateLandingPage(editingPage.id, formData);
      } else {
        await createLandingPage(formData);
      }
      resetForm();
      fetchPages();
      window.location.href = `/marketing?tab=social&slug=${slugToRedirect}`;
    } catch (err) {
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', slug: '',
      description: '', ctaText: '', status: 'DRAFT', adBudget: 0,
      campaignName: '', couponCode: ''
    });
    setEditingPage(null);
    setShowForm(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-base font-bold">Landing Page Portfolio</h4>
          <p className="text-xs text-muted-foreground">Orchestrate and publish responsive, high-conversion templates</p>
        </div>
        {hasPermission('MARKETING_CREATE') && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1"
          >
            {showForm ? 'Close Form' : <><Plus size={16} /> Create Page</>}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="animate-in fade-in duration-200">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-sm font-semibold">{editingPage ? 'Update Landing Page' : 'New Page Configuration'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Page Title *</label>
                  <Input type="text" name="title" value={formData.title} onChange={handleFormChange} required placeholder="e.g., Free CRM Demo" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">URL Slug *</label>
                  <Input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                    required
                    placeholder="free-crm-demo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Main Description</label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Discover how our platform helps businesses..."
                />
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Campaign Name *</label>
                  <Input type="text" name="campaignName" value={formData.campaignName} onChange={handleFormChange} required placeholder="e.g. Summer Promo" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Coupon Code (Optional)</label>
                  <select
                    className="input-field w-full text-sm bg-background border-border text-foreground px-3 py-2.5 rounded-md"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleFormChange}
                  >
                    <option value="">No Coupon</option>
                    {activeCoupons.map(c => (
                      <option key={c.id} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">CTA Button Text</label>
                  <Input type="text" name="ctaText" value={formData.ctaText} onChange={handleFormChange} placeholder="e.g., Register Now" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ad Budget</label>
                  <Input type="number" name="adBudget" value={formData.adBudget || ''} onChange={handleFormChange} placeholder="e.g., 5000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Publish Status</label>
                  <select
                    className="input-field w-full text-sm bg-background border-border text-foreground px-3 py-2.5 rounded-md"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="DRAFT">Draft (Hidden)</option>
                    <option value="ACTIVE">Active (Published)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Processing...' : 'Save Configuration'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2 border-b">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b bg-slate-900/40 text-muted-foreground font-semibold">
                <th className="px-6 py-3">Page Details</th>
                <th className="px-6 py-3 text-center">Related Links</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-cyan-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">
                    No landing pages found.
                  </td>
                </tr>
              ) : (
                filteredPages.map(page => {
                  const pageLinks = trackedLinks.filter(tl => tl.landingSlug === page.slug);
                  const isExpanded = expandedPages.has(page.id);
                  return (
                    <React.Fragment key={page.id}>
                      <tr
                        className={`border-b hover:bg-slate-900/10 cursor-pointer ${isExpanded ? 'bg-cyan-500/5' : ''}`}
                        onClick={() => toggleExpand(page.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{page.title}</div>
                          <div className="text-[10px] text-cyan-400">/{page.slug}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1 font-bold text-cyan-400">
                            {pageLinks.length} <LinkIcon size={12} />
                            {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${page.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                            {page.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            {hasPermission('MARKETING_UPDATE') && (
                              <button className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-cyan-400" onClick={(e) => handleEdit(page, e)}>
                                <Pencil size={13} />
                              </button>
                            )}
                            {hasPermission('MARKETING_DELETE') && (
                              <button className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-red-400" onClick={(e) => handleDelete(page.id, e)}>
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-900/20">
                          <td colSpan={4} className="px-6 py-4">
                            <div className="grid gap-3 grid-cols-1 md:grid-cols-3 animate-in slide-in-from-top-1 duration-200">
                              {pageLinks.length > 0 ? (
                                pageLinks.map(link => (
                                  <div key={link.id} className="p-3 rounded-lg border border-border bg-slate-900/50 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 uppercase">{link.source}</span>
                                      <a href={link.generatedLink} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                                        <ExternalLink size={12} />
                                      </a>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mt-1">
                                      <span>Clicks: <span className="text-foreground">{link.views || 0}</span></span>
                                      <span>Leads: <span className="text-green-500">{link.signups || 0}</span></span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-full text-center py-2 text-muted-foreground text-[10px] italic">
                                  No active tracking links for this landing page.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}


