import re

path = r'C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace thead
thead_pattern = r'<thead className="bg-slate-800/50 border-b border-slate-700/50 text-slate-400">[\s\S]*?</thead>'
new_thead = """<thead className="bg-slate-800/50 border-b border-slate-700/50 text-slate-400">
                      <tr>
                        <th className="px-4 py-2 font-medium">Item</th>
                        <th className="px-4 py-2 font-medium">Required</th>
                        <th className="px-4 py-2 font-medium">Received</th>
                        <th className="px-4 py-2 font-medium">Assigned</th>
                        <th className="px-4 py-2 font-medium">Available</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 font-medium">Action</th>
                      </tr>
                    </thead>"""
c = re.sub(thead_pattern, new_thead, c)

# Replace tbody
tbody_pattern = r'<tbody className="divide-y divide-slate-700/50">[\s\S]*?</tbody>'
new_tbody = """<tbody className="divide-y divide-slate-700/50">
                      {selectedReq.items && selectedReq.items.length > 0 ? selectedReq.items.map((item: any, idx) => {
                        const rp = receivedProducts.find(r => r.productName === item.itemName || r.requirementItemId === item.id) || {
                           receivedQuantity: 0, assignedQuantity: 0, availableQuantity: 0, status: 'NOT_RECEIVED', id: 0
                        };
                        return (
                        <tr key={idx} className="bg-slate-900/30">
                          <td className="px-4 py-2 text-slate-250 font-medium">{item.itemName}</td>
                          <td className="px-4 py-2 text-slate-250">{item.quantity}</td>
                          <td className="px-4 py-2 text-slate-250">{rp.receivedQuantity}</td>
                          <td className="px-4 py-2 text-slate-250">{rp.assignedQuantity}</td>
                          <td className="px-4 py-2 text-slate-250">{rp.availableQuantity}</td>
                          <td className="px-4 py-2 text-slate-250 text-xs">
                             <span className={`px-2 py-1 rounded-full border ${rp.status.includes('PARTIAL') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : rp.status.includes('NOT') ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{rp.status.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="px-4 py-2 flex gap-2">
                            {rp.receivedQuantity < item.quantity && (
                              <button onClick={async () => {
                                 const q = prompt("Enter quantity to receive:", "1");
                                 if(q && !isNaN(parseInt(q))) {
                                    await rolesApi.post(`/vendors/received-products/receive/${item.id}?quantity=${parseInt(q)}`);
                                    fetchReceivedProducts(selectedReq!.id);
                                 }
                              }} className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded cursor-pointer">Receive</button>
                            )}
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
                    </tbody>"""
c = re.sub(tbody_pattern, new_tbody, c)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("Replaced table")
