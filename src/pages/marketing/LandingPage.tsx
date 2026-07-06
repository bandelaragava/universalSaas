import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { trackEvent, getLandingPageBySlug, captureLead } from '@/services/marketing';
import { generateSessionId, getStoredMarketingData, getUTMParams } from './trackingUtils';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PageDataType {
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  moduleType?: string;
  landingPageType?: string;
}

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pageData, setPageData] = useState<PageDataType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Capture any UTMs from URL
    getUTMParams();

    const loadContent = async () => {
      if (!slug) return;
      try {
        const res = await getLandingPageBySlug(slug);
        const data = res?.data || res;
        if (data) setPageData(data);
      } catch (err) {
        console.error('Content fetch error', err);
      }
    };
    loadContent();

    // Track PAGE_VIEW
    if (slug) {
      const mData = getStoredMarketingData();
      trackEvent({
        sessionId: generateSessionId(),
        source: mData.source || 'DIRECT',
        utmSource: mData.utmSource,
        utmMedium: mData.utmMedium,
        utmCampaign: mData.utmCampaign,
        page: `/landing/${slug}`,
        eventType: 'PAGE_VIEW'
      }).catch(err => console.warn('PageView tracking failed', err));
    }
  }, [slug]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageData || !slug) return;
    const mData = getStoredMarketingData();

    // Map dynamic form data to standard lead fields
    const leadName = formData.name || formData.fullName || `${formData.firstName || ''} ${formData.lastName || ''}`.trim();

    const submissionPayload = {
      name: leadName,
      email: formData.email,
      phone: formData.phone,
      courseInterest: pageData.title,
      source: pageData.moduleType || 'CRM',
      utmSource: mData.utmSource,
      utmMedium: mData.utmMedium,
      utmCampaign: mData.utmCampaign,
      sessionId: generateSessionId()
    };

    captureLead(submissionPayload)
      .then(() => {
        trackEvent({
          sessionId: generateSessionId(),
          source: mData.source || 'DIRECT',
          utmSource: mData.utmSource,
          utmMedium: mData.utmMedium,
          utmCampaign: mData.utmCampaign,
          page: `/landing/${slug}`,
          eventType: 'SIGNUP'
        }).catch(err => console.warn('Signup event tracking failed', err));
        setSubmitted(true);
      })
      .catch(err => {
        console.error("Form submission failed:", err);
        alert("Failed to submit the form. Please try again later.");
      });
  };

  if (!pageData) return null;

  const renderDynamicForm = () => {
    const modType = pageData.moduleType || 'CRM';

    if (modType === 'CRM') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">First Name *</label>
              <Input type="text" required onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Last Name</label>
              <Input type="text" onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email *</label>
            <Input type="email" required onChange={e => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Mobile Number *</label>
            <Input type="tel" required onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Company Name</label>
            <Input type="text" onChange={e => setFormData({ ...formData, company: e.target.value })} />
          </div>
        </div>
      );
    }

    if (modType === 'HRMS') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Full Name *</label>
            <Input type="text" required onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email *</label>
              <Input type="email" required onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Phone *</label>
              <Input type="tel" required onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Experience (Years) *</label>
            <select
              className="input-field w-full text-sm bg-background border-border text-foreground px-3 py-2 rounded-md"
              required
              onChange={e => setFormData({ ...formData, experience: e.target.value })}
            >
              <option value="">Select</option>
              <option value="0-2">0 - 2 Years</option>
              <option value="3-5">3 - 5 Years</option>
              <option value="5+">5+ Years</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">LinkedIn URL</label>
            <Input type="url" onChange={e => setFormData({ ...formData, linkedin: e.target.value })} />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Full Name *</label>
          <Input type="text" required onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email Address *</label>
          <Input type="email" required onChange={e => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Phone Number</label>
          <Input type="tel" onChange={e => setFormData({ ...formData, phone: e.target.value })} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-vh-100 bg-background flex flex-col justify-center items-center py-12 px-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          {pageData.moduleType && (
            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-bold rounded-full border border-cyan-500/20">
              {pageData.moduleType} / {pageData.landingPageType || 'Landing Page'}
            </span>
          )}
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">{pageData.title}</h1>
          {pageData.subtitle && <p className="text-sm text-muted-foreground">{pageData.subtitle}</p>}
          {pageData.description && <p className="text-xs text-muted-foreground max-w-lg mx-auto">{pageData.description}</p>}
        </div>

        <Card className="shadow-xl">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="text-cyan-500" size={16} /> {pageData.ctaText || 'Complete the Form Below'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {submitted ? (
              <div className="text-center py-8 space-y-3 animate-in fade-in duration-200">
                <CheckCircle2 size={48} className="text-green-500 mx-auto" />
                <h3 className="text-sm font-bold text-foreground">Success!</h3>
                <p className="text-xs text-muted-foreground">Your details have been registered. Our representative will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {renderDynamicForm()}
                <Button type="submit" className="w-full py-3 font-bold text-xs uppercase tracking-wider mt-4">
                  {pageData.ctaText || 'Submit Details'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


