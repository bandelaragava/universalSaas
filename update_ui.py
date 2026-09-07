with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add Return Modal state
state_repl = """  const [loadingHistory, setLoadingHistory] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnData, setReturnData] = useState({ quantity: 1 });"""
content = content.replace("const [loadingHistory, setLoadingHistory] = useState(false);", state_repl)

# Add Return action functions
funcs = """
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
"""
content = content.replace("const handleAssign = async (e: any) => {", funcs + "\n  const handleAssign = async (e: any) => {")

# Add Return button in Actions
btn_repl = """<div className="flex justify-end gap-2">
                          {available > 0 && (
                            <button
                              onClick={() => openReturnModal(product)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                              title="Return damaged or rejected products to vendor"
                            >
                              Return
                            </button>
                          )}
                          <button"""
content = content.replace("""<div className="flex justify-end gap-2">
                          <button""", btn_repl)

# Add Return Modal UI at the bottom
return_modal = """
      <Modal isOpen={returnModalOpen} onClose={() => setReturnModalOpen(false)} title="Return to Vendor">
        {selectedProduct && (
          <form onSubmit={handleReturn} className="space-y-6">
            <div className="bg-rose-900/20 p-4 rounded-xl border border-rose-700/50 mb-6">
              <h3 className="text-lg font-bold text-rose-200 mb-2">Return {selectedProduct?.productName}</h3>
              <p className="text-rose-300/70 text-sm">Return damaged or rejected items back to {selectedProduct?.vendorName}.</p>
              <div className="mt-2 text-sm font-medium text-emerald-400">
                Available to return: {selectedProduct?.receivedQuantity - selectedProduct?.assignedQuantity}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quantity to Return</label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.receivedQuantity - selectedProduct?.assignedQuantity}
                value={returnData.quantity}
                onChange={(e: any) => setReturnData({ quantity: parseInt(e.target.value as string) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setReturnModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50">
                {submitting ? 'Returning...' : 'Return'}
              </button>
            </div>
          </form>
        )}
      </Modal>
"""
content = content.replace("</Modal>\n    </div>", "</Modal>\n" + return_modal + "\n    </div>")

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated UI")
