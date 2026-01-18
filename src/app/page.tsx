import { createClient } from "@/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calculateTeamPoints } from "@/lib/points"

// Components
import { ProgramGrid } from "@/components/public/ProgramGrid"
import { StandingsList } from "@/components/public/StandingsList"

export default async function LandingPage() {
  const supabase = await createClient()

  // 1. Fetch Programs
  const { data: programs } = await supabase
    .from("programs")
    .select("*")
    .or("status.eq.live,status.eq.completed,status.eq.upcoming")
    .order("status", { ascending: false })

  const livePrograms = programs?.filter(p => p.status === 'live') || []
  const completedPrograms = programs?.filter(p => p.status === 'completed') || []
  const upcomingPrograms = programs?.filter(p => p.status === 'upcoming') || []

  // 2. Fetch Teams & Calculate Standings
  const { data: teams } = await supabase.from("teams").select("*")
  
  let rankings: any[] = []
  if (teams) {
    rankings = await Promise.all(teams.map(async (team) => {
        const points = await calculateTeamPoints(supabase, team.id)
        return { ...team, ...points }
    }))
    // Sort by total points
    rankings.sort((a, b) => b.totalPoints - a.totalPoints)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30 dark:bg-gray-950">
      {/* Navbar */}
      <main className="flex-1 pt-12">
         <div className="container mx-auto py-4 px-4 md:px-6">
            <Tabs defaultValue="standings" className="w-full space-y-8">
                <div className="flex justify-center mb-8">
                    <TabsList className="grid w-full max-w-[500px] grid-cols-3 h-12 p-1 bg-white dark:bg-gray-800 shadow-lg rounded-full">
                        <TabsTrigger value="live" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Live Now</TabsTrigger>
                        <TabsTrigger value="standings" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Championship</TabsTrigger>
                        <TabsTrigger value="results" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Results</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="live" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ProgramGrid programs={livePrograms} type="live" />
                    {upcomingPrograms.length > 0 && (
                        <div className="pt-8 border-t border-dashed">
                             <h3 className="text-xl font-semibold mb-6 text-muted-foreground">Coming Up Next</h3>
                             <ProgramGrid programs={upcomingPrograms} type="upcoming" />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="standings" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <StandingsList rankings={rankings} />
                </TabsContent>

                <TabsContent value="results" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ProgramGrid programs={completedPrograms} type="completed" />
                </TabsContent>
            </Tabs>
         </div>
      </main>

      <footer className="py-8 w-full border-t bg-white dark:bg-gray-950">
         <div className="container mx-auto px-4 text-center">
            <div className="flex flex-col items-center gap-2">
                <h3 className="font-semibold text-foreground">Dharmagiri College of Arts and Science</h3>
                <p className="text-sm text-muted-foreground">(Affiliated to University of Calicut & Approved by AICTE)</p>
                <p className="text-sm text-muted-foreground">Kunnumpuram, Cheruppadimala, Malappuram Dt</p>
            </div>
         </div>
      </footer>
    </div>
  )
}
