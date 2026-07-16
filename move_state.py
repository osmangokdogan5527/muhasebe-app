with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("  const [adminTab, setAdminTab] = useState<'errors' | 'feedback'>('errors');\n", "")
content = content.replace("  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);\n", "")

with open('src/App.tsx', 'w') as f:
    f.write(content)

with open('src/components/AuthScreen.tsx', 'r') as f:
    auth_content = f.read()

states_to_add = """
  const [adminTab, setAdminTab] = React.useState<'errors' | 'feedback'>('errors');
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null);
"""

auth_content = auth_content.replace("export const AuthScreen: React.FC<AuthScreenProps> = (props) => {", "export const AuthScreen: React.FC<AuthScreenProps> = (props) => {\n" + states_to_add)

with open('src/components/AuthScreen.tsx', 'w') as f:
    f.write(auth_content)
