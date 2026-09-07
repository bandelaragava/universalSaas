const fs = require('fs');

const path = "C:\\Users\\ASUS\\Downloads\\universalSaas\\universalSaas\\src\\pages\\vendor\\ReceivedProducts.tsx";
let content = fs.readFileSync(path, 'utf8');

// Add deployedAssets state and fetch it
if (!content.includes('const [deployedAssets, setDeployedAssets]')) {
  content = content.replace("const [products, setProducts] = useState<any[]>([]);\n", 
  "const [products, setProducts] = useState<any[]>([]);\n  const [deployedAssets, setDeployedAssets] = useState<any[]>([]);\n");

  const fetchRepl = `const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await rolesApi.get('/vendors/received-products');
      const data = res.data?.data?.content || res.data?.data || [];
      setProducts(data);
      
      const assetRes = await rolesApi.get('/vendors/received-products/assignments');
      const assetData = assetRes.data?.data?.content || assetRes.data?.data || [];
      setDeployedAssets(assetData);
    } catch (error) {`;
  content = content.replace(/const fetchProducts = async \(\) => \{\s*try \{\s*setLoading\(true\);\s*const res = await rolesApi\.get\('\/vendors\/received-products'\);\s*const data = res\.data\?\.data\?\.content \|\| res\.data\?\.data \|\| \[\];\s*setProducts\(data\);\s*\} catch \(error\) \{/s, fetchRepl);

  // Add the new lifecycle action functions
  const lifecycleFuncs = `
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
      await rolesApi.post(\`/vendors/received-products/assignments/\${selectedProduct?.id}/\${lifecycleAction}\`, {
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
      const res = await rolesApi.get(\`/vendors/received-products/assignments/\${assignment.id}/history\`);
      const data = res.data?.data?.content || res.data?.data || [];
      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };
`;
  content = content.replace("const openAssignModal = (product: any) => {", lifecycleFuncs + "\n  const openAssignModal = (product: any) => {");

  // Modify History modal logic since we reassigned its endpoint
  content = content.replace("const res = await rolesApi.get(`/vendors/received-products/${product.id}/assignments`);", "// old history logic removed");

  const deployedAssetsUi = `
      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Settings size={20} className="text-cyan-400" />
          Deployed Assets
        </h2>
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-800/80 text-slate-300 font-medium border-b border-slate-700/50">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Asset ID</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-300">
                {deployedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No assets have been deployed yet.
                    </td>
                  </tr>
                ) : (
                  deployedAssets.map((asset, index) => {
                    const prodName = products.find(p => p.id === asset.receivedProductId)?.productName || 'Unknown';
                    return (
                    <tr key={index} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-4 font-medium text-slate-200">
                        {prodName}
                      </td>
                      <td className="p-4">
                        {asset.itemType === 'CONSUMABLE' ? '-' : (asset.assetIdentifier || \`Asset #\${asset.id}\`)}
                      </td>
                      <td className="p-4">{asset.userName}</td>
                      <td className="p-4">
                        <span className={\`px-2.5 py-1 text-xs font-semibold rounded-full border \${
                          asset.status === 'DAMAGED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 
                          asset.status === 'UNDER_REPAIR' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 
                          asset.status === 'CONSUMED' ? 'bg-slate-500/10 text-slate-400 border-slate-500/30' : 
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }\`}>
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
  `;

  content = content.replace("      {/* Tables */}", "      {/* Tables */}");
  content = content.replace("</div>\n\n      {/* Modals */}", deployedAssetsUi + "\n    </div>\n\n      {/* Modals */}");

  const lifecycleModalUi = `
      <Modal isOpen={lifecycleModalOpen} onClose={() => setLifecycleModalOpen(false)} title={\`Action: \${lifecycleAction.replace('-', ' ').toUpperCase()}\`}>
        <form onSubmit={submitLifecycleAction} className="space-y-6">
          <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 mb-6">
            <h3 className="text-lg font-bold text-slate-200 mb-2">Asset #{selectedProduct?.id}</h3>
            <p className="text-slate-400 text-sm">Assigned To: {selectedProduct?.userName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description / Reason</label>
            <textarea
              rows={3}
              value={lifecycleDesc}
              onChange={(e) => setLifecycleDesc(e.target.value)}
              placeholder="Provide details for this action..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setLifecycleModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors">
              {submitting ? 'Processing...' : 'Confirm Action'}
            </button>
          </div>
        </form>
      </Modal>
  `;
  content = content.replace("</Modal>\n    </div>", "</Modal>\n" + lifecycleModalUi + "\n    </div>");

  const historyModalOld = /\{loadingHistory \?\s*\(\s*<tr><td colSpan=\{3\} className="p-4 text-center text-slate-400">Loading\.\.\.<\/td><\/tr>\s*\)\s*:\s*assignments\.length === 0 \?\s*\(\s*<tr><td colSpan=\{3\} className="p-4 text-center text-slate-400">No assignments yet\.<\/td><\/tr>\s*\)\s*:\s*\(\s*assignments\.map\(\(a, i\) => \(\s*<tr key=\{i\} className="hover:bg-slate-800\/30">\s*<td className="p-3 text-slate-200">\{a\.userName\}<\/td>\s*<td className="p-3 text-center font-mono text-cyan-400">\{a\.quantity\}<\/td>\s*<td className="p-3 text-right text-slate-400">\{new Date\(a\.assignedAt\)\.toLocaleDateString\(\)\}<\/td>\s*<\/tr>\s*\)\)\s*\)\}/s;

  const historyModalNew = `{loadingHistory ? (
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
                  )}`;

  content = content.replace(historyModalOld, historyModalNew);

  const headersOld = `<tr>
                    <th className="p-3">User</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3 text-right">Date</th>
                  </tr>`;
  const headersNew = `<tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Assigned To</th>
                    <th className="p-3">Details</th>
                  </tr>`;
  content = content.replace(headersOld, headersNew);
                  
  content = content.replace("Total Assigned: {selectedProduct?.assignedQuantity}", "Quantity: {selectedProduct?.quantity || 1}");

  fs.writeFileSync(path, content, 'utf8');
  console.log("Updated ReceivedProducts UI");
} else {
  console.log("Already updated");
}
