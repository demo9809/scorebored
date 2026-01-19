"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Points Configuration
const POINTS_INDIVIDUAL: Record<number, number> = {
    1: 5,
    2: 3,
    3: 1
}

const POINTS_GROUP: Record<number, number> = {
    1: 10,
    2: 5,
    3: 3
}

type ImportRow = {
    program_name: string
    position: string | number
    candidate_name: string
    team_name: string
    program_type?: string // Optional
}

export async function importResults(rows: ImportRow[]) {
    const supabase = await createClient()
    let createdCandidates = 0
    let createdScores = 0
    let createdPrograms = 0

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: "Unauthorized" }

        const adminId = user.id

        // Cache existing data
        let { data: programs } = await supabase.from('programs').select('id, name, participant_type')
        let { data: teams } = await supabase.from('teams').select('id, name')

        // Loop through rows
        for (const row of rows) {
            const pName = row.program_name?.trim()
            const cName = row.candidate_name?.trim()
            const tName = row.team_name?.trim()
            const pType = row.program_type?.trim().toLowerCase()

            if (!pName || !tName) continue // Basic validation

            // Parse Rank
            let rank = 0
            const posStr = String(row.position).toLowerCase()
            if (posStr.includes('1') || posStr === 'i' || posStr.includes('first')) rank = 1
            else if (posStr.includes('2') || posStr === 'ii' || posStr.includes('second')) rank = 2
            else if (posStr.includes('3') || posStr === 'iii' || posStr.includes('third')) rank = 3
            
            if (rank === 0) continue 

            // 1. Find or Create Program
            let program = programs?.find(p => p.name.toLowerCase() === pName.toLowerCase())
            if (!program) {
                // Create Program
                // Determine type based on row if provided
                const isGroup = pType && (pType.includes('group') || pType.includes('team'))
                
                const { data: newProg, error: progError } = await supabase
                    .from('programs')
                    .insert({
                        name: pName,
                        participant_type: isGroup ? 'team' : 'individual', 
                        status: 'completed',
                        max_score_per_judge: isGroup ? 10 : 5 
                    })
                    .select('id, name, participant_type')
                    .single()
                
                if (newProg && !progError) {
                    programs = [...(programs || []), newProg]
                    program = newProg
                    createdPrograms++
                } else {
                    console.error("Failed to create program", pName, progError)
                    continue
                }
            }

            // 2. Find or Create Team
            let team = teams?.find(t => t.name.toLowerCase() === tName.toLowerCase())
            if (!team) {
                const { data: newTeam, error: teamError } = await supabase
                    .from('teams')
                    .insert({ name: tName })
                    .select('id, name')
                    .single()
                
                if (newTeam && !teamError) {
                    teams = [...(teams || []), newTeam]
                    team = newTeam
                } else {
                    console.error("Failed to create team", tName, teamError)
                    continue
                }
            }

            // 3. Find or Create Candidate
            let candidateId: string | null = null
            
            // Scope lookup by team + name to avoid collisions
            const { data: existingCandidate } = await supabase
                .from('candidates')
                .select('id')
                .eq('team_id', team.id)
                .ilike('name', cName)
                .maybeSingle()

            if (existingCandidate) {
                candidateId = existingCandidate.id
            } else {
                const { data: newCand } = await supabase
                    .from('candidates')
                    .insert({ name: cName, team_id: team.id })
                    .select('id')
                    .single()
                
                if (newCand) {
                    candidateId = newCand.id
                    createdCandidates++
                }
            }

            if (!candidateId) continue

            // 4. Enroll in Program
            let participantId: string | null = null
            
            // Check existing participation
            const { data: existingPart } = await supabase
                .from('program_participants')
                .select('id')
                .eq('program_id', program.id)
                .eq('candidate_id', candidateId)
                .maybeSingle()
            
            if (existingPart) {
                participantId = existingPart.id
            } else {
                const { data: newPart } = await supabase
                    .from('program_participants')
                    .insert({
                        program_id: program.id,
                        candidate_id: candidateId,
                        team_id: team.id, // Explicitly link team_id for points calculation
                        status: 'active'
                    })
                    .select('id')
                    .single()
                
                if (newPart) participantId = newPart.id
            }

            if (!participantId) continue

            // 5. Update Rank/Score
            // Use correct points map
            const pointsMap = program.participant_type === 'team' 
                ? POINTS_GROUP 
                : POINTS_INDIVIDUAL
                
            const points = pointsMap[rank] || 0
            
            await supabase
                .from('program_participants')
                .update({
                    rank: rank,
                    total_score: points * 10,
                })
                .eq('id', participantId)

            // 6. Insert Score Record
            const { data: rules } = await supabase.from('program_rules').select('id').eq('program_id', program.id).limit(1)
            let ruleId = rules?.[0]?.id

            // If no rules exist, create a default "Rank" rule
            if (!ruleId) {
                const { data: newRule } = await supabase
                    .from('program_rules')
                    .insert({ 
                        program_id: program.id, 
                        name: 'Rank', 
                        max_score: 10,
                        order_index: 1 
                    })
                    .select('id')
                    .single()
                if (newRule) ruleId = newRule.id
            }

            if (ruleId) {
                await supabase.from('scores').upsert({
                    program_id: program.id,
                    participant_id: participantId,
                    judge_id: adminId,
                    rule_id: ruleId,
                    score_value: points
                }, { onConflict: 'program_id, participant_id, judge_id, rule_id' })
                createdScores++
            }
            
            // 7. Ensure Program is Completed
            await supabase.from('programs').update({ status: 'completed' }).eq('id', program.id)
        }

        revalidatePath('/', 'layout')
        return { success: true, counts: { candidates: createdCandidates, scores: createdScores, programs: createdPrograms } }

    } catch (error: any) {
        console.error("Import Error", error)
        return { error: error.message || "Server Error" }
    }
}
