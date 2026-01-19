"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { getDashboardStats } from "@/app/actions/dashboard-stats"
import { cn } from "@/lib/utils"

export function LivePulse({ initialPulse }: { initialPulse: any[] }) {
    const [pulse, setPulse] = useState(initialPulse)

    useEffect(() => {
        const interval = setInterval(async () => {
             const stats = await getDashboardStats()
             if (stats.pulse) {
                 setPulse(stats.pulse)
             }
        }, 5000) // Poll every 5 seconds

        return () => clearInterval(interval)
    }, [])

    return (
        <Card className="border-l-4 border-l-green-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    Live Judging Pulse
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {pulse.length === 0 ? (
                         <p className="text-sm text-muted-foreground">Waiting for scores...</p>
                    ) : (
                        pulse.slice(0, 3).map((p: any, idx: number) => (
                            <div key={idx} className={cn(
                                "flex flex-col border-b pb-2 last:border-0 last:pb-0 transition-all duration-500",
                                idx === 0 ? "opacity-100" : "opacity-70"
                            )}>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-lg text-primary">{p.score}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">{new Date(p.time).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-xs font-medium truncate">{p.program}</div>
                                <div className="text-[10px] text-muted-foreground">Judge: {p.judge}</div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
