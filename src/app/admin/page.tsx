import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, UserCheck, Activity } from "lucide-react"
import { calculateTeamPoints } from "@/lib/points"

async function getStats() {
  const supabase = await createClient()
  
  const { count: programsCount } = await supabase.from("programs").select("*", { count: "exact", head: true })
  const { count: judgesCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "judge")
  const { count: teamsCount } = await supabase.from("teams").select("*", { count: "exact", head: true })
  const { count: scoresCount } = await supabase.from("scores").select("*", { count: "exact", head: true })

  return {
    programs: programsCount || 0,
    judges: judgesCount || 0,
    teams: teamsCount || 0,
    scores: scoresCount || 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()
  const supabase = await createClient()

  // Fetch Programs for Status Table
  const { data: programs } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

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

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      
      {/* STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.programs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Judges</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.judges}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams Registered</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teams}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scores</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scores}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* CHAMPIONSHIP STATUS */}
        <Card className="col-span-4 transition-all hover:shadow-md">
            <CardHeader>
                <CardTitle>Championship Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {rankings.map((team, index) => (
                        <div key={team.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-transparent text-muted-foreground'}`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="font-semibold">{team.name}</div>
                                    <div className="text-xs text-muted-foreground">{team.programBreakdown?.length || 0} events participated</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold font-mono">{team.totalPoints}</div>
                                <div className="text-[10px] uppercase text-muted-foreground">Points</div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        {/* RECENT PROGRAMS */}
        <Card className="col-span-3 transition-all hover:shadow-md">
            <CardHeader>
                <CardTitle>Recent Programs</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {programs?.map(program => (
                        <div key={program.id} className="flex items-center justify-between p-2 border-b last:border-0">
                            <div>
                                <div className="font-medium">{program.name}</div>
                                <div className="text-xs text-muted-foreground capitalize">{program.participant_type}</div>
                            </div>
                            <div className="text-right">
                                <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${
                                    program.status === 'live' ? 'bg-green-100 text-green-700 animate-pulse' : 
                                    program.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {program.status}
                                </span>
                            </div>
                        </div>
                    ))}
                    {(!programs || programs.length === 0) && <div className="text-muted-foreground text-sm">No programs found.</div>}
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  )
}

