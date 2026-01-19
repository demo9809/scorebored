import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trophy, Users, UserCheck, Activity, TrendingUp, Zap, AlertTriangle } from "lucide-react"
import { calculateTeamPoints } from "@/lib/points"
import { getDashboardStats } from "../actions/dashboard-stats"
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts"
import { LivePulse } from "@/components/admin/LivePulse"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const stats = await getDashboardStats()

  // Fetch Teams for Championship Table
  const { data: teams } = await supabase.from("teams").select("*")
  let rankings: any[] = []
  if (teams) {
    rankings = await Promise.all(teams.map(async (team) => {
        const points = await calculateTeamPoints(supabase, team.id)
        return { ...team, ...points }
    }))
    rankings.sort((a, b) => b.totalPoints - a.totalPoints)
  }

  // AI Insights Logic (Simple Heuristics)
  const topDepartment = stats.analytics.department[0]
  const competitiveIndex = stats.counts.scores > 0 ? (stats.counts.scores / stats.counts.programs).toFixed(1) : "0"
  
  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Dashboard</h1>
            <p className="text-muted-foreground">Real-time Arts Fest Analytics & Insights</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold animate-pulse">
              <div className="w-2 h-2 bg-green-600 rounded-full" />
              SYSTEM LIVE
          </div>
      </div>
      
      {/* TOP METRICS & PULSE */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
        <Card className="md:col-span-4 lg:col-span-4 grid gap-4 md:grid-cols-4 p-4 bg-muted/20">
             <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase font-bold">Total Programs</span>
                <span className="text-2xl font-bold">{stats.counts.programs}</span>
                <span className="text-[10px] text-green-600 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {stats.counts.livePrograms} Live Now</span>
             </div>
             <div className="flex flex-col gap-1">
                 <span className="text-xs text-muted-foreground uppercase font-bold">Candidates</span>
                 <span className="text-2xl font-bold">{stats.counts.candidates}</span>
                 <span className="text-[10px] text-muted-foreground">From {stats.analytics.department.length} Depts</span>
             </div>
             <div className="flex flex-col gap-1">
                 <span className="text-xs text-muted-foreground uppercase font-bold">Total Scores</span>
                 <span className="text-2xl font-bold">{stats.counts.scores}</span>
                 <span className="text-[10px] text-blue-600 flex items-center gap-1"><Activity className="h-3 w-3" /> Avg {competitiveIndex} / Prg</span>
             </div>
             <div className="flex flex-col gap-1">
                 <span className="text-xs text-muted-foreground uppercase font-bold">Leading Team</span>
                 <span className="text-xl font-bold truncate text-primary">{rankings[0]?.name || "N/A"}</span>
                 <span className="text-[10px] text-muted-foreground">{rankings[0]?.totalPoints || 0} Points</span>
             </div>
        </Card>
        
        {/* LIVE PULSE SIDEBAR */}
        <div className="md:col-span-4 lg:col-span-1 row-span-2">
            <LivePulse initialPulse={stats.pulse} />
        </div>
      </div>

      {/* ANALYTICS & INSIGHTS */}
      <div className="grid gap-4 md:grid-cols-7">
        
        {/* CHARTS */}
        <div className="md:col-span-5 space-y-4">
             {/* AI INSIGHTS BAR */}
             <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-indigo-600"/> Top Dept</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-lg font-bold">{topDepartment?.name || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">{topDepartment?.value || 0} Candidates</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-orange-600"/> Gold Race</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-lg font-bold">{rankings[0]?.name?.split(" ")[0]} vs {rankings[1]?.name?.split(" ")[0] || "TBD"}</div>
                        <div className="text-xs text-muted-foreground">Gap: {(rankings[0]?.totalPoints || 0) - (rankings[1]?.totalPoints || 0)} Pts</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-600"/> Engagement</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-lg font-bold">{(stats.counts.candidates / 2000 * 100).toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Student Turnout</div>
                    </CardContent>
                </Card>
             </div>

             <AnalyticsCharts stats={stats.analytics} />
        </div>

        {/* TOP TEAMS SIDEBAR */}
        <Card className="md:col-span-2 h-fit">
            <CardHeader>
                <CardTitle className="text-sm">Championship Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="space-y-0 divide-y">
                    {rankings.slice(0, 10).map((team, index) => (
                        <div key={team.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-6 h-6 text-xs rounded-full font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-transparent text-muted-foreground'}`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">{team.name}</div>
                                </div>
                            </div>
                            <div className="font-mono font-bold text-sm">{team.totalPoints}</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}

