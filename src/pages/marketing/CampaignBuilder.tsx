import React, { useState } from 'react';
import { Save, Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CampaignBuilderProps {
  onSave: (payload: {
    campaignName: string;
    subject: string;
    content: string;
    status: string;
    recipients: string[];
  }) => void;
  onCancel: () => void;
}

export default function CampaignBuilder({ onSave, onCancel }: CampaignBuilderProps) {
  const [formData, setFormData] = useState({
    campaignName: '',
    recipients: '',
    subject: '',
    content: '',
    status: 'ACTIVE'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const newEmails = text
        .split(/[\r\n,]+/)
        .map(email => email.trim())
        .filter(email => email.includes('@'));

      setFormData(prev => {
        const existingEmails = prev.recipients
          ? prev.recipients.split(/[,\n]/).map(e => e.trim()).filter(Boolean)
          : [];
        
        const combined = Array.from(new Set([...existingEmails, ...newEmails]));
        return {
          ...prev,
          recipients: combined.join(', ')
        };
      });
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const downloadTemplate = () => {
    const csvContent = "email\njohn@example.com\nsarah@example.com\nmike@test.com";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'recipients_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const manualRecipients = formData.recipients
      ? formData.recipients.split(/[,\n]/).map(e => e.trim()).filter(e => e.includes('@'))
      : [];

    onSave({
      campaignName: formData.campaignName,
      subject: formData.subject,
      content: formData.content,
      status: formData.status,
      recipients: manualRecipients
    });
  };

  return (
    <Card className="animate-in fade-in duration-200">
      <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
        <CardTitle className="text-base font-bold">Create Campaign</CardTitle>
        <Button variant="outline" size="sm" type="button" onClick={onCancel}>Cancel</Button>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Campaign Name *</label>
            <Input
              type="text"
              name="campaignName"
              value={formData.campaignName}
              onChange={handleChange}
              placeholder="e.g., Summer Special Course Offer"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipients (Comma separated emails) *</label>
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={downloadTemplate}
                  className="text-xs font-semibold text-slate-400 hover:text-cyan-500 hover:underline cursor-pointer"
                >
                  Download Sample CSV
                </button>
                <label className="text-xs font-bold text-cyan-500 hover:underline cursor-pointer flex items-center gap-1">
                  Bulk Upload .CSV
                  <input 
                    type="file" 
                    accept=".csv,.txt" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                </label>
              </div>
            </div>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              name="recipients"
              value={formData.recipients}
              onChange={handleChange}
              placeholder="test@gmail.com, demo@gmail.com"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Subject *</label>
            <Input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g., Special 20% discount coupon inside"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Message *</label>
            <textarea
              className="flex min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={6}
              placeholder="Write your email marketing campaign body here..."
              required
            />
          </div>

          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</label>
            <select
              className="input-field w-full text-sm bg-background border-border text-foreground px-3 py-2 rounded-md"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="DRAFT">Draft (Save only)</option>
              <option value="ACTIVE">Send Now</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            {formData.status === 'DRAFT' ? (
              <Button type="submit" variant="outline" className="flex items-center gap-2">
                <Save size={16} /> Save Draft
              </Button>
            ) : (
              <Button type="submit" className="flex items-center gap-2">
                <Rocket size={16} /> Send Campaign
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
