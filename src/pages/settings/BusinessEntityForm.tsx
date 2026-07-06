import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import rolesApi from '@/services/rolesApi';
import EntityFormPage from '@/components/shared/EntityFormPage';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface EntityFormState {
  entityCode: string;
  companyName: string;
  description: string;
  active: boolean;
  showInUserForm: boolean;
}

export function BusinessEntityForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState<EntityFormState>({
    entityCode: '',
    companyName: '',
    description: '',
    active: true,
    showInUserForm: true,
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  interface BusinessEntityResponse {
    id: number;
    entityCode: string;
    companyName: string;
    description?: string;
    active?: boolean;
    showInUserForm?: boolean;
  }

  useEffect(() => {
    if (!isEdit) return;
    rolesApi
      .get('/business-entities')
      .then((res) => {
        const list = res.data || [];
        const found = list.find((e: BusinessEntityResponse) => String(e.id) === String(id));
        if (found) {
          setForm({
            entityCode: found.entityCode || '',
            companyName: found.companyName || '',
            description: found.description || '',
            active: found.active ?? true,
            showInUserForm: found.showInUserForm !== false,
          });
        } else {
          setError('Business entity not found.');
        }
      })
      .catch((err: unknown) => {
        const errMsg = err instanceof Error ? err.message : 'Failed to fetch business entity';
        setError(errMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (isEdit) {
        await rolesApi.put(`/business-entities/${id}`, form);
        setSuccess('Business entity updated successfully.');
      } else {
        await rolesApi.post('/business-entities', form);
        setSuccess('Business entity created successfully.');
      }
      setTimeout(() => navigate('/settings/entities'), 1000);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to save business entity';
      setError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntityFormPage
      title={isEdit ? 'Edit Entity' : 'Add Entity'}
      subtitle={isEdit ? form.companyName : undefined}
      backRoute="/settings/entities"
      onSubmit={handleSubmit}
      submitLabel={saving ? 'Saving...' : isEdit ? 'Update Entity' : 'Create Entity'}
      loading={loading}
      error={error}
      success={success}
    >
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-1.5">
              <Label htmlFor="entityCode" className="text-xs font-semibold text-muted-foreground">
                Entity Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="entityCode"
                placeholder="e.g. ABC, HQ"
                value={form.entityCode}
                onChange={(e) => setForm({ ...form, entityCode: e.target.value.toUpperCase() })}
                disabled={isEdit}
                required
                className="h-9"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Unique short identifier.</p>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="companyName" className="text-xs font-semibold text-muted-foreground">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="e.g. ABC Holdings Pvt Ltd"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground">
              Description (optional)
            </Label>
            <Input
              id="description"
              placeholder="Short description of this legal entity..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-9"
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="showInUserForm"
                checked={form.showInUserForm}
                onCheckedChange={(checked) => setForm({ ...form, showInUserForm: !!checked })}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="showInUserForm" className="text-xs font-medium cursor-pointer">
                  Show in User Form
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  If enabled, this entity will be visible when assigning/editing users.
                </p>
              </div>
            </div>

            {isEdit && (
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="active"
                  checked={form.active}
                  onCheckedChange={(checked) => setForm({ ...form, active: !!checked })}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="active" className="text-xs font-medium cursor-pointer">
                    Active
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Only active entities can be assigned to new users/records.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </EntityFormPage>
  );
}

export default BusinessEntityForm;


