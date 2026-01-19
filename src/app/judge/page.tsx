import { JudgeHeader } from "@/components/judge/JudgeHeader"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function JudgeDashboard() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch assigned programs
  // program_judges -> program
  const { data: assignments } = await supabase
    .from("program_judges")
    .select("*, programs(*)")
    .eq("judge_id", user.id)

  const activePrograms = assignments?.filter(a => a.programs?.status === 'live' || a.programs?.status === 'upcoming') || []
  const completedPrograms = assignments?.filter(a => a.programs?.status === 'completed') || []

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Judge Dashboard</h1>
          <p className="text-muted-foreground">
            Select an active competition to start scoring.
          </p>
        </div>
        <JudgeHeader userName={user.user_metadata.full_name} />
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Active Competitions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activePrograms.map((assignment) => {
              const program = assignment.programs
              if (!program) return null
              return (
                <Card key={program.id} className="hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      {program.name}
                      <Badge variant={program.status === "live" ? "default" : "secondary"}>
                        {program.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="text-sm text-muted-foreground">
                        <p>Type: {program.participant_type}</p>
                        <p>Max Score: {program.max_score_per_judge}</p>
                      </div>
                      <Button className="w-full" asChild>
                        <Link href={`/judge/program/${program.id}`}>
                          {program.status === 'live' ? 'Enter Scoring Console' : 'View Details'}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {activePrograms.length === 0 && (
               <p className="text-muted-foreground col-span-full">No active competitions assigned.</p>
            )}
          </div>
        </section>

        {completedPrograms.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Completed</h2>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {completedPrograms.map((assignment) => {
                 const program = assignment.programs
                 if (!program) return null
                 return (
                   <Card key={program.id} className="opacity-75 hover:opacity-100 transition-opacity">
                     <CardHeader>
                       <CardTitle className="flex justify-between items-start">
                         {program.name}
                         <Badge variant="secondary">Completed</Badge>
                       </CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="flex flex-col gap-4">
                         <div className="text-sm text-muted-foreground">
                           <p>Type: {program.participant_type}</p>
                           <p>Max Score: {program.max_score_per_judge}</p>
                         </div>
                         <Button variant="outline" className="w-full" asChild>
                           <Link href={`/judge/program/${program.id}`}>
                             View Scores
                           </Link>
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 )
               })}
             </div>
          </section>
        )}
      </div>
    </div>
  )
}
