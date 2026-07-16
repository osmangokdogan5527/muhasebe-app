with open("src/components/KasaView.tsx", "r") as f:
    content = f.read()

print("Length:", len(content))
end_idx = content.rfind("KasaModals")
print("KasaModals usage at:", end_idx)

