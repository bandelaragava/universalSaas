with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\services\employees.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("...employee,", "...employee,\n      user_id: employee.user_id || existing?.user_id || '',")

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\services\employees.ts", "w", encoding="utf-8") as f:
    f.write(content)
