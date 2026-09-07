with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "setUsers" in line or "users" in line:
        print(f"{i+1}: {line.strip()}")
