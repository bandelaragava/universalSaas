import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Receipt.tsx", "r", encoding="utf-8") as f:
    print(f.read()[0:1500])
