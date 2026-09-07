with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\marketing\SocialLinkGenerator.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("onChange={(e) => {}(...args)}", "onChange={() => {}}")
content = content.replace("onChange={(e) => {}(", "onChange={(e) => { /* no-op */ }")

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\marketing\SocialLinkGenerator.tsx", "w", encoding="utf-8") as f:
    f.write(content)
