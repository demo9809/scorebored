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
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

import { ProgramDialog } from "@/components/admin/ProgramDialog"
import { DeleteButton } from "@/components/admin/DeleteButton"

async function getPrograms() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false })
  return data || []
}

export default async function ProgramsPage() {
  const programs = await getPrograms()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
        <ProgramDialog />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Max Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/programs/${program.id}`} className="hover:underline">
                    {program.name}
                  </Link>
                </TableCell>
                <TableCell>{program.participant_type}</TableCell>
                <TableCell>
                  <Badge variant={program.status === "live" ? "default" : "secondary"}>
                    {program.status}
                  </Badge>
                </TableCell>
                <TableCell>{program.max_score_per_judge}</TableCell>

                <TableCell className="text-right flex justify-end gap-2">
                  <Link href={`/admin/programs/${program.id}`}>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </Link>
                  <DeleteButton table="programs" id={program.id} path="/admin/programs" />
                </TableCell>
              </TableRow>
            ))}
            {programs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No programs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
