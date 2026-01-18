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

export default async function CandidatesPage() {
  const supabase = await createClient()

  const { data: candidates, error } = await supabase
    .from("candidates")
    .select("*, teams(name)")
    .order("chest_number", { ascending: true })

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .order("name", { ascending: true })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground">
            Manage individual candidates and their team affiliations.
          </p>
        </div>
        <CandidateDialog teams={teams || []} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Candidates</CardTitle>
        </CardHeader>
        <CardContent>
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
              {candidates?.map((candidate) => (
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
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                     <DeleteButton table="candidates" id={candidate.id} path="/admin/candidates" />
                  </TableCell>
                </TableRow>
              ))}
              {!candidates?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No candidates found. Register a candidate to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
