import re

file_path = r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update assignData state
content = content.replace(
    "const [assignData, setAssignData] = useState({ receivedProductId: 0, quantity: 1, userId: '' });",
    "const [assignData, setAssignData] = useState({ receivedProductId: 0, quantity: 1, userId: '', itemName: '', available: 0 });"
)

# Add fetchUsers
fetch_users_code = """
  const fetchUsers = async () => {
    try {
      const res = await rolesApi.get('/users?size=100');
      if(res.data.data.content) {
         setUsers(res.data.data.content);
      }
    } catch (e) {
      console.error("Error fetching users", e);
    }
  };
"""

content = content.replace(
    "const fetchReceivedProducts = async (reqId: string | number) => {",
    fetch_users_code + "\n  const fetchReceivedProducts = async (reqId: string | number) => {"
)

# Add fetchUsers to useEffect
content = content.replace(
    "fetchVendors();\n    }, 0);",
    "fetchVendors();\n      fetchUsers();\n    }, 0);"
)

# Update onClick for Assign button
old_onclick = "onClick={() => { setAssignData({ receivedProductId: rp.id, quantity: 1, userId: '' }); setIsAssignOpen(true); }}"
new_onclick = "onClick={() => { setAssignData({ receivedProductId: rp.id, quantity: 1, userId: '', itemName: item.itemName, available: rp.availableQuantity }); setIsAssignOpen(true); }}"
content = content.replace(old_onclick, new_onclick)

# Update Modal UI
old_modal_start = """<Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Assign Product to User">
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Select User</label>"""
              
new_modal_start = """<Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Assign Product to User">
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-sm">Product</span>
                <span className="font-semibold text-slate-200">{assignData.itemName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Available</span>
                <span className="font-semibold text-emerald-400">{assignData.available}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Select User</label>"""

content = content.replace(old_modal_start, new_modal_start)

# Update quantity input to use assignData.available as max
content = content.replace(
    """<input type="number" required min="1" value={assignData.quantity} onChange={e => setAssignData({...assignData, quantity: parseInt(e.target.value) || 1})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />""",
    """<input type="number" required min="1" max={assignData.available} value={assignData.quantity} onChange={e => setAssignData({...assignData, quantity: parseInt(e.target.value) || 1})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />"""
)

# Update the table column rendering to also show remaining
# First add "Remaining" column header
content = content.replace(
    """<th className="px-4 py-2 font-medium">Available</th>
                          <th className="px-4 py-2 font-medium">Status</th>""",
    """<th className="px-4 py-2 font-medium">Available</th>
                          <th className="px-4 py-2 font-medium">Pending</th>
                          <th className="px-4 py-2 font-medium">Status</th>"""
)

# Then add the data cell for Pending
# pendingQuantity = requiredQuantity - receivedQuantity
old_row_data = """<td className="px-4 py-2 text-slate-250">{rp.assignedQuantity}</td>
                            <td className="px-4 py-2 text-slate-250">{rp.availableQuantity}</td>
                            <td className="px-4 py-2 text-slate-250 text-xs">"""

new_row_data = """<td className="px-4 py-2 text-slate-250">{rp.assignedQuantity}</td>
                            <td className="px-4 py-2 text-slate-250">{rp.availableQuantity}</td>
                            <td className="px-4 py-2 text-slate-250">{Math.max(0, item.quantity - rp.receivedQuantity)}</td>
                            <td className="px-4 py-2 text-slate-250 text-xs">"""
content = content.replace(old_row_data, new_row_data)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("UI Fixed successfully!")
