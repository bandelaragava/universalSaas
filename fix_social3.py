with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\marketing\SocialLinkGenerator.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("onChange={(e) => { /* no-op */ }'landingSlug', e.target.value)}", "onChange={(e) => {}}")
content = content.replace("onChange={(e) => { /* no-op */ }'campaignName', e.target.value)}", "onChange={(e) => {}}")
# Or let's just do regex
import re
content = re.sub(r"onChange=\{\(e\) => \{\s*/\*\s*no-op\s*\*/\s*\}'.*?'\s*,\s*e\.target\.value\)\}", "onChange={() => {}}", content)
content = re.sub(r"onChange=\{\(e\) => \{\}\('.*?'\s*,\s*e\.target\.value\)\}", "onChange={() => {}}", content)

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\marketing\SocialLinkGenerator.tsx", "w", encoding="utf-8") as f:
    f.write(content)
