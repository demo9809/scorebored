import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TeamDialog } from "@/components/admin/TeamDialog"
import { DeleteButton } from "@/components/admin/DeleteButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TeamsPage() {
  const supabase = await createClient()

  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .order("total_points", { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage teams and track their overall points.
          </p>
        </div>
        <TeamDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Points</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams?.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/teams/${team.id}`} className="hover:underline text-primary">
                      {team.name}
                    </Link>
                  </TableCell>
                  <TableCell>{team.total_points ?? 0}</TableCell>

                  <TableCell className="text-right flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <DeleteButton table="teams" id={team.id} path="/admin/teams" />
                  </TableCell>
                </TableRow>
              ))}
              {!teams?.length && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    No teams found. Create a team to allow candidate registration.
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
