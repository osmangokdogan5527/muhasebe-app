sed -i '1,74d' src/constants.tsx
sed -i '1i import React from "react";\nimport { LayoutDashboard, Users, Package, Receipt, Briefcase, Wallet, DollarSign, Landmark, BarChart3, Settings } from "lucide-react";\nimport { KeyboardShortcut } from "./types";' src/constants.tsx
