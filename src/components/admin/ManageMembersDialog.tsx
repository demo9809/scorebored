"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Users, X } from "lucide-react"
import { toast } from "sonner"
import { addTeamMember, removeTeamMember } from "@/app/actions/manage-members"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface ManageMembersDialogProps {
    participant: any
    candidates: any[]
}

export function ManageMembersDialog({ participant, candidates }: ManageMembersDialogProps) {
    const [open, setOpen] = useState(false)
    const [selectedCandidateId, setSelectedCandidateId] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Filter candidates belonging to this team
    const teamCandidates = candidates.filter(c => c.team_id === participant.team_id)
    
    // Filter out already added members
    const availableCandidates = teamCandidates.filter(c => 
        !participant.program_participant_members?.some((m: any) => m.candidate_id === c.id)
    )

    const handleAdd = async () => {
        if (!selectedCandidateId) return
        setLoading(true)
        try {
            const res = await addTeamMember(participant.id, selectedCandidateId)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Member added")
                setSelectedCandidateId("")
                router.refresh()
            }
        } catch (e) {
            toast.error("Failed to add member")
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = async (memberId: string) => {
        try {
            const res = await removeTeamMember(memberId)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Member removed")
                router.refresh()
            }
        } catch (e) {
            toast.error("Failed to remove member")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-foreground">
                    <Users className="h-3 w-3" />
                    <span className="text-xs">
                        {participant.program_participant_members?.length || 0} Members
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Team Members</DialogTitle>
                    <DialogDescription>
                        Add students from {participant.teams?.name} participating in this event.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-col gap-4 py-4">
                    {/* Add Member */}
                    <div className="flex gap-2">
                        <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select student..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCandidates.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name} ({c.chest_number})
                                    </SelectItem>
                                ))}
                                {availableCandidates.length === 0 && (
                                    <SelectItem value="none" disabled>No more candidates available</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAdd} disabled={!selectedCandidateId || loading}>
                            Add
                        </Button>
                    </div>

                    {/* Member List */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {participant.program_participant_members?.map((m: any) => (
                            <Badge key={m.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                                {m.candidates?.name}
                                <button 
                                    onClick={() => handleRemove(m.id)}
                                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        {(!participant.program_participant_members || participant.program_participant_members.length === 0) && (
                            <p className="text-sm text-muted-foreground w-full text-center py-4">
                                No members added yet.
                            </p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
