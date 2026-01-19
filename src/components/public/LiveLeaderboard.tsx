"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"

// Points Logic
const POINTS_INDIVIDUAL = { 1: 5, 2: 3, 3: 1 }
const POINTS_GROUP = { 1: 10, 2: 5, 3: 3 }

interface LiveLeaderboardProps {
  program: any
  initialParticipants: any[]
  initialScores: any[]
}

export function LiveLeaderboard({ program, initialParticipants, initialScores }: LiveLeaderboardProps) {
  const [scores, setScores] = useState<any[]>(initialScores)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('realtime_scores')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
          filter: `program_id=eq.${program.id}`,
        },
        (payload) => {
           console.log('Realtime update:', payload)
           if (payload.eventType === 'INSERT') {
               setScores(prev => [...prev, payload.new])
           } else if (payload.eventType === 'UPDATE') {
               setScores(prev => prev.map(s => s.id === payload.new.id ? payload.new : s))
           } else if (payload.eventType === 'DELETE') {
               setScores(prev => prev.filter(s => s.id !== payload.old.id))
           }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [program.id, supabase])

  // Calculate ranks
  const rankedParticipants = useMemo(() => {
      // 1. Group scores by participant
      
      // We need to aggregate properly.
      // Logic: Max Score per rule? Or just sum of all scores?
      // AND "Best of N Judges".
      // This is complex for client-side if data is massive, but for 20-50 participants it's fine.
      
      // Group by participant -> judge -> rule
      const pMap: Record<string, Record<string, number>> = {} // pid -> judge_id -> total_for_judge
      
      scores.forEach(s => {
          if (!pMap[s.participant_id]) pMap[s.participant_id] = {}
          if (!pMap[s.participant_id][s.judge_id]) pMap[s.participant_id][s.judge_id] = 0
          pMap[s.participant_id][s.judge_id] += s.score_value
      })
      
      // Now aggregate judges based on program.best_of_judge_count
      const finalScores: { id: string, total: number, participant: any }[] = []

      initialParticipants.forEach(p => {
          const judgeScores = pMap[p.id] ? Object.values(pMap[p.id]) : []
          // Sort judge scores desc
          judgeScores.sort((a,b) => b - a)
          
          // Take top N
          const N = program.best_of_judge_count || 100 // fallback to all
          const bestScores = judgeScores.slice(0, N)
          
          // Average or Sum? Usually Average of best N? Or Sum?
          // Prompt doesn't specify formula. "Max score per judge" implies Judge gives X.
          // Usually final score is Average of these N judges.
          
          const sum = bestScores.reduce((a,b) => a+b, 0)
          const avg = bestScores.length > 0 ? sum / bestScores.length : 0
          
          // Let's use Average for now as it's standard.
          
          finalScores.push({
              id: p.id,
              total: avg,
              participant: p
          })
      })

      // Sort by total desc
      return finalScores.sort((a,b) => b.total - a.total)

  }, [scores, initialParticipants, program.best_of_judge_count])

  // Assign ranks
  const leaderboard = useMemo(() => {
      // If completed, trust the rank from DB if available
      if (program.status === 'completed') {
          // Map participants to include total (for display) and rank
          const dbRanked = initialParticipants.map(p => {
              // total_score is stored * 10 usually, or just store points?
              // Import results stores: total_score: points * 10
              // So display total = total_score / 10 if we want points.
              // BUT, the table display logic below handles "Points" display based on rank.
              // So let's just ensure rank is correct.
              
              return {
                  id: p.id,
                  total: p.total_score ? p.total_score / 10 : 0, // Fallback
                  rank: p.rank || 999,
                  participant: p
              }
          })
          
          return dbRanked.sort((a,b) => a.rank - b.rank)
      }

      // Live Calculation
      let currentRank = 1
      return rankedParticipants.map((item, index) => {
          let rank = currentRank
          if (index > 0 && item.total < rankedParticipants[index-1].total) {
              rank = index + 1
              currentRank = rank
          }
          return { ...item, rank }
      })
  }, [rankedParticipants, program.status, initialParticipants])

  return (
    <Card>
        <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Rank</TableHead>
                        <TableHead>Participant</TableHead>
                        <TableHead className="text-right">
                            {program.status === 'completed' ? 'Points' : 'Score'}
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leaderboard.map((item) => {
                         // Calculate display score (Points) if completed
                         let displayScore = item.total.toFixed(2)
                         
                         if (program.status === 'completed') {
                             const pType = program.participant_type === 'team' || program.participant_type === 'group' ? 'group' : 'individual'
                             const pointsMap = pType === 'group' ? POINTS_GROUP : POINTS_INDIVIDUAL
                             // @ts-ignore
                             const points = pointsMap[item.rank] || 0
                             displayScore = points.toString()
                         }

                         return (
                        <TableRow key={item.id} className={item.rank === 1 ? "bg-yellow-50 dark:bg-yellow-900/10 font-bold" : ""}>
                            <TableCell className="font-medium flex items-center gap-2">
                                {item.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                                <span className={item.rank <= 3 ? "text-lg" : ""}>#{item.rank}</span>
                            </TableCell>
                            <TableCell>
                                <div>
                                    <div className="font-semibold">
                                     {program.participant_type === 'individual' ? (
                                        <div className="flex flex-col">
                                            <span>{item.participant.candidates?.name}</span>
                                            <span className="text-xs text-muted-foreground font-normal">{item.participant.candidates?.teams?.name}</span>
                                        </div>
                                     ) : item.participant.teams?.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {item.participant.participant_no}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right text-lg">
                                {displayScore}
                            </TableCell>
                        </TableRow>
                    )})}
                     {leaderboard.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                No scores yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  )
}
