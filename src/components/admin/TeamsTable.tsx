"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TeamDialog } from "@/components/admin/TeamDialog"
import { DeleteButton } from "@/components/admin/DeleteButton"
import { useRouter } from "next/navigation"

interface TeamsTableProps {
  teams: any[]
}

export function TeamsTable({ teams }: TeamsTableProps) {
  const router = useRouter()

  return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Points</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow 
                key={team.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/admin/teams/${team.id}`)}
            >
              <TableCell className="font-medium">
                  {team.name}
              </TableCell>
              <TableCell>{team.total_points ?? 0}</TableCell>

              <TableCell className="text-right">
                 {/* Stop propagation to prevent row click when clicking actions */}
                <div onClick={(e) => e.stopPropagation()} className="flex justify-end gap-2">
                    <TeamDialog 
                      teamToEdit={team}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      }
                    />
                    <DeleteButton table="teams" id={team.id} path="/admin/teams" />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {!teams.length && (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                No teams found. Create a team to allow candidate registration.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
  )
}
