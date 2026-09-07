with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("// old history logic removed", "const res = await rolesApi.get(`/vendors/received-products/${product.id}/assignments`);")
content = content.replace("parseInt(assignData.quantity as string)", "Number(assignData.quantity)")
content = content.replace("parseInt(assignData.userId as string)", "Number(assignData.userId)")
content = content.replace('colSpan="6"', 'colSpan={6}')

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed TS errors")
