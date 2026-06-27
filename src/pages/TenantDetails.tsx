import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Landmark, Layers, Users, ShieldAlert, BarChart3, Database, Mail, Phone, Calendar, Play, X, Printer, FileText, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import html2pdf from 'html2pdf.js';

import { AssignSubscriptionModal } from '@/components/shared/AssignSubscriptionModal';

interface Tenant {
  id: number;
  name: string;
  code: string;
  dbName: string;
  adminEmail: string | null;
  active: boolean;
  status?: string;
  superAdminName?: string;
  phone?: string;
  subscriptionType?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
}

interface TenantModule {
  moduleName: string;
  active: boolean;
  amount: number | null;
  paymentMethod: string;
  specialRequirements: string | null;
  extraCharges: number | null;
}

interface TenantDetailsProps {
  tenantId?: number | null;
  onClose?: () => void;
}

export default function TenantDetails({ tenantId, onClose }: TenantDetailsProps = {}) {
  const { id: paramId } = useParams<{ id: string }>();
  const activeId = tenantId !== undefined ? tenantId : (paramId ? Number(paramId) : null);
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [modules, setModules] = useState<TenantModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renewModalOpen, setRenewModalOpen] = useState(false);

  useEffect(() => {
    const fetchTenantData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [tenantRes, modulesRes] = await Promise.all([
          rolesApi.get<Tenant[]>('/tenants'),
          rolesApi.get<TenantModule[]>(`/tenants/${activeId}/modules`),
        ]);

        const found = (tenantRes.data || []).find((t) => t.id === Number(activeId));
        if (found) {
          setTenant(found);
        } else {
          setError('Tenant registry entry not found.');
        }

        if (modulesRes.data) {
          setModules(modulesRes.data);
        }
      } catch (err: unknown) {
        const axiosError = err as { message?: string };
        setError(axiosError.message || 'Failed to query tenant profiles.');
      } finally {
        setLoading(false);
      }
    };

    if (activeId) {
      fetchTenantData();
    }
  }, [activeId]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin text-indigo-500" />
        <div className="text-sm text-gray-500">Fetching workspace profile details...</div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className={onClose ? "w-full space-y-4" : "max-w-4xl mx-auto space-y-4"}>
        {!onClose && (
          <button
            type="button"
            onClick={() => navigate('/tenants')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tenants
          </button>
        )}
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl text-center">
          <ShieldAlert className="w-8 h-8 mx-auto mb-2" />
          <h4 className="font-bold">Error Displaying Profile</h4>
          <p className="text-xs mt-1">{error || 'Tenant workspace details could not be parsed.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={onClose ? "w-full" : "max-w-5xl mx-auto space-y-6"}>
      {/* Back navigation */}
      {!onClose && (
        <button
          type="button"
          onClick={() => navigate('/tenants')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tenants
        </button>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-full blur-2xl" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
              <Landmark className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">{tenant.name}</h1>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${tenant.active
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-red-50 text-red-600 border-red-200'
                    }`}
                >
                  {tenant.active ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-1 font-mono">
                Code ID: <span className="text-cyan-600 font-bold">{tenant.code}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">Account status:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
              {tenant.status || 'ACTIVE'}
            </span>
          </div>
        </div>

        <hr className="border-gray-100 my-5" />

        {/* Contact info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs relative z-10">
          <div className="flex items-start gap-2 text-gray-600">
            <Database className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Isolated Database</span>
              <span className="text-gray-800 font-mono font-medium">{tenant.dbName}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-gray-600">
            <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Admin Email</span>
              <span className="text-gray-800 font-medium break-all">{tenant.adminEmail || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-gray-600">
            <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Phone Contact</span>
              <span className="text-gray-800 font-medium">{tenant.phone || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Subscription Term</span>
              <span className="text-gray-800 font-medium">
                {tenant.subscriptionStartDate || '-'} to {tenant.subscriptionEndDate || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configured modules section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-full space-y-4">
            <h3 className="text-sm font-bold text-cyan-600 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" /> Subscription Module Mappings
            </h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Note: <strong>SYSTEM_ADMIN</strong> and <strong>EMPLOYEE</strong> are core service containers automatically provisioned on launch to guarantee baseline portal operation.
            </p>

            <hr className="border-gray-100" />

            <div className="space-y-3">
              {modules.length > 0 ? (
                modules.map((m) => (
                  <div
                    key={m.moduleName}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 transition-colors hover:bg-gray-100/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border ${m.active
                            ? 'bg-emerald-100 text-emerald-600 border-emerald-200'
                            : 'bg-gray-200 text-gray-500 border-gray-300'
                          }`}
                      >
                        {m.active ? <Play className="w-3 h-3 fill-emerald-500" /> : <X className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-sm font-bold ${m.active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                        {m.moduleName}
                      </span>
                    </div>

                    {m.active && (
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {m.amount !== null && (
                          <span>
                            License Fee: <strong className="text-gray-900">₹{m.amount}</strong>
                          </span>
                        )}
                        <span>
                          Method: <strong className="text-gray-700">{m.paymentMethod}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-xs py-2">No subscription modules detected.</div>
              )}
            </div>
          </div>
        </div>

        {/* Resources container block */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 h-full">
            <h3 className="text-sm font-bold text-cyan-600 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Live Resource Load
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold">User Seats</span>
                <span className="text-sm font-black text-gray-900 mt-1 block">—</span>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center">
                <Database className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold">DB Usage</span>
                <span className="text-sm font-black text-gray-900 mt-1 block">—</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl space-y-3 text-xs text-gray-600 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Billing Status:</span>
                <span className="text-gray-900 font-bold px-2 py-0.5 bg-gray-200 rounded text-[10px] uppercase">—</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">API Calls:</span>
                <span className="text-gray-900 font-bold">—</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Data Logs:</span>
                <span className="text-gray-900 font-bold">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INVOICE HISTORY SECTION */}
      <div id="invoice-history-section" className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <h3 className="text-sm font-bold text-cyan-600 uppercase tracking-wider flex items-center gap-2">
            <Landmark className="w-4 h-4" /> Invoice & Billing History
          </h3>
          <button
            onClick={() => setRenewModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg uppercase transition-colors shadow-sm"
          >
            Renew Subscription
          </button>
        </div>

        <InvoiceHistory tenantId={Number(activeId)} tenant={tenant} />
      </div>

      {renewModalOpen && tenant && (
        <AssignSubscriptionModal
          isOpen={true}
          onClose={() => setRenewModalOpen(false)}
          tenantId={tenant.id}
          tenantName={tenant.name}
          onSuccess={() => {
            setRenewModalOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// INVOICE HISTORY COMPONENT
function InvoiceHistory({ tenantId, tenant }: { tenantId: number, tenant: any }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [installments, setInstallments] = useState<any[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);

  const fetchInvoices = () => {
    rolesApi.get(`/tenants/${tenantId}/invoices`)
      .then(res => setInvoices(res.data))
      .catch(err => console.error("Failed to load invoices", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
    rolesApi.get('/company-profile')
      .then(res => setCompany(res.data))
      .catch(err => console.error("Failed to fetch company profile", err));
  }, [tenantId]);

  const toggleExpand = async (invoiceId: number) => {
    if (expandedId === invoiceId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(invoiceId);
    setLoadingInstallments(true);
    try {
      const res = await rolesApi.get(`/tenants/${tenantId}/invoices/${invoiceId}/installments`);
      setInstallments(res.data);
    } catch (error) {
      console.error("Failed to load installments", error);
    } finally {
      setLoadingInstallments(false);
    }
  };

  const handlePayInstallment = async (invoiceId: number, installmentId: number) => {
    try {
      await rolesApi.put(`/tenants/${tenantId}/invoices/${invoiceId}/installments/${installmentId}/pay`);
      // Refresh installments and invoices
      const res = await rolesApi.get(`/tenants/${tenantId}/invoices/${invoiceId}/installments`);
      setInstallments(res.data);
      fetchInvoices();
    } catch (error) {
      console.error("Failed to pay installment", error);
      alert("Failed to pay installment");
    }
  };

  if (loading) return <div className="text-sm text-gray-500 py-6 text-center font-medium">Loading invoices...</div>;

  if (invoices.length === 0) {
    return <div className="text-sm text-gray-500 py-6 text-center bg-gray-50 rounded-lg border border-gray-100 border-dashed">No invoices generated yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="text-[10px] uppercase bg-gray-50 text-gray-500 border-y border-gray-200 font-bold">
          <tr>
            <th className="px-4 py-3">Invoice No</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3 text-right">Total Amount</th>
            <th className="px-4 py-3 text-right">Pending</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoices.map((inv) => (
            <React.Fragment key={inv.id}>
              <tr
                onClick={() => toggleExpand(inv.id)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-4 font-mono font-medium text-cyan-700">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{expandedId === inv.id ? '▼' : '▶'}</span>
                    {inv.invoiceNumber}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">{inv.invoiceType}</span>
                </td>
                <td className="px-4 py-4 text-gray-500 text-xs font-medium">{inv.invoiceDate}</td>
                <td className="px-4 py-4 font-semibold text-gray-700 text-xs">{inv.paymentType}</td>
                <td className="px-4 py-4 text-right font-bold text-gray-900">₹{inv.totalAmount}</td>
                <td className="px-4 py-4 text-right font-bold text-red-600">₹{inv.pendingAmount}</td>
                <td className="px-4 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setViewInvoice(inv);
                      try {
                        const res = await rolesApi.get(`/tenants/${tenantId}/invoices/${inv.id}/items`);
                        setInvoiceItems(res.data);
                      } catch (err) {
                        console.error("Failed to fetch items", err);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> View
                  </button>
                </td>
              </tr>
              {expandedId === inv.id && (
                <tr>
                  <td colSpan={8} className="px-0 py-0 bg-gray-50/80 border-b border-gray-200">
                    <div className="p-5 pl-10 border-l-4 border-indigo-200">
                      <h4 className="text-xs uppercase font-bold text-gray-500 mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Installment Schedule
                      </h4>
                      {loadingInstallments ? (
                        <div className="text-sm text-gray-500 font-medium">Loading schedule...</div>
                      ) : installments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {installments.map(inst => (
                            <div key={inst.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="text-sm font-bold text-gray-900">Installment #{inst.installmentNo}</div>
                                  <div className="text-xs text-gray-500 font-medium mt-0.5">Due: {inst.dueDate}</div>
                                </div>
                                <div className="text-lg font-black text-gray-900">₹{inst.amount}</div>
                              </div>
                              <div className="pt-3 border-t border-gray-100 flex justify-end">
                                {inst.paid ? (
                                  <span className="px-3 py-1 rounded-md text-xs font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 w-full text-center">Paid Successfully</span>
                                ) : (
                                  <button
                                    onClick={() => handlePayInstallment(inv.id, inst.id)}
                                    className="px-4 py-1.5 rounded-md text-xs font-bold uppercase bg-gray-900 hover:bg-gray-800 text-white transition-colors w-full"
                                  >
                                    Pay Now
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 bg-white p-4 rounded border border-gray-200 border-dashed">No installments found for this invoice.</div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* INVOICE MODAL */}
      {viewInvoice && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-gray-100 overflow-y-auto">
          <div className="max-w-4xl w-full mx-auto my-8 bg-white text-black rounded-xl shadow-2xl flex flex-col min-h-full border border-gray-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" /> Invoice Document</h2>
              <button onClick={() => setViewInvoice(null)} className="text-gray-500 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-10 overflow-y-auto flex-1 font-sans relative bg-white" id="tenant-invoice-print">
              {/* WATERMARK */}
              {viewInvoice.status === 'Paid' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
                  <span className="text-[180px] font-black text-emerald-500 opacity-5 -rotate-45 select-none">
                    PAID
                  </span>
                </div>
              )}

              <div className="relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-900">
                  <div>
                    {company?.logoUrl && <img src={company.logoUrl} alt="Logo" className="h-14 mb-4 object-contain" />}
                    <h1 className="text-4xl font-black uppercase text-gray-900 tracking-widest mb-1">INVOICE</h1>
                    <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-700">
                      <span className="font-bold text-gray-500 uppercase">Invoice No</span>
                      <span className="font-bold text-gray-900">: {viewInvoice.invoiceNumber}</span>
                      <span className="font-bold text-gray-500 uppercase">Invoice Date</span>
                      <span className="font-bold text-gray-900">: {viewInvoice.invoiceDate}</span>
                      <span className="font-bold text-gray-500 uppercase">Due Date</span>
                      <span className="font-bold text-gray-900">: {viewInvoice.dueDate || 'N/A'}</span>
                      <span className="font-bold text-gray-500 uppercase mt-2">Payment Status</span>
                      <div className="mt-2 flex items-center gap-2">
                        <span>:</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-black uppercase ${viewInvoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {viewInvoice.status === 'Paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          {viewInvoice.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg mb-2">
                      {/* Placeholder for QR Code */}
                      <QrCode className="w-20 h-20 text-gray-800" strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Scan to Verify</span>
                  </div>
                </div>

                {/* Billed From / Billed To */}
                <div className="grid grid-cols-2 gap-10 mb-8">
                  {/* Billed From */}
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Billed From</h3>
                    <h4 className="text-lg font-black text-gray-900 mb-2">{company?.companyName || 'GYANTRIX TECHNOLOGIES PRIVATE LIMITED'}</h4>
                    <div className="text-sm text-gray-600 grid grid-cols-[80px_1fr] gap-y-1">
                      <span className="font-semibold text-gray-500">GSTIN</span>
                      <span className="text-gray-900">: {company?.gstNumber || '36ABCDE1234F1Z5'}</span>
                      <span className="font-semibold text-gray-500">Email</span>
                      <span className="text-gray-900">: {company?.email || 'billing@gyantrix.com'}</span>
                      <span className="font-semibold text-gray-500">Phone</span>
                      <span className="text-gray-900">: {company?.phone || '+91 9876543210'}</span>
                      <span className="font-semibold text-gray-500">Address</span>
                      <span className="text-gray-900">: {company?.addressLine1 || 'Hyderabad, Telangana, India'}</span>
                    </div>
                  </div>

                  {/* Billed To */}
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Billed To</h3>
                    <h4 className="text-lg font-black text-gray-900 mb-2">{tenant?.name || 'Tenant Name'}</h4>
                    <div className="text-sm text-gray-600 grid grid-cols-[80px_1fr] gap-y-1">
                      <span className="font-semibold text-gray-500">Tenant Code</span>
                      <span className="text-gray-900 font-bold">: {tenant?.code || 'TENANT'}</span>
                      <span className="font-semibold text-gray-500">Email</span>
                      <span className="text-gray-900">: {tenant?.adminEmail || 'N/A'}</span>
                      <span className="font-semibold text-gray-500">Phone</span>
                      <span className="text-gray-900">: {tenant?.phone || 'N/A'}</span>
                      <span className="font-semibold text-gray-500">Address</span>
                      <span className="text-gray-900">: {tenant?.dbName || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                <div className="mb-8">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Subscription Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subscription Type</span>
                      <span className="font-bold text-gray-900">{viewInvoice.invoiceType?.replace('_', ' ') || 'New Subscription'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Plan Name</span>
                      <span className="font-bold text-gray-900">{viewInvoice.paymentType === 'INSTALLMENT' ? 'Installment Plan' : 'Professional Plan'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Date</span>
                      <span className="font-bold text-gray-900">{tenant?.subscriptionStartDate || viewInvoice.invoiceDate}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">End Date</span>
                      <span className="font-bold text-gray-900">{tenant?.subscriptionEndDate || viewInvoice.dueDate}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Items</h3>
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-900 text-white font-bold text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Description</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 border-b-2 border-gray-900">
                      {invoiceItems && invoiceItems.length > 0 ? (
                        invoiceItems.map((item, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="px-4 py-4">
                              <div className="font-black text-gray-900 text-base">{item.moduleName}</div>
                              {item.extraCharges > 0 && <div className="text-xs font-medium text-gray-500 mt-0.5">Includes Extra Charges: ₹{item.extraCharges}</div>}
                            </td>
                            <td className="px-4 py-4 text-center text-gray-600 font-bold">1</td>
                            <td className="px-4 py-4 text-right font-black text-gray-900 text-base">₹{(item.amount || 0) + (item.extraCharges || 0)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="bg-white">
                          <td className="px-4 py-4">
                            <div className="font-black text-gray-900 text-base">Subscription Charges</div>
                            <div className="text-xs text-gray-500 mt-0.5">Software as a Service Access & Usage</div>
                          </td>
                          <td className="px-4 py-4 text-center text-gray-600 font-bold">1</td>
                          <td className="px-4 py-4 text-right font-black text-gray-900 text-base">₹{viewInvoice.subtotal || viewInvoice.totalAmount}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary & Payment Info */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
                  <div className="w-full md:w-1/2">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Payment Details</h3>
                    <div className="text-sm grid grid-cols-[120px_1fr] gap-y-2 mt-3">
                      <span className="font-semibold text-gray-500">Payment Method</span>
                      <span className="font-bold text-gray-900">: {viewInvoice.paymentType === 'INSTALLMENT' ? 'Instalment/Card' : 'UPI/Bank Transfer'}</span>
                      <span className="font-semibold text-gray-500">Transaction ID</span>
                      <span className="font-bold text-gray-900 font-mono">: {`TXN${Math.floor(Date.now() / 1000)}${viewInvoice.id}`}</span>
                    </div>
                  </div>

                  <div className="w-full md:w-80">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-gray-600 px-2">
                        <span className="font-bold uppercase tracking-wider text-xs">Subtotal</span>
                        <span className="font-black text-gray-900">₹{viewInvoice.subtotal || viewInvoice.totalAmount}</span>
                      </div>
                      {(viewInvoice.gstAmount !== undefined && viewInvoice.gstAmount !== null) && (
                        <div className="flex justify-between text-gray-600 px-2">
                          <span className="font-bold uppercase tracking-wider text-xs">GST (18%)</span>
                          <span className="font-black text-gray-900">₹{viewInvoice.gstAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-gray-900 pt-3 border-t-2 border-gray-900 mt-3 px-2">
                        <span className="font-black uppercase tracking-wider">Total Amount</span>
                        <span className="font-black text-xl">₹{viewInvoice.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes & Footer */}
                <div className="border-t-2 border-gray-900 pt-6 flex justify-between items-end">
                  <div className="w-full md:w-2/3">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Notes</h3>
                    <div className="text-xs text-gray-600 font-medium space-y-1">
                      <p>Thank you for your subscription.</p>
                      <p>This is a computer-generated invoice and does not require a signature.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {company?.signatureUrl && <img src={company.signatureUrl} alt="Signature" className="h-16 ml-auto mb-2 object-contain mix-blend-multiply" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-4 rounded-b-xl shadow-sm z-20">
              <button
                onClick={() => setViewInvoice(null)}
                className="px-6 py-2.5 rounded-lg font-bold text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('tenant-invoice-print');
                  if (element) {
                    const opt = {
                      margin: 0.5,
                      filename: `Invoice_${viewInvoice.invoiceNumber}.pdf`,
                      image: { type: 'jpeg' as const, quality: 0.98 },
                      html2canvas: { scale: 2 },
                      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
                    };
                    html2pdf().set(opt).from(element).save();
                  }
                }}
                className="px-6 py-2.5 rounded-lg font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}