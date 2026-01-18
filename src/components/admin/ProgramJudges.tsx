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

interface ProgramJudgesProps {
  programId: string
  assignedJudges: any[]
  availableJudges: any[]
}

export function ProgramJudges({ programId, assignedJudges, availableJudges }: ProgramJudgesProps) {
  const [selectedJudgeId, setSelectedJudgeId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleAddJudge() {
    if (!selectedJudgeId) return
    setLoading(true)
    
    try {
      const { error } = await supabase.from("program_judges").insert({
        program_id: programId,
        judge_id: selectedJudgeId
      })

      if (error) throw error

      toast.success("Judge assigned successfully")
      setSelectedJudgeId("")
      router.refresh()
    } catch (error) {
      toast.error("Failed to assign judge")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveJudge(id: string) {
    try {
      const { error } = await supabase.from("program_judges").delete().eq("id", id)
      if (error) throw error
      toast.success("Judge removed")
      router.refresh()
    } catch (error) {
       toast.error("Failed to remove judge")
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Assigned Judges</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a judge to assign" />
            </SelectTrigger>
            <SelectContent>
              {availableJudges.map((judge) => (
                <SelectItem key={judge.id} value={judge.id}>
                  {judge.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddJudge} disabled={!selectedJudgeId || loading}>
            Assign
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Assigned At</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignedJudges.map((pj) => (
              <TableRow key={pj.id}>
                <TableCell>{pj.profiles?.full_name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                   {/* Date formatting could go here */}
                   -
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveJudge(pj.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {assignedJudges.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No judges assigned yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
