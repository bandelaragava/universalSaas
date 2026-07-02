/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
import rolesApi from '@/services/rolesApi';
import { motion } from 'framer-motion';
import { FileSignature, Calendar, AlertCircle, Plus, Eye, Edit2, Trash2, Upload, Download } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Modal from '@/components/ui/Modal';

interface Contract {
  id: number | string;
  title: string;
  vendorId: number | string;
  vendorName: string;
  amount: string;
  startDate: string;
  expires: string;
  notes?: string;
  status: 'Active' | 'Expired' | 'Renewed' | 'Pending';
  documentUrl?: string;
}

interface Vendor {
  id: number | string;
  vendorName: string;
}

const statusBadge = {
  Active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  Expired: 'bg-slate-500/10 text-muted-foreground border-slate-500/30',
  Renewed: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  Pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
};

export default function Contracts() {
  const { searchQuery } = useAppStore();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [editContract, setEditContract] = useState<Contract | null>(null);
  const [newContract, setNewContract] = useState({ title: '', vendorId: '', amount: '', startDate: '', expires: '', notes: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchContracts = async () => {
    try {
      const res = await rolesApi.get('/vendor-contracts');
      if (res.data?.data !== undefined) setContracts(res.data.data);
      else if (res.data?.success) setContracts(res.data.data);
    } catch (e) { console.error("Error fetching contracts", e); }
  };

  const fetchVendors = async () => {
    try {
      const response = await rolesApi.get('/vendors?size=100');
      if (response.data && response.data.data) {
        const vendorList = response.data.data.content || response.data.data || [];
        setVendors(vendorList);
      }
    } catch (error) { console.error("Error fetching vendors", error); }
  };

  useEffect(() => {
    fetchContracts();
    fetchVendors();
  }, []);

  const openView = (c: Contract) => { setSelected(c); setIsViewOpen(true); };
  const openEdit = (c: Contract) => { setEditContract({ ...c }); setIsViewOpen(false); setIsEditOpen(true); };

  const handleDelete = async (id: number | string) => {
    if (window.confirm('Delete this contract?')) {
      try {
        await rolesApi.delete(`/api/vendor-contracts/${id}`);
        fetchContracts();
        setIsViewOpen(false);
      } catch (e) { console.error("Error deleting contract", e); }
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...newContract, status: 'Active' };
      const res = await rolesApi.post('/vendor-contracts', payload);

      if (res.data?.data?.id && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await rolesApi.post(`/api/vendor-contracts/${res.data.data.id}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      fetchContracts();
      setNewContract({ title: '', vendorId: '', amount: '', startDate: '', expires: '', notes: '' });
      setSelectedFile(null);
      setIsAddOpen(false);
    } catch (e) { console.error("Error creating contract", e); }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContract) return;
    try {
      await rolesApi.put(`/api/vendor-contracts/${editContract.id}`, editContract);

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await rolesApi.post(`/api/vendor-contracts/${editContract.id}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      fetchContracts();
      setIsEditOpen(false);
      setEditContract(null);
      setSelectedFile(null);
    } catch (e) { console.error("Error updating contract", e); }
  };

  const filteredContracts = contracts.filter(c =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const expiringContract = contracts.find(c => c.status === 'Active') || null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Contract Management</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage agreements and track SLA renewals</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn-primary flex items-center shrink-0 w-full sm:w-auto justify-center cursor-pointer">
          <Plus size={16} className="mr-2" /> New Contract
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-6 md:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-4">Active Contracts</h3>
          <div className="space-y-4">
            {filteredContracts.length > 0 ? filteredContracts.map((c) => (
              <div key={c.id} className="bg-muted/40 border border-border p-4 rounded-xl hover:bg-muted/60 hover:border-border transition-all group cursor-pointer" onClick={() => openView(c)}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex items-center">
                    <div className="p-3 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-lg mr-4 shrink-0"><FileSignature size={22} /></div>
                    <div>
                      <h4 className="font-medium text-foreground">{c.title}</h4>
                      <p className="text-sm text-muted-foreground">{c.vendorName} · {c.amount}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 ml-14 sm:ml-0">
                    <div className="flex items-center text-sm text-foreground font-medium">
                      <Calendar size={13} className="mr-1.5 text-muted-foreground" /> Expires {c.expires}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadge[c.status] || statusBadge.Active}`}>{c.status}</span>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-border">
                  <button onClick={(e) => { e.stopPropagation(); openView(c); }} className="btn-icon text-xs gap-1 flex items-center px-2 py-1 cursor-pointer" title="View">
                    <Eye size={13} /> View
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} className="btn-icon text-xs gap-1 flex items-center px-2 py-1 cursor-pointer" title="Edit">
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="btn-icon hover:text-rose-600 dark:text-rose-400 text-xs gap-1 flex items-center px-2 py-1 cursor-pointer" title="Delete">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-muted-foreground">No contracts found matching "{searchQuery}"</div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <AlertCircle className="text-rose-600 dark:text-rose-400 mr-2" size={20} /> Action Required
          </h3>
          <div className="space-y-4">
            {expiringContract ? (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                <h4 className="font-medium text-rose-600 dark:text-rose-400 text-sm">Expiring Soon</h4>
                <p className="text-foreground font-medium text-sm mt-1">{expiringContract.vendorName} — {expiringContract.title}</p>
                <p className="text-xs text-foreground0 mt-0.5">Expires {expiringContract.expires}</p>
                <button
                  onClick={() => { openEdit({ ...expiringContract, status: 'Renewed' }); }}
                  className="mt-3 text-xs bg-rose-500/20 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-rose-500/30 transition-colors cursor-pointer"
                >
                  Renew Contract
                </button>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">No action required at this time.</div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Contract Details">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selected.title}</h3>
                <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-0.5">{selected.vendorName}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${statusBadge[selected.status] || statusBadge.Active}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-foreground0 text-xs mb-0.5">Contract Value</p><p className="text-foreground font-bold text-lg">{selected.amount}</p></div>
              <div><p className="text-foreground0 text-xs mb-0.5">Start Date</p><p className="text-foreground">{selected.startDate}</p></div>
              <div className="col-span-2"><p className="text-foreground0 text-xs mb-0.5">Expiry Date</p><p className="text-foreground">{selected.expires}</p></div>
            </div>
            {selected.notes && (
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs text-foreground0 mb-1">Notes</p>
                <p className="text-sm text-foreground font-medium">{selected.notes}</p>
              </div>
            )}
            {selected.documentUrl && (
              <div className="mt-4">
                <a href={selected.documentUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
                  <Download size={16} /> Download Contract Document
                </a>
              </div>
            )}
            <div className="pt-2 flex justify-between items-center border-t border-border">
              <button onClick={() => handleDelete(selected.id)} className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-400/10 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                <Trash2 size={15} /> Delete
              </button>
              <div className="flex gap-3">
                <button onClick={() => setIsViewOpen(false)} className="btn-secondary cursor-pointer">Close</button>
                <button onClick={() => openEdit(selected)} className="btn-primary flex items-center gap-2 cursor-pointer"><Edit2 size={15} /> Edit</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {editContract && (
        <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditContract(null); }} title="Edit Contract">
          <form className="space-y-4" onSubmit={handleEditSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Contract Title *</label>
                <input type="text" className="input-field" required value={editContract.title} onChange={(e) => setEditContract({ ...editContract, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Vendor *</label>
                <select className="input-field text-foreground bg-background border-border" required value={editContract.vendorId} onChange={(e) => setEditContract({ ...editContract, vendorId: e.target.value })}>
                  <option value="" className="bg-background">Select Vendor...</option>
                  {vendors.map(v => <option key={v.id} value={v.id} className="bg-background">{v.vendorName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Contract Value</label>
                <input type="text" className="input-field" placeholder="$0" value={editContract.amount} onChange={(e) => setEditContract({ ...editContract, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Start Date</label>
                <input type="date" className="input-field" value={editContract.startDate} onChange={(e) => setEditContract({ ...editContract, startDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Expiry Date</label>
                <input type="date" className="input-field" value={editContract.expires} onChange={(e) => setEditContract({ ...editContract, expires: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Status</label>
                <select className="input-field text-foreground bg-background border-border" value={editContract.status} onChange={(e) => setEditContract({ ...editContract, status: e.target.value as Contract['status'] })}>
                  <option value="Active" className="bg-background">Active</option>
                  <option value="Renewed" className="bg-background">Renewed</option>
                  <option value="Expired" className="bg-background">Expired</option>
                  <option value="Pending" className="bg-background">Pending</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Notes</label>
                <textarea rows={3} className="input-field resize-none" value={editContract.notes || ''} onChange={(e) => setEditContract({ ...editContract, notes: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Upload New Document (Optional)</label>
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs py-1.5 flex items-center cursor-pointer">
                    <Upload size={14} className="mr-2" /> Choose File
                  </button>
                  {selectedFile && <span className="text-xs text-muted-foreground">{selectedFile.name}</span>}
                  {!selectedFile && editContract.documentUrl && <span className="text-xs text-cyan-600 dark:text-cyan-400">Current document exists</span>}
                </div>
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
              <button type="button" onClick={() => { setIsEditOpen(false); setEditContract(null); }} className="btn-secondary cursor-pointer">Cancel</button>
              <button type="submit" className="btn-primary cursor-pointer">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="New Contract">
        <form className="space-y-4" onSubmit={handleAdd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground font-medium mb-1">Contract Title *</label>
              <input type="text" className="input-field" required placeholder="e.g. Annual Software License 2025" value={newContract.title} onChange={(e) => setNewContract({ ...newContract, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground font-medium mb-1">Vendor *</label>
              <select className="input-field text-foreground bg-background border-border" required value={newContract.vendorId} onChange={(e) => setNewContract({ ...newContract, vendorId: e.target.value })}>
                <option value="" className="bg-background">Select Vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id} className="bg-background">{v.vendorName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground font-medium mb-1">Contract Value</label>
              <input type="text" className="input-field" placeholder="$0" value={newContract.amount} onChange={(e) => setNewContract({ ...newContract, amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground font-medium mb-1">Start Date</label>
              <input type="date" className="input-field" value={newContract.startDate} onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground font-medium mb-1">Expiry Date</label>
              <input type="date" className="input-field" value={newContract.expires} onChange={(e) => setNewContract({ ...newContract, expires: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground font-medium mb-1">Notes</label>
              <textarea rows={3} className="input-field resize-none" placeholder="Any special terms or notes..." value={newContract.notes} onChange={(e) => setNewContract({ ...newContract, notes: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground font-medium mb-1">Upload Contract Document</label>
              <div className="flex items-center gap-3">
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs py-1.5 flex items-center cursor-pointer">
                  <Upload size={14} className="mr-2" /> Choose File
                </button>
                {selectedFile && <span className="text-xs text-muted-foreground">{selectedFile.name}</span>}
              </div>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn-secondary cursor-pointer">Cancel</button>
            <button type="submit" className="btn-primary cursor-pointer">Create Contract</button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
