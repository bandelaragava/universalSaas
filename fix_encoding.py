with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\integrations\IntegrationsPage.tsx", "rb") as f:
    content_bytes = f.read()

try:
    content_str = content_bytes.decode('utf-8')
except UnicodeDecodeError:
    content_str = content_bytes.decode('cp1252', errors='replace')

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\integrations\IntegrationsPage.tsx", "w", encoding="utf-8") as f:
    f.write(content_str)
print("Resaved IntegrationsPage as UTF-8")
