
import { SupabaseClient } from "@supabase/supabase-js"

export interface ParticipantResult {
  id: string
  name: string
  participant_no: string | null
  total_score: number
  rank: number
  chest_number?: string | null
}

export async function calculateProgramRankings(
  supabase: SupabaseClient, 
  programId: string
): Promise<ParticipantResult[]> {
  // 1. Fetch Program, Scores, Participants
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('id', programId)
    .single()
  
  if (!program) throw new Error("Program not found")

  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('program_id', programId)

  const { data: participants } = await supabase
    .from('program_participants')
    .select('*, candidates(*), teams(*)')
    .eq('program_id', programId)

  if (!scores || !participants) return []

  // 2. Group scores
  // Calculate Total Score per Judge for each Participant.
  
  const pMap: Record<string, Record<string, number>> = {} // pid -> judge_id -> total_score
  
  scores.forEach((s: any) => {
      if (!pMap[s.participant_id]) pMap[s.participant_id] = {}
      if (!pMap[s.participant_id][s.judge_id]) pMap[s.participant_id][s.judge_id] = 0
      pMap[s.participant_id][s.judge_id] += s.score_value
  })
  
  const results = participants.map((p: any) => {
      const judgeScoresMap = pMap[p.id] || {}
      const judgeScores = Object.values(judgeScoresMap)
      
      // Sort desc
      judgeScores.sort((a,b) => b - a)
      
      const N = program.best_of_judge_count || judgeScores.length || 1
      const bestScores = judgeScores.slice(0, N)
      
      const sum = bestScores.reduce((a,b) => a + b, 0)
      const avg = bestScores.length > 0 ? sum / bestScores.length : 0
      
      const name = program.participant_type === 'individual' 
        ? p.candidates?.name 
        : p.teams?.name + (p.candidates?.name ? ` (${p.candidates.name})` : "")
        
      return {
          id: p.id,
          name: name || "Unknown",
          participant_no: p.participant_no,
          chest_number: p.candidates?.chest_number,
          total_score: Number(avg.toFixed(2)),
          rank: 0
      }
  })

  // 3. Sort and Rank
  results.sort((a, b) => b.total_score - a.total_score)

  let currentRank = 1
  for (let i = 0; i < results.length; i++) {
      if (i > 0 && results[i].total_score < results[i-1].total_score) {
          currentRank = i + 1
      }
      results[i].rank = currentRank
  }
  
  return results
}
