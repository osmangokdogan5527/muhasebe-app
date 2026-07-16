with open("src/components/CalisanlarView.tsx", "r") as f:
    content = f.read()

m1_start = content.find("{/* Add/Edit Modal */}")
m2_start = content.find("{/* Advance/Payment Modal */}")
end_str = content.rfind("    </div>\n  );\n}")

print("M1 Start:", m1_start)
print("M2 Start:", m2_start)
print("End:", end_str)

