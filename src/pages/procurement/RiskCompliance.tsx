/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, FileSearch, Shield, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Modal from '@/components/ui/Modal';

interface AuditRecord {
  id: number | string;
  vendorId: number | string;
  vendorName: string;
  type: string;
  auditor: string;
  auditDate: string;
  nextAudit: string;
  findings: string;
  status: 'Passed' | 'Failed' | 'Pending';
}

interface Vendor {
  id: number | string;
  vendorName: string;
}

const statusBadge: Record<string, string> = {
  Passed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  Failed: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  Pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
};

export default function RiskCompliance() {
  const { searchQuery } = useAppStore();
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selected, setSelected] = useState<AuditRecord | null>(null);
  const [editAudit, setEditAudit] = useState<AuditRecord | null>(null);
  const [newAudit, setNewAudit] = useState({ vendorId: '', type: '', auditor: '', auditDate: '', nextAudit: '', findings: '', status: 'Pending' as AuditRecord['status'] });

  const fetchAudits = async () => {
    try {
      const response = await rolesApi.get('/vendor-audits');
      if (response.data && response.data.data) setAudits(response.data.data);
    } catch (error) { console.error("Error fetching audits", error); }
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
    fetchAudits();
    fetchVendors();
  }, []);

  const openView = (a: AuditRecord) => { setSelected(a); setIsViewOpen(true); };
  const openEdit = (a: AuditRecord) => { setEditAudit({ ...a }); setIsViewOpen(false); setIsEditOpen(true); };

  const handleDelete = async (id: number | string) => {
    if (window.confirm('Delete this audit record?')) {
      try {
        await rolesApi.delete(`/vendor-audits/${id}`);
        fetchAudits();
        setIsViewOpen(false);
      } catch (error) { console.error("Error deleting audit", error); }
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rolesApi.post('/vendor-audits', newAudit);
      fetchAudits();
      setNewAudit({ vendorId: '', type: '', auditor: '', auditDate: '', nextAudit: '', findings: '', status: 'Pending' });
      setIsAddOpen(false);
    } catch (error) { console.error("Error adding audit", error); }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAudit) return;
    try {
      await rolesApi.put(`/vendor-audits/${editAudit.id}`, editAudit);
      fetchAudits();
      setIsEditOpen(false);
      setEditAudit(null);
    } catch (error) { console.error("Error updating audit", error); }
  };

  const filteredAudits = audits.filter(a =>
    (a.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const compliantCount = audits.filter(a => a.status === 'Passed').length;
  const underReviewCount = audits.filter(a => a.status === 'Pending').length;
  const highRiskCount = audits.filter(a => a.status === 'Failed').length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Risk &amp; Compliance</h2>
          <p className="text-muted-foreground text-sm mt-1">Monitor vendor risk scores and compliance audits</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn-primary flex items-center shrink-0 w-full sm:w-auto justify-center">
          <Plus size={16} className="mr-2" /> New Audit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-6 bg-emerald-500/5 border-emerald-500/20">
          <div className="flex items-center mb-4"><ShieldCheck size={24} className="text-emerald-600 dark:text-emerald-500 mr-3" /><h3 className="text-lg font-semibold text-foreground">Compliant</h3></div>
          <p className="text-3xl font-bold text-foreground mb-1">{compliantCount}</p>
          <p className="text-sm text-muted-foreground">Vendors passing all checks</p>
        </div>
        <div className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-6 bg-amber-500/5 border-amber-500/20">
          <div className="flex items-center mb-4"><Shield size={24} className="text-amber-600 dark:text-amber-500 mr-3" /><h3 className="text-lg font-semibold text-foreground">Under Review</h3></div>
          <p className="text-3xl font-bold text-foreground mb-1">{underReviewCount}</p>
          <p className="text-sm text-muted-foreground">Pending audit results</p>
        </div>
        <div className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-6 bg-rose-500/5 border-rose-500/20">
          <div className="flex items-center mb-4"><ShieldAlert size={24} className="text-rose-600 dark:text-rose-500 mr-3" /><h3 className="text-lg font-semibold text-foreground">High Risk</h3></div>
          <p className="text-3xl font-bold text-foreground mb-1">{highRiskCount}</p>
          <p className="text-sm text-muted-foreground">Requires immediate action</p>
        </div>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-xl p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
          <FileSearch className="mr-2 text-cyan-600 dark:text-cyan-400" size={20} /> Recent Compliance Audits
        </h3>
        <div className="space-y-3">
          {filteredAudits.length > 0 ? filteredAudits.map((audit) => {
            const s = statusBadge[audit.status] || statusBadge.Pending;
            return (
              <div key={audit.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/20 rounded-xl border border-border hover:bg-muted/50 hover:border-border transition-all group cursor-pointer" onClick={() => openView(audit)}>
                <div className="mb-3 sm:mb-0">
                  <h4 className="font-medium text-foreground">{audit.type}</h4>
                  <p className="text-sm text-muted-foreground">Vendor: <span className="text-foreground font-medium">{audit.vendorName}</span></p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-muted-foreground">{audit.auditDate}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s}`}>{audit.status}</span>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openView(audit); }} className="btn-icon" title="View Report"><Eye size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); openEdit(audit); }} className="btn-icon" title="Edit"><Edit2 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(audit.id); }} className="btn-icon hover:text-rose-600 dark:hover:text-rose-400" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="p-8 text-center text-muted-foreground border border-border rounded-xl bg-muted/10">
              No compliance audits found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Audit Report">
        {selected && (() => {
          const s = statusBadge[selected.status] || statusBadge.Pending;
          return (
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selected.type}</h3>
                  <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-0.5">{selected.vendorName}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${s}`}>{selected.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs mb-0.5">Audit Date</p><p className="text-foreground">{selected.auditDate}</p></div>
                <div><p className="text-muted-foreground text-xs mb-0.5">Next Audit Due</p><p className="text-foreground">{selected.nextAudit}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground text-xs mb-0.5">Auditor / Firm</p><p className="text-foreground">{selected.auditor}</p></div>
              </div>
              <div className="bg-muted/40 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Findings &amp; Notes</p>
                <p className="text-sm text-foreground font-medium leading-relaxed">{selected.findings}</p>
              </div>
              <div className="pt-2 flex justify-between items-center border-t border-border mt-4">
                <button onClick={() => handleDelete(selected.id)} className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 px-3 py-2 rounded-lg transition-colors">
                  <Trash2 size={15} /> Delete
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setIsViewOpen(false)} className="btn-secondary">Close</button>
                  <button onClick={() => openEdit(selected)} className="btn-primary flex items-center gap-2"><Edit2 size={15} /> Edit</button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {editAudit && (
        <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditAudit(null); }} title="Edit Audit Record">
          <form className="space-y-4" onSubmit={handleEditSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Vendor</label>
                <select className="input-field w-full" value={editAudit.vendorId} onChange={(e) => setEditAudit({ ...editAudit, vendorId: e.target.value })}>
                  <option value="">Select a vendor...</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.vendorName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                <select className="input-field w-full" value={editAudit.status} onChange={(e) => setEditAudit({ ...editAudit, status: e.target.value as AuditRecord['status'] })}>
                  <option>Pending</option><option>Passed</option><option>Failed</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Audit Type *</label>
                <input type="text" className="input-field w-full" required value={editAudit.type} onChange={(e) => setEditAudit({ ...editAudit, type: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Audit Date</label>
                <input type="date" className="input-field w-full" value={editAudit.auditDate || ''} onChange={(e) => setEditAudit({ ...editAudit, auditDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Next Audit Due</label>
                <input type="date" className="input-field w-full" value={editAudit.nextAudit} onChange={(e) => setEditAudit({ ...editAudit, nextAudit: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Auditor / Firm</label>
                <input type="text" className="input-field w-full" value={editAudit.auditor} onChange={(e) => setEditAudit({ ...editAudit, auditor: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Findings &amp; Notes</label>
                <textarea rows={4} className="input-field w-full resize-none" value={editAudit.findings} onChange={(e) => setEditAudit({ ...editAudit, findings: e.target.value })} />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
              <button type="button" onClick={() => { setIsEditOpen(false); setEditAudit(null); }} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record New Audit">
        <form className="space-y-4" onSubmit={handleAdd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Vendor *</label>
              <select className="input-field w-full" required value={newAudit.vendorId} onChange={(e) => setNewAudit({ ...newAudit, vendorId: e.target.value })}>
                <option value="">Select vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.vendorName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
              <select className="input-field w-full" value={newAudit.status} onChange={(e) => setNewAudit({ ...newAudit, status: e.target.value as AuditRecord['status'] })}>
                <option>Pending</option><option>Passed</option><option>Failed</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Audit Type *</label>
              <input type="text" className="input-field w-full" required placeholder="e.g. ISO 27001 Security Audit" value={newAudit.type} onChange={(e) => setNewAudit({ ...newAudit, type: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Audit Date</label>
              <input type="date" className="input-field w-full" value={newAudit.auditDate} onChange={(e) => setNewAudit({ ...newAudit, auditDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Next Audit Due</label>
              <input type="date" className="input-field w-full" value={newAudit.nextAudit} onChange={(e) => setNewAudit({ ...newAudit, nextAudit: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Auditor / Firm</label>
              <input type="text" className="input-field w-full" placeholder="e.g. External - CyberAssure Ltd" value={newAudit.auditor} onChange={(e) => setNewAudit({ ...newAudit, auditor: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Findings &amp; Notes</label>
              <textarea rows={3} className="input-field w-full resize-none" placeholder="Summarise key findings..." value={newAudit.findings} onChange={(e) => setNewAudit({ ...newAudit, findings: e.target.value })} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Record Audit</button>
          </div>
        </form>
      </Modal>

    </motion.div>
  );
}



