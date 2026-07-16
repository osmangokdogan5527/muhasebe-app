with open("src/components/TemplateDesignerView.tsx", "r") as f:
    content = f.read()

content = content.replace("function SwitchRow({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) {\n  return (\n    <label className=\"flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors\">\n      <span className=\"text-sm text-slate-700 font-medium\">{label}</span>\n      <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-slate-300'}`}>\n        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />\n      </div>\n      {/* Hidden checkbox for accessibility */}\n      <input type=\"checkbox\" className=\"sr-only\" checked={checked} onChange={(e) => onChange(e.target.checked)} />\n    </label>\n  );\n}", "")

content = "import { SwitchRow } from './templates/SwitchRow';\n" + content

with open("src/components/TemplateDesignerView.tsx", "w") as f:
    f.write(content)
