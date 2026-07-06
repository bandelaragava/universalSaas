import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import rolesApi from '@/services/rolesApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface GenericLookupSettingsFormProps {
  titleCreate: string;
  titleEdit: string;
  description: string;
  endpoint: string;
  backRoute: string;
  entityLabel: string;
}

export function GenericLookupSettingsForm({ titleCreate, titleEdit, description, endpoint, backRoute, entityLabel }: GenericLookupSettingsFormProps) {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
    showInUserForm: true
  });

  useEffect(() => {
    if (isEdit && id) {
      rolesApi.get(`${endpoint}/${id}`)
        .then(res => setFormData({
          name: res.data.name || '',
          description: res.data.description || '',
          active: res.data.active ?? true,
          showInUserForm: res.data.showInUserForm ?? true
        }))
        .catch(() => toast.error(`Failed to load ${entityLabel} details`))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, endpoint, entityLabel]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Name is required');

    setSaving(true);
    try {
      if (isEdit) {
        await rolesApi.put(`${endpoint}/${id}`, formData);
        toast.success(`${entityLabel} updated successfully`);
      } else {
        await rolesApi.post(endpoint, formData);
        toast.success(`${entityLabel} created successfully`);
      }
      navigate(backRoute);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to save ${entityLabel}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-muted-foreground text-xs gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(backRoute)} className="h-8 w-8 rounded-full border border-border bg-card hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={isEdit ? titleEdit : titleCreate} description={description} />
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-xl space-y-6 shadow-sm">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder={`e.g. Regular, Contractor, etc.`} required className="max-w-md" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Optional description..." className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
          </div>

          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center justify-between border p-4 rounded-lg bg-background">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <div className="text-xs text-muted-foreground">Enable or disable this {entityLabel.toLowerCase()} across the system.</div>
              </div>
              <Switch checked={formData.active} onCheckedChange={(c) => handleSwitchChange('active', c)} />
            </div>

            <div className="flex items-center justify-between border p-4 rounded-lg bg-background">
              <div className="space-y-0.5">
                <Label>Show in User Form</Label>
                <div className="text-xs text-muted-foreground">Make this {entityLabel.toLowerCase()} selectable when adding/editing users.</div>
              </div>
              <Switch checked={formData.showInUserForm} onCheckedChange={(c) => handleSwitchChange('showInUserForm', c)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
          <Button type="button" variant="outline" onClick={() => navigate(backRoute)}>Cancel</Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default GenericLookupSettingsForm;


