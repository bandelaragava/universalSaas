/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import rolesApi from '@/services/rolesApi';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, DollarSign, Upload, FileUp, Eye, Edit2, Trash2, Download } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Modal from '@/components/ui/Modal';

interface Invoice {
  id: number | string;
  invoiceNumber: string;
  vendorId: number | string;
  vendorName: string;
  amount: string;
  amountValue?: number;
  date: string;
  dueDate: string;
  poRef: string;
  status: 'Paid' | 'Approved' | 'Pending' | 'Rejected' | 'Partially Paid';
  notes?: string;
  receiptUrl?: string;
  requirementId?: number | string;
  amountPaid?: number | string;
  amountPending?: number | string;
  paymentHistory?: string;
}

interface Vendor {
  id: number | string;
  vendorName: string;
}

interface Requirement {
  id: number | string;
  requirementType?: string;
  description?: string;
  vendor?: {
    id: number | string;
  };
}

const statusStyle = {
  Paid: { badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', label: 'Paid' },
  Approved: { badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30', label: 'Approved' },
  Pending: { badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', label: 'Pending' },
  Rejected: { badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30', label: 'Rejected' },
  'Partially Paid': { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'Partially Paid' },
};

const mockInvoices: Invoice[] = [
  { id: 1, invoiceNumber: 'INV-2026-004', vendorId: 1, vendorName: 'Acme Supply Solutions LLC', amount: '$12,500', amountValue: 12500, date: '2026-06-08', dueDate: '2026-07-15', poRef: 'PO-1024', status: 'Paid', notes: 'Procurement of server rack hardware & network switches.', receiptUrl: '/vendor/invoices/1/receipt' },
  { id: 2, invoiceNumber: 'INV-2026-005', vendorId: 2, vendorName: 'Apex Globals Ltd', amount: '$8,400', amountValue: 8400, date: '2026-06-09', dueDate: '2026-07-20', poRef: 'PO-1025', status: 'Approved', notes: 'Office space leasing deposit.' },
  { id: 3, invoiceNumber: 'INV-2026-006', vendorId: 1, vendorName: 'Acme Supply Solutions LLC', amount: '$4,200', amountValue: 4200, date: '2026-06-09', dueDate: '2026-07-25', poRef: 'PO-1026', status: 'Pending', notes: 'Consulting fees for cloud migration.' }
];

const mockVendors: Vendor[] = [
  { id: 1, vendorName: 'Acme Supply Solutions LLC' },
  { id: 2, vendorName: 'Apex Globals Ltd' }
];

export default function Invoices() {
  const { searchQuery } = useAppStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [newInvoice, setNewInvoice] = useState({ vendorId: '', amount: '', poRef: '', dueDate: '', notes: '', requirementId: '' });
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; invoice: Invoice | null; inputValue: string; error: string }>({ open: false, invoice: null, inputValue: '', error: '' });

  const fetchInvoices = async () => {
    try {
      const res = await rolesApi.get('/api/vendor-invoices');
      if (res.data?.data !== undefined) setInvoices(res.data.data);
      else if (res.data.success) setInvoices(res.data.data);
    } catch (e) {
      console.warn("Error fetching invoices, falling back to mock data", e);
      setInvoices(mockInvoices);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await rolesApi.get('/api/vendors?size=100');
      const raw = response.data?.data;
      let vendorList = [];
      if (Array.isArray(raw)) {
        vendorList = raw;
      } else if (raw?.content && Array.isArray(raw.content)) {
        vendorList = raw.content;
      } else if (raw) {
        vendorList = Object.values(raw);
      }
      setVendors(vendorList.length > 0 ? vendorList : mockVendors);
    } catch (error) {
      console.warn("Error fetching vendors, falling back to mock data", error);
      setVendors(mockVendors);
    }
  };

  const fetchRequirements = async () => {
    try {
      const res = await rolesApi.get('/api/requirements');
      if (res.data) setRequirements(res.data);
    } catch (error) { console.error("Error fetching requirements", error); }
  };

  useEffect(() => {
    fetchInvoices();
    fetchVendors();
    fetchRequirements();
  }, []);

  const openView = (inv: Invoice) => { setSelected(inv); setIsViewOpen(true); };
  const openEdit = (inv: Invoice) => { setEditInvoice({ ...inv }); setIsViewOpen(false); setIsEditOpen(true); };

  const handleDelete = async (id: number | string) => {
    if (window.confirm('Delete this invoice?')) {
      try {
        await rolesApi.delete(`/api/vendor-invoices/${id}`);
        fetchInvoices();
        setIsViewOpen(false);
        setSelected(null);
      } catch (e) {
        console.warn("Error deleting invoice, updating local state", e);
        setInvoices(prev => prev.filter(i => i.id !== id));
        setIsViewOpen(false);
        setSelected(null);
      }
    }
  };

  const handleStatusChange = async (id: number | string, newStatus: Invoice['status']) => {
    if (newStatus === 'Partially Paid') {
      const inv = invoices.find(i => i.id === id);
      if (!inv) return;
      setPaymentModal({ open: true, invoice: inv, inputValue: '', error: '' });
      return;
    }
    await applyStatusChange(id, newStatus, null);
  };

  const applyStatusChange = async (id: number | string, newStatus: Invoice['status'], partialAmount: number | null) => {
    try {
      const invToUpdate = invoices.find(i => i.id === id);
      if (!invToUpdate) return;

      let amountPaid = typeof invToUpdate.amountPaid === 'string' ? parseFloat(invToUpdate.amountPaid) : (invToUpdate.amountPaid || 0);
      let amountPending = invToUpdate.amountPending !== undefined
        ? (typeof invToUpdate.amountPending === 'string' ? parseFloat(invToUpdate.amountPending) : invToUpdate.amountPending)
        : (invToUpdate.amountValue || 0);
      let paymentHistory: any[] = [];

      try {
        if (invToUpdate.paymentHistory) paymentHistory = JSON.parse(invToUpdate.paymentHistory);
      } catch (_) { }

      if (newStatus === 'Partially Paid' && partialAmount !== null) {
        paymentHistory.push({
          date: new Date().toISOString().split('T')[0],
          amount: partialAmount,
          note: `Installment #${paymentHistory.length + 1}`
        });
        amountPaid = amountPaid + partialAmount;
        amountPending = (invToUpdate.amountValue || 0) - amountPaid;
        if (amountPending <= 0) { newStatus = 'Paid'; amountPending = 0; }
      } else if (newStatus === 'Paid') {
        const remaining = (invToUpdate.amountValue || 0) - amountPaid;
        if (remaining > 0) paymentHistory.push({ date: new Date().toISOString().split('T')[0], amount: remaining, note: 'Final payment' });
        amountPaid = (invToUpdate.amountValue || 0);
        amountPending = 0;
      }

      await rolesApi.put(`/api/vendor-invoices/${id}`, {
        ...invToUpdate,
        status: newStatus,
        amountPaid,
        amountPending,
        paymentHistory: JSON.stringify(paymentHistory)
      });

      await fetchInvoices();
      setSelected(prev => prev ? { ...prev, status: newStatus, amountPaid, amountPending, paymentHistory: JSON.stringify(paymentHistory) } : prev);
    } catch (e) { console.error('Error updating invoice status', e); }
  };

  const submitPayment = async () => {
    const { invoice, inputValue } = paymentModal;
    if (!invoice) return;
    const parsed = parseFloat(inputValue);
    const alreadyPaid = typeof invoice.amountPaid === 'string' ? parseFloat(invoice.amountPaid) : (invoice.amountPaid || 0);
    const totalValue = invoice.amountValue || 0;
    const remaining = totalValue - alreadyPaid;

    if (isNaN(parsed) || parsed <= 0) {
      setPaymentModal(p => ({ ...p, error: 'Please enter a valid positive amount.' }));
      return;
    }
    if (parsed > remaining + 0.001) {
      setPaymentModal(p => ({ ...p, error: `Cannot exceed remaining balance of $${remaining.toFixed(2)}.` }));
      return;
    }
    setPaymentModal({ open: false, invoice: null, inputValue: '', error: '' });
    await applyStatusChange(invoice.id, 'Partially Paid', parsed);
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    let createdId = null;

    try {
      const payload = {
        vendorId: newInvoice.vendorId,
        requirementId: newInvoice.requirementId || null,
        amount: newInvoice.amount,
        date: new Date().toISOString().split('T')[0],
        dueDate: newInvoice.dueDate || 'TBD',
        poRef: newInvoice.poRef || '—',
        status: 'Pending',
        notes: newInvoice.notes || '',
      };
      const res = await rolesApi.post('/api/vendor-invoices', payload);
      if (res.data?.data?.id) createdId = res.data.data.id;
    } catch (e) {
      console.error("Error creating invoice", e);
    }

    if (createdId && selectedFile) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await rolesApi.post(`/api/vendor-invoices/${createdId}/upload-receipt`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (uploadErr) {
        console.warn("Receipt upload failed (invoice still created):", uploadErr);
      }
    }

    fetchInvoices();
    setNewInvoice({ vendorId: '', amount: '', poRef: '', dueDate: '', notes: '', requirementId: '' });
    setSelectedFile(null);
    setIsUploadOpen(false);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvoice) return;
    try {
      await rolesApi.put(`/api/vendor-invoices/${editInvoice.id}`, editInvoice);
      fetchInvoices();
      setIsEditOpen(false);
      setEditInvoice(null);
    } catch (e) { console.error("Error editing invoice", e); }
  };

  const handleDownloadReceipt = async (id: number | string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      const response = await rolesApi.get(`/api/vendor-invoices/${id}/receipt`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      let filename = `receipt-${id}.pdf`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/['"]/g, '');
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Error downloading receipt", error);
      alert("Failed to download receipt. Please check permissions.");
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const searchLower = (searchQuery || '').toLowerCase();
    if (!searchLower) return true;
    return (inv.invoiceNumber || '').toLowerCase().includes(searchLower) ||
      (inv.vendorName || '').toLowerCase().includes(searchLower) ||
      (inv.status || '').toLowerCase().includes(searchLower);
  });

  const totalPaid = invoices.reduce((sum, i) => sum + (Number(i.amountPaid) || (i.status === 'Paid' ? (i.amountValue || 0) : 0)), 0);
  const totalPendingStr = invoices.reduce((sum, i) => sum + (i.amountPending !== undefined ? Number(i.amountPending) : (i.status === 'Paid' ? 0 : (i.amountValue || 0))), 0);
  const totalPending = totalPendingStr;
  const totalApproved = invoices.filter(i => i.status === 'Approved').reduce((sum, i) => sum + (i.amountPending !== undefined ? Number(i.amountPending) : (i.amountValue || 0)), 0);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const linkedRequirementIds = new Set(invoices.filter(i => i.requirementId).map(i => i.requirementId?.toString() || ''));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Invoices &amp; Payments</h2>
          <p className="text-muted-foreground text-sm mt-1">Track financial transactions and approvals</p>
        </div>
        <button onClick={() => setIsUploadOpen(true)} className="btn-primary flex items-center shrink-0 w-full sm:w-auto justify-center cursor-pointer">
          <Upload size={16} className="mr-2" /> Upload Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[
          { label: 'Total Paid (MTD)', value: formatCurrency(totalPaid), icon: DollarSign, color: 'text-emerald-500' },
          { label: 'Pending Approval', value: formatCurrency(totalPending), icon: FileText, color: 'text-amber-500' },
          { label: 'Approved, Unpaid', value: formatCurrency(totalApproved), icon: CheckCircle2, color: 'text-cyan-500' },
        ].map((c, i) => (
          <div key={i} className="bg-card border border-border shadow-sm rounded-xl p-5 border border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm mb-1">{c.label}</p>
                <h3 className="text-2xl font-bold text-foreground">{c.value}</h3>
              </div>
              <c.icon className={c.color} size={32} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-border/50 bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Invoice ID</th>
                <th className="p-4 font-medium">Vendor</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium hidden sm:table-cell">Due Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => {
                const s = statusStyle[inv.status] || statusStyle.Pending;
                return (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="p-4 font-mono text-sm text-cyan-600 dark:text-cyan-400">{inv.invoiceNumber}</td>
                    <td className="p-4 text-sm text-foreground">
                      <div>{inv.vendorName}</div>
                      {inv.requirementId && <div className="text-xs text-foreground0 mt-1">REQ-{inv.requirementId}</div>}
                    </td>
                    <td className="p-4 text-sm font-semibold text-foreground">
                      <div>{inv.amount}</div>
                      <div className="text-xs font-normal text-emerald-600 dark:text-emerald-400 mt-0.5">Paid: {formatCurrency(Number(inv.amountPaid) || 0)}</div>
                      <div className="text-xs font-normal text-amber-600 dark:text-amber-400 mt-0.5">Pending: {formatCurrency(inv.amountPending !== undefined ? Number(inv.amountPending) : (inv.amountValue || 0))}</div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell">{inv.dueDate}</td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.badge}`}>{inv.status}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {inv.receiptUrl && (
                          <button onClick={(e) => handleDownloadReceipt(inv.id, e as unknown as React.MouseEvent)} className="btn-icon text-cyan-600 dark:text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 cursor-pointer" title="Download Uploaded Receipt">
                            <Download size={16} />
                          </button>
                        )}
                        <button onClick={() => window.open(`/vendor/invoices/${inv.id}/receipt`, '_blank')} className="btn-icon text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 cursor-pointer" title="Generate Payment Receipt">
                          <FileText size={16} />
                        </button>
                        <button onClick={() => openView(inv)} className="btn-icon cursor-pointer" title="View details"><Eye size={16} /></button>
                        <button onClick={() => openEdit(inv)} className="btn-icon cursor-pointer" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(inv.id)} className="btn-icon text-rose-600 dark:text-rose-400 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No invoices found matching "{searchQuery}"</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Invoice Details">
        {selected && (() => {
          const s = statusStyle[selected.status] || statusStyle.Pending;
          return (
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 block mb-1">{selected.invoiceNumber}</span>
                  <h3 className="text-xl font-bold text-foreground">{selected.vendorName}</h3>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${s.badge}`}>{selected.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-foreground0 text-xs mb-0.5">Amount</p><p className="text-foreground font-bold text-lg">{selected.amount}</p></div>
                <div><p className="text-foreground0 text-xs mb-0.5">PO Reference</p><p className="text-foreground font-mono">{selected.poRef || '—'}</p></div>
                <div><p className="text-foreground0 text-xs mb-0.5">Invoice Date</p><p className="text-foreground">{selected.date}</p></div>
                <div><p className="text-foreground0 text-xs mb-0.5">Due Date</p><p className="text-foreground">{selected.dueDate}</p></div>
                <div><p className="text-foreground0 text-xs mb-0.5">Amount Paid</p><p className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(Number(selected.amountPaid) || 0)}</p></div>
                <div><p className="text-foreground0 text-xs mb-0.5">Amount Pending</p><p className="text-amber-600 dark:text-amber-400 font-semibold">{formatCurrency(selected.amountPending !== undefined ? Number(selected.amountPending) : (selected.amountValue || 0))}</p></div>
                {selected.requirementId && (
                  <div className="col-span-2">
                    <p className="text-foreground0 text-xs mb-0.5">Linked Requirement</p>
                    <p className="text-cyan-600 dark:text-cyan-400 font-mono bg-cyan-400/10 inline-block px-2 py-0.5 rounded border border-cyan-400/20">REQ-{selected.requirementId}</p>
                  </div>
                )}
              </div>

              {selected.notes && (
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <p className="text-xs text-foreground0 mb-1">Notes</p>
                  <p className="text-sm text-foreground font-medium">{selected.notes}</p>
                </div>
              )}

              {selected.paymentHistory && (() => {
                try {
                  const steps = JSON.parse(selected.paymentHistory);
                  if (!steps || steps.length === 0) return null;
                  return (
                    <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-3 pb-2">
                        Payment Installments ({steps.length})
                      </p>
                      <div className="divide-y divide-slate-700/40">
                        {steps.map((step: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">{idx + 1}</div>
                              <div>
                                <p className="text-xs text-foreground font-medium">{step.note}</p>
                                <p className="text-xs text-foreground0">{step.date}</p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(step.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch (_) { return null; }
              })()}

              {selected.receiptUrl && (
                <div className="mt-4">
                  <button onClick={(e) => handleDownloadReceipt(selected.id, e as unknown as React.MouseEvent)} className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer">
                    <Download size={16} /> Download Payment Receipt
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {(['Pending', 'Approved', 'Partially Paid', 'Paid', 'Rejected'] as Invoice['status'][])
                  .filter(st => st !== selected.status || st === 'Partially Paid')
                  .map(st => {
                    const isSame = st === selected.status;
                    const btnLabel = isSame ? 'Update Partial Payment' : `Mark as ${st}`;
                    return (
                      <button key={st + (isSame ? '-update' : '')} onClick={() => handleStatusChange(selected.id, st)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors cursor-pointer">
                        {btnLabel}
                      </button>
                    );
                  })}
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-border mt-4">
                <button onClick={() => handleDelete(selected.id)} className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-400/10 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                  <Trash2 size={15} /> Delete
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setIsViewOpen(false)} className="btn-secondary cursor-pointer">Close</button>
                  <button onClick={() => openEdit(selected)} className="btn-primary flex items-center gap-2 cursor-pointer"><Edit2 size={15} /> Edit</button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {editInvoice && (
        <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditInvoice(null); }} title="Edit Invoice">
          <form className="space-y-4" onSubmit={handleEditSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Vendor *</label>
                <select className="input-field text-foreground bg-background border-border" required value={editInvoice.vendorId} onChange={(e) => setEditInvoice({ ...editInvoice, vendorId: e.target.value })}>
                  <option value="" className="bg-background">Select Vendor...</option>
                  {vendors.map(v => <option key={v.id} value={v.id} className="bg-background">{v.vendorName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Amount</label>
                <input type="text" className="input-field" placeholder="$0" value={editInvoice.amount} onChange={(e) => setEditInvoice({ ...editInvoice, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground font-medium mb-1">PO Reference</label>
                <input type="text" className="input-field" value={editInvoice.poRef} onChange={(e) => setEditInvoice({ ...editInvoice, poRef: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Due Date</label>
                <input type="date" className="input-field text-foreground bg-background border-border" value={editInvoice.dueDate} onChange={(e) => setEditInvoice({ ...editInvoice, dueDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Status</label>
                <select className="input-field text-foreground bg-background border-border" value={editInvoice.status} onChange={(e) => setEditInvoice({ ...editInvoice, status: e.target.value as Invoice['status'] })}>
                  <option className="bg-background">Pending</option>
                  <option className="bg-background">Approved</option>
                  <option className="bg-background">Paid</option>
                  <option className="bg-background">Rejected</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Notes</label>
                <textarea rows={3} className="input-field resize-none" value={editInvoice.notes || ''} onChange={(e) => setEditInvoice({ ...editInvoice, notes: e.target.value })} />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
              <button type="button" onClick={() => { setIsEditOpen(false); setEditInvoice(null); }} className="btn-secondary cursor-pointer">Cancel</button>
              <button type="submit" className="btn-primary cursor-pointer">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      <Modal isOpen={isUploadOpen} onClose={() => { setIsUploadOpen(false); setSelectedFile(null); }} title="Upload Vendor Invoice">
        <form className="space-y-4" onSubmit={handleAddInvoice}>
          <div
            className="border-2 border-dashed border-border bg-muted/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-cyan-500/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
            {selectedFile ? (
              <>
                <div className="p-4 bg-emerald-500/10 rounded-full mb-3 text-emerald-600 dark:text-emerald-400"><FileText size={32} /></div>
                <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-foreground0 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <button type="button" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-300 text-xs mt-4 cursor-pointer">Change File</button>
              </>
            ) : (
              <>
                <div className="p-4 bg-muted rounded-full mb-3 text-cyan-600 dark:text-cyan-400"><FileUp size={32} /></div>
                <p className="text-sm font-medium text-foreground">Drag &amp; drop your invoice file here</p>
                <p className="text-xs text-foreground0 mt-1">Supports PDF, PNG, JPG (Max 10MB)</p>
                <button type="button" className="btn-secondary text-xs py-1.5 mt-4 cursor-pointer">Browse Files</button>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground font-medium mb-1">Select Vendor *</label>
              <select className="input-field text-foreground bg-background border-border" required value={newInvoice.vendorId} onChange={(e) => setNewInvoice({ ...newInvoice, vendorId: e.target.value, requirementId: '' })}>
                <option value="" className="bg-background">Select Vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id} className="bg-background">{v.vendorName}</option>)}
              </select>
            </div>
            {newInvoice.vendorId && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground font-medium mb-1">Link Requirement (Optional)</label>
                <select className="input-field text-foreground bg-background border-border" value={newInvoice.requirementId} onChange={(e) => setNewInvoice({ ...newInvoice, requirementId: e.target.value })}>
                  <option value="" className="bg-background">No specific requirement</option>
                  {requirements
                    .filter(req => req.vendor?.id?.toString() === newInvoice.vendorId.toString())
                    .filter(req => !linkedRequirementIds.has(req.id.toString()))
                    .map(req => (
                      <option key={req.id} value={req.id} className="bg-background">
                        REQ-{req.id} - {req.description?.substring(0, 40) || req.requirementType}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground font-medium mb-1">Invoice Amount *</label>
              <input type="number" step="0.01" className="input-field" placeholder="0.00" required value={newInvoice.amount} onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground font-medium mb-1">PO Reference</label>
              <input type="text" className="input-field" placeholder="PO-2024-xxx" value={newInvoice.poRef} onChange={(e) => setNewInvoice({ ...newInvoice, poRef: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground font-medium mb-1">Due Date</label>
              <input type="date" className="input-field text-foreground bg-background border-border" value={newInvoice.dueDate} onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground font-medium mb-1">Notes</label>
              <textarea rows={2} className="input-field resize-none" placeholder="Any additional notes..." value={newInvoice.notes} onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
            <button type="button" onClick={() => setIsUploadOpen(false)} className="btn-secondary cursor-pointer">Cancel</button>
            <button type="submit" className="btn-primary cursor-pointer">Submit Invoice</button>
          </div>
        </form>
      </Modal>

      {paymentModal.open && paymentModal.invoice && (() => {
        const inv = paymentModal.invoice;
        const alreadyPaid = typeof inv.amountPaid === 'string' ? parseFloat(inv.amountPaid) : (inv.amountPaid || 0);
        const total = inv.amountValue || 0;
        const remaining = total - alreadyPaid;
        const pct = total > 0 ? Math.min((alreadyPaid / total) * 100, 100) : 0;
        const inputAmt = parseFloat(paymentModal.inputValue) || 0;
        const afterPct = total > 0 ? Math.min(((alreadyPaid + inputAmt) / total) * 100, 100) : 0;
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setPaymentModal({ open: false, invoice: null, inputValue: '', error: '' })} />
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-card-foreground">Record Payment</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{inv.vendorName} · {inv.invoiceNumber}</p>
                </div>
                <button onClick={() => setPaymentModal({ open: false, invoice: null, inputValue: '', error: '' })} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none cursor-pointer">×</button>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Payment Progress</span>
                  <span>{pct.toFixed(0)}% paid</span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${afterPct}%`, background: afterPct >= 100 ? '#10b981' : 'linear-gradient(90deg,#10b981,#06b6d4)' }} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-muted-foreground">Invoice Total</p>
                    <p className="text-card-foreground font-semibold mt-0.5">{inv.amount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Already Paid</p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">{formatCurrency(alreadyPaid)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="text-amber-600 dark:text-amber-400 font-semibold mt-0.5">{formatCurrency(remaining)}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Payment Amount for This Installment
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={remaining}
                    autoFocus
                    placeholder="0.00"
                    className="input-field pl-7 w-full text-lg font-semibold"
                    value={paymentModal.inputValue}
                    onChange={e => {
                      const val = e.target.value;
                      const parsed = parseFloat(val);
                      if (!isNaN(parsed) && parsed > remaining) {
                        setPaymentModal(p => ({ ...p, inputValue: remaining.toFixed(2), error: `Capped at remaining balance: ${formatCurrency(remaining)}` }));
                      } else {
                        setPaymentModal(p => ({ ...p, inputValue: val, error: '' }));
                      }
                    }}
                    onKeyDown={e => e.key === 'Enter' && submitPayment()}
                  />
                </div>
                {paymentModal.error && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {paymentModal.error}
                  </p>
                )}
                {inputAmt > 0 && inputAmt <= remaining && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    After this payment: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(alreadyPaid + inputAmt)}</span> paid · <span className="text-amber-600 dark:text-amber-400 font-semibold">{formatCurrency(remaining - inputAmt)}</span> pending
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-1 mt-4">
                <button
                  type="button"
                  onClick={() => setPaymentModal({ open: false, invoice: null, inputValue: '', error: '' })}
                  className="btn-secondary flex-1 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitPayment}
                  disabled={!paymentModal.inputValue || parseFloat(paymentModal.inputValue) <= 0 || parseFloat(paymentModal.inputValue) > remaining}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all cursor-pointer ${!paymentModal.inputValue || parseFloat(paymentModal.inputValue) <= 0 || parseFloat(paymentModal.inputValue) > remaining
                    ? 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    }`}
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </motion.div>
  );
}