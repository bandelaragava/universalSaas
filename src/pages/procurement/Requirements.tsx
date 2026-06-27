import React, { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';
import { motion } from 'framer-motion';
import { FileText, Plus, Trash2, CalendarDays, Eye } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Modal from '@/components/ui/Modal';

interface Item {
  itemName: string;
  brand: string;
  quantity: number;
  unit?: string;
}

interface Vendor {
  id: number | string;
  vendorName: string;
  companyName?: string;
}

interface Requirement {
  id: number | string;
  description?: string;
  vendorId?: number | string;
  vendor?: Vendor;
  requiredDate?: string;
  returnDate?: string;
  requirementType?: string;
  items?: Item[];
  status: string;
}

export function Requirements() {
  const { searchQuery } = useAppStore();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isAddReqOpen, setIsAddReqOpen] = useState(false);
  const [isViewReqOpen, setIsViewReqOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newReq, setNewReq] = useState<{
    description: string;
    vendorId: string;
    requiredDate: string;
    requirementType: string;
    returnDate?: string;
    items: Item[];
  }>({
    description: '',
    vendorId: '',
    requiredDate: '',
    requirementType: 'BUY',
    items: [],
  });

  const fetchRequirements = async () => {
    try {
      const res = await rolesApi.get('/api/requirements');
      setRequirements(res.data || []);
    } catch (e) {
      console.error("Error fetching requirements", e);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await rolesApi.get('/api/vendors?size=100');
      const data = response.data?.data || response.data || {};
      const vendorList = data.content || data || [];
      if (Array.isArray(vendorList)) {
        setVendors(vendorList);
      }
    } catch (error) {
      console.error("Error fetching vendors", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequirements();
      fetchVendors();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await rolesApi.post('/api/requirements', newReq);
      fetchRequirements();
      setNewReq({ description: '', vendorId: '', requiredDate: '', requirementType: 'BUY', items: [] });
      setIsAddReqOpen(false);
    } catch (e) {
      console.error("Error creating requirement", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = () => {
    setNewReq({
      ...newReq,
      items: [...newReq.items, { itemName: '', brand: '', quantity: 1 }]
    });
  };

  const handleUpdateItem = (index: number, field: keyof Item, value: string | number) => {
    const updatedItems = [...newReq.items];
    const item = { ...updatedItems[index] };
    if (field === 'quantity') {
      item.quantity = Number(value);
    } else if (field === 'itemName') {
      item.itemName = String(value);
    } else if (field === 'brand') {
      item.brand = String(value);
    }
    updatedItems[index] = item;
    setNewReq({ ...newReq, items: updatedItems });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = newReq.items.filter((_, i) => i !== index);
    setNewReq({ ...newReq, items: updatedItems });
  };

  const updateStatus = async (id: number | string, status: string) => {
    try {
      await rolesApi.put(`/api/requirements/${id}/status?status=${status}`);
      fetchRequirements();
      if (selectedReq && selectedReq.id === id) {
        setSelectedReq({ ...selectedReq, status });
      }
    } catch (e) {
      console.error("Error updating status", e);
    }
  };

  const filteredRequirements = requirements.filter(r =>
    (r.id?.toString() || '').includes(searchQuery) ||
    (r.vendor?.vendorName || r.vendor?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'SENT_TO_VENDOR': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'QUOTATION_RECEIVED': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'PO_CREATED': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'INVOICE_RECEIVED': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'PAYMENT_DONE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-50">Procurement Requirements</h2>
          <p className="text-slate-400 text-sm mt-1">Create requirements and assign to vendors</p>
        </div>
        <button onClick={() => setIsAddReqOpen(true)} className="btn-primary flex items-center shrink-0 w-full sm:w-auto justify-center cursor-pointer">
          <Plus size={16} className="mr-2" />
          New Requirement
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Req ID</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Items</th>
                <th className="p-4 font-medium">Vendor</th>
                <th className="p-4 font-medium hidden sm:table-cell">Required Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredRequirements.length > 0 ? filteredRequirements.map((req) => {
                const itemsSummary = req.items && req.items.length > 0
                  ? req.items.map(i => i.itemName).join(', ')
                  : 'No items';

                return (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4 font-mono text-cyan-400">REQ-{req.id}</td>
                    <td className="p-4 text-sm text-slate-300 capitalize">{req.requirementType?.replace('_', ' ') || 'Buy'}</td>
                    <td className="p-4 font-medium text-slate-200 truncate max-w-xs" title={itemsSummary}>{itemsSummary}</td>
                    <td className="p-4 text-sm text-slate-300">{req.vendor?.vendorName || req.vendor?.companyName}</td>
                    <td className="p-4 text-sm text-slate-400 hidden sm:table-cell">{req.requiredDate || 'TBD'}</td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadge(req.status)}`}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => { setSelectedReq(req); setIsViewReqOpen(true); }} className="btn-icon cursor-pointer" title="View details"><Eye size={16} /></button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No requirements found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Requirement Modal */}
      <Modal isOpen={isAddReqOpen} onClose={() => setIsAddReqOpen(false)} title="New Requirement">
        <form className="space-y-4 text-xs sm:text-sm" onSubmit={handleAddRequirement}>
          <div>
            <label className="block text-xs font-medium text-slate-350 mb-1">Assign Vendor *</label>
            <select className="input-field text-foreground bg-background border-border text-xs" required value={newReq.vendorId} onChange={(e) => setNewReq({ ...newReq, vendorId: e.target.value })}>
              <option value="" className="bg-background">Select Vendor...</option>
              {vendors.map(v => <option key={v.id} value={v.id} className="bg-background">{v.vendorName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-350 mb-1">Requirement Type *</label>
              <select className="input-field text-foreground bg-background border-border text-xs" required value={newReq.requirementType} onChange={(e) => setNewReq({ ...newReq, requirementType: e.target.value })}>
                <option value="BUY" className="bg-background">Buy</option>
                <option value="LEASE" className="bg-background">Lease</option>
                <option value="OLD_ITEM" className="bg-background">Old Item</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-355 mb-1">Required Date</label>
              <input
                type="date"
                className="input-field px-2 text-foreground bg-background border-border text-xs"
                value={newReq.requiredDate}
                onChange={(e) => setNewReq({ ...newReq, requiredDate: e.target.value })}
              />
            </div>
            {newReq.requirementType === 'LEASE' && (
              <div>
                <label className="block text-xs font-medium text-slate-355 mb-1">Return Date</label>
                <input
                  type="date"
                  className="input-field px-2 text-foreground bg-background border-border text-xs"
                  value={newReq.returnDate || ''}
                  onChange={(e) => setNewReq({ ...newReq, returnDate: e.target.value })}
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-355 mb-1">Description</label>
            <textarea
              rows={3}
              className="input-field resize-none text-foreground bg-background border-border text-xs"
              placeholder="Detailed specifications..."
              value={newReq.description}
              onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
            />
          </div>
          <div className="pt-3 border-t border-slate-700/50 mt-3">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-slate-200 font-semibold text-xs">Items</h4>
              <button type="button" onClick={handleAddItem} className="btn-secondary py-1 text-xs px-2 flex items-center cursor-pointer">
                <Plus size={14} className="mr-1" /> Add Item
              </button>
            </div>

            {newReq.items.length > 0 ? (
              <div className="space-y-3">
                {newReq.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800 items-center">
                    <div className="col-span-12 sm:col-span-5">
                      <input type="text" required placeholder="Item Name (e.g. Laptop)" className="input-field py-1.5 text-xs text-foreground bg-background border-border" value={item.itemName} onChange={(e) => handleUpdateItem(idx, 'itemName', e.target.value)} />
                    </div>
                    <div className="col-span-6 sm:col-span-4">
                      <input type="text" placeholder="Brand" className="input-field py-1.5 text-xs text-foreground bg-background border-border" value={item.brand} onChange={(e) => handleUpdateItem(idx, 'brand', e.target.value)} />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input type="number" required min="1" placeholder="Qty" className="input-field py-1.5 text-xs text-foreground bg-background border-border" value={item.quantity} onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)} />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end sm:justify-center">
                      <button type="button" onClick={() => handleRemoveItem(idx)} className="p-1.5 text-rose-400 hover:bg-rose-400/10 rounded shrink-0 cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-900/30 rounded-lg border border-slate-800 border-dashed text-slate-500 text-xs">
                No items added. Click "Add Item" to add requirements.
              </div>
            )}
          </div>
          <div className="pt-3 flex justify-end gap-3 border-t border-slate-700/50 mt-3">
            <button type="button" onClick={() => setIsAddReqOpen(false)} className="btn-secondary cursor-pointer" disabled={isSubmitting}>Cancel</button>
            <button type="submit" disabled={newReq.items.length === 0 || isSubmitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {isSubmitting ? 'Sending...' : 'Save & Send Email'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Requirement Modal */}
      <Modal isOpen={isViewReqOpen} onClose={() => setIsViewReqOpen(false)} title="Requirement Details">
        {selectedReq && (
          <div className="space-y-5">
            <div className="flex items-start justify-between border-b border-slate-700/50 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-50">REQ-{selectedReq.id}</h3>
                <p className="text-sm text-cyan-400 mt-0.5">Assigned to: {selectedReq.vendor?.vendorName || selectedReq.vendor?.companyName}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${getStatusBadge(selectedReq.status)}`}>
                {selectedReq.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-800 rounded-lg shrink-0"><CalendarDays size={14} className="text-amber-400" /></div>
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Required Date</p>
                  <p className="text-slate-200 font-medium">{selectedReq.requiredDate || 'TBD'}</p>
                </div>
              </div>
              {selectedReq.returnDate && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg shrink-0"><CalendarDays size={14} className="text-rose-400" /></div>
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Return Date</p>
                    <p className="text-slate-200 font-medium">{selectedReq.returnDate}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-800 rounded-lg shrink-0"><FileText size={14} className="text-cyan-400" /></div>
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Type</p>
                  <p className="text-slate-200 font-medium capitalize">{selectedReq.requirementType?.replace('_', ' ') || 'Buy'}</p>
                </div>
              </div>
            </div>

            {selectedReq.description && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-505 mb-1">Notes</p>
                <p className="text-xs sm:text-sm text-slate-300">{selectedReq.description}</p>
              </div>
            )}

            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-300 mb-3">Requested Items</p>
              <div className="overflow-x-auto border border-slate-700/50 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/50 border-b border-slate-700/50 text-slate-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">Item Name</th>
                      <th className="px-4 py-2 font-medium">Brand</th>
                      <th className="px-4 py-2 font-medium">Quantity</th>
                      <th className="px-4 py-2 font-medium">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {selectedReq.items && selectedReq.items.length > 0 ? selectedReq.items.map((item, idx) => (
                      <tr key={idx} className="bg-slate-900/30">
                        <td className="px-4 py-2 text-slate-250 font-medium">{item.itemName}</td>
                        <td className="px-4 py-2 text-slate-350">{item.brand || '-'}</td>
                        <td className="px-4 py-2 text-slate-250">{item.quantity}</td>
                        <td className="px-4 py-2 text-slate-400">{item.unit || '-'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-center text-slate-500">No items specified.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/50">
              <p className="text-xs sm:text-sm font-semibold text-slate-300 mb-3">Update Workflow Status:</p>
              <div className="flex flex-wrap gap-2">
                {['QUOTATION_RECEIVED', 'PO_CREATED', 'INVOICE_RECEIVED', 'PAYMENT_DONE'].map(st => (
                  <button
                    key={st}
                    onClick={() => updateStatus(selectedReq.id, st)}
                    disabled={selectedReq.status === st}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${selectedReq.status === st
                        ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                        : 'border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                  >
                    Mark as {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-slate-700/50">
              <button onClick={() => setIsViewReqOpen(false)} className="btn-secondary cursor-pointer">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

export default Requirements;