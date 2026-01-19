import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { LiveLeaderboard } from "@/components/public/LiveLeaderboard"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch program details + participants + scores
  const { data: program } = await supabase
    .from("programs")
    .select("*, program_rules(*), program_participants(*, candidates(*, teams(name)), teams(*))")
    .eq("id", id)
    .single()

  if (!program) notFound()

  // Initial fetch of scores
  const { data: scores } = await supabase
    .from("scores")
    .select("*")
    .eq("program_id", id)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
       <header className="bg-white dark:bg-gray-800 border-b p-4 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" asChild>
               <Link href="/">
                 <ArrowLeft className="h-4 w-4" />
               </Link>
             </Button>
             <div>
               <h1 className="text-xl font-bold">{program.name}</h1>
               <div className="flex gap-2 text-sm text-muted-foreground items-center">
                  <Badge variant={program.status === 'live' ? 'default' : 'secondary'}>{program.status}</Badge>
                  {program.status === 'live' && <span className="text-red-500 animate-pulse text-xs uppercase font-bold tracking-wider">Live Updates</span>}
               </div>
             </div>
           </div>
        </div>
      </header>
      <main className="container mx-auto py-8 px-4">
         <LiveLeaderboard 
            program={program}
            initialParticipants={program.program_participants}
            initialScores={scores || []}
         />
      </main>
    </div>
  )
}
