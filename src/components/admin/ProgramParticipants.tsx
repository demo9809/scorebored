"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"

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

      if (participantType === "individual") {
        payload.candidate_id = selectedId
      } else {
        payload.team_id = selectedId
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
            {participantType === "individual" && (
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
                    {selectedTeamFilter !== "all" && (
                        <Button variant="secondary" size="sm" onClick={handleBulkAddTeam} disabled={isBulkAdding}>
                            {isBulkAdding ? "Adding..." : "Add All from Team"}
                        </Button>
                    )}
                </div>
            )}

            <div className="flex gap-2">
            <Input 
                placeholder="Chest/Team No." 
                className="w-[150px]" 
                value={participantNo}
                onChange={(e) => setParticipantNo(e.target.value)}
            />
            <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="w-[300px]">
                <SelectValue placeholder={`Select ${participantType}`} />
                </SelectTrigger>
                <SelectContent>
                {participantType === "individual" 
                    ? filteredCandidates.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.chest_number})</SelectItem>
                    ))
                    : teams.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))
                }
                </SelectContent>
            </Select>
            <Button onClick={handleAddParticipant} disabled={!selectedId || loading}>
                Add Single
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
                    ? pp.candidates?.name 
                    : pp.teams?.name}
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
