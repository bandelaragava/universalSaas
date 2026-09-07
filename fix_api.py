with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace api import with rolesApi
content = content.replace("import api from '@/services/api';", "import rolesApi from '@/services/rolesApi';")

# Replace api.get with rolesApi.get
content = content.replace("await api.get(", "await rolesApi.get(")
content = content.replace("await api.post(", "await rolesApi.post(")

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Replaced api with rolesApi in ReceivedProducts.tsx")
