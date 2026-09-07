import sys

with open(r'C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the Action column in the table to have both Receive and Assign buttons.

old_td = '''<td className="px-4 py-2">
                            {rp.availableQuantity > 0 && (
                              <button onClick={() => { setAssignData({ receivedProductId: rp.id, quantity: 1, userId: '' }); setIsAssignOpen(true); }} className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-1 rounded cursor-pointer">Assign</button>
                            )}
                          </td>'''

new_td = '''<td className="px-4 py-2 flex gap-2">
                            {rp.receivedQuantity < item.quantity && (
                              <button onClick={async () => {
                                 const q = prompt("Enter quantity to receive:", "1");
                                 if(q && !isNaN(parseInt(q))) {
                                    await rolesApi.post(/vendors/received-products/receive/?quantity=);
                                    fetchReceivedProducts(selectedReq!.id);
                                 }
                              }} className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded cursor-pointer">Receive</button>
                            )}
                            {rp.availableQuantity > 0 && (
                              <button onClick={() => { setAssignData({ receivedProductId: rp.id, quantity: 1, userId: '' }); setIsAssignOpen(true); }} className="text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-1 rounded cursor-pointer">Assign</button>
                            )}
                          </td>'''

content = content.replace(old_td, new_td)

with open(r'C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

