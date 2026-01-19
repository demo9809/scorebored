"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export function AnalyticsCharts({ stats }: { stats: any }) {

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Department Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Candidates by Department</CardTitle>
                    <CardDescription>Participation distribution across departments</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.department} layout="vertical" margin={{ left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={100} 
                                tick={{ fontSize: 12 }} 
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {stats.department.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Year Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Candidates by Year</CardTitle>
                    <CardDescription>Breakdown by academic year</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex justify-center items-center">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.year}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.year.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                 contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                            />
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                         {stats.year.map((item: any, idx: number) => (
                             <div key={idx} className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(idx + 3) % COLORS.length] }} />
                                 <span className="text-muted-foreground">{item.name}:</span>
                                 <span className="font-bold">{item.value}</span>
                             </div>
                         ))}
                     </div>
                </CardContent>
            </Card>
        </div>
    )
}
