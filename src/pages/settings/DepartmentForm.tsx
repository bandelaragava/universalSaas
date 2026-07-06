import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import rolesApi from '@/services/rolesApi';
import EntityFormPage from '@/components/shared/EntityFormPage';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface DepartmentFormState {
  deptCode: string;
  deptName: string;
  description: string;
  entityId: string;
  active: boolean;
  showInUserForm: boolean;
}

interface BusinessEntity {
  id: number;
  entityCode: string;
  companyName: string;
}

export function DepartmentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState<DepartmentFormState>({
    deptCode: '',
    deptName: '',
    description: '',
    entityId: '',
    active: true,
    showInUserForm: true,
  });

  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  interface DepartmentResponse {
    id: number;
    deptCode: string;
    deptName: string;
    description?: string;
    entityId?: number | null;
    active?: boolean;
    showInUserForm?: boolean;
  }

  useEffect(() => {
    // Fetch active business entities for selection dropdown
    rolesApi
      .get('/business-entities/active')
      .then((res) => {
        setEntities(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to load business entities for association', err);
      });

    if (!isEdit) return;
    rolesApi
      .get('/departments')
      .then((res) => {
        const list = res.data || [];
        const found = list.find((d: DepartmentResponse) => String(d.id) === String(id));
        if (found) {
          setForm({
            deptCode: found.deptCode || '',
            deptName: found.deptName || '',
            description: found.description || '',
            entityId: found.entityId ? String(found.entityId) : '',
            active: found.active ?? true,
            showInUserForm: found.showInUserForm !== false,
          });
        } else {
          setError('Department not found.');
        }
      })
      .catch((err: unknown) => {
        const errMsg = err instanceof Error ? err.message : 'Failed to fetch department';
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
    const payload = {
      ...form,
      entityId: form.entityId ? Number(form.entityId) : null,
    };
    try {
      if (isEdit) {
        await rolesApi.put(`/departments/${id}`, payload);
        setSuccess('Department updated successfully.');
      } else {
        await rolesApi.post('/departments', payload);
        setSuccess('Department created successfully.');
      }
      setTimeout(() => navigate('/settings/departments'), 1000);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to save department';
      setError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntityFormPage
      title={isEdit ? 'Edit Department' : 'Add Department'}
      subtitle={isEdit ? form.deptName : undefined}
      backRoute="/settings/departments"
      onSubmit={handleSubmit}
      submitLabel={saving ? 'Saving...' : isEdit ? 'Update Department' : 'Create Department'}
      loading={loading}
      error={error}
      success={success}
    >
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-1.5">
              <Label htmlFor="deptCode" className="text-xs font-semibold text-muted-foreground">
                Dept Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deptCode"
                placeholder="e.g. HR, SALES"
                value={form.deptCode}
                onChange={(e) => setForm({ ...form, deptCode: e.target.value.toUpperCase() })}
                disabled={isEdit}
                required
                className="h-9"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Unique short identifier.</p>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="deptName" className="text-xs font-semibold text-muted-foreground">
                Department Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deptName"
                placeholder="e.g. Human Resources"
                value={form.deptName}
                onChange={(e) => setForm({ ...form, deptName: e.target.value })}
                required
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="entityId" className="text-xs font-semibold text-muted-foreground">
              Business Entity Link (optional)
            </Label>
            <select
              id="entityId"
              value={form.entityId}
              onChange={(e) => setForm({ ...form, entityId: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">- None / General Department -</option>
              {entities.map((en) => (
                <option key={en.id} value={en.id}>
                  {en.entityCode} – {en.companyName}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground">
              Select a parent legal entity to restrict or group this department.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground">
              Description (optional)
            </Label>
            <Input
              id="description"
              placeholder="Short description of this department..."
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
                  If enabled, this department will be visible when assigning/editing users.
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
                    Only active departments can be assigned to new users/records.
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

export default DepartmentForm;


