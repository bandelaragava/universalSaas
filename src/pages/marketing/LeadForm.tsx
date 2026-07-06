import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trackEvent, captureLead } from '@/services/marketing';
import { getStoredMarketingData, generateSessionId } from './trackingUtils';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LeadFormProps {
  courseTitle?: string;
  buttonText?: string;
}

export default function LeadForm({ courseTitle = "the course", buttonText = "Get Syllabus" }: LeadFormProps) {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    referralCode: searchParams.get('ref') || '',
    affiliateCode: searchParams.get('aff') || ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleClear = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      referralCode: searchParams.get('ref') || '',
      affiliateCode: searchParams.get('aff') || ''
    });
    setStatus({ type: '', message: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'info', message: 'Processing your request...' });

    const marketingData = getStoredMarketingData();
    const sessionId = generateSessionId();

    try {
      await trackEvent({
        sessionId,
        source: marketingData.source,
        utmSource: marketingData.utmSource,
        utmMedium: marketingData.utmMedium,
        utmCampaign: marketingData.utmCampaign,
        page: window.location.pathname,
        eventType: 'CLICK',
        metadataJSON: JSON.stringify({ action: 'lead_form_submit_click', course_interest: courseTitle })
      });
    } catch (err) {
      console.warn('Click tracking failed', err);
    }

    try {
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      if (!name || !formData.email || !formData.phone) {
        setStatus({ type: 'danger', message: 'Please fill in all required fields.' });
        return;
      }

      const payload = {
        name,
        email: formData.email,
        phone: formData.phone,
        courseInterest: courseTitle || 'LMS Course',
        ...marketingData,
        sessionId
      };

      await captureLead(payload);

      try {
        await trackEvent({
          sessionId,
          source: marketingData.source || (formData.referralCode ? 'REFERRAL' : 'DIRECT'),
          utmSource: marketingData.utmSource,
          utmMedium: marketingData.utmMedium,
          utmCampaign: marketingData.utmCampaign,
          page: window.location.pathname,
          eventType: 'SIGNUP',
          metadataJSON: JSON.stringify({ course_interest: courseTitle, ref: formData.referralCode })
        });
      } catch (trackError) {
        console.warn('Tracking signup failed', trackError);
      }

      setStatus({ type: 'success', message: 'Success! Your information has been captured. We will contact you soon.' });
      alert('Submitted Successfully!');
      setFormData({ firstName: '', lastName: '', email: '', phone: '', referralCode: '', affiliateCode: '' });
    } catch (err) {
      console.error(err);
      const error = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const errorMsg = error.response?.data?.message
        || error.response?.data?.error
        || (typeof error.response?.data === 'string' ? error.response.data : null)
        || error.message
        || 'Something went wrong. Please check your connection and try again.';
      setStatus({ type: 'danger', message: errorMsg });
    }
  };

  return (
    <Card className="max-w-md mx-auto overflow-hidden">
      <CardHeader className="bg-cyan-550/10 text-center border-b pb-4">
        <CardTitle className="text-sm font-bold text-foreground">Interested in {courseTitle}?</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Fill the form to get started with your learning journey.</p>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">First Name *</label>
              <Input
                type="text"
                placeholder="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Last Name *</label>
              <Input
                type="text"
                placeholder="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email Address *</label>
            <Input
              type="email"
              placeholder="name@example.com"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Phone Number *</label>
            <Input
              type="tel"
              placeholder="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>

          {(formData.referralCode || formData.affiliateCode) && (
            <div className="flex gap-2 mb-2">
              {formData.referralCode && (
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">Ref: {formData.referralCode}</span>
              )}
              {formData.affiliateCode && (
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">Aff: {formData.affiliateCode}</span>
              )}
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" className="w-full text-xs py-3 font-bold uppercase tracking-wider">
              {buttonText}
            </Button>
            <button type="button" className="w-full text-center text-[10px] text-muted-foreground mt-2 hover:underline cursor-pointer" onClick={handleClear}>
              Reset Form
            </button>
          </div>

          {status.message && (
            <div className={`p-3 rounded-lg text-xs font-semibold text-center border mt-4 ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                status.type === 'info' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                  'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
              {status.type === 'success' && <CheckCircle2 className="inline mr-1" size={14} />}
              {status.message}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}


