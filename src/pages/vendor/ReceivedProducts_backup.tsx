import React, { useState, useEffect } from 'react';
import { ShoppingCart, UserCheck, Package, CheckCircle, Clock } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import Modal from '@/components/ui/Modal';

const ReceivedProducts = () => {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const [assignData, setAssignData] = useState({
    userId: '',
    quantity: 1
  });
  const [submitting, setSubmitting] = useState(false);
  const [viewHistoryModal, setViewHistoryModal] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnData, setReturnData] = useState({ quantity: 1 });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await rolesApi.get('/vendors/received-products');
      if (res.data?.data?.content) {
        setProducts(res.data.data.content);
      } else if (Array.isArray(res.data?.data)) {
        setProducts(res.data.data);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await rolesApi.get('/users');
      const allUsers = Array.isArray(res.data) ? res.data : (res.data?.data?.content || res.data?.data || []);
      setUsers(allUsers.filter((u: any) => u.active !== false));
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchUsers();
  }, []);

  
  const openHistoryModal = async (product: any) => {
    setSelectedProduct(product);
    setViewHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await rolesApi.get(`/vendors/received-products/${product.id}/assignments`);
      const data = res.data?.data?.content || res.data?.data || [];
      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };


  const [lifecycleModalOpen, setLifecycleModalOpen] = useState(false);
  const [lifecycleAction, setLifecycleAction] = useState('');
  const [lifecycleDesc, setLifecycleDesc] = useState('');
  
  const openLifecycleModal = (assignment: any, action: string) => {
    setSelectedProduct(assignment);
    setLifecycleAction(action);
    setLifecycleDesc('');
    setLifecycleModalOpen(true);
  };

  const submitLifecycleAction = async (e: any) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await rolesApi.post(`/vendors/received-products/assignments/${selectedProduct?.id}/${lifecycleAction}`, {
        description: lifecycleDesc
      });
      setLifecycleModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const openAssetHistory = async (assignment: any) => {
    setSelectedProduct(assignment);
    setViewHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await rolesApi.get(`/vendors/received-products/assignments/${assignment.id}/history`);
      const data = res.data?.data?.content || res.data?.data || [];
      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openAssignModal = (product: any) => {
    setSelectedProduct(product);
    setAssignData({ userId: '', quantity: 1 });
    setModalOpen(true);
  };

  
  const openReturnModal = (product: any) => {
    setSelectedProduct(product);
    setReturnData({ quantity: 1 });
    setReturnModalOpen(true);
  };

  const handleReturn = async (e: any) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await rolesApi.post(`/vendors/received-products/${selectedProduct?.id}/return?quantity=${returnData.quantity}`);
      setReturnModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to return product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (e: any) => {
    e.preventDefault();
    if (!assignData.userId) {
      alert("Please select a user");
      return;
    }
    const available = selectedProduct?.receivedQuantity - selectedProduct?.assignedQuantity;
    if (assignData.quantity > available) {
      alert("Quantity cannot exceed available quantity");
      return;
    }

    try {
      setSubmitting(true);
      await rolesApi.post(`/vendors/received-products/${selectedProduct?.id}/assign`, {
        userId: Number(assignData.userId),
        quantity: Number(assignData.quantity)
      });
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to assign product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
            <ShoppingCart className="text-cyan-400" />
            Received Products
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage and assign received products to users.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-400">
              <tr>
                <th className="p-4 font-semibold">Product</th>
                <th className="p-4 font-semibold">Vendor</th>
                <th className="p-4 font-semibold text-center">Received</th>
                <th className="p-4 font-semibold text-center">Available</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Loading...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No received products found.</td>
                </tr>
              ) : (
                products.map((product: any) => {
                  const available = product.receivedQuantity - product.assignedQuantity;
                  return (
                    <tr key={product.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          <Package className="text-slate-500" size={16} />
                          {product.productName}
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{product.vendorName}</td>
                      <td className="p-4 text-center font-mono text-slate-400">{product.receivedQuantity}</td>
                      <td className="p-4 text-center">
                        <span className={`font-mono font-medium ${available > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {available}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          product.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          product.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {available > 0 && (
                            <button
                              onClick={() => openReturnModal(product)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                              title="Return damaged or rejected products to vendor"
                            >
                              Return
                            </button>
                          )}
                          <button
                            onClick={() => openHistoryModal(product)}
                            className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                          >
                            <Clock size={16} />
                            History
                          </button>
                          {available > 0 ? (
                            <button
                              onClick={() => openAssignModal(product)}
                              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                            >
                              <UserCheck size={16} />
                              Assign
                            </button>
                          ) : (
                            <span className="text-slate-500 text-sm italic px-2 py-1.5">Assigned</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Assign Product to User">
        {selectedProduct && (
          <form onSubmit={handleAssign} className="space-y-6">
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 mb-6">
              <h3 className="text-lg font-bold text-slate-200 mb-2">{selectedProduct?.productName}</h3>
              <p className="text-slate-400 text-sm">Vendor: {selectedProduct?.vendorName}</p>
              <div className="mt-2 text-sm font-medium text-emerald-400">
                Available to assign: {selectedProduct?.receivedQuantity - selectedProduct?.assignedQuantity}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Assign To Employee/User</label>
              <select
                value={assignData.userId}
                onChange={(e: any) => setAssignData({ ...assignData, userId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                required
              >
                <option value="">Select a user...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.receivedQuantity - selectedProduct?.assignedQuantity}
                value={assignData.quantity}
                onChange={(e: any) => setAssignData({ ...assignData, quantity: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={viewHistoryModal} onClose={() => setViewHistoryModal(false)} title="Assignment History">
        {selectedProduct && (
          <div className="space-y-4">
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-bold text-slate-200">{selectedProduct?.productName}</h3>
              <p className="text-slate-400 text-sm">Total Assigned: {selectedProduct?.quantity}</p>
            </div>
            
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/50 text-slate-400">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Assigned To</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {loadingHistory ? (
                    <tr><td colSpan={4} className="p-4 text-center text-slate-400">Loading history...</td></tr>
                  ) : assignments.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-slate-400">No history found.</td></tr>
                  ) : (
                    assignments.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 border-b border-slate-700/30 last:border-0">
                        <td className="p-3 text-slate-200">{new Date(a.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 font-medium text-cyan-400">{a.eventType}</td>
                        <td className="p-3 text-slate-300">{a.assignedToName || '-'}</td>
                        <td className="p-3 text-slate-400 text-sm max-w-xs truncate" title={a.description}>{a.description || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end pt-4">
              <button onClick={() => setViewHistoryModal(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg">Close</button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default ReceivedProducts;


