with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx", "r", encoding="utf-8") as f:
    content = f.read()
    
# Let's see the useEffects
import re
matches = re.finditer(r'useEffect\(\(\) => \{', content)
for m in matches:
    print(f"useEffect found at index {m.start()}")
