"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DeleteButton } from "@/components/admin/DeleteButton"
import { deletePrograms } from "@/app/actions/delete-programs"
import { toast } from "sonner"
import { Trash2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { BulkAssignJudgeDialog } from "@/components/admin/BulkAssignJudgeDialog"

interface Program {
  id: string
  name: string
  participant_type: string
  status: string
  max_score_per_judge: number | null
}

interface ProgramsListProps {
  programs: Program[]
  judges: any[]
}

export function ProgramsList({ programs, judges }: ProgramsListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const router = useRouter()

  const toggleSelectAll = () => {
    if (selectedIds.length === programs.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(programs.map((p) => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} programs?`)) return

    setIsDeleting(true)
    const result = await deletePrograms(selectedIds)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Programs deleted successfully")
      setSelectedIds([])
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <span className="text-sm font-medium pl-2">{selectedIds.length} selected</span>
          <div className="ml-auto flex gap-2">
             <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAssigning(true)}
             >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Judge
             </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteSelected}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Selected"}
                <Trash2 className="ml-2 h-4 w-4" />
              </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={programs.length > 0 && selectedIds.length === programs.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Max Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow 
                key={program.id} 
                data-state={selectedIds.includes(program.id) && "selected"}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/admin/programs/${program.id}`)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={selectedIds.includes(program.id)}
                    onCheckedChange={() => toggleSelect(program.id)}
                    aria-label={`Select ${program.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                   {program.name}
                </TableCell>
                <TableCell className="capitalize">{program.participant_type}</TableCell>
                <TableCell>
                  <Badge variant={program.status === "live" ? "default" : "secondary"} className="capitalize">
                    {program.status}
                  </Badge>
                </TableCell>
                <TableCell>{program.max_score_per_judge}</TableCell>

                <TableCell className="text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <Link href={`/admin/programs/${program.id}`}>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </Link>
                  <DeleteButton table="programs" id={program.id} path="/admin/programs" />
                </TableCell>
              </TableRow>
            ))}
            {programs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No programs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <BulkAssignJudgeDialog 
        open={isAssigning} 
        onOpenChange={setIsAssigning}
        selectedIds={selectedIds}
        judges={judges}
        onSuccess={() => {
            setSelectedIds([]) 
            router.refresh()
        }}
      />
    </div>
  )
}
