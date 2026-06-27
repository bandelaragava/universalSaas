import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Edit2, Eye, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Modal from '@/components/ui/Modal';
import rolesApi from '@/services/rolesApi';
import { usePermissions } from '@/auth/usePermissions';

interface VendorCategory {
  id: number | string;
  name: string;
  active: boolean;
}

interface Vendor {
  id: number | string;
  vendorCode: string;
  name: string;
  categoryId: string | number;
  categoryName: string;
  companyName: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  alternateMobileNumber: string;
  contact: string;
  email: string;
  phone: string;
  status: string;
  risk: string;
  rating: string | number;
}

interface NewVendorState {
  id?: number | string;
  vendorCode?: string;
  vendorName: string;
  companyName: string;
  categoryId: string | number;
  contactPerson: string;
  email: string;
  mobileNumber: string;
  alternateMobileNumber: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  rating: string;
  status?: string;
  risk?: string;
}

export default function Vendors() {
  const { searchQuery, setSearchQuery } = useAppStore();
  const { hasPermission } = usePermissions();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const itemsPerPage = 5;

  const [filters, setFilters] = useState<{ status: string[]; risk: string[] }>({ status: [], risk: [] });

  const [newVendor, setNewVendor] = useState<NewVendorState>({
    vendorName: '', companyName: '', categoryId: '', contactPerson: '',
    email: '', mobileNumber: '', alternateMobileNumber: '',
    gstNumber: '', panNumber: '', address: '', city: '', state: '',
    country: '', postalCode: '', rating: ''
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const validateVendor = () => {
    const errors: { [key: string]: string } = {};
    if (!/^[a-zA-Z0-9.\-_]+@gmail\.com$/.test(newVendor.email)) {
      errors.email = "Email must be a valid Gmail address";
    }
    if (!/^\d{10}$/.test(newVendor.mobileNumber)) {
      errors.mobileNumber = "Mobile number must be exactly 10 digits";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchCategories = async () => {
    try {
      const response = await rolesApi.get('/api/vendor-categories');
      if (response.data && response.data.data) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const endpoint = searchQuery ? '/api/vendors/search' : '/api/vendors';
      const params: Record<string, string | number> = {
        page: currentPage - 1,
        size: itemsPerPage,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      };
      if (searchQuery) params.searchTerm = searchQuery;

      const response = await rolesApi.get(endpoint, { params });

      if (response.data && response.data.data) {
        let fetchedVendors = response.data.data.content.map((v: any) => ({
          id: v.id,
          vendorCode: v.vendorCode,
          name: v.vendorName,
          categoryId: v.categoryId,
          categoryName: v.categoryName || 'N/A',
          companyName: v.companyName,
          gstNumber: v.gstNumber,
          panNumber: v.panNumber,
          address: v.address,
          city: v.city,
          state: v.state,
          country: v.country,
          postalCode: v.postalCode,
          alternateMobileNumber: v.alternateMobileNumber,
          contact: v.contactPerson,
          email: v.email,
          phone: v.mobileNumber,
          status: v.status || (v.active ? 'Active' : 'Inactive'),
          risk: v.risk || 'Low',
          rating: v.rating || 'N/A',
        }));

        if (filters.status.length > 0) {
          fetchedVendors = fetchedVendors.filter((v: Vendor) => filters.status.includes(v.status));
        }
        if (filters.risk.length > 0) {
          fetchedVendors = fetchedVendors.filter((v: Vendor) => filters.risk.includes(v.risk));
        }

        setVendors(fetchedVendors);
        setTotalPages(response.data.data.totalPages);
        setTotalEntries(response.data.data.totalElements);
      }
    } catch (error) {
      console.error("Error fetching vendors", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [currentPage, searchQuery, filters]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleFilter = (type: 'status' | 'risk', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  const clearFilters = () => {
    setFilters({ status: [], risk: [] });
    setIsFiltersOpen(false);
  };

  const resetForm = () => {
    setNewVendor({
      vendorName: '', companyName: '', categoryId: '', contactPerson: '',
      email: '', mobileNumber: '', alternateMobileNumber: '',
      gstNumber: '', panNumber: '', address: '', city: '', state: '',
      country: '', postalCode: '', rating: ''
    });
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVendor()) return;
    try {
      const payload = {
        vendorCode: `V-${Math.floor(Math.random() * 9000) + 1000}`,
        vendorName: newVendor.vendorName,
        companyName: newVendor.companyName,
        categoryId: newVendor.categoryId,
        contactPerson: newVendor.contactPerson,
        email: newVendor.email,
        mobileNumber: newVendor.mobileNumber,
        alternateMobileNumber: newVendor.alternateMobileNumber,
        gstNumber: newVendor.gstNumber,
        panNumber: newVendor.panNumber,
        address: newVendor.address,
        city: newVendor.city,
        state: newVendor.state,
        country: newVendor.country,
        postalCode: newVendor.postalCode,
        rating: newVendor.rating ? parseFloat(newVendor.rating) : null,
        status: 'Pending',
        active: false
      };
      await rolesApi.post('/api/vendors', payload);
      fetchVendors();
      resetForm();
      setIsAddVendorOpen(false);
    } catch (error: any) {
      console.error("Failed to add vendor", error);
      alert(error.response?.data?.error || "Failed to add vendor");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rolesApi.post('/api/vendor-categories', {
        name: newCategoryName,
        active: true
      });
      fetchCategories();
      setNewCategoryName('');
      // Keep modal open after adding to match Manage Categories behavior
    } catch (error: any) {
      console.error("Failed to add category", error);
      alert(error.response?.data?.error || "Failed to add category");
    }
  };

  const handleToggleCategoryStatus = async (cat: any) => {
    try {
      await rolesApi.put(`/api/vendor-categories/${cat.id}`, {
        ...cat,
        active: !cat.active
      });
      fetchCategories();
    } catch (error) {
      console.error("Failed to toggle category status", error);
    }
  };

  const handleDeleteCategory = async (id: number | string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await rolesApi.delete(`/api/vendor-categories/${id}`);
        fetchCategories();
      } catch (error) {
        console.error("Failed to delete category", error);
      }
    }
  };

  const handleEditCategoryName = async (cat: any) => {
    const newName = window.prompt("Enter new category name:", cat.name);
    if (newName && newName.trim() !== "" && newName !== cat.name) {
      try {
        await rolesApi.put(`/api/vendor-categories/${cat.id}`, {
          ...cat,
          name: newName.trim()
        });
        fetchCategories();
      } catch (error) {
        console.error("Failed to edit category", error);
      }
    }
  };

  const handleEditVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVendor()) return;
    try {
      const payload = {
        vendorCode: newVendor.vendorCode,
        vendorName: newVendor.vendorName,
        companyName: newVendor.companyName,
        categoryId: newVendor.categoryId,
        contactPerson: newVendor.contactPerson,
        email: newVendor.email,
        mobileNumber: newVendor.mobileNumber,
        alternateMobileNumber: newVendor.alternateMobileNumber,
        gstNumber: newVendor.gstNumber,
        panNumber: newVendor.panNumber,
        address: newVendor.address,
        city: newVendor.city,
        state: newVendor.state,
        country: newVendor.country,
        postalCode: newVendor.postalCode,
        rating: newVendor.rating ? parseFloat(newVendor.rating) : null,
        status: newVendor.status,
        active: newVendor.status === 'Active'
      };
      await rolesApi.put(`/api/vendors/${newVendor.id}`, payload);
      fetchVendors();
      resetForm();
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error("Failed to edit vendor", error);
      alert(error.response?.data?.error || "Failed to edit vendor");
    }
  };

  const handleDeleteVendor = async (id: number | string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await rolesApi.delete(`/api/vendors/${id}`);
        fetchVendors();
      } catch (error) {
        console.error("Failed to delete vendor", error);
      }
    }
  };

  const openEditModal = (vendor: Vendor) => {
    setNewVendor({
      id: vendor.id,
      vendorCode: vendor.vendorCode,
      vendorName: vendor.name,
      companyName: vendor.companyName || '',
      contactPerson: vendor.contact,
      email: vendor.email,
      mobileNumber: vendor.phone,
      alternateMobileNumber: vendor.alternateMobileNumber || '',
      gstNumber: vendor.gstNumber || '',
      panNumber: vendor.panNumber || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      country: vendor.country || '',
      postalCode: vendor.postalCode || '',
      status: vendor.status,
      categoryId: vendor.categoryId,
      risk: vendor.risk,
      rating: vendor.rating?.toString() || ''
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setActiveTab('Overview');
    setIsViewModalOpen(true);
  };

  const paginatedVendors = vendors;
  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vendor Directory</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage and evaluate your vendor network</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <button onClick={() => setIsFiltersOpen(true)} className="btn-secondary flex items-center shrink-0">
            <Filter size={16} className="mr-2" />
            Filters
          </button>
          {hasPermission('VENDOR_CATEGORY_CREATE') && (
            <button onClick={() => setIsAddCategoryOpen(true)} className="btn-secondary flex items-center shrink-0">
              <Plus size={16} className="mr-2" />
              Add Category
            </button>
          )}
          {hasPermission('VENDOR_CREATE') && (
            <button onClick={() => setIsAddVendorOpen(true)} className="btn-primary flex items-center shrink-0">
              <Plus size={16} className="mr-2" />
              Add Vendor
            </button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading vendors...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Vendor</th>
                  <th className="p-4 font-medium hidden md:table-cell">Category</th>
                  <th className="p-4 font-medium hidden lg:table-cell">Contact</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium hidden sm:table-cell">Risk Score</th>
                  <th className="p-4 font-medium">Rating</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedVendors.length > 0 ? (
                  paginatedVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center mr-3 shrink-0">
                            <span className="text-foreground font-semibold">{vendor.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{vendor.name}</div>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">{vendor.vendorCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-sm text-foreground">{vendor.categoryName}</td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="text-sm text-foreground">{vendor.contact}</div>
                        <div className="text-xs text-muted-foreground">{vendor.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${vendor.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                          vendor.status === 'Under Review' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <div className="flex items-center">
                          {vendor.risk === 'Low' && <ShieldCheck size={16} className="text-emerald-500 mr-2" />}
                          {vendor.risk === 'Medium' && <AlertCircle size={16} className="text-amber-500 mr-2" />}
                          {vendor.risk === 'High' && <AlertCircle size={16} className="text-rose-500 mr-2" />}
                          <span className="text-sm text-foreground">{vendor.risk}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center text-sm">
                          {vendor.rating !== 'N/A' ? (
                            <>
                              <span className="font-semibold text-foreground mr-1">{vendor.rating}</span>
                              <span className="text-amber-500">★</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {hasPermission('VENDOR_VIEW') && (
                            <button onClick={() => openViewModal(vendor)} className="btn-icon" title="View details"><Eye size={16} /></button>
                          )}
                          {hasPermission('VENDOR_UPDATE') && (
                            <button onClick={() => openEditModal(vendor)} className="btn-icon" title="Edit"><Edit2 size={16} /></button>
                          )}
                          {hasPermission('VENDOR_DELETE') && (
                            <button onClick={() => handleDeleteVendor(vendor.id)} className="btn-icon hover:text-rose-500" title="Delete"><Trash2 size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No vendors found matching "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
          <span>
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalEntries)} of {totalEntries} entries
          </span>
          <div className="flex gap-1 flex-wrap justify-center">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded border transition-colors ${currentPage === i + 1
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-600 dark:text-cyan-400 border-cyan-500/20 font-semibold'
                  : 'border-border hover:bg-muted'
                  }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isAddVendorOpen} onClose={() => setIsAddVendorOpen(false)} title="Register New Vendor">
        <form className="space-y-4 text-xs" onSubmit={handleAddVendor}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Company Name *</label>
              <input type="text" className="input-field w-full" required placeholder="e.g. Acme Corp" value={newVendor.vendorName} onChange={(e) => setNewVendor({ ...newVendor, vendorName: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
              <select className="input-field w-full bg-background text-foreground border-border" value={newVendor.categoryId || ''} onChange={(e) => setNewVendor({ ...newVendor, categoryId: e.target.value })}>
                <option value="" className="bg-background text-foreground">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-background text-foreground">{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Legal Company Name</label>
            <input type="text" className="input-field w-full" placeholder="e.g. Acme Corp Pvt Ltd" value={newVendor.companyName} onChange={(e) => setNewVendor({ ...newVendor, companyName: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Contact Person</label>
            <input type="text" className="input-field w-full" placeholder="Full Name" value={newVendor.contactPerson} onChange={(e) => setNewVendor({ ...newVendor, contactPerson: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Email Address *</label>
              <input type="email" className={`input-field w-full ${formErrors.email ? 'border-rose-500' : ''}`} required placeholder="email@gmail.com" value={newVendor.email} onChange={(e) => { setNewVendor({ ...newVendor, email: e.target.value }); setFormErrors(prev => ({ ...prev, email: '' })); }} />
              {formErrors.email && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.email}</span>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Mobile Number *</label>
              <input type="tel" className={`input-field w-full ${formErrors.mobileNumber ? 'border-rose-500' : ''}`} required placeholder="1234567890" value={newVendor.mobileNumber} onChange={(e) => { setNewVendor({ ...newVendor, mobileNumber: e.target.value }); setFormErrors(prev => ({ ...prev, mobileNumber: '' })); }} />
              {formErrors.mobileNumber && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.mobileNumber}</span>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Alt. Mobile</label>
            <input type="tel" className="input-field w-full" placeholder="+1 (555) 000-0000" value={newVendor.alternateMobileNumber} onChange={(e) => setNewVendor({ ...newVendor, alternateMobileNumber: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">GST Number</label>
              <input type="text" className="input-field w-full" placeholder="GSTIN..." value={newVendor.gstNumber} onChange={(e) => setNewVendor({ ...newVendor, gstNumber: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">PAN Number</label>
              <input type="text" className="input-field w-full" placeholder="PAN..." value={newVendor.panNumber} onChange={(e) => setNewVendor({ ...newVendor, panNumber: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Address</label>
            <input type="text" className="input-field w-full" placeholder="123 Street Name" value={newVendor.address} onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">City</label>
              <input type="text" className="input-field w-full" placeholder="City" value={newVendor.city} onChange={(e) => setNewVendor({ ...newVendor, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">State</label>
              <input type="text" className="input-field w-full" placeholder="State" value={newVendor.state} onChange={(e) => setNewVendor({ ...newVendor, state: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Country</label>
              <input type="text" className="input-field w-full" placeholder="Country" value={newVendor.country} onChange={(e) => setNewVendor({ ...newVendor, country: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Postal Code</label>
              <input type="text" className="input-field w-full" placeholder="Zip/Pin" value={newVendor.postalCode} onChange={(e) => setNewVendor({ ...newVendor, postalCode: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Initial Rating (Optional)</label>
            <input type="number" step="0.1" min="0" max="5" className="input-field w-full" placeholder="0.0 - 5.0" value={newVendor.rating} onChange={(e) => setNewVendor({ ...newVendor, rating: e.target.value })} />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <button type="button" onClick={() => setIsAddVendorOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Register Vendor</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); resetForm(); }} title="Edit Vendor">
        <form className="space-y-4 text-xs" onSubmit={handleEditVendor}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Company Name *</label>
              <input type="text" className="input-field w-full" required placeholder="e.g. Acme Corp" value={newVendor.vendorName} onChange={(e) => setNewVendor({ ...newVendor, vendorName: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
              <select className="input-field w-full bg-background text-foreground border-border" value={newVendor.categoryId || ''} onChange={(e) => setNewVendor({ ...newVendor, categoryId: e.target.value })}>
                <option value="" className="bg-background text-foreground">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-background text-foreground">{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Legal Company Name</label>
            <input type="text" className="input-field w-full" placeholder="Full Legal Entity Name" value={newVendor.companyName} onChange={(e) => setNewVendor({ ...newVendor, companyName: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Contact Person</label>
              <input type="text" className="input-field w-full" placeholder="Full Name" value={newVendor.contactPerson} onChange={(e) => setNewVendor({ ...newVendor, contactPerson: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Email Address *</label>
              <input type="email" className={`input-field w-full ${formErrors.email ? 'border-rose-500' : ''}`} required placeholder="email@gmail.com" value={newVendor.email} onChange={(e) => { setNewVendor({ ...newVendor, email: e.target.value }); setFormErrors(prev => ({ ...prev, email: '' })); }} />
              {formErrors.email && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.email}</span>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Mobile Number *</label>
              <input type="tel" className={`input-field w-full ${formErrors.mobileNumber ? 'border-rose-500' : ''}`} required placeholder="1234567890" value={newVendor.mobileNumber} onChange={(e) => { setNewVendor({ ...newVendor, mobileNumber: e.target.value }); setFormErrors(prev => ({ ...prev, mobileNumber: '' })); }} />
              {formErrors.mobileNumber && <span className="text-[10px] text-rose-500 block mt-1" aria-live="polite">{formErrors.mobileNumber}</span>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Alternate Number</label>
              <input type="tel" className="input-field w-full" placeholder="+1 (555) 000-0000" value={newVendor.alternateMobileNumber} onChange={(e) => setNewVendor({ ...newVendor, alternateMobileNumber: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">GST Number</label>
              <input type="text" className="input-field w-full" placeholder="GSTIN" value={newVendor.gstNumber} onChange={(e) => setNewVendor({ ...newVendor, gstNumber: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">PAN Number</label>
              <input type="text" className="input-field w-full" placeholder="PAN" value={newVendor.panNumber} onChange={(e) => setNewVendor({ ...newVendor, panNumber: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Address</label>
            <input type="text" className="input-field w-full" placeholder="Street Address" value={newVendor.address} onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">City</label>
              <input type="text" className="input-field w-full" placeholder="City" value={newVendor.city} onChange={(e) => setNewVendor({ ...newVendor, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">State</label>
              <input type="text" className="input-field w-full" placeholder="State" value={newVendor.state} onChange={(e) => setNewVendor({ ...newVendor, state: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Country</label>
              <input type="text" className="input-field w-full" placeholder="Country" value={newVendor.country} onChange={(e) => setNewVendor({ ...newVendor, country: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Postal Code</label>
              <input type="text" className="input-field w-full" placeholder="Zip/Pin" value={newVendor.postalCode} onChange={(e) => setNewVendor({ ...newVendor, postalCode: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Rating</label>
              <input type="number" step="0.1" min="0" max="5" className="input-field w-full" placeholder="0.0 - 5.0" value={newVendor.rating || ''} onChange={(e) => setNewVendor({ ...newVendor, rating: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
              <select className="input-field w-full bg-background text-foreground border-border" value={newVendor.status} onChange={(e) => setNewVendor({ ...newVendor, status: e.target.value })}>
                <option value="Active" className="bg-background text-foreground">Active</option>
                <option value="Under Review" className="bg-background text-foreground">Under Review</option>
                <option value="Inactive" className="bg-background text-foreground">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Risk Level</label>
              <select className="input-field w-full bg-background text-foreground border-border" value={newVendor.risk} onChange={(e) => setNewVendor({ ...newVendor, risk: e.target.value })}>
                <option value="Low" className="bg-background text-foreground">Low</option>
                <option value="Medium" className="bg-background text-foreground">Medium</option>
                <option value="High" className="bg-background text-foreground">High</option>
                <option value="Pending" className="bg-background text-foreground">Pending</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <button type="button" onClick={() => { setIsEditModalOpen(false); resetForm(); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Vendor Details">
        {selectedVendor && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center space-x-4 border-b border-border pb-4">
              <div className="w-16 h-16 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                <span className="text-2xl text-foreground font-bold">{selectedVendor.name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedVendor.name}</h3>
                <p className="text-sm text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">{selectedVendor.vendorCode}</p>
              </div>
            </div>

            <div className="flex border-b border-border mt-4 mb-4 gap-4">
              {['Overview', 'Contracts', 'Invoices'].map(tab => (
                <button
                  key={tab}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  onClick={(e) => { e.preventDefault(); setActiveTab(tab); }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Overview' && (
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <p className="text-muted-foreground mb-1">Category</p>
                  <p className="text-foreground font-medium">{selectedVendor.categoryName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Company Name</p>
                  <p className="text-foreground font-medium">{selectedVendor.companyName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Contact Person</p>
                  <p className="text-foreground font-medium">{selectedVendor.contact}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">GST Number</p>
                  <p className="text-foreground">{selectedVendor.gstNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">PAN Number</p>
                  <p className="text-foreground">{selectedVendor.panNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Address</p>
                  <p className="text-foreground">{[selectedVendor.address, selectedVendor.city, selectedVendor.state, selectedVendor.country].filter(Boolean).join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Email Address</p>
                  <p className="text-foreground font-medium">{selectedVendor.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Rating</p>
                  <div className="flex items-center">
                    {selectedVendor.rating !== 'N/A' ? (
                      <>
                        <span className="font-semibold text-foreground mr-1">{selectedVendor.rating}</span>
                        <span className="text-amber-500">★</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${selectedVendor.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                    selectedVendor.status === 'Under Review' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}>
                    {selectedVendor.status}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Risk Level</p>
                  <div className="flex items-center">
                    {selectedVendor.risk === 'Low' && <ShieldCheck size={16} className="text-emerald-500 mr-2" />}
                    {selectedVendor.risk === 'Medium' && <AlertCircle size={16} className="text-amber-500 mr-2" />}
                    {selectedVendor.risk === 'High' && <AlertCircle size={16} className="text-rose-500 mr-2" />}
                    <span className="text-foreground font-medium">{selectedVendor.risk}</span>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'Contracts' || activeTab === 'Invoices') && (
              <div className="bg-muted/20 rounded-lg p-6 text-center border border-border min-h-[200px] flex flex-col items-center justify-center">
                <p className="text-muted-foreground text-sm">No {activeTab.toLowerCase()} found.</p>
              </div>
            )}

            <div className="pt-4 flex justify-end border-t border-border">
              <button onClick={() => setIsViewModalOpen(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isAddCategoryOpen} onClose={() => setIsAddCategoryOpen(false)} title="Manage Categories">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">Existing Categories</label>
            <div className="max-h-48 overflow-y-auto custom-scrollbar border border-border rounded-lg p-2 bg-muted/20">
              {categories.length > 0 ? (
                <ul className="space-y-2">
                  {categories.map(cat => (
                    <li key={cat.id} className="text-foreground text-xs p-2 hover:bg-muted/50 rounded flex justify-between items-center">
                      <span className="font-medium">{cat.name}</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-medium ${cat.active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-600 dark:text-muted-foreground border border-slate-500/20'}`}>
                          {cat.active ? 'Active' : 'Inactive'}
                        </span>
                        <div className="flex gap-2">
                          {hasPermission('VENDOR_CATEGORY_UPDATE') && (
                            <>
                              <button type="button" onClick={() => handleToggleCategoryStatus(cat)} className="text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-600 dark:text-cyan-400 transition-colors" title={cat.active ? "Deactivate" : "Activate"}>
                                <ShieldCheck size={14} />
                              </button>
                              <button type="button" onClick={() => handleEditCategoryName(cat)} className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Edit Name">
                                <Edit2 size={14} />
                              </button>
                            </>
                          )}
                          {hasPermission('VENDOR_CATEGORY_DELETE') && (
                            <button type="button" onClick={() => handleDeleteCategory(cat.id)} className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-600 dark:text-rose-400 transition-colors" title="Delete Category">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-xs text-center py-4">No categories added yet.</p>
              )}
            </div>
          </div>

          {hasPermission('VENDOR_CATEGORY_CREATE') && (
            <form className="space-y-4 border-t border-border pt-4" onSubmit={handleAddCategory}>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Add New Category *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-field w-full bg-background text-foreground border-border flex-1"
                    required
                    placeholder="e.g. Facilities Management"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <button type="submit" className="btn-primary shrink-0 py-2">Add</button>
                </div>
              </div>
            </form>
          )}

          <div className="pt-2 flex justify-end">
            <button type="button" onClick={() => setIsAddCategoryOpen(false)} className="btn-secondary">Close</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} title="Advanced Filters">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">Status</label>
            <div className="flex flex-wrap gap-4">
              {['Active', 'Under Review', 'Inactive'].map(status => (
                <label key={status} className="flex items-center space-x-2 text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-border bg-background text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500"
                    checked={filters.status.includes(status)}
                    onChange={() => toggleFilter('status', status)}
                  />
                  <span>{status}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2 mt-4">Risk Level</label>
            <div className="flex flex-wrap gap-4">
              {['Low', 'Medium', 'High'].map(risk => (
                <label key={risk} className="flex items-center space-x-2 text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-border bg-background text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500"
                    checked={filters.risk.includes(risk)}
                    onChange={() => toggleFilter('risk', risk)}
                  />
                  <span>{risk}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="pt-6 flex justify-end gap-3 border-t border-border">
            <button onClick={clearFilters} className="btn-secondary">Clear All</button>
            <button onClick={() => setIsFiltersOpen(false)} className="btn-primary">Apply Filters</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}