with open(r"C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx", "r", encoding="utf-8") as f:
    content = f.read()

print("First useEffect:")
print(content[1768:2000])

print("\nSecond useEffect:")
print(content[3403:3600])
