"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScoreEditDialog } from "./ScoreEditDialog"
import { useRouter } from "next/navigation"

interface AdminScoreMatrixProps {
  program: any
  judges: any[]
  participants: any[]
  scores: any[]
}

export function AdminScoreMatrix({ program, judges, participants, scores }: AdminScoreMatrixProps) {
  const router = useRouter()
  const [selectedCell, setSelectedCell] = useState<{
    judge: any
    participant: any
    scores: any[]
  } | null>(null)

  // Helper to get total score for a judge-participant pair
  const getCellData = useCallback((judgeId: string, participantId: string) => {
    const participantScores = scores.filter(s => 
      s.program_id === program.id && 
      s.judge_id === judgeId && 
      s.participant_id === participantId
    )
    
    const total = participantScores.reduce((sum: number, s: any) => sum + (s.score_value || 0), 0)
    const hasScores = participantScores.length > 0
    
    return { total, hasScores, participantScores }
  }, [scores, program.id])

  // Calculate final total for a participant (average of best N judges)
  const getFinalScore = useMemo(() => {
    return (participantId: string) => {
      // Get all judge totals for this participant
      const judgeTotals = judges.map(j => getCellData(j.id, participantId).total)
      
      // Sort desc
      judgeTotals.sort((a,b) => b - a)
      
      // Top N
      const N = program.best_of_judge_count || judges.length
      const bestTotals = judgeTotals.slice(0, N)
      
      const sum = bestTotals.reduce((a,b) => a+b, 0)
      const avg = bestTotals.length > 0 ? sum / bestTotals.length : 0
      
      return avg
    }
  }, [judges, program.best_of_judge_count, getCellData])

  // Sort participants by final rank
  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => getFinalScore(b.id) - getFinalScore(a.id))
  }, [participants, getFinalScore])

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead className="min-w-[200px]">Participant</TableHead>
              {judges.map(judge => (
                <TableHead key={judge.id} className="text-center min-w-[100px]">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-normal text-muted-foreground">Judge</span>
                    <span className="font-medium whitespace-nowrap">{judge.full_name}</span>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-right font-bold bg-muted/50">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedParticipants.map((participant, index) => {
                const finalScore = getFinalScore(participant.id)
                return (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium text-muted-foreground">#{index + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {program.participant_type === 'individual' ? (
                            <div className="flex flex-col">
                                <span>{participant.candidates?.name}</span>
                                <span className="text-xs text-muted-foreground font-normal">{participant.candidates?.teams?.name}</span>
                            </div>
                        ) : participant.teams?.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{participant.participant_no}</div>
                    </TableCell>
                    {judges.map(judge => {
                      const { total, hasScores, participantScores } = getCellData(judge.id, participant.id)
                      return (
                        <TableCell key={judge.id} className="text-center p-1">
                          <Button 
                            variant={hasScores ? "outline" : "ghost"} 
                            className={`h-8 w-full ${hasScores ? "" : "text-muted-foreground opacity-50 hover:opacity-100"}`}
                            onClick={() => setSelectedCell({ judge, participant, scores: participantScores })}
                          >
                            {hasScores ? total : "-"}
                          </Button>
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right font-bold text-lg bg-muted/50">
                        {finalScore.toFixed(2)}
                    </TableCell>
                  </TableRow>
                )
            })}
            {participants.length === 0 && (
                <TableRow>
                    <TableCell colSpan={judges.length + 3} className="h-24 text-center text-muted-foreground">
                        No participants found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedCell && (
        <ScoreEditDialog 
            open={!!selectedCell} 
            onOpenChange={(val) => !val && setSelectedCell(null)}
            program={program}
            judge={selectedCell.judge}
            participant={selectedCell.participant}
            rules={program.program_rules || []}
            initialScores={selectedCell.scores}
            onSaved={() => {
                router.refresh()
            }}
        />
      )}
    </div>
  )
}
