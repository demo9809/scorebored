import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ScoringInterface } from "@/components/judge/ScoringInterface"

export default async function JudgeScoringPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Check assignment
  const { data: assignment } = await supabase
    .from("program_judges")
    .select("*")
    .eq("program_id", id)
    .eq("judge_id", user.id)
    .single()

  if (!assignment) {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p>You are not assigned to judge this program.</p>
            <Button asChild className="mt-4"><Link href="/judge">Back to Dashboard</Link></Button>
        </div>
    )
  }

  // Fetch Program Details + Rules + Participants
  const { data: program } = await supabase
    .from("programs")
    .select("*, program_rules(*), program_participants(*, candidates(*), teams(*))")
    .eq("id", id)
    .single()

  if (!program) notFound()

  // Fetch filtered active participants or sort them
  const participants = program.program_participants?.sort((a: any, b: any) => {
      // Sort by participant no (string converted to int or string compare)
      return (Number(a.participant_no) || 0) - (Number(b.participant_no) || 0)
  }) || []

  // Fetch existing scores by this judge for this program
  const { data: existingScores } = await supabase
      .from("scores")
      .select("*")
      .eq("program_id", id)
      .eq("judge_id", user.id)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b p-4 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" asChild>
               <Link href="/judge">
                 <ArrowLeft className="h-4 w-4" />
               </Link>
             </Button>
             <div>
               <h1 className="text-xl font-bold">{program.name}</h1>
               <div className="flex gap-2 text-sm text-muted-foreground">
                  <Badge variant={program.status === 'live' ? 'default' : 'secondary'}>{program.status}</Badge>
               </div>
             </div>
           </div>
           {/* Maybe show connection status here later */}
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
          {program.status === 'upcoming' ? (
              <div className="text-center py-20">
                  <h2 className="text-2xl font-bold text-muted-foreground">Scoring is not yet open.</h2>
              </div>
          ) : (
             <ScoringInterface 
                program={program} 
                judgeId={user.id} 
                rules={program.program_rules || []}
                participants={participants}
                initialScores={existingScores || []}
                readOnly={program.status === 'completed'}
             />
          )}
      </main>
    </div>
  )
}
