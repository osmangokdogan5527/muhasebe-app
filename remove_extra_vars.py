with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("  const [resetModalOpen, setResetModalOpen] = useState(false);\n", "")
content = content.replace("  const [resetConfirmationText, setResetConfirmationText] = useState('');\n", "")
content = content.replace("  const [resetError, setResetError] = useState('');\n", "")
content = content.replace("  const [isResetting, setIsResetting] = useState(false);\n", "")
content = content.replace("  const [isBackupLoading, setBackupLoading] = useState(false);\n", "")

with open('src/App.tsx', 'w') as f:
    f.write(content)
