import React, { useState } from 'react';
import { Copy, Plus, Award, Mail, CheckCircle } from 'lucide-react';
import { useAffiliate } from '../context/AffiliateContext';

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="16" height="16">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="16" height="16">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="16" height="16">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="16" height="16">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const ReferralLinks: React.FC = () => {
  const { profile, links, createLink, loading } = useAffiliate();
  const [newLinkName, setNewLinkName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const referralCode = profile?.referralCode || 'SARAH50X';
  const mainReferralUrl = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkName.trim()) return;

    setCreating(true);
    try {
      await createLink(newLinkName);
      setNewLinkName('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const shareOnSocial = (platform: string) => {
    const message = encodeURIComponent(`Check out this amazing SaaS platform! Register using my link: ${mainReferralUrl}`);
    let url: string;

    switch (platform) {
      case 'Twitter':
        url = `https://twitter.com/intent/tweet?text=${message}`;
        break;
      case 'LinkedIn':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(mainReferralUrl)}`;
        break;
      case 'Facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(mainReferralUrl)}`;
        break;
      case 'WhatsApp':
        url = `https://wa.me/?text=${message}`;
        break;
      case 'Email':
        url = `mailto:?subject=${encodeURIComponent('Join SaaSPlatform')}&body=${message}`;
        break;
      default:
        return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading || !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Referral Links & Tools</h2>
        <p className="text-xs text-muted-foreground">
          Share your unique referral link and track your marketing campaign performance.
        </p>
      </div>

      {/* Main Referral Identity Card */}
      <div className="relative overflow-hidden bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Award size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Primary Referral Identity</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Your unique affiliate coordinate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Referral Code</label>
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-border font-mono text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {referralCode}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Default Registration Link</label>
                <div className="flex items-center gap-2 p-1.5 pl-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-border overflow-hidden">
                  <span className="text-xs font-semibold text-slate-500 truncate flex-1">{mainReferralUrl}</span>
                  <button 
                    onClick={() => handleCopy('main', mainReferralUrl)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-bold text-xs shadow-sm cursor-pointer"
                  >
                    {copiedId === 'main' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Quick Social Share</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                <button 
                  onClick={() => shareOnSocial('Twitter')}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <TwitterIcon />
                  <span className="text-[9px] font-bold">Twitter</span>
                </button>
                <button 
                  onClick={() => shareOnSocial('LinkedIn')}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 text-slate-850 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <LinkedInIcon />
                  <span className="text-[9px] font-bold">LinkedIn</span>
                </button>
                <button 
                  onClick={() => shareOnSocial('Facebook')}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 text-slate-850 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <FacebookIcon />
                  <span className="text-[9px] font-bold">Facebook</span>
                </button>
                <button 
                  onClick={() => shareOnSocial('WhatsApp')}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 text-slate-850 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <WhatsAppIcon />
                  <span className="text-[9px] font-bold">WhatsApp</span>
                </button>
                <button 
                  onClick={() => shareOnSocial('Email')}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 text-slate-850 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Mail size={16} />
                  <span className="text-[9px] font-bold">Email</span>
                </button>
              </div>
              <p className="text-[9px] text-muted-foreground font-medium italic text-center">
                * Sharing your link across multiple channels increases conversion by up to 40%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create campaign link */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-sm text-foreground">Generate Campaign Link</h3>
          <p className="text-[11px] text-muted-foreground">Create custom tracking links to split test campaigns or channels.</p>
        </div>

        <form onSubmit={handleCreateLink} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Campaign name (e.g. Summer Newsletter, Twitter post)..."
            value={newLinkName}
            onChange={(e) => setNewLinkName(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-border text-sm text-slate-850 dark:text-slate-200 focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-500/10"
          >
            <Plus size={16} />
            Generate Link
          </button>
        </form>
      </div>

      {/* Links List Panel */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-foreground">Tracking Channels Performance</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <th className="pb-3.5 pl-2">Campaign Channel</th>
                <th className="pb-3.5">Clicks</th>
                <th className="pb-3.5">Signups</th>
                <th className="pb-3.5">Conversions</th>
                <th className="pb-3.5">Rate</th>
                <th className="pb-3.5 text-right pr-2">Earnings</th>
                <th className="pb-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-4 pl-2">
                    <div>
                      <p className="font-bold text-foreground">{link.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-xs md:max-w-sm mt-0.5">{link.url}</p>
                    </div>
                  </td>
                  <td className="py-4 font-semibold text-slate-600 dark:text-slate-450">{link.clicks.toLocaleString()}</td>
                  <td className="py-4 font-semibold text-slate-600 dark:text-slate-450">{link.signups}</td>
                  <td className="py-4 font-semibold text-slate-650 dark:text-slate-450">{link.conversions}</td>
                  <td className="py-4 font-extrabold text-indigo-600 dark:text-indigo-400">{link.conversionRate}</td>
                  <td className="py-4 text-right font-black text-emerald-600 dark:text-emerald-400 pr-2">{formatCurrency(link.earnings)}</td>
                  <td className="py-4 text-right pr-2">
                    <button 
                      onClick={() => handleCopy(link.id, link.url)}
                      className="inline-flex items-center justify-center p-1.5 rounded-lg border border-border hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 dark:text-slate-550 hover:text-indigo-600 transition cursor-pointer"
                    >
                      {copiedId === link.id ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReferralLinks;




