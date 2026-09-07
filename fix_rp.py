with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix fetchProducts to handle both PageImpl structure and plain array
content = content.replace(
    "if (res.data?.data?.content) {\n        setProducts(res.data.data.content);\n      } else {\n        setProducts([]);\n      }",
    "if (res.data?.data?.content) {\n        setProducts(res.data.data.content);\n      } else if (Array.isArray(res.data?.data)) {\n        setProducts(res.data.data);\n      } else {\n        setProducts([]);\n      }"
)

# Also ensure users fetch correctly
content = content.replace(
    "const allUsers = Array.isArray(res.data) ? res.data : (res.data?.data || []);",
    "const allUsers = Array.isArray(res.data) ? res.data : (res.data?.data?.content || res.data?.data || []);"
)

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed ReceivedProducts.tsx")
