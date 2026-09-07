with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\marketing\SocialLinkGenerator.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace handleConfigChange with an empty function if not defined, or setConfig
if "const handleConfigChange" not in content:
    content = content.replace("onChange={(e) => handleConfigChange", "onChange={(e) => {}")

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\marketing\SocialLinkGenerator.tsx", "w", encoding="utf-8") as f:
    f.write(content)
