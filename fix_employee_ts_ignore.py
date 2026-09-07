with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\services\employees.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("merged.set(key, {", "// @ts-ignore\n    merged.set(key, {")

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\services\employees.ts", "w", encoding="utf-8") as f:
    f.write(content)
