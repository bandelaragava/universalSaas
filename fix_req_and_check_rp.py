with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx", "r", encoding="utf-8") as f:
    req_content = f.read()

# Fix user fetch
req_content = req_content.replace(
    "if(res.data.data.content) {\n         setUsers(res.data.data.content);\n      }",
    "setUsers(res.data.data || []);"
)

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx", "w", encoding="utf-8") as f:
    f.write(req_content)

print("Fixed Requirements.tsx users fetch")

# Read ReceivedProducts.tsx
with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\ReceivedProducts.tsx", "r", encoding="utf-8") as f:
    rp_content = f.read()

import re
matches = re.finditer(r'fetch\w*\(', rp_content)
for m in matches:
    start = max(0, m.start() - 50)
    end = min(len(rp_content), m.end() + 150)
    print("---")
    print(rp_content[start:end])
