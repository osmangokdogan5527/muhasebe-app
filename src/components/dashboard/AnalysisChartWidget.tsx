import React from 'react';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AnalysisChartWidgetProps {
  chartData: any[];
  dashboardCurrency: string;
  formatCurrency: (amount: number, currency?: string) => string;
  renderWidgetControls: () => React.ReactNode;
}

export const AnalysisChartWidget: React.FC<AnalysisChartWidgetProps> = ({
  chartData,
  dashboardCurrency,
  formatCurrency,
  renderWidgetControls
}) => {
  return (
                  <div
                    
                    className={`h-full flex flex-col gap-2.5 group transition-all duration-300`}
                  >
                    <div className="flex justify-between items-center bg-[#111111]/80 px-4 py-2 rounded-lg border border-white/5 shadow-sm">
                      <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        SATIŞ VE ALIŞ ANALİZİ GRAFİĞİ
                      </span>
                      {renderWidgetControls()}
                    </div>

                    <div className="bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg flex-1 flex flex-col justify-between">
                      <div className="mb-6">
                        <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">
                          Satış ve Alış Analizi
                        </h2>
                        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">
                          Son 6 aylık faturalandırılmış hacim trendi
                        </p>
                      </div>

                      <div className="h-64 sm:h-80 w-full text-[10px] font-mono">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={chartData}
                            margin={{
                              top: 10,
                              right: 10,
                              left: -20,
                              bottom: 0,
                            }}
                          >
                            <defs>
                              <linearGradient
                                id="colorSatis"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#2dd4bf"
                                  stopOpacity={0.25}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#2dd4bf"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                              <linearGradient
                                id="colorAlis"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#f43f5e"
                                  stopOpacity={0.25}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#f43f5e"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="var(--chart-grid, rgba(255,255,255,0.03))"
                            />
                            <XAxis
                              dataKey="month"
                              stroke="var(--chart-axis, rgba(255,255,255,0.3))"
                              tickLine={false}
                            />
                            <YAxis
                              stroke="var(--chart-axis, rgba(255,255,255,0.3))"
                              tickLine={false}
                              tickFormatter={(v) => `₺${v / 1000}k`}
                            />
                            <Tooltip
                              formatter={(value: any) => [
                                formatCurrency(Number(value)),
                                "",
                              ]}
                              contentStyle={{
                                backgroundColor: "var(--bg-card, #111111)",
                                borderRadius: "12px",
                                border:
                                  "1px solid var(--border-color, rgba(255,255,255,0.1))",
                                color: "var(--text-primary, #ffffff)",
                              }}
                              itemStyle={{
                                color: "var(--text-primary, #ffffff)",
                              }}
                            />
                            <Area
                              type="monotone"
                              name="Satış (TL)"
                              dataKey="satis"
                              stroke="#2dd4bf"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorSatis)"
                            />
                            <Area
                              type="monotone"
                              name="Alış (TL)"
                              dataKey="alis"
                              stroke="#f43f5e"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorAlis)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
  );
};

