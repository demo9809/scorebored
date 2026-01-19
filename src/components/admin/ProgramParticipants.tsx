"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ManageMembersDialog } from "@/components/admin/ManageMembersDialog"

interface ProgramParticipantsProps {
  programId: string
  participantType: "individual" | "team"
  candidates: any[]
  teams: any[]
  programParticipants: any[]
}

export function ProgramParticipants({ 
  programId, 
  participantType, 
  candidates, 
  teams, 
  programParticipants 
}: ProgramParticipantsProps) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string>("")
  const [participantNo, setParticipantNo] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all")
  const [isBulkAdding, setIsBulkAdding] = useState(false)

  // Filter candidates based on team selection
  const filteredCandidates = selectedTeamFilter === "all" 
    ? candidates 
    : candidates.filter(c => c.team_id === selectedTeamFilter)


  async function handleAddParticipant() {
    if (!selectedId) return
    setLoading(true)
    
    try {
      const payload: any = {
        program_id: programId,
        participant_no: participantNo,
        status: "active"
      }

      if (participantType === "individual" || participantType === "team") {
        // Find the selected candidate to get their team_id
        const selectedCandidate = candidates.find(c => c.id === selectedId)
        if (!selectedCandidate) {
            toast.error("Invalid candidate selected")
            return
        }
        
        payload.candidate_id = selectedId
        payload.team_id = selectedCandidate.team_id
      }

      const { error } = await supabase.from("program_participants").insert(payload)

      if (error) throw error

      toast.success("Participant added successfully")
      setSelectedId("")
      setParticipantNo("")
      router.refresh()
    } catch (error: any) {
      toast.error("Failed to add participant")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(id: string) {
    try {
      const { error } = await supabase.from("program_participants").delete().eq("id", id)
      if (error) throw error
      toast.success("Participant removed")
      router.refresh()
    } catch (error) {
       toast.error("Failed to remove participant")
    }
  }

  async function handleBulkAddTeam() {
    if (selectedTeamFilter === "all") return
    setIsBulkAdding(true)
    try {
        const teamCandidates = candidates.filter(c => c.team_id === selectedTeamFilter)
        
        const newParticipants = teamCandidates.filter(tc => 
            !programParticipants.some(pp => pp.candidate_id === tc.id)
        ).map(tc => ({
            program_id: programId,
            participant_no: tc.chest_number, 
            status: "active",
            candidate_id: tc.id
        }))

        if (newParticipants.length === 0) {
            toast.info("All candidates from this team are already added.")
            return
        }

        const { error } = await supabase.from("program_participants").insert(newParticipants)
        if (error) throw error

        toast.success(`Added ${newParticipants.length} participants from team`)
        router.refresh()
    } catch (e) {
        toast.error("Failed to bulk add")
        console.error(e)
    } finally {
        setIsBulkAdding(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Participants ({participantType})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
            {/* Team Filter for Individual Programs */}
            {/* Team Filter (for both Individual and Team programs now) */}
            <div className="flex gap-2 items-center p-2 bg-muted/50 rounded-md">
                <span className="text-sm font-medium whitespace-nowrap">Filter by Team:</span>
                <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Teams" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Teams</SelectItem>
                        {teams.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {/* Bulk add only makes sense if we are adding ALL candidates, which is weird for Team events if we just want one lead. 
                    So keep bulk add logic maybe? 
                    Actually bulk adding "All Team Members" as "Team Leaders" makes no sense for a group item. 
                    You only have ONE team entry per house usually.
                */}
                {selectedTeamFilter !== "all" && participantType === "individual" && (
                    <Button variant="secondary" size="sm" onClick={handleBulkAddTeam} disabled={isBulkAdding}>
                        {isBulkAdding ? "Adding..." : "Add All from Team"}
                    </Button>
                )}
            </div>

            <div className="flex gap-2">
            <Input 
                placeholder="Chest/Team No." 
                className="w-[150px]" 
                value={participantNo}
                onChange={(e) => setParticipantNo(e.target.value)}
            />
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[300px] justify-between"
                >
                  {selectedId
                    ? filteredCandidates.find((c) => c.id === selectedId)?.name
                    : (participantType === "individual" ? "Select Candidate..." : "Select Team Lead...")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search candidate..." />
                  <CommandList>
                    <CommandEmpty>No candidate found.</CommandEmpty>
                    <CommandGroup>
                      {filteredCandidates.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={(_) => {
                            setSelectedId(c.id)
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedId === c.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {c.name} {c.chest_number ? `(${c.chest_number})` : ""}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button onClick={handleAddParticipant} disabled={!selectedId || loading}>
                Add {participantType === "individual" ? "Participant" : "Team Entry"}
            </Button>
            </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programParticipants.map((pp) => (
              <TableRow key={pp.id}>
                <TableCell>{pp.participant_no}</TableCell>
                <TableCell>
                  {participantType === "individual" 
                    ? (
                        <div className="flex flex-col">
                            <span className="font-medium">{pp.candidates?.name}</span>
                            <span className="text-xs text-muted-foreground">{pp.candidates?.teams?.name}</span>
                        </div>
                    )
                    : (
                        <div className="flex flex-col gap-1 items-start">
                            <span className="font-medium">{pp.teams?.name}</span>
                            <span className="text-xs text-muted-foreground">Lead: {pp.candidates?.name || "N/A"}</span>
                            {/* Only show for team events */}
                            {pp.teams && (
                                <ManageMembersDialog participant={pp} candidates={candidates} />
                            )}
                        </div>
                    )
                  }
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(pp.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
             {programParticipants.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No participants added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
