const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistant.tsx', 'utf8');

const chartCode = `
                      {msg.text}
                      {msg.chart && msg.chart.data && msg.chart.data.length > 0 && (
                        <div className="mt-3 w-full h-[180px] bg-slate-50/50 rounded-xl p-2 border border-slate-100">
                          <ResponsiveContainer width="100%" height="100%">
                            {msg.chart.tip === 'pie' ? (
                              <PieChart>
                                <Pie data={msg.chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#0d9488" label={({name, percent}) => \`\${name} (\${(percent * 100).toFixed(0)}%)\`}>
                                  {msg.chart.data.map((entry, index) => (
                                    <Cell key={\`cell-\${index}\`} fill={['#0d9488', '#0f766e', '#14b8a6', '#5eead4', '#ccfbf1'][index % 5]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val as number)} />
                              </PieChart>
                            ) : (
                              <BarChart data={msg.chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-20} textAnchor="end" height={40} />
                                <YAxis tick={{fontSize: 10}} width={45} tickFormatter={(val) => \`\${(val/1000).toFixed(0)}k\`} />
                                <Tooltip formatter={(val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val as number)} />
                                <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      )}
`;

content = content.replace(/\{msg\.text\}/g, chartCode.trim());

fs.writeFileSync('src/components/AiAssistant.tsx', content);
