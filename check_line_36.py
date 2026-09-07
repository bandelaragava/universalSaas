with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(25, 45):
    if i < len(lines):
        print(f"{i+1}: {lines[i].rstrip()}")
