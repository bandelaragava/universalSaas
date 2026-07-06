import React, { useState, useRef, useEffect } from 'react';
import { User, Award, Save, Phone, MapPin, Camera, Landmark, Check } from 'lucide-react';
import { useAffiliate } from '../context/AffiliateContext';

interface DetailItemProps {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, icon: Icon }) => (
  <div className="flex flex-col gap-1 text-left items-start w-full">
    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
    <div className="flex items-start gap-2.5 w-full">
      {Icon && <Icon className="text-muted-foreground mt-0.5 flex-shrink-0" size={16} />}
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-350 break-words leading-relaxed">{value || 'Not provided'}</span>
    </div>
  </div>
);

export const AffiliateProfile: React.FC = () => {
  const { profile, updateProfileDetails, loading } = useAffiliate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
  });

  // Payment Form state
  const [paymentForm, setPaymentForm] = useState({
    bankName: '',
    accountNumber: '',
    upiId: '',
    payoutMethod: 'ACH/Direct Deposit'
  });

  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        avatar: profile.avatar || '',
      });
      setPaymentForm({
        bankName: profile.bankDetails?.bankName || '',
        accountNumber: profile.bankDetails?.accountNumber || '',
        upiId: profile.upiId || '',
        payoutMethod: profile.bankDetails?.payoutMethod || 'ACH/Direct Deposit'
      });
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setMessage(null);
    try {
      await updateProfileDetails({
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        address: profileForm.address,
        avatar: profileForm.avatar,
      });
      setMessage({ type: 'success', text: 'Personal details updated successfully!' });
      setIsEditingProfile(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update personal details.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingPayment(true);
    setMessage(null);
    try {
      await updateProfileDetails({
        bankDetails: {
          holderName: profileForm.name,
          bankName: paymentForm.bankName,
          accountNumber: paymentForm.accountNumber,
          payoutMethod: paymentForm.payoutMethod,
        },
        upiId: paymentForm.upiId,
      });
      setMessage({ type: 'success', text: 'Payment details saved successfully!' });
      setIsEditingPayment(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update payment details.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, avatar: reader.result as string }));
        updateProfileDetails({ avatar: reader.result as string })
          .then(() => setMessage({ type: 'success', text: 'Profile avatar updated!' }))
          .catch(() => setMessage({ type: 'error', text: 'Failed to update avatar.' }));
      };
      reader.readAsDataURL(file);
    }
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
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Affiliate Profile Management</h2>
          <p className="text-xs text-muted-foreground">
            Review your personal information, payout methods, and program details.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 w-fit">
          <Award size={14} />
          Platinum Elite Tier (20%)
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col items-center text-center gap-5 shadow-sm">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              {profileForm.avatar ? (
                <img 
                  src={profileForm.avatar} 
                  alt={profileForm.name} 
                  className="w-24 h-24 rounded-full border-4 border-indigo-500/10 object-cover shadow-md transition group-hover:scale-[1.02]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-indigo-500/10 bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-muted-foreground shadow-md transition group-hover:scale-[1.02]">
                  <User size={32} />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>
            
            <div>
              <h3 className="text-base font-bold text-slate-850 dark:text-white">{profileForm.name}</h3>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">{profileForm.email}</p>
            </div>

            <div className="w-full pt-4 border-t border-border space-y-4">
              <DetailItem label="Referral Code" value={profile.referralCode || ''} icon={Award} />
              <DetailItem label="Phone" value={profileForm.phone} icon={Phone} />
              <DetailItem label="Address" value={profileForm.address} icon={MapPin} />
            </div>
          </div>

          {/* Quick Balance Panel */}
          <div className="bg-card text-foreground p-6 rounded-2xl overflow-hidden relative border border-border shadow-lg">
            <div className="relative z-10">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider block">Available Balance</span>
              <h4 className="text-2xl font-black mt-1">{formatCurrency(profile.earnings.pending)}</h4>
              <p className="text-muted-foreground/75 text-[9px] mt-4 font-medium italic">* Settled automatically via your default payout configuration.</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Edit Forms Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form 1: Personal Details */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <User size={16} />
                </div>
                <h3 className="font-bold text-sm text-foreground">Personal Account Details</h3>
              </div>
              {!isEditingProfile && (
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Edit Details
                </button>
              )}
            </div>

            {!isEditingProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DetailItem label="Full Name" value={profileForm.name} />
                <DetailItem label="Email Address" value={profileForm.email} />
                <DetailItem label="Phone Number" value={profileForm.phone} />
                <div className="md:col-span-2">
                  <DetailItem label="Permanent Address" value={profileForm.address} />
                </div>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Display Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-border text-sm text-slate-850 dark:text-slate-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-border text-sm text-slate-850 dark:text-slate-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-border text-sm text-slate-850 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Permanent Address</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                      className="px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-border text-sm text-slate-850 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
                  <button 
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={updatingProfile}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-500/10"
                  >
                    <Save size={14} />
                    Save Details
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Form 2: Payout configurations */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Landmark size={16} />
                </div>
                <h3 className="font-bold text-sm text-foreground">Payout Settlement Details</h3>
              </div>
              {!isEditingPayment && (
                <button 
                  onClick={() => setIsEditingPayment(true)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Update Payment
                </button>
              )}
            </div>

            {!isEditingPayment ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DetailItem label="Default Method" value={paymentForm.bankName || paymentForm.upiId ? paymentForm.payoutMethod : 'Not Configured'} />
                <DetailItem label="Bank Entity Name" value={paymentForm.bankName || 'No bank name added'} />
                <DetailItem label="Account Reference" value={paymentForm.accountNumber ? '•••• •••• •••• ' + (paymentForm.accountNumber.length > 4 ? paymentForm.accountNumber.slice(-4) : paymentForm.accountNumber) : 'No account details added'} />
                <DetailItem label="UPI ID (VPA)" value={paymentForm.upiId || 'No UPI ID registered'} />
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Default Payout Channel</label>
                  <select
                    value={paymentForm.payoutMethod}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payoutMethod: e.target.value }))}
                    className="px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-border text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="ACH/Direct Deposit">Bank Transfer (ACH/Direct Deposit)</option>
                    <option value="PayPal">PayPal Business</option>
                    <option value="Wire Transfer">Global Wire Transfer</option>
                    <option value="UPI">UPI (Unified Payments Interface)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bank Name</label>
                    <input
                      type="text"
                      value={paymentForm.bankName}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, bankName: e.target.value }))}
                      className="px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-border text-sm text-slate-850 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account Number</label>
                    <input
                      type="password"
                      value={paymentForm.accountNumber}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                      className="px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-border text-sm text-slate-850 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">UPI ID (VPA)</label>
                    <input
                      type="text"
                      value={paymentForm.upiId}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, upiId: e.target.value }))}
                      className="px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-900 border-border text-sm text-slate-850 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
                  <button 
                    type="button"
                    onClick={() => setIsEditingPayment(false)}
                    className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={updatingPayment}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-500/10"
                  >
                    <Check size={14} />
                    Save Payout Rules
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateProfile;




