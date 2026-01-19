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
  const { data: team } = await supabase.from("teams").select("name").eq("id", teamId).single()
  if (!team) throw new Error("Team not found")

  // Fetch all ranked participations for this team in completed programs
  
  // 1. Get all candidates for this team (to filter in JS)
  const { data: teamCandidates } = await supabase.from("candidates").select("id").eq("team_id", teamId)
  const candidateIds = new Set(teamCandidates?.map(c => c.id) || [])

  // 2. Fetch ALL ranked participations in completed programs
  // We fetch all to avoid complex OR logic with IN clauses which can be flaky in Supabase JS client
  const { data: allParticipations } = await supabase
    .from("program_participants")
    .select(`
      rank,
      program_id,
      candidate_id,
      team_id,
      programs!inner (id, name, status),
      candidates (name),
      teams (name)
    `)
    .eq("programs.status", "completed")
    .not("rank", "is", null)
  
  const participations = allParticipations?.filter(p => {
      // Direct team match
      if (p.team_id === teamId) return true
      // Candidate match
      if (p.candidate_id && candidateIds.has(p.candidate_id)) return true
      return false
  })

  // Filter out any where program might be null due to join type, though inner join preferred.
  // Supabase inner joins: !inner
  
  const breakdown: TeamPointsData["programBreakdown"] = []
  let totalPoints = 0

  if (participations) {
      participations.forEach((p: any) => {
          if (!p.programs) return // Should not happen if filtered correctly
          
          const rank = p.rank
          const points = (POINTS_SYSTEM as any)[rank] || 0
          
          if (points > 0) {
              totalPoints += points
              breakdown.push({
                  programId: p.programs.id,
                  programName: p.programs.name,
                  rank: rank,
                  points: points,
                  participantName: p.candidates?.name || p.teams?.name || "Participant"
              })
          }
      })
  }

  return {
    teamId,
    totalPoints,
    programBreakdown: breakdown.sort((a,b) => b.points - a.points)
  }
}

export async function updateAllTeamPoints(supabase: SupabaseClient) {
    const { data: teams } = await supabase.from("teams").select("id")
    if (!teams) return

    for (const team of teams) {
        try {
            const data = await calculateTeamPoints(supabase, team.id)
            await supabase.from("teams").update({ total_points: data.totalPoints }).eq("id", team.id)
        } catch (e) {
            console.error(`Failed to update points for team ${team.id}`, e)
        }
    }
}
