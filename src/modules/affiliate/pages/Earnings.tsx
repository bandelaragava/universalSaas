import React, { useState } from 'react';
import { DollarSign, Wallet, Calendar, AlertCircle, Search, FileText } from 'lucide-react';
import { useAffiliate } from '../context/AffiliateContext';

export const Earnings: React.FC = () => {
  const { stats, commissions, requestPayoutRelease, loading } = useAffiliate();
  const [search, setSearch] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handlePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayoutMessage({ type: 'error', text: 'Please enter a valid payout amount.' });
      return;
    }
    if (amt > (stats?.pending || 0)) {
      setPayoutMessage({ type: 'error', text: 'Amount exceeds your pending approval balance.' });
      return;
    }

    setPayoutLoading(true);
    setPayoutMessage(null);
    try {
      await requestPayoutRelease(amt);
      setPayoutMessage({ type: 'success', text: `Payout request of ${formatCurrency(amt)} submitted successfully!` });
      setPayoutAmount('');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setPayoutMessage({ type: 'error', text: errMsg || 'Failed to submit request.' });
    } finally {
      setPayoutLoading(false);
    }
  };

  const filteredHistory = commissions.filter(item => 
    item.referrer.toLowerCase().includes(search.toLowerCase()) ||
    item.type.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['Client Brand', 'Pricing Trigger', 'Rate Applied', 'Trigger Date', 'Commission Amount'];
    const rows = filteredHistory.map(item => [
      item.referrer,
      item.type,
      item.rate,
      new Date(item.date).toLocaleDateString(),
      item.amount
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `commission_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Earnings & Payout Ledger</h2>
        <p className="text-xs text-muted-foreground">
          Monitor your commissions, request payouts, and check your commission ledger details.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Total Earned</span>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.total)}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <DollarSign size={18} />
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Pending Approval</span>
            <h4 className="text-xl font-black text-slate-950 dark:text-white mt-1">{formatCurrency(stats.pending)}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertCircle size={18} />
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Paid Ledger Balance</span>
            <h4 className="text-xl font-black text-slate-950 dark:text-white mt-1">{formatCurrency(stats.paid)}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Wallet size={18} />
          </div>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Earned This Month</span>
            <h4 className="text-xl font-black text-slate-950 dark:text-white mt-1">{formatCurrency(stats.thisMonth)}</h4>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Calendar size={18} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payout Request Card */}
        <div className="lg:col-span-1 bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-sm text-foreground">Request Payout Release</h3>
            <p className="text-[11px] text-muted-foreground">Withdraw approved commission earnings to your bank account.</p>
          </div>

          <form onSubmit={handlePayoutRequest} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Withdrawal Amount (INR)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-border text-sm text-slate-850 dark:text-slate-200 focus:outline-none"
                  required
                />
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">₹</span>
              </div>
            </div>

            {payoutMessage && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                payoutMessage.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {payoutMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={payoutLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-500/10"
            >
              {payoutLoading ? 'Processing Withdrawal...' : 'Submit Payout Request'}
            </button>
          </form>
        </div>

        {/* Ledger table card */}
        <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="font-bold text-sm text-foreground">Commission Ledger Logs</h3>
              <p className="text-[11px] text-muted-foreground">Approved and pending subscription commissions</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-border bg-slate-50 dark:bg-slate-900 rounded-lg text-xs focus:outline-none text-slate-850 dark:text-slate-200"
                />
                <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>
              <button 
                onClick={exportCSV}
                className="inline-flex items-center justify-center p-1.5 border border-border rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <FileText size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <th className="pb-3.5 pl-2">Client Referrer</th>
                  <th className="pb-3.5">Trigger Event</th>
                  <th className="pb-3.5">Rate Applied</th>
                  <th className="pb-3.5">Event Date</th>
                  <th className="pb-3.5 text-right pr-2">Your Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-900/50">
                {filteredHistory.map((comm) => (
                  <tr key={comm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 pl-2 font-bold text-slate-950 dark:text-white">
                      {comm.referrer}
                    </td>
                    <td className="py-4 font-semibold text-muted-foreground">
                      {comm.type}
                    </td>
                    <td className="py-4 font-bold text-slate-900 dark:text-slate-150">
                      {comm.rate}
                    </td>
                    <td className="py-4 text-muted-foreground font-semibold">
                      {new Date(comm.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right font-black text-emerald-600 dark:text-emerald-400 pr-2">
                      {formatCurrency(comm.amount)}
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      No matching commission logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings;




