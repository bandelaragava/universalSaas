with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Receipt.tsx", "r", encoding="utf-8") as f:
    rp_content = f.read()

import re
matches = re.finditer(r'fetch\w*\(', rp_content)
for m in matches:
    start = max(0, m.start() - 50)
    end = min(len(rp_content), m.end() + 150)
    print("---")
    print(rp_content[start:end])
