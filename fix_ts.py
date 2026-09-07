with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix 'u' type
content = content.replace("allUsers.filter(u => u.active !== false)", "allUsers.filter((u: any) => u.active !== false)")

# Fix selectedProduct null checks
content = content.replace("selectedProduct.receivedQuantity - selectedProduct.assignedQuantity", "selectedProduct?.receivedQuantity - selectedProduct?.assignedQuantity")
content = content.replace("selectedProduct.id", "selectedProduct?.id")
content = content.replace("selectedProduct.productName", "selectedProduct?.productName")
content = content.replace("selectedProduct.vendorName", "selectedProduct?.vendorName")

# selectedProduct type
content = content.replace("const [selectedProduct, setSelectedProduct] = useState(null);", "const [selectedProduct, setSelectedProduct] = useState<any>(null);")
content = content.replace("const [users, setUsers] = useState([]);", "const [users, setUsers] = useState<any[]>([]);")

# Fix quantity parsing string to number
content = content.replace("parseInt(assignData.userId)", "parseInt(assignData.userId as string)")
content = content.replace("parseInt(assignData.quantity)", "parseInt(assignData.quantity as string)")

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed TS errors in ReceivedProducts.tsx")
