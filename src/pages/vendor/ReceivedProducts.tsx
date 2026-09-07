import React, { useState, useEffect } from 'react';
import { ShoppingCart, UserCheck, Package, Clock, Search, RotateCcw } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import Modal from '@/components/ui/Modal';

const ReceivedProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [deployedAssets, setDeployedAssets] = useState<any[]>([]);
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
  const [historyType, setHistoryType] = useState<'product' | 'asset'>('product');
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnData, setReturnData] = useState({ quantity: 1 });
  const [activeTab, setActiveTab] = useState<'inventory' | 'deployed'>('inventory');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryVendor, setInventoryVendor] = useState('');
  const [inventoryStatus, setInventoryStatus] = useState('');
  const [inventoryItemType, setInventoryItemType] = useState('');
  const [assetProductSearch, setAssetProductSearch] = useState('');
  const [assetIdSearch, setAssetIdSearch] = useState('');
  const [assetUserSearch, setAssetUserSearch] = useState('');
  const [assetStatus, setAssetStatus] = useState('');

  const fetchProducts = async (signal?: any) => {
    try {
      setLoading(true);
      console.log('🔍 [ReceivedProducts] Fetching inventory & deployed assets...');
      const overallStart = performance.now();

      const [res, assetRes] = await Promise.allSettled([
        (async () => {
          const tStart = performance.now();
          const r = await rolesApi.get('/vendors/received-products', { signal });
          const elapsed = (performance.now() - tStart).toFixed(2);
          console.log(`⏱️ [ReceivedProducts] GET /vendors/received-products completed in ${elapsed} ms (${(Number(elapsed)/1000).toFixed(2)}s)`);
          return r;
        })(),
        (async () => {
          const tStart = performance.now();
          const r = await rolesApi.get('/vendors/received-products/assignments', { signal });
          const elapsed = (performance.now() - tStart).toFixed(2);
          console.log(`⏱️ [ReceivedProducts] GET /vendors/received-products/assignments completed in ${elapsed} ms (${(Number(elapsed)/1000).toFixed(2)}s)`);
          return r;
        })()
      ]);

      const totalElapsed = (performance.now() - overallStart).toFixed(2);
      console.log(`⏱️ [ReceivedProducts] Total Parallel Request Duration: ${totalElapsed} ms (${(Number(totalElapsed)/1000).toFixed(2)}s)`);

      if (signal?.aborted) return;

      if (res.status === 'fulfilled') {
        const val = res.value.data;
        const data = val?.data?.content || val?.content || (Array.isArray(val?.data) ? val.data : (Array.isArray(val) ? val : []));
        console.log('📦 [ReceivedProducts] Inventory API Raw Response:', val);
        console.log('📦 [ReceivedProducts] Parsed Products List:', data);
        setProducts(Array.isArray(data) ? data : []);
      } else {
        console.error('❌ [ReceivedProducts] Inventory API Failed:', res.reason);
      }

      if (assetRes.status === 'fulfilled') {
        const val = assetRes.value.data;
        const assetData = val?.data?.content || val?.content || (Array.isArray(val?.data) ? val.data : (Array.isArray(val) ? val : []));
        console.log('🚀 [ReceivedProducts] Deployed Assets API Raw Response:', val);
        console.log('🚀 [ReceivedProducts] Parsed Deployed Assets List:', assetData);
        setDeployedAssets(Array.isArray(assetData) ? assetData : []);
      } else {
        console.error('❌ [ReceivedProducts] Deployed Assets API Failed:', assetRes.reason);
      }
    } catch (err: any) {
      if (!signal?.aborted) {
        console.error('❌ [ReceivedProducts] Fetch Error:', err);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const fetchUsers = async (signal?: any) => {
    try {
      const res = await rolesApi.get('/users', { signal });
      if (signal?.aborted) return;
      const allUsers = Array.isArray(res.data) ? res.data : (res.data?.data?.content || res.data?.data || []);
      setUsers(allUsers.filter((u: any) => u.active !== false));
    } catch (err: any) {
      if (!signal?.aborted) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    fetchUsers(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  
  const openHistoryModal = async (product: any) => {
    setSelectedProduct(product);
    setHistoryType('product');
    setViewHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await rolesApi.get(`/vendors/received-products/${product.id}/assignments`);
      const data = res.data?.data?.content || res.data?.data || [];
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setAssignments([]);
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
    setHistoryType('asset');
    setViewHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await rolesApi.get(`/vendors/received-products/assignments/${assignment.id}/history`);
      const data = res.data?.data?.content || res.data?.data || [];
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setAssignments([]);
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

  const vendors = [...new Set(products.map((product: any) => product.vendorName).filter(Boolean))];
  const inventoryStatuses = [...new Set(products.map((product: any) => product.status).filter(Boolean))];
  const assetStatuses = [...new Set(deployedAssets.map((asset: any) => asset.status || 'ASSIGNED').filter(Boolean))];
  const normalizedInventorySearch = inventorySearch.trim().toLowerCase();
  const filteredProducts = products.filter((product: any) => {
    const itemType = product.itemType || product.requirementItemType || 'ASSET';
    return (!normalizedInventorySearch || [product.productName, product.vendorName].some((value) =>
      String(value || '').toLowerCase().includes(normalizedInventorySearch)
    )) && (!inventoryVendor || product.vendorName === inventoryVendor)
      && (!inventoryStatus || product.status === inventoryStatus)
      && (!inventoryItemType || itemType === inventoryItemType);
  });
  const filteredDeployedAssets = deployedAssets.filter((asset: any) => {
    const productName = asset.productName || products.find((product: any) => String(product.id) === String(asset.receivedProductId))?.productName || '';
    const status = asset.status || 'ASSIGNED';
    return (!assetProductSearch.trim() || productName.toLowerCase().includes(assetProductSearch.trim().toLowerCase()))
      && (!assetIdSearch.trim() || String(asset.assetIdentifier || asset.id).toLowerCase().includes(assetIdSearch.trim().toLowerCase()))
      && (!assetUserSearch.trim() || String(asset.userName || '').toLowerCase().includes(assetUserSearch.trim().toLowerCase()))
      && (!assetStatus || status === assetStatus);
  });

  useEffect(() => {
    console.log('💡 [ReceivedProducts] State Updated - Deployed Assets:', deployedAssets);
    console.log('💡 [ReceivedProducts] Filtered Deployed Assets:', filteredDeployedAssets);
  }, [deployedAssets, assetProductSearch, assetIdSearch, assetUserSearch, assetStatus]);

  const resetInventoryFilters = () => {
    setInventorySearch('');
    setInventoryVendor('');
    setInventoryStatus('');
    setInventoryItemType('');
  };

  const resetAssetFilters = () => {
    setAssetProductSearch('');
    setAssetIdSearch('');
    setAssetUserSearch('');
    setAssetStatus('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
            <ShoppingCart className="text-cyan-400" />
            Received Products &amp; Assets
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage received inventory and track deployed asset lifecycles.</p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package size={16} />
            Received Inventory ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('deployed')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'deployed'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck size={16} />
            Deployed Assets ({deployedAssets.length})
          </button>
        </div>
      </div>

      {/* TAB 1: RECEIVED INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Inventory Search &amp; Filters</h3>
                <p className="text-xs text-slate-500 mt-1">Filter received products without changing the inventory.</p>
              </div>
              <button type="button" onClick={resetInventoryFilters} className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
                <RotateCcw size={15} />
                Reset
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="relative sm:col-span-2 lg:col-span-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} placeholder="Search products..." className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none" />
              </label>
              <select value={inventoryVendor} onChange={(e) => setInventoryVendor(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none">
                <option value="">All vendors</option>
                {vendors.map((vendor) => <option key={vendor} value={vendor}>{vendor}</option>)}
              </select>
              <select value={inventoryStatus} onChange={(e) => setInventoryStatus(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none">
                <option value="">All statuses</option>
                {inventoryStatuses.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
              </select>
              <select value={inventoryItemType} onChange={(e) => setInventoryItemType(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none">
                <option value="">All item types</option>
                <option value="ASSET">Asset</option>
                <option value="CONSUMABLE">Consumable</option>
              </select>
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
                    <th className="p-4 font-semibold text-center">Assigned</th>
                    <th className="p-4 font-semibold text-center">Available</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">Loading...</td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">No received products found.</td>
                    </tr>
                  ) : (
                    filteredProducts.map((product: any) => {
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
                          <td className="p-4 text-center font-mono text-slate-400">{product.assignedQuantity || 0}</td>
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
        </div>
      )}

      {/* TAB 2: DEPLOYED ASSETS */}
      {activeTab === 'deployed' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Deployed Assets Search &amp; Filters</h3>
                <p className="text-xs text-slate-500 mt-1">Search assignments independently from received products.</p>
              </div>
              <button type="button" onClick={resetAssetFilters} className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
                <RotateCcw size={15} />
                Reset
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input value={assetProductSearch} onChange={(e) => setAssetProductSearch(e.target.value)} placeholder="Search by product name" className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none" />
              <input value={assetIdSearch} onChange={(e) => setAssetIdSearch(e.target.value)} placeholder="Search by Asset ID" className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none" />
              <input value={assetUserSearch} onChange={(e) => setAssetUserSearch(e.target.value)} placeholder="Search by assigned user" className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none" />
              <select value={assetStatus} onChange={(e) => setAssetStatus(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none">
                <option value="">All statuses</option>
                {assetStatuses.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-800/80 text-slate-300 font-medium border-b border-slate-700/50">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">Asset ID</th>
                    <th className="p-4">Assigned To (Taken By)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-slate-300">
                  {filteredDeployedAssets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No assets have been deployed yet.
                      </td>
                    </tr>
                  ) : (
                    filteredDeployedAssets.map((asset, index) => {
                      const prodName = asset.productName || products.find((p: any) => p.id === asset.receivedProductId)?.productName || 'Unknown';
                      return (
                      <tr key={index} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-4 font-medium text-slate-200">
                          {prodName}
                        </td>
                        <td className="p-4">
                          {asset.itemType === 'CONSUMABLE' ? (
                            <span className="text-slate-500">-</span>
                          ) : (
                            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-md font-mono text-xs font-semibold">
                              {asset.assetIdentifier || (asset.id ? `AST-${String(asset.id).padStart(4, '0')}` : `AST-${asset.id}`)}
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-medium text-slate-200">{asset.userName}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            asset.status === 'DAMAGED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 
                            asset.status === 'UNDER_REPAIR' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 
                            asset.status === 'CONSUMED' ? 'bg-slate-500/10 text-slate-400 border-slate-500/30' : 
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {asset.status || 'ASSIGNED'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 text-xs items-center">
                            <button onClick={() => openAssetHistory(asset)} className="text-slate-400 hover:text-cyan-400 px-1 py-1 transition-colors font-medium">History</button>
                            
                            {asset.status === 'ASSIGNED' && asset.itemType === 'ASSET' && (
                              <>
                                <span className="text-slate-600">&#183;</span>
                                <button onClick={() => openLifecycleModal(asset, 'damage')} className="text-rose-400 hover:text-rose-300 font-medium">Damage</button>
                                <span className="text-slate-600">&#183;</span>
                                <button onClick={() => openLifecycleModal(asset, 'return')} className="text-amber-400 hover:text-amber-300 font-medium">Return</button>
                              </>
                            )}
                            
                            {asset.status === 'DAMAGED' && asset.itemType === 'ASSET' && (
                              <>
                                <span className="text-slate-600">&#183;</span>
                                <button onClick={() => openLifecycleModal(asset, 'repair')} className="text-amber-400 hover:text-amber-300 font-medium">Repair</button>
                              </>
                            )}
                            
                            {asset.status === 'UNDER_REPAIR' && asset.itemType === 'ASSET' && (
                              <>
                                <span className="text-slate-600">&#183;</span>
                                <button onClick={() => openLifecycleModal(asset, 'complete-repair')} className="text-emerald-400 hover:text-emerald-300 font-medium">Complete Repair</button>
                                <span className="text-slate-600">&#183;</span>
                                <button onClick={() => openLifecycleModal(asset, 'not-repairable')} className="text-rose-400 hover:text-rose-300 font-medium">Scrap</button>
                              </>
                            )}
                            
                            {asset.status === 'ASSIGNED' && asset.itemType === 'CONSUMABLE' && (
                              <>
                                <span className="text-slate-600">&#183;</span>
                                <button onClick={() => openLifecycleModal(asset, 'consume')} className="text-indigo-400 hover:text-indigo-300 font-medium">Consume</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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

      <Modal 
        isOpen={viewHistoryModal} 
        onClose={() => setViewHistoryModal(false)} 
        title={historyType === 'product' ? 'Product Assignment History' : 'Asset Lifecycle History'}
        size="4xl"
      >
        {selectedProduct && (
          <div className="space-y-5">
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{selectedProduct?.productName || selectedProduct?.itemType || 'Product'}</h3>
                {selectedProduct?.vendorName && (
                  <p className="text-slate-400 text-sm">Vendor: <span className="text-slate-200">{selectedProduct?.vendorName}</span></p>
                )}
                {selectedProduct?.assetIdentifier && (
                  <p className="text-slate-400 text-sm font-mono mt-0.5">Asset ID: <span className="text-cyan-400">{selectedProduct?.assetIdentifier}</span></p>
                )}
              </div>
              <div className="flex gap-3 text-sm">
                {historyType === 'product' ? (
                  <>
                    <div className="text-center px-3.5 py-1.5 bg-slate-900/80 rounded-lg border border-slate-700/60">
                      <div className="text-slate-400 text-xs font-medium">Received</div>
                      <div className="text-emerald-400 font-bold font-mono">{selectedProduct?.receivedQuantity ?? '-'}</div>
                    </div>
                    <div className="text-center px-3.5 py-1.5 bg-slate-900/80 rounded-lg border border-slate-700/60">
                      <div className="text-slate-400 text-xs font-medium">Assigned</div>
                      <div className="text-cyan-400 font-bold font-mono">{selectedProduct?.assignedQuantity ?? '-'}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-center px-3.5 py-1.5 bg-slate-900/80 rounded-lg border border-slate-700/60">
                    <div className="text-slate-400 text-xs font-medium">Current Status</div>
                    <div className="text-cyan-400 font-bold font-mono uppercase text-xs mt-0.5">{selectedProduct?.status || 'ASSIGNED'}</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border border-slate-700/60 rounded-xl overflow-hidden shadow-inner bg-slate-950/40">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/70 text-slate-300 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Date &amp; Time</th>
                    <th className="p-3.5">{historyType === 'product' ? 'Status' : 'Event / Action'}</th>
                    <th className="p-3.5">{historyType === 'product' ? 'Assigned Employee' : 'Assigned To'}</th>
                    <th className="p-3.5">{historyType === 'product' ? 'Quantity' : 'Details / Remarks'}</th>
                    {historyType === 'product' && <th className="p-3.5">Asset ID</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingHistory ? (
                    <tr><td colSpan={historyType === 'product' ? 5 : 4} className="p-6 text-center text-slate-400">Loading history records...</td></tr>
                  ) : assignments.length === 0 ? (
                    <tr><td colSpan={historyType === 'product' ? 5 : 4} className="p-6 text-center text-slate-500">No history records found.</td></tr>
                  ) : (
                    assignments.map((a, i) => {
                      const dateStr = a.assignedAt || a.createdAt;
                      const formattedDate = dateStr ? new Date(dateStr).toLocaleString() : '-';
                      const statusVal = a.status || a.eventType || 'ASSIGNED';
                      const userName = a.userName || a.assignedToName || '-';
                      
                      return (
                        <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 text-slate-200 whitespace-nowrap">{formattedDate}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                              statusVal === 'ASSIGNED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              statusVal === 'RETURNED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                              statusVal === 'DAMAGED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                              'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                            }`}>
                              {statusVal}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-200 font-medium">{userName}</td>
                          {historyType === 'product' ? (
                            <>
                              <td className="p-3.5 text-slate-300 font-mono font-medium">{a.quantity ?? 1}</td>
                              <td className="p-3.5">
                                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-md font-mono text-xs font-semibold">
                                  {a.assetIdentifier || (a.id ? `AST-${String(a.id).padStart(4, '0')}` : (a.assignmentId ? `AST-${String(a.assignmentId).padStart(4, '0')}` : '-'))}
                                </span>
                              </td>
                            </>
                          ) : (
                            <td className="p-3.5 text-slate-400 text-sm max-w-sm" title={a.description}>{a.description || '-'}</td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end pt-2">
              <button 
                type="button"
                onClick={() => setViewHistoryModal(false)} 
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={returnModalOpen} onClose={() => setReturnModalOpen(false)} title="Return Product">
        {selectedProduct && (
          <form onSubmit={handleReturn} className="space-y-6">
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 mb-6">
              <h3 className="text-lg font-bold text-slate-200 mb-2">{selectedProduct?.productName}</h3>
              <p className="text-slate-400 text-sm">Available to return: {selectedProduct?.receivedQuantity - selectedProduct?.assignedQuantity}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quantity to Return</label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.receivedQuantity - selectedProduct?.assignedQuantity}
                value={returnData.quantity}
                onChange={(e: any) => setReturnData({ quantity: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-cyan-500"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setReturnModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-slate-300">Cancel</button>
              <button type="submit" disabled={submitting} className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg disabled:opacity-50">
                {submitting ? 'Returning...' : 'Return'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={lifecycleModalOpen} onClose={() => setLifecycleModalOpen(false)} title={`Action: ${lifecycleAction.replace('-', ' ')}`}>
        {selectedProduct && (
          <form onSubmit={submitLifecycleAction} className="space-y-6">
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 mb-6">
              <h3 className="text-lg font-bold text-slate-200 mb-2">{products.find((p:any) => p.id === selectedProduct?.receivedProductId)?.productName}</h3>
              <p className="text-slate-400 text-sm">Asset ID: {selectedProduct?.assetIdentifier || selectedProduct?.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description / Reason</label>
              <textarea
                value={lifecycleDesc}
                onChange={(e: any) => setLifecycleDesc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-cyan-500 h-24"
                placeholder={`Reason for ${lifecycleAction.replace('-', ' ')}...`}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setLifecycleModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-slate-300">Cancel</button>
              <button type="submit" disabled={submitting} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 capitalize">
                {submitting ? 'Processing...' : lifecycleAction.replace('-', ' ')}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ReceivedProducts;

