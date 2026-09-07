import re

with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\vendor\ReceivedProducts.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the modals block and tables block with the full UI
tables_regex = r"\{/\*\s*Tables\s*\*/\}(.*?)\{/\*\s*Modals\s*\*/\}"
modals_regex = r"\{/\*\s*Modals\s*\*/\}(.*?)</Modal>\s*</div>"

# I'll just use a direct script to inject the Deployed Assets UI since it's missing!
