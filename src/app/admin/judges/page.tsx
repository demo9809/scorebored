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
import { JudgeDialog } from "@/components/admin/JudgeDialog"
import { DeleteButton } from "@/components/admin/DeleteButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function JudgesPage() {
  const supabase = await createClient()

  // Fetch profiles with role 'judge'
  const { data: judges, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "judge")
    .order("full_name", { ascending: true })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Judges</h1>
          <p className="text-muted-foreground">
            Manage competition judges and assignments.
          </p>
        </div>
        <JudgeDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Judges</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {judges?.map((judge) => (
                <TableRow key={judge.id}>
                  <TableCell className="font-medium">{judge.full_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {judge.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <DeleteButton table="profiles" id={judge.id} path="/admin/judges" />
                  </TableCell>
                </TableRow>
              ))}
              {!judges?.length && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    No judges found. Add a judge to get started.
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
