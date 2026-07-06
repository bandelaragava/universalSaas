import React, { useState, useEffect } from 'react';
import { getReferralCode, getReferralStats } from '@/services/marketing';
import { Link, Users, Info } from 'lucide-react';
import { usePermissions } from '@/auth/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ReferralStatType {
  id: string | number;
  refereeId: string | number;
  createdAt: string;
  status: string;
  referrerReward: number;
}

export default function ReferralHub() {
  const { user } = usePermissions();
  const learnerId = user?.id;
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStatType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferralData = async () => {
    if (!learnerId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const codeRes = await getReferralCode(learnerId);
      setReferralCode(codeRes?.data?.code || codeRes?.code || null);
      const statsRes = await getReferralStats(learnerId);
      const list = statsRes?.data || statsRes || [];
      setStats(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch referral data', err);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReferralData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerId]);

  const shareUrl = referralCode ? `${window.location.origin}/signup?ref=${referralCode}` : '';

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />
      </div>
    );
  }

  if (!learnerId) {
    return (
      <Card className="text-center border-dashed p-6">
        <CardContent className="space-y-4">
          <Info size={40} className="text-cyan-500 mx-auto opacity-70" />
          <h4 className="font-bold text-sm text-foreground">Sign in to view Referral Hub</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You need to be logged in as a student to share your referral link and earn credits.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-gradient-to-r from-cyan-900/40 via-indigo-950/40 to-slate-900 border-cyan-500/20 text-center overflow-hidden">
        <CardContent className="p-8 space-y-4">
          <h2 className="text-xl font-bold text-foreground">Refer & Earn Rewards!</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Share the love for learning and get rewarded. Your friends get credits, and you get bonuses on their first purchase!
          </p>

          {referralCode && (
            <div className="inline-block bg-slate-950 border border-cyan-500/30 rounded-lg px-6 py-2">
              <span className="text-cyan-400 font-extrabold text-lg tracking-wider uppercase">{referralCode}</span>
            </div>
          )}

          <div className="pt-2">
            <Button onClick={handleCopy} className="rounded-full px-6 font-bold flex items-center gap-2 mx-auto">
              <Link size={14} /> Copy Sharing Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Your Referral Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground space-y-2">
              <Users size={36} className="mx-auto opacity-30" />
              <p className="font-semibold text-xs">No referrals yet</p>
              <p className="text-[10px]">Start sharing to earn rewards!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b bg-slate-900/40 text-muted-foreground font-semibold">
                    <th className="px-6 py-3">Friend</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Your Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map(s => (
                    <tr key={s.id} className="border-b hover:bg-slate-900/10">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">User #{s.refereeId}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'REWARDED'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-500">
                        {s.status === 'REWARDED' ? `+₹${s.referrerReward}` : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-4 bg-cyan-950/20 border-t border-cyan-500/15 text-left flex gap-3 items-start">
            <Info className="text-cyan-400 shrink-0 mt-0.5" size={16} />
            <div>
              <h6 className="font-bold text-xs text-cyan-400">How it works?</h6>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                When they register with your link, they get 20 credits. When they complete their first enrollment, you get 50 credits in your wallet! Credits can be used for up to 10% of any course price.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


