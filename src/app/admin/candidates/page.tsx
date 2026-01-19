import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CandidateDialog } from "@/components/admin/CandidateDialog"
import { DeleteButton } from "@/components/admin/DeleteButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BulkImportDialog } from "@/components/admin/BulkImportDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function CandidatesPage() {
  const supabase = await createClient()

  const { data: candidates } = await supabase
    .from("candidates")
    .select("*, teams(name)")
    .order("chest_number", { ascending: true })

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .order("name", { ascending: true })
  const { data: programs } = await supabase
    .from("programs")
    .select("id, name, participant_type")

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground">
            Manage individual candidates and their team affiliations.
          </p>
        </div>
        <div className="flex gap-2">
           <BulkImportDialog teams={teams || []} programs={programs || []} />
           <CandidateDialog teams={teams || []} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Candidates</CardTitle>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4 flex flex-wrap h-auto gap-2 justify-start">
                    <TabsTrigger value="all">All Candidates</TabsTrigger>
                    {teams?.map(team => (
                        <TabsTrigger key={team.id} value={team.id}>{team.name}</TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="all">
                    <CandidatesTable candidates={candidates || []} teams={teams || []} />
                </TabsContent>

                {teams?.map(team => (
                    <TabsContent key={team.id} value={team.id}>
                        <CandidatesTable 
                            candidates={candidates?.filter(c => c.team_id === team.id) || []} 
                            teams={teams || []} 
                        />
                    </TabsContent>
                ))}
            </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function CandidatesTable({ candidates, teams }: { candidates: any[], teams: any[] }) {
    if (candidates.length === 0) {
        return <div className="p-8 text-center text-muted-foreground border rounded-md">No candidates found in this group.</div>
    }

    return (
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chest No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                   <TableCell className="font-medium">
                    <Badge variant="outline">{candidate.chest_number}</Badge>
                  </TableCell>
                  <TableCell>{candidate.name}</TableCell>
                  <TableCell>
                    {candidate.teams ? (
                      <Badge variant="secondary">{candidate.teams.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right flex justify-end gap-2">
                    <CandidateDialog 
                      teams={teams || []} 
                      candidateToEdit={candidate}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      }
                    />
                     <DeleteButton table="candidates" id={candidate.id} path="/admin/candidates" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
    )
}
