import { createClient } from "@/lib/supabase/server"
import { calculateTeamPoints } from "@/lib/points"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Star } from "lucide-react"

export default async function PublicStandingsPage() {
  const supabase = await createClient()

  // Fetch all teams
  const { data: teams } = await supabase.from("teams").select("*")
  if (!teams) return null

  // Calculate points for ALL teams
  const rankings = await Promise.all(teams.map(async (team) => {
      const points = await calculateTeamPoints(supabase, team.id)
      return { ...team, ...points }
  }))

  // Sort by total points
  rankings.sort((a, b) => b.totalPoints - a.totalPoints)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
       <header className="bg-white dark:bg-gray-800 border-b p-4 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Trophy className="h-6 w-6 text-yellow-500" />
             <h1 className="text-xl font-bold">Championship Standings</h1>
           </div>
           
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="grid gap-6">
            {rankings.map((team, index) => (
                <Card key={team.id} className={`overflow-hidden ${index < 3 ? 'border-primary/50 shadow-lg' : ''}`}>
                    <div className={`h-2 w-full ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-transparent'}`} />
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`flex items-center justify-center h-12 w-12 rounded-full font-bold text-xl ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : index === 2 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">{team.name}</CardTitle>
                                    <p className="text-muted-foreground font-medium">{team.totalPoints} Points</p>
                                </div>
                            </div>
                            {index === 0 && <Trophy className="h-8 w-8 text-yellow-500 animate-pulse" />}
                            {index === 1 && <Medal className="h-8 w-8 text-gray-400" />}
                            {index === 2 && <Medal className="h-8 w-8 text-amber-700" />}
                        </div>
                    </CardHeader>
                    <CardContent>
                       {/* Accordion or simple list for breakdown */}
                       <div className="mt-4">
                           <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                               <Star className="h-4 w-4" /> Top Performances
                           </h4>
                           <div className="space-y-2">
                               {team.programBreakdown.slice(0, 5).map((item, idx) => (
                                   <div key={idx} className="flex items-center justify-between text-sm border-b pb-1 last:border-0">
                                       <span className="truncate max-w-[200px]">{item.programName}</span>
                                       <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">#{item.rank}</Badge>
                                            <span className="font-bold">+{item.points} pts</span>
                                       </div>
                                   </div>
                               ))}
                               {team.programBreakdown.length === 0 && <p className="text-xs text-muted-foreground">No points yet.</p>}
                               {team.programBreakdown.length > 5 && (
                                   <p className="text-xs text-center text-muted-foreground mt-2">
                                       + {team.programBreakdown.length - 5} more
                                   </p>
                               )}
                           </div>
                       </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </main>
    </div>
  )
}
