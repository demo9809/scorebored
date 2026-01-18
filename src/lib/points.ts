import { SupabaseClient } from "@supabase/supabase-js"

export const POINTS_SYSTEM = {
  1: 5,
  2: 3,
  3: 1
}

export interface TeamPointsData {
  teamId: string
  totalPoints: number
  programBreakdown: {
    programId: string
    programName: string
    rank: number | null
    points: number
    participantName?: string // For individual items
  }[]
}

export async function calculateTeamPoints(supabase: SupabaseClient, teamId: string): Promise<TeamPointsData> {
  // 1. Fetch team details
  const { data: team } = await supabase.from("teams").select("*").eq("id", teamId).single()
  if (!team) throw new Error("Team not found")

  // 2. Fetch all completed/live programs
  const { data: programs } = await supabase
    .from("programs")
    .select("*, program_participants(*, candidates(*), teams(*))")
    .in("status", ["completed", "live"])

  if (!programs) return { teamId, totalPoints: 0, programBreakdown: [] }

  const breakdown: TeamPointsData["programBreakdown"] = []
  let totalPoints = 0

  // 3. For each program, calculate rank and points
  for (const program of programs) {
    // Get all scores for this program to calculate ranks
    const { data: scores } = await supabase
      .from("scores")
      .select("*")
      .eq("program_id", program.id)

    if (!scores || scores.length === 0) continue

    // Calculate ranks for this program (simplified version of LiveLeaderboard logic)
    // We need to DRY this up later, but for now duplicate logic is safer than refactoring everything.
    const participantScores: Record<string, Record<string, number>> = {} // pid -> judge -> score
    scores.forEach((s: any) => {
       if (!participantScores[s.participant_id]) participantScores[s.participant_id] = {}
       if (!participantScores[s.participant_id][s.judge_id]) participantScores[s.participant_id][s.judge_id] = 0
       participantScores[s.participant_id][s.judge_id] += s.score_value
    })

    const rankedList = program.program_participants?.map((p: any) => {
        const judgeScores = participantScores[p.id] ? Object.values(participantScores[p.id]) : []
        judgeScores.sort((a,b) => b - a)
        const N = program.best_of_judge_count || 100
        const bestScores = judgeScores.slice(0, N)
        const sum = bestScores.reduce((a,b) => a+b, 0)
        const avg = bestScores.length > 0 ? sum / bestScores.length : 0
        return { ...p, total: avg }
    }).sort((a: any, b: any) => b.total - a.total) || []

    // Find rank of our team
    let myRank = null
    let earnedPoints = 0
    let participantName = ""

    // Assign generic rank
    let currentRank = 1
    const finalRankedList = rankedList.map((item: any, index: number) => {
        if (index > 0 && item.total < rankedList[index-1].total) {
            currentRank = index + 1
        }
        return { ...item, rank: currentRank }
    })

    if (program.participant_type === 'team') {
        const myParticipation = finalRankedList.find((p: any) => p.team_id === teamId)
        if (myParticipation) {
            myRank = myParticipation.rank
            participantName = team.name
        }
    } else {
        // For individual, checking if any of our candidates participated
        // If multiple candidates from same team, do we sum points? Usually yes.
        // Or just take best? Standard is sum of points earned by candidates.
        // Let's find ALL candidates from this team in the ranked list
        const myCandidates = finalRankedList.filter((p: any) => p.candidates?.team_id === teamId)
        
        // Loop through each candidate and sum points
        if (myCandidates.length > 0) {
            for (const cand of myCandidates) {
                const p = (POINTS_SYSTEM as any)[cand.rank] || 0
                if (p > 0) {
                     earnedPoints += p
                     // We might have multiple entries in breakdown if multiple candidates won.
                     // But let's aggregate for "Score Card" or list them? 
                     // List them is better for clarity.
                     breakdown.push({
                        programId: program.id,
                        programName: program.name,
                        rank: cand.rank,
                        points: p,
                        participantName: cand.candidates.name
                     })
                }
            }
            // Skip the default push below
            totalPoints += earnedPoints
            continue 
        }
    }

    if (program.participant_type === 'team' && myRank) {
        earnedPoints = (POINTS_SYSTEM as any)[myRank] || 0
        breakdown.push({
            programId: program.id,
            programName: program.name,
            rank: myRank,
            points: earnedPoints,
            participantName: participantName
        })
        totalPoints += earnedPoints
    }
  }

  return {
    teamId,
    totalPoints,
    programBreakdown: breakdown.sort((a,b) => b.points - a.points) // Show highest points first
  }
}
