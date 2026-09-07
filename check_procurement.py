import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Procurement.tsx", "r", encoding="utf-8") as f:
    content = f.read()
    print([line for line in content.split('\n') if 'Received' in line or 'received' in line])
