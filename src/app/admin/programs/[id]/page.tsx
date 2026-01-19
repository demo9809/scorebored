import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Tables } from "@/lib/database.types"
import { RuleDialog } from "@/components/admin/RuleDialog"
import { ProgramJudges } from "@/components/admin/ProgramJudges"
import { ProgramParticipants } from "@/components/admin/ProgramParticipants"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ProgramEditDialog } from "@/components/admin/ProgramEditDialog"
import { AdminScoreMatrix } from "@/components/admin/AdminScoreMatrix"
import { DeleteButton } from "@/components/admin/DeleteButton"

export default async function ProgramDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: program, error } = await supabase
    .from("programs")
    .select("*, program_rules(*)")
    .eq("id", id)
    .single()

  if (error || !program) {
    notFound()
  }

  // Fetch Assigned Judges
  const { data: assignedJudges } = await supabase
    .from("program_judges")
    .select("*, profiles(*)")
    .eq("program_id", id)

  // Fetch Available Judges (all judges)
  // We should ideally filter out already assigned ones in UI or here.
  const { data: allJudges } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "judge")

  // Fetch Participants
  const { data: programParticipants } = await supabase
    .from("program_participants")
    .select("*, candidates(*, teams(name)), teams(*), program_participant_members(*, candidates(name, chest_number))")
    .eq("program_id", id)
    .order("participant_no", { ascending: true })

  // Fetch candidates and teams for selection
  const { data: candidates } = await supabase.from("candidates").select("*")
  const { data: teams } = await supabase.from("teams").select("*")

  // Fetch existing scores
  const { data: scores } = await supabase
    .from("scores")
    .select("*")
    .eq("program_id", id)

  return (
    <div className="flex flex-col gap-8">
      {/* ... Header ... */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/programs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
            <ProgramEditDialog program={program} />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Badge variant="outline" className="capitalize">
              {program.participant_type}
            </Badge>
            <span>•</span>
            <Badge variant={program.status === "live" ? "default" : "secondary"} className="capitalize">
              {program.status}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="scores" className="w-full">
        <TabsList>
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="judges">Judges</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="scores">
          <AdminScoreMatrix 
            program={program}
            judges={assignedJudges?.map((j: any) => j.profiles) || []}
            participants={programParticipants || []}
            scores={scores || []}
          />
        </TabsContent>

        <TabsContent value="judges">
          <ProgramJudges 
            programId={program.id} 
            programName={program.name}
            programRules={program.program_rules || []}
            participantType={program.participant_type}
            participants={programParticipants || []}
            assignedJudges={assignedJudges || []}
            availableJudges={allJudges || []} 
          />
        </TabsContent>
        <TabsContent value="participants">
          <ProgramParticipants
             programId={program.id}
             participantType={program.participant_type}
             candidates={candidates || []}
             teams={teams || []}
             programParticipants={programParticipants || []}
          />
        </TabsContent>
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
             <RuleDialog programId={program.id} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Judging Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {program.program_rules?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No rules defined.</p>
                ) : (
                  <div className="grid gap-4">
                    {program.program_rules?.sort((a: Tables<'program_rules'>, b: Tables<'program_rules'>) => (a.order_index??0) - (b.order_index??0)).map((rule: Tables<'program_rules'>) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between border p-4 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Max Score: {rule.max_score}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Badge variant="outline">Order: {rule.order_index}</Badge>
                             <RuleDialog programId={program.id} rule={rule} />
                             <DeleteButton table="program_rules" id={rule.id} path={`/admin/programs/${program.id}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
