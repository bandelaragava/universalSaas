import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, XCircle, ArrowUpRight, Printer, X } from 'lucide-react';
import { useAffiliate } from '../context/AffiliateContext';
import { PayoutTransaction } from '../types';

export const Payments: React.FC = () => {
  const { transactions, loading } = useAffiliate();
  const [selectedTx, setSelectedTx] = useState<PayoutTransaction | null>(null);

  const getStatusBadge = (status: PayoutTransaction['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 size={12} />
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertCircle size={12} />
            Pending
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400">
            <XCircle size={12} />
            Failed
          </span>
        );
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Payout Disbursements</h2>
        <p className="text-xs text-muted-foreground">
          Track and verify your commission disbursements directly to your bank account.
        </p>
      </div>

      {/* Payments History List */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <th className="pb-3.5 pl-2">Invoice Code</th>
                <th className="pb-3.5">Settlement Method</th>
                <th className="pb-3.5">Settlement Date</th>
                <th className="pb-3.5">Disbursement Status</th>
                <th className="pb-3.5 text-right">Disbursed Total</th>
                <th className="pb-3.5 pr-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-900/50">
              {transactions.map((pay) => (
                <tr
                  key={pay.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedTx(pay)}
                >
                  <td className="py-4 pl-2 font-mono text-xs font-bold text-slate-950 dark:text-slate-200">
                    {pay.invoiceNumber}
                  </td>
                  <td className="py-4 font-semibold text-slate-500 dark:text-slate-450">
                    {pay.method}
                  </td>
                  <td className="py-4 font-semibold text-muted-foreground">
                    {new Date(pay.date).toLocaleDateString()}
                  </td>
                  <td className="py-4">
                    {getStatusBadge(pay.status)}
                  </td>
                  <td className="py-4 text-right font-black text-slate-900 dark:text-white">
                    {formatCurrency(pay.amount)}
                  </td>
                  <td className="py-4 text-right pr-2">
                    <button className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition text-muted-foreground">
                      <ArrowUpRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No disbursement transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt details modal overlay */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 print:relative print:border-none print:shadow-none print:w-full">

            {/* Header controls (Hidden on print) */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 p-5 print:hidden">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Transaction Details</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-border bg-card text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
                >
                  <Printer size={14} />
                  Print
                </button>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Receipt layout */}
            <div className="p-6 md:p-8 space-y-6 bg-card text-foreground dark:bg-slate-900 dark:text-slate-100 print:p-0 print:bg-white print:text-slate-900">
              <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-base print:bg-indigo-600">
                      A
                    </div>
                    <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white print:text-slate-900">
                      Affiliate SaaS
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-400 leading-relaxed print:text-slate-500">
                    100 Pine Street, Suite 1200<br />
                    San Francisco, CA 94111<br />
                    billing@affiliatesaas.io
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <h4 className="text-lg font-black text-muted-foreground tracking-tight uppercase print:text-slate-400">Invoice Receipt</h4>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 print:text-slate-700">Invoice Ref: <span className="font-black text-slate-950 dark:text-slate-50 print:text-slate-950">{selectedTx.invoiceNumber}</span></p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 print:text-slate-700">Settled Date: <span className="font-black text-slate-950 dark:text-slate-50 print:text-slate-950">{new Date(selectedTx.date).toLocaleDateString()}</span></p>
                </div>
              </div>

              {/* Billing details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-muted-foreground print:text-slate-650">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Billed To</span>
                  <p className="font-bold text-slate-900 dark:text-slate-50 print:text-slate-900">Sarah Jenkins</p>
                  <p className="leading-relaxed">
                    500 Silicon Valley Blvd, Apt 4C<br />
                    San Jose, CA 95112<br />
                    sarah.jenkins@affiliate.io
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Disbursement Method</span>
                  <p className="font-bold text-slate-900 dark:text-slate-50 flex items-center gap-1.5 mt-0.5 print:text-slate-900">
                    <CreditCard size={14} className="text-slate-400" />
                    {selectedTx.method}
                  </p>
                  <p className="mt-1">
                    Status: <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">Paid / Cleared</span>
                  </p>
                </div>
              </div>

              {/* Line items table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <th className="pb-3 pl-2">Line Item Service Description</th>
                      <th className="pb-3 text-right">Unit Price</th>
                      <th className="pb-3 text-right">Quantity</th>
                      <th className="pb-3 text-right pr-2">Total Yield</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="text-slate-800 dark:text-slate-200 print:text-slate-800">
                      <td className="py-4 pl-2">
                        <p className="font-bold">{selectedTx.description}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">SaaS Referral subscription payout cycles</p>
                      </td>
                      <td className="py-4 text-right font-medium">{formatCurrency(selectedTx.amount)}</td>
                      <td className="py-4 text-right font-medium">1</td>
                      <td className="py-4 text-right font-black pr-2">{formatCurrency(selectedTx.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex flex-col items-end gap-2.5 pt-4 border-t border-border">
                <div className="w-full sm:w-64 space-y-2 text-xs font-bold text-muted-foreground print:text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-foreground print:text-slate-900">{formatCurrency(selectedTx.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Fee (0.00%)</span>
                    <span className="text-foreground print:text-slate-900">₹0.00</span>
                  </div>
                  <div className="border-t border-border my-1" />
                  <div className="flex justify-between text-sm font-black">
                    <span className="text-foreground print:text-slate-900">Total Paid Out</span>
                    <span className="text-indigo-600 dark:text-indigo-400 print:text-indigo-650">{formatCurrency(selectedTx.amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer controls */}
            <div className="bg-slate-50 dark:bg-background border-t border-slate-100 dark:border-slate-850 p-4 flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

