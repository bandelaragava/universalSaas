import React, { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';
import { CreditCard, CheckCircle2, AlertCircle, Clock, Zap, Shield, Crown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SubscriptionHistoryItem {
  id?: number;
  planName: string;
  amount: number;
  startDate: string;
  endDate: string;
  paymentReference: string;
  status: string;
  createdAt?: string;
}

function generatePaymentReference() {
  return 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function BillingPage() {
  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionHistoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);
      const res = await rolesApi.get('/api/subscriptions');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setHistory(data);
        if (data.length > 0) {
          // Assuming the first item is the active/latest subscription
          setCurrentPlan(data[0]);
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

  const plans = [
    { name: 'Starter', price: 99, days: 30, icon: <Zap className="w-6 h-6 text-yellow-400" />, features: ['Up to 10 Users', 'Basic Modules', 'Email Support'] },
    { name: 'Professional', price: 299, days: 30, icon: <Shield className="w-6 h-6 text-cyan-400" />, features: ['Up to 50 Users', 'All Modules', 'Priority Support', 'Custom Branding'] },
    { name: 'Enterprise', price: 999, days: 30, icon: <Crown className="w-6 h-6 text-purple-400" />, features: ['Unlimited Users', 'Dedicated Success Manager', '24/7 Phone Support', 'Custom Integrations'] }
  ];

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

      {/* Available Plans */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan?.planName.toLowerCase() === plan.name.toLowerCase();
            return (
              <div
                key={plan.name}
                className={`bg-card border ${isCurrent ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-border'
                  } rounded-xl p-6 flex flex-col relative overflow-hidden transition-all hover:-translate-y-0.5`}
              >
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-cyan-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    CURRENT
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-muted rounded-lg border border-border">
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">{plan.name}</h3>
                    <p className="text-xl font-extrabold text-foreground">
                      ${plan.price}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </p>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(plan.name, plan.price, plan.days)}
                  disabled={upgrading || isCurrent}
                  className={`w-full ${isCurrent
                      ? 'bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed border'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    }`}
                  size="sm"
                >
                  {upgrading ? 'Processing...' : (isCurrent ? 'Active Plan' : 'Upgrade')}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

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
                    <tr key={i} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 text-muted-foreground">
                        {invoice.createdAt?.split(' ')[0] || invoice.startDate}
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
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold hover:bg-emerald-500/10">
                          {invoice.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BillingPage;

