import re

with open("src/components/CalisanlarView.tsx", "r") as f:
    content = f.read()

m1_start = content.find("{/* MODAL: ADD/EDIT EMPLOYEE CARD */}")
m2_start = content.find("{/* MODAL: ADD/EDIT SALARY CARI TRANSACTION */}")
m3_start = content.find("{/* MODAL: EMPLOYEE CARI DETAIL VIEWER */}")
end_str = content.find("</div>\n  );\n}")

print(m1_start, m2_start, m3_start, end_str)
