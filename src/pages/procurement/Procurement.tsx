/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';
import { motion } from 'framer-motion';
import { Package, Plus, Trash2, User, DollarSign, CalendarDays } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Modal from '@/components/ui/Modal';

interface Asset {
  id: number | string;
  poNumber: string;
  vendorId: number | string;
  vendorName: string;
  item?: string;
  items?: Array<{
    itemDescription: string;
    brand: string;
    quantity: number;
    price: number;
  }>;
  date: string;
  deliveryDate: string;
  status: string;
  notes?: string;
  totalAmount?: number;
  amountFormatted?: string;
}

interface Vendor {
  id: number | string;
  vendorName: string;
}

export default function Procurement() {
  const { searchQuery } = useAppStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isViewAssetOpen, setIsViewAssetOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [newAsset, setNewAsset] = useState({ vendorId: '', name: '', cost: '', date: '', notes: '' });

  const fetchAssets = async () => {
    try {
      const res = await rolesApi.get('/purchase-orders');
      if (res.data && res.data.data) {
        setAssets(res.data.data);
      }
    } catch (e) { console.error("Error fetching assets", e); }
  };

  const fetchVendors = async () => {
    try {
      const response = await rolesApi.get('/vendors');
      if (response.data && response.data.data) {
        setVendors(response.data.data.content || response.data.data);
      }
    } catch (error) { console.error("Error fetching vendors", error); }
  };

  useEffect(() => {
    fetchAssets();
    fetchVendors();
  }, []);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        poNumber: `AST-${Math.floor(Math.random() * 9000) + 1000}`,
        vendorId: newAsset.vendorId,
        items: [{
          itemDescription: newAsset.name,
          brand: 'N/A',
          quantity: 1,
          price: parseFloat(newAsset.cost)
        }],
        date: newAsset.date || new Date().toISOString().split('T')[0],
        deliveryDate: 'N/A',
        status: 'Delivered',
        notes: newAsset.notes || '',
        totalAmount: parseFloat(newAsset.cost)
      };
      await rolesApi.post('/purchase-orders', payload);
      fetchAssets();
      setNewAsset({ vendorId: '', name: '', cost: '', date: '', notes: '' });
      setIsAddAssetOpen(false);
    } catch (e) { console.error("Error creating asset", e); }
  };

  const handleDeleteAsset = async (id: number | string) => {
    if (window.confirm('Are you sure you want to delete this Asset?')) {
      try {
        await rolesApi.delete(`/purchase-orders/${id}`);
        fetchAssets();
        setIsViewAssetOpen(false);
      } catch (e) { console.error("Error deleting asset", e); }
    }
  };

  const filteredAssets = assets.filter(a =>
    (a.poNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.item || (a.items && a.items[0]?.itemDescription) || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-50">Vendor Assets</h2>
          <p className="text-slate-400 text-sm mt-1">Directly add and manage acquired assets</p>
        </div>
        <button onClick={() => setIsAddAssetOpen(true)} className="btn-primary flex items-center shrink-0 w-full sm:w-auto justify-center cursor-pointer">
          <Plus size={16} className="mr-2" />
          Add Asset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAssets.map((asset) => {
          const assetName = asset.item || (asset.items && asset.items[0]?.itemDescription) || 'Unknown Asset';
          const cost = asset.amountFormatted || `₹${asset.totalAmount || 0}`;

          return (
            <div
              key={asset.id}
              onClick={() => { setSelectedAsset(asset); setIsViewAssetOpen(true); }}
              className="glass-card p-5 cursor-pointer relative overflow-hidden group border border-slate-800"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Package size={64} className="text-cyan-500" />
              </div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md">{asset.poNumber}</span>
                <span className="text-xs text-slate-400">{asset.date}</span>
              </div>

              <h3 className="text-lg font-bold text-slate-50 mb-1 relative z-10 truncate" title={assetName}>{assetName}</h3>
              <div className="flex items-center text-sm text-slate-400 mb-4 relative z-10">
                <User size={14} className="mr-1.5" />
                <span className="truncate">{asset.vendorName}</span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-700/50 relative z-10">
                <span className="text-slate-300 text-xs">Cost</span>
                <span className="font-semibold text-emerald-400">{cost}</span>
              </div>
            </div>
          );
        })}
        {filteredAssets.length === 0 && (
          <div className="col-span-full py-12 text-center bg-muted/40 rounded-xl border border-border">
            <Package size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-300">No assets found</h3>
            <p className="text-slate-500 mt-1">Click "Add Asset" to start tracking.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isAddAssetOpen} onClose={() => setIsAddAssetOpen(false)} title="Add New Asset">
        <form className="space-y-4" onSubmit={handleAddAsset}>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Asset Name *</label>
            <input
              type="text"
              className="input-field"
              required
              placeholder="e.g. MacBook Pro M3"
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Vendor *</label>
            <select className="input-field text-foreground bg-background border-border" required value={newAsset.vendorId} onChange={(e) => setNewAsset({ ...newAsset, vendorId: e.target.value })}>
              <option value="" className="bg-background">Select Vendor...</option>
              {vendors.map(v => <option key={v.id} value={v.id} className="bg-background">{v.vendorName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Cost *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field pl-8"
                  required
                  placeholder="0.00"
                  value={newAsset.cost}
                  onChange={(e) => setNewAsset({ ...newAsset, cost: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Acquired Date</label>
              <input
                type="date"
                className="input-field text-slate-400"
                value={newAsset.date}
                onChange={(e) => setNewAsset({ ...newAsset, date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              rows={3}
              className="input-field resize-none"
              placeholder="Serial numbers, warranty info, etc..."
              value={newAsset.notes}
              onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-700/50 mt-4">
            <button type="button" onClick={() => setIsAddAssetOpen(false)} className="btn-secondary cursor-pointer">Cancel</button>
            <button type="submit" className="btn-primary cursor-pointer">Add Asset</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewAssetOpen} onClose={() => setIsViewAssetOpen(false)} title="Asset Details">
        {selectedAsset && (
          <div className="space-y-5">
            <div className="flex items-start justify-between border-b border-slate-700/50 pb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 block mb-1">{selectedAsset.poNumber}</span>
                <h3 className="text-xl font-bold text-slate-50">{selectedAsset.item || (selectedAsset.items && selectedAsset.items[0]?.itemDescription) || 'Unknown Asset'}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-800 rounded-lg shrink-0"><User size={14} className="text-cyan-400" /></div>
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Vendor</p>
                  <p className="text-slate-200 font-medium">{selectedAsset.vendorName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-800 rounded-lg shrink-0"><DollarSign size={14} className="text-emerald-400" /></div>
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Cost</p>
                  <p className="text-slate-200 font-semibold">{selectedAsset.amountFormatted || `₹${selectedAsset.totalAmount || 0}`}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-800 rounded-lg shrink-0"><CalendarDays size={14} className="text-amber-400" /></div>
                <div>
                  <p className="text-slate-500 text-xs mb-0.5">Acquired Date</p>
                  <p className="text-slate-200 font-medium">{selectedAsset.date}</p>
                </div>
              </div>
            </div>

            {selectedAsset.notes && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-300">{selectedAsset.notes}</p>
              </div>
            )}

            <div className="pt-2 flex justify-between items-center border-t border-slate-700/50">
              <button
                onClick={() => handleDeleteAsset(selectedAsset.id)}
                className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={15} /> Delete Asset
              </button>
              <button onClick={() => setIsViewAssetOpen(false)} className="btn-secondary cursor-pointer">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}





