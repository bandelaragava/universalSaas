with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add itemType to the items state
content = content.replace("name: '', quantity: 1, unit: 'pcs'", "name: '', quantity: 1, unit: 'pcs', itemType: 'ASSET'")
content = content.replace("item.name, item.brand, item.quantity, item.unit", "item.name, item.brand, item.quantity, item.unit, item.itemType")
content = content.replace("brand: i.brand, quantity: i.quantity, unit: i.unit", "brand: i.brand, quantity: i.quantity, unit: i.unit, itemType: i.itemType || 'ASSET'")

# Add Item Type dropdown in the form (around line where Brand is)
item_type_field = """<div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Item Type</label>
                        <select
                          value={item.itemType}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[index].itemType = e.target.value;
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        >
                          <option value="ASSET">Asset (e.g. Laptop, Monitor)</option>
                          <option value="CONSUMABLE">Consumable (e.g. Pen, Paper)</option>
                        </select>
                      </div>"""

content = content.replace("""<div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Brand (Optional)</label>""", item_type_field + """\n                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Brand (Optional)</label>""")

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Requirements.tsx")
