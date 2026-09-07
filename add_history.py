with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Let's add state for viewing assignments
content = content.replace(
    "const [submitting, setSubmitting] = useState(false);",
    "const [submitting, setSubmitting] = useState(false);\n  const [viewHistoryModal, setViewHistoryModal] = useState(false);\n  const [assignments, setAssignments] = useState<any[]>([]);\n  const [loadingHistory, setLoadingHistory] = useState(false);"
)

# Let's add the fetch assignments function
fetch_assignments_code = """
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
"""
content = content.replace(
    "const openAssignModal = (product: any) => {",
    fetch_assignments_code + "\n  const openAssignModal = (product: any) => {"
)

# Let's add the History button next to Assign
old_actions = """<td className="p-4 text-right">
                        {available > 0 ? (
                          <button
                            onClick={() => openAssignModal(product)}
                            className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                          >
                            <UserCheck size={16} />
                            Assign
                          </button>
                        ) : (
                          <span className="text-slate-500 text-sm italic">Assigned</span>
                        )}
                      </td>"""
                      
new_actions = """<td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
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
                      </td>"""
                      
content = content.replace(old_actions, new_actions)

# Let's add the History Modal JSX at the end of the file, before the last </div>
history_modal_jsx = """
      <Modal isOpen={viewHistoryModal} onClose={() => setViewHistoryModal(false)} title="Assignment History">
        {selectedProduct && (
          <div className="space-y-4">
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-bold text-slate-200">{selectedProduct?.productName}</h3>
              <p className="text-slate-400 text-sm">Total Assigned: {selectedProduct?.assignedQuantity}</p>
            </div>
            
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/50 text-slate-400">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {loadingHistory ? (
                    <tr><td colSpan={3} className="p-4 text-center text-slate-400">Loading...</td></tr>
                  ) : assignments.length === 0 ? (
                    <tr><td colSpan={3} className="p-4 text-center text-slate-400">No assignments yet.</td></tr>
                  ) : (
                    assignments.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="p-3 text-slate-200">{a.userName}</td>
                        <td className="p-3 text-center font-mono text-cyan-400">{a.quantity}</td>
                        <td className="p-3 text-right text-slate-400">{new Date(a.assignedAt).toLocaleDateString()}</td>
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
"""
content = content.replace("</Modal>\n    </div>", "</Modal>\n" + history_modal_jsx + "\n    </div>")

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Added Assignment History UI")
