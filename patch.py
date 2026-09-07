import sys

with open(r'C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add users state fetch
fetch_users_logic = '''
  useEffect(() => {
    fetchRequirements();
    fetchVendors();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await rolesApi.get('/users');
      setUsers(res.data.data.content || res.data.data);
    } catch (e) {
      console.error("Error fetching users", e);
    }
  };
'''

content = content.replace('''  useEffect(() => {
    fetchRequirements();
    fetchVendors();
  }, []);''', fetch_users_logic)

# Add fetchReceivedProducts
fetch_rec_prod_logic = '''
  const fetchReceivedProducts = async (reqId: string | number) => {
    try {
      const res = await rolesApi.get(/vendors/received-products/requirement/);
      setReceivedProducts(res.data.data || []);
    } catch (e) {
      console.error("Error fetching received products", e);
    }
  };

  useEffect(() => {
    if (isViewReqOpen && selectedReq) {
      fetchReceivedProducts(selectedReq.id);
    }
  }, [isViewReqOpen, selectedReq]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await rolesApi.post(/vendors/received-products//assign, {
        userId: parseInt(assignData.userId),
        quantity: assignData.quantity
      });
      setIsAssignOpen(false);
      if (selectedReq) fetchReceivedProducts(selectedReq.id);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to assign product");
    } finally {
      setIsSubmitting(false);
    }
  };
'''

content = content.replace('const [vendors, setVendors] = useState<Vendor[]>([]);', 'const [vendors, setVendors] = useState<Vendor[]>([]);\n' + fetch_rec_prod_logic)

# Replace the table header
new_thead = '''
                    <thead className="bg-slate-800/50 border-b border-slate-700/50 text-slate-400">
                      <tr>
                        <th className="px-4 py-2 font-medium">Item</th>
                        <th className="px-4 py-2 font-medium">Required</th>
                        <th className="px-4 py-2 font-medium">Received</th>
                        <th className="px-4 py-2 font-medium">Assigned</th>
                        <th className="px-4 py-2 font-medium">Available</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 font-medium">Action</th>
                      </tr>
                    </thead>
'''

content = content.replace('''                    <thead className="bg-slate-800/50 border-b border-slate-700/50 text-slate-400">
                      <tr>
                        <th className="px-4 py-2 font-medium">Item Name</th>
                        <th className="px-4 py-2 font-medium">Brand</th>
                        <th className="px-4 py-2 font-medium">Quantity</th>
                        <th className="px-4 py-2 font-medium">Unit</th>
                      </tr>
                    </thead>''', new_thead)


# Replace the table body
new_tbody = '''
                    <tbody className="divide-y divide-slate-700/50">
                      {selectedReq.items && selectedReq.items.length > 0 ? selectedReq.items.map((item: any, idx) => {
                        const rp = receivedProducts.find(r => r.productName === item.itemName || r.requirementItemId === item.id) || {
                           receivedQuantity: 0, assignedQuantity: 0, availableQuantity: 0, status: 'NOT_RECEIVED'
                        };
                        return (
                        <tr key={idx} className="bg-slate-900/30">
                          <td className="px-4 py-2 text-slate-250 font-medium">{item.itemName}</td>
                          <td className="px-4 py-2 text-slate-250">{item.quantity}</td>
                          <td className="px-4 py-2 text-slate-250">{rp.receivedQuantity}</td>
                          <td className="px-4 py-2 text-slate-250">{rp.assignedQuantity}</td>
                          <td className="px-4 py-2 text-slate-250">{rp.availableQuantity}</td>
                          <td className="px-4 py-2 text-slate-250 text-xs">
                             <span className={px-2 py-1 rounded-full border }>{rp.status.replace('_', ' ')}</span>
                          </td>
                          <td className="px-4 py-2">
                            {rp.availableQuantity > 0 && (
                              <button onClick={() => { setAssignData({ receivedProductId: rp.id, quantity: 1, userId: '' }); setIsAssignOpen(true); }} className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-1 rounded cursor-pointer">Assign</button>
                            )}
                          </td>
                        </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 text-center text-slate-500">No items specified.</td>
                        </tr>
                      )}
                    </tbody>
'''

content = content.replace('''                    <tbody className="divide-y divide-slate-700/50">
                      {selectedReq.items && selectedReq.items.length > 0 ? selectedReq.items.map((item, idx) => (
                        <tr key={idx} className="bg-slate-900/30">
                          <td className="px-4 py-2 text-slate-250 font-medium">{item.itemName}</td>
                          <td className="px-4 py-2 text-slate-350">{item.brand || '-'}</td>
                          <td className="px-4 py-2 text-slate-250">{item.quantity}</td>
                          <td className="px-4 py-2 text-slate-400">{item.unit || '-'}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-center text-slate-500">No items specified.</td>
                        </tr>
                      )}
                    </tbody>''', new_tbody)

# Add Assignment Modal at the end before </motion.div>
assignment_modal = '''
      <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Assign Product to User">
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Select User</label>
            <select required value={assignData.userId} onChange={e => setAssignData({...assignData, userId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
              <option value="">Select a user...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Quantity</label>
            <input type="number" required min="1" value={assignData.quantity} onChange={e => setAssignData({...assignData, quantity: parseInt(e.target.value) || 1})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
          </div>
          <div className="pt-3 flex justify-end gap-3 border-t border-slate-700/50">
            <button type="button" onClick={() => setIsAssignOpen(false)} className="btn-secondary cursor-pointer" disabled={isSubmitting}>Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary cursor-pointer">{isSubmitting ? 'Assigning...' : 'Assign'}</button>
          </div>
        </form>
      </Modal>
'''

content = content.replace('    </motion.div>', assignment_modal + '\n    </motion.div>')

with open(r'C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

