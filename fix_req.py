import re

with open(r'C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix the rolesApi.get
c = c.replace('rolesApi.get(/vendors/received-products/requirement/);', 'rolesApi.get(`/vendors/received-products/requirement/${reqId}`);')

# Fix the rolesApi.post for assignment
# Actually, let's just find the exact string that was broken and fix it.
# Because the previous powershell script swallowed backticks, let's see what it wrote for handleAssign
# await rolesApi.post(/vendors/received-products//assign, {

c = re.sub(r'rolesApi\.post\(/vendors/received-products//assign', r'rolesApi.post(`/vendors/received-products/${assignData.receivedProductId}/assign`', c)

# Fix the status classname
# <span className={px-2 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20}>
c = re.sub(r'className=\{([^}]+)\}>\{rp\.status\.replace', r'className={`px-2 py-1 rounded-full border ${rp.status.includes("PARTIAL") ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : rp.status.includes("NOT") ? "bg-slate-500/10 text-slate-400 border-slate-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>{rp.status.replace', c)

with open(r'C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

