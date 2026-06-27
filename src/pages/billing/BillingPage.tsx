import React, { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';
import { CreditCard, CheckCircle2, AlertCircle, Clock, Zap, Shield, Crown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/AuthContext';
import { X, Printer, Share2, QrCode, FileText } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface SubscriptionHistoryItem {
  id?: number;
  planName: string;
  amount: number;
  startDate: string;
  endDate: string;
  paymentReference: string;
  status: string;
  createdAt?: string;
  rawInvoice?: any;
}

function generatePaymentReference() {
  return 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function BillingPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionHistoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [installments, setInstallments] = useState<any[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);

  useEffect(() => {
    if (viewInvoice && viewInvoice.id && user?.tenantId) {
      rolesApi.get(`/tenants/${user.tenantId}/invoices/${viewInvoice.id}/items`)
        .then(res => setInvoiceItems(res.data))
        .catch(err => console.error('Failed to load invoice items', err));
    } else {
      setInvoiceItems([]);
    }
  }, [viewInvoice, user?.tenantId]);

  useEffect(() => {
    const fetchContextData = async () => {
      try {
        const [compRes, tenRes] = await Promise.all([
          rolesApi.get('/company-profile').catch(() => null),
          user?.tenantId ? rolesApi.get(`/tenants/${user.tenantId}`).catch(() => null) : Promise.resolve(null)
        ]);
        if (compRes?.data) setCompany(compRes.data);
        if (tenRes?.data) setTenant(tenRes.data);
      } catch (err) {
        console.error('Error fetching context data', err);
      }
    };
    fetchContextData();
  }, [user]);

  const fetchHistory = async (showLoader = false) => {
    if (!user?.tenantId) return;
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);
      const res = await rolesApi.get(`/tenants/${user.tenantId}/invoices`);
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        const mappedData = data.map((inv: any) => ({
          id: inv.id,
          planName: inv.invoiceType || 'SUBSCRIPTION',
          amount: inv.totalAmount || 0,
          startDate: inv.invoiceDate,
          endDate: inv.dueDate,
          paymentReference: inv.invoiceNumber,
          status: inv.status,
          createdAt: inv.createdAt,
          rawInvoice: inv
        }));
        setHistory(mappedData);
        if (mappedData.length > 0) {
          setCurrentPlan(mappedData[0]);
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching subscription history', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to load subscription history';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleUpgrade = async (planName: string, amount: number, durationDays: number) => {
    try {
      setUpgrading(true);
      const req = {
        planName,
        amount,
        durationDays,
        paymentReference: generatePaymentReference(),
      };

      await rolesApi.post('/api/subscriptions', req);
      alert('Subscription upgraded successfully!');
      fetchHistory(true);
    } catch (err: unknown) {
      console.error('Error upgrading subscription', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to upgrade subscription';
      alert(errMsg);
    } finally {
      setUpgrading(false);
    }
  };

  const toggleExpand = async (invoiceId: number) => {
    if (expandedId === invoiceId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(invoiceId);
    setLoadingInstallments(true);
    try {
      const res = await rolesApi.get(`/tenants/${user?.tenantId}/invoices/${invoiceId}/installments`);
      setInstallments(res.data);
    } catch (error) {
      console.error("Failed to load installments", error);
    } finally {
      setLoadingInstallments(false);
    }
  };

  const handlePayInstallment = async (invoiceId: number, installmentId: number) => {
    try {
      await rolesApi.put(`/tenants/${user?.tenantId}/invoices/${invoiceId}/installments/${installmentId}/pay`);
      const res = await rolesApi.get(`/tenants/${user?.tenantId}/invoices/${invoiceId}/installments`);
      setInstallments(res.data);
      fetchHistory(true);
    } catch (error) {
      console.error("Failed to pay installment", error);
      alert("Failed to pay installment");
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-500" />
            Billing & Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your workspace plan and billing history.</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 py-2 px-3 text-sm rounded-lg flex items-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="text-sm text-muted-foreground">Loading active plan...</div>
            </div>
          ) : currentPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-muted/40 p-4 rounded-lg border border-border">
                <p className="text-muted-foreground text-xs mb-1">Active Plan</p>
                <p className="text-lg font-bold text-cyan-500">{currentPlan.planName}</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg border border-border">
                <p className="text-muted-foreground text-xs mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500 text-sm font-semibold">{currentPlan.status}</span>
                </div>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg border border-border">
                <p className="text-muted-foreground text-xs mb-1">Renewal Date</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-foreground">{currentPlan.endDate}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-amber-500 bg-amber-500/10 p-4 rounded-lg border border-amber-500/20 text-sm">
              <AlertCircle className="w-4 h-4" />
              <p>You are currently on a Free Trial or no active plan is detected.</p>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Plan</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Period</th>
                  <th className="p-4 font-semibold">Reference</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Loading history...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No billing history found.
                    </td>
                  </tr>
                ) : (
                  history.map((invoice, i) => (
                    <React.Fragment key={i}>
                      <tr className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => toggleExpand(invoice.id!)}>
                        <td className="p-4 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">{expandedId === invoice.id ? '▼' : '▶'}</span>
                            {invoice.createdAt?.split(' ')[0] || invoice.startDate}
                          </div>
                        </td>
                        <td className="p-4 text-foreground font-semibold">
                          {invoice.planName}
                        </td>
                        <td className="p-4 text-foreground font-medium">
                          ${invoice.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {invoice.startDate} to {invoice.endDate}
                        </td>
                        <td className="p-4 font-mono text-muted-foreground">
                          {invoice.paymentReference}
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className={`font-semibold ${invoice.status === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10'
                            }`}>
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {invoice.status !== 'Paid' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => toggleExpand(invoice.id!)}>
                                Pay Now
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs"
                              onClick={() => setViewInvoice(invoice.rawInvoice)}
                            >
                              View Invoice
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === invoice.id && (
                        <tr>
                          <td colSpan={7} className="px-0 py-0 bg-muted/5 border-b border-border">
                            <div className="p-5 pl-10 border-l-4 border-indigo-200">
                              <h4 className="text-xs uppercase font-bold text-muted-foreground mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Installment Schedule
                              </h4>
                              {loadingInstallments ? (
                                <div className="text-sm text-muted-foreground font-medium">Loading schedule...</div>
                              ) : installments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {installments.map(inst => (
                                    <div key={inst.id} className="bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col justify-between">
                                      <div className="flex justify-between items-start mb-3">
                                        <div>
                                          <div className="text-sm font-bold text-foreground">Installment #{inst.installmentNo}</div>
                                          <div className="text-xs text-muted-foreground font-medium mt-0.5">Due: {inst.dueDate}</div>
                                        </div>
                                        <div className="text-lg font-black text-foreground">₹{inst.amount}</div>
                                      </div>
                                      <div className="pt-3 border-t border-border flex justify-end">
                                        {inst.paid ? (
                                          <span className="px-3 py-1 rounded-md text-xs font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 w-full text-center">Paid Successfully</span>
                                        ) : (
                                          <Button
                                            size="sm"
                                            onClick={() => handlePayInstallment(invoice.id!, inst.id)}
                                            className="w-full h-8 text-xs font-bold uppercase"
                                          >
                                            Pay Installment
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground bg-card p-4 rounded border border-border border-dashed">No installments found for this invoice.</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Modal Overlay */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Subscription Invoice
              </h2>
              <button onClick={() => setViewInvoice(null)} className="text-gray-500 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-10 overflow-y-auto flex-1 font-sans relative bg-white" id="tenant-invoice-print">
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
                    <div className="mt-4 grid grid-cols-[120px_1fr] gap-y-2 text-sm text-gray-700">
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
                      <QrCode className="w-20 h-20 text-gray-800" strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Scan to Verify</span>
                  </div>
                </div>

                {/* Billed From / Billed To */}
                <div className="grid grid-cols-2 gap-10 mb-8">
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Billed From</h3>
                    <h4 className="text-lg font-black text-gray-900 mb-2">{company?.companyName || 'SYSTEM ADMINISTRATION'}</h4>
                    <div className="text-sm text-gray-600 grid grid-cols-[80px_1fr] gap-y-1">
                      <span className="font-semibold text-gray-500">GSTIN</span>
                      <span className="text-gray-900">: {company?.gstNumber || 'N/A'}</span>
                      <span className="font-semibold text-gray-500">Email</span>
                      <span className="text-gray-900">: {company?.email || 'billing@example.com'}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Billed To</h3>
                    <h4 className="text-lg font-black text-gray-900 mb-2">{tenant?.name || 'Tenant Name'}</h4>
                    <div className="text-sm text-gray-600 grid grid-cols-[80px_1fr] gap-y-1">
                      <span className="font-semibold text-gray-500">Code</span>
                      <span className="text-gray-900 font-bold">: {tenant?.code || 'TENANT'}</span>
                      <span className="font-semibold text-gray-500">Email</span>
                      <span className="text-gray-900">: {tenant?.adminEmail || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subscription Type</span>
                    <span className="font-bold text-gray-900">{viewInvoice.invoiceType?.replace('_', ' ') || 'Subscription'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Plan Name</span>
                    <span className="font-bold text-gray-900">{viewInvoice.paymentType === 'INSTALLMENT' ? 'Installment Plan' : 'Professional Plan'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Date</span>
                    <span className="font-bold text-gray-900">{viewInvoice.invoiceDate}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">End Date</span>
                    <span className="font-bold text-gray-900">{viewInvoice.dueDate}</span>
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
                            <td className="px-4 py-4 text-center text-gray-600 font-bold">{item.quantity || 1}</td>
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
                          <td className="px-4 py-4 text-right font-black text-gray-900 text-base">₹{viewInvoice.totalAmount}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary & Payment Info */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 pt-6 border-t-2 border-gray-900">
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
                        <span className="font-black text-xl text-indigo-700">₹{viewInvoice.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <Button variant="outline" onClick={() => setViewInvoice(null)}>Close</Button>
              <Button onClick={() => {
                const el = document.getElementById('tenant-invoice-print');
                if (el) html2pdf().set({ margin: 0.5, filename: `Invoice_${viewInvoice.invoiceNumber}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } }).from(el).save();
              }}>
                <Printer className="w-4 h-4 mr-2" /> Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingPage;

