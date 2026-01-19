"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { DeleteButton } from "@/components/admin/DeleteButton"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { bulkDeleteCandidates } from "@/app/actions/bulk-delete-candidates"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Program {
    name: string
    participant_type: string
}

interface ProgramParticipant {
    program?: Program
}

interface ProgramParticipantMember {
    program_participant?: {
        program?: Program
    }
}

interface Candidate {
    id: string
    name: string
    chest_number: string | null
    year: string | null
    department: string | null
    program_participants?: ProgramParticipant[]
    program_participant_members?: ProgramParticipantMember[]
}

interface TeamCandidatesTableProps {
    candidates: Candidate[]
    teamId: string
}

export function TeamCandidatesTable({ candidates, teamId }: TeamCandidatesTableProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isDeleting, setIsDeleting] = useState(false)

    // Helper to extract program names
    const getProgramNames = (c: Candidate) => {
        const formatProgram = (p?: Program) => {
            if (!p) return null
            const type = p.participant_type === 'individual' ? 'Individual' : 'Team'
            return `${p.name} (${type})`
        }

        const directPrograms = c.program_participants?.map((pp) => formatProgram(pp.program)) || []
        const memberPrograms = c.program_participant_members?.map((ppm) => formatProgram(ppm.program_participant?.program)) || []
        const allPrograms = [...directPrograms, ...memberPrograms].filter(Boolean) as string[]
        return Array.from(new Set(allPrograms)).join(", ")
    }

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(candidates.map(c => c.id)))
        } else {
            setSelectedIds(new Set())
        }
    }

    const toggleSelect = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds)
        if (checked) {
            newSet.add(id)
        } else {
            newSet.delete(id)
        }
        setSelectedIds(newSet)
    }

    const handleBulkDelete = async () => {
        setIsDeleting(true)
        const idsToDelete = Array.from(selectedIds)
        const res = await bulkDeleteCandidates(idsToDelete, `/admin/teams/${teamId}`)
        
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(`Deleted ${res.count} candidates`)
            setSelectedIds(new Set())
        }
        setIsDeleting(false)
    }

    const allSelected = candidates.length > 0 && selectedIds.size === candidates.length

    return (
        <div className="space-y-4">
            {selectedIds.size > 0 && (
                <div className="flex items-center justify-between bg-muted/40 p-2 rounded-md border">
                    <span className="text-sm font-medium px-2">{selectedIds.size} selected</span>
                     <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isDeleting}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {isDeleting ? "Deleting..." : "Delete Selected"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {selectedIds.size} Candidates?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete these candidates? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox 
                                checked={allSelected}
                                onCheckedChange={(checked) => toggleSelectAll(checked as boolean)}
                            />
                        </TableHead>
                        <TableHead>Chest No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Program(s)</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Dept</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {candidates.map(c => (
                        <TableRow key={c.id} data-state={selectedIds.has(c.id) ? "selected" : undefined}>
                            <TableCell>
                                <Checkbox 
                                    checked={selectedIds.has(c.id)}
                                    onCheckedChange={(checked) => toggleSelect(c.id, checked as boolean)}
                                />
                            </TableCell>
                            <TableCell>{c.chest_number ? <Badge variant="outline">{c.chest_number}</Badge> : <span className="text-muted-foreground">-</span>}</TableCell>
                            <TableCell>
                                <span className="font-medium">{c.name}</span>
                            </TableCell>
                            <TableCell>
                                <span className="text-xs text-muted-foreground">{getProgramNames(c) || "-"}</span>
                            </TableCell>
                            <TableCell>{c.year || '-'}</TableCell>
                            <TableCell>{c.department || '-'}</TableCell>
                            <TableCell className="text-right">
                                <DeleteButton table="candidates" id={c.id} path={`/admin/teams/${teamId}`} />
                            </TableCell>
                        </TableRow>
                    ))}
                    {candidates.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                                No candidates registered.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
