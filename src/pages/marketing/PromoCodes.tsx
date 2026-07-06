import React, { useState, useEffect } from 'react';
import {
  getCoupons,
  createCoupon,
  updateCouponStatus,
  softDeleteCoupon,
  hardDeleteCoupon
} from '@/services/marketing';
import { Plus, Ticket, Pencil, Trash2, Archive, Pause, Play } from 'lucide-react';
import { usePermissions } from '@/auth/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CouponType {
  id: string | number;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  discountCap?: number;
  minPurchaseAmount: number;
  maxUsage?: number;
  usedCount: number;
  isFirstOrderOnly?: boolean;
  firstOrderOnly?: boolean;
  autoApply?: boolean;
  status: string;
  expiryDate?: string;
}

export default function PromoCodes() {
  const { hasPermission } = usePermissions();
  const [coupons, setCoupons] = useState<CouponType[]>([]);
  const [viewTab, setViewTab] = useState('ACTIVE'); // ACTIVE, INACTIVE, EXPIRED, ALL
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const initialForm = {
    code: '',
    discountType: 'PERCENT' as 'PERCENT' | 'FIXED',
    discountValue: 0,
    discountCap: '',
    minPurchaseAmount: 0,
    maxUsage: 100,
    isFirstOrderOnly: false,
    autoApply: false,
    learnerId: '',
    courseIds: [] as string[],
    expiryDate: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await getCoupons();
      const list = res?.data || res || [];
      setCoupons(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCoupons();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        discountCap: formData.discountCap ? parseFloat(formData.discountCap) : null
      };

      if (editingId) {
        alert('Updating full details is not currently supported by backend. Please pause and create a new coupon.');
      } else {
        await createCoupon(payload);
        alert('Promo code launched successfully!');
      }

      resetForm();
      fetchCoupons();
    } catch (err) {
      console.error(err);
      alert('Error saving promo code');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c: CouponType) => {
    setEditingId(c.id);
    setFormData({
      code: c.code || '',
      discountType: c.discountType || 'PERCENT',
      discountValue: c.discountValue || 0,
      discountCap: c.discountCap ? String(c.discountCap) : '',
      minPurchaseAmount: c.minPurchaseAmount || 0,
      maxUsage: c.maxUsage || 100,
      isFirstOrderOnly: c.isFirstOrderOnly || c.firstOrderOnly || false,
      autoApply: c.autoApply || false,
      learnerId: '',
      courseIds: [],
      expiryDate: c.expiryDate ? c.expiryDate.split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleStatusUpdate = async (id: string | number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateCouponStatus(id, nextStatus);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      alert('Status update failed');
    }
  };

  const handleSoftDelete = async (id: string | number) => {
    if (window.confirm('Are you sure you want to archive (soft delete) this promo code? It will no longer be usable by customers.')) {
      try {
        await softDeleteCoupon(id);
        fetchCoupons();
      } catch (err) {
        console.error(err);
        alert('Archive failed');
      }
    }
  };

  const handleHardDelete = async (id: string | number) => {
    if (window.confirm('CRITICAL ACTION: Are you sure you want to PERMANENTLY delete this promo code from the database? This action cannot be undone.')) {
      try {
        await hardDeleteCoupon(id);
        fetchCoupons();
      } catch (err) {
        console.error(err);
        alert('Permanent delete failed');
      }
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const filteredCoupons = coupons.filter(c => {
    if (viewTab === 'ALL') return true;
    return c.status === viewTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold">Promo Codes</h2>
          <p className="text-xs text-muted-foreground">Orchestrate discounts with precision: Edit, Pause, and Manage lifecycles.</p>
        </div>
        {!showForm && hasPermission('MARKETING_CREATE') && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-1">
            <Plus size={16} /> Create Code
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-t-4 border-t-cyan-500 animate-in fade-in duration-200">
          <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
            <CardTitle className="text-sm font-semibold">{editingId ? `Editing Code: ${formData.code}` : 'Configure New Promotion'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={resetForm}>Close</Button>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Coupon Code *</label>
                  <Input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="SUMMER50" required className="font-bold uppercase" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Discount Type</label>
                  <select
                    className="input-field w-full text-sm bg-background border-border text-foreground px-3 py-2.5 rounded-md"
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Discount Value *</label>
                  <Input type="number" name="discountValue" value={formData.discountValue} onChange={handleChange} required />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Valid Until</label>
                  <Input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Min Purchase Amount (₹)</label>
                  <Input type="number" name="minPurchaseAmount" value={formData.minPurchaseAmount} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Max Usage (Global)</label>
                  <Input type="number" name="maxUsage" value={formData.maxUsage} onChange={handleChange} />
                </div>
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input type="checkbox" name="isFirstOrderOnly" checked={formData.isFirstOrderOnly} onChange={handleChange} className="rounded border-border bg-transparent text-cyan-500 focus:ring-cyan-500 h-4 w-4" />
                  <span>New Users Only</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input type="checkbox" name="autoApply" checked={formData.autoApply} onChange={handleChange} className="rounded border-border bg-transparent text-cyan-500 focus:ring-cyan-500 h-4 w-4" />
                  <span>Auto-Apply on Checkout</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" type="button" onClick={resetForm}>Discard</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Processing...' : (editingId ? 'Save Changes' : 'Launch Promo Code')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!showForm && (
        <Card>
          <CardHeader className="p-0 border-b">
            <div className="flex border-b border-border">
              {['ACTIVE', 'INACTIVE', 'EXPIRED', 'DELETED', 'ALL'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setViewTab(tab)}
                  className={`px-4 py-3 text-xs font-bold transition-all border-b-2 hover:text-cyan-400 cursor-pointer ${viewTab === tab ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-muted-foreground'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-cyan-500 mx-auto" />
                <p className="text-[10px] text-muted-foreground mt-2">Syncing promo data...</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b bg-slate-900/40 text-muted-foreground font-semibold">
                    <th className="px-6 py-3">Promo Code</th>
                    <th className="px-6 py-3">Value</th>
                    <th className="px-6 py-3">Requirements</th>
                    <th className="px-6 py-3">Usage Status</th>
                    <th className="px-6 py-3">Visibility</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map(c => (
                    <tr key={c.id} className="border-b hover:bg-slate-900/10">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{c.code}</div>
                        <div className="text-[10px] text-muted-foreground">ID: #{c.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-emerald-500">
                          {c.discountType === 'PERCENT' ? `${c.discountValue}% Off` : `₹${c.discountValue} Flat`}
                        </div>
                        {c.discountCap && <div className="text-muted-foreground text-[10px]">Cap: ₹{c.discountCap}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div>Min: ₹{c.minPurchaseAmount}</div>
                        {c.expiryDate && <div className="text-[10px] text-red-400">Until: {new Date(c.expiryDate).toLocaleDateString()}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden mb-1">
                          <div
                            className="bg-cyan-500 h-full transition-all duration-300"
                            style={{ width: `${Math.min(100, ((c.usedCount || 0) / (c.maxUsage || 1)) * 100)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground">{c.usedCount} / {c.maxUsage || '∞'}</div>
                      </td>
                      <td className="px-6 py-4 space-x-1">
                        {(c.isFirstOrderOnly || c.firstOrderOnly) && <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px] font-bold">New</span>}
                        {c.autoApply && <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 text-[10px] font-bold">Auto</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            c.status === 'DELETED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {hasPermission('MARKETING_UPDATE') && (
                            <>
                              <button className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-cyan-400 cursor-pointer" onClick={() => handleEdit(c)} title="Edit Configuration">
                                <Pencil size={13} />
                              </button>
                              <button
                                className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-amber-400 cursor-pointer"
                                onClick={() => handleStatusUpdate(c.id, c.status)}
                                title={c.status === 'ACTIVE' ? 'Pause Promotion' : 'Resume Promotion'}
                              >
                                {c.status === 'ACTIVE' ? <Pause size={13} /> : <Play size={13} />}
                              </button>
                            </>
                          )}
                          {hasPermission('MARKETING_DELETE') && (
                            <>
                              <button className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-red-400 cursor-pointer" onClick={() => handleSoftDelete(c.id)} title="Archive (Soft Delete)">
                                <Archive size={13} />
                              </button>
                              <button className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-red-500 cursor-pointer" onClick={() => handleHardDelete(c.id)} title="Permanent Delete">
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCoupons.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        <Ticket size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-xs">No promotions found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


