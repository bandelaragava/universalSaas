import React, { useState, useEffect, useCallback } from 'react';
import { User, Mail, Shield, Building, AlertCircle, Phone, MapPin } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import { useAuth } from '@/auth/AuthContext';

export default function UserProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    tenantCode: ''
  });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rolesApi.get('/users/me', { ignore403: true });
      if (res.data) {
        setProfileData({
          firstName: res.data.firstName || res.data.name || '',
          lastName: res.data.lastName || '',
          email: res.data.email || user?.email || '',
          phone: res.data.phone || res.data.phoneNumber || '',
          role: res.data.role || res.data.roleName || user?.role || 'User',
          tenantCode: res.data.tenantCode || user?.tenantCode || ''
        });
      }
    } catch (err: any) {
      setError('Failed to load user profile details.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          View your personal account details, contact information, and system roles.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3.5 rounded-lg flex gap-2 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-2"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-xl space-y-5 shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">First Name</label>
                <div className="w-full bg-muted/30 border border-input text-foreground rounded-lg px-4 py-2.5 opacity-90">
                  {profileData.firstName || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Last Name</label>
                <div className="w-full bg-muted/30 border border-input text-foreground rounded-lg px-4 py-2.5 opacity-90">
                  {profileData.lastName || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5"/> Email Address
                </label>
                <div className="w-full bg-muted/30 border border-input text-foreground rounded-lg px-4 py-2.5 opacity-90">
                  {profileData.email || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5"/> Phone Number
                </label>
                <div className="w-full bg-muted/30 border border-input text-foreground rounded-lg px-4 py-2.5 opacity-90">
                  {profileData.phone || '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-xl space-y-5 shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" /> System Access & Roles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5"/> Organization (Tenant)
                </label>
                <div className="w-full bg-muted/30 border border-input text-foreground rounded-lg px-4 py-2.5 opacity-90 uppercase font-mono font-medium">
                  {profileData.tenantCode || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Assigned Role</label>
                <div className="w-full bg-muted/30 border border-input text-foreground rounded-lg px-4 py-2.5 opacity-90 font-medium text-primary">
                  {profileData.role || '—'}
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-400 flex gap-3">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Your access permissions and module visibility are determined by your assigned role. If you require additional access, please contact your system administrator.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
