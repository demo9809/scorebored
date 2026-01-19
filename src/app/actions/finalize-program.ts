"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { calculateProgramRankings } from "@/lib/ranking"
import { updateAllTeamPoints } from "@/lib/points"

export async function finalizeProgram(programId: string) {
  const supabase = await createClient()
  
  // Create Admin Client for bypassing RLS on writes
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // 1. Auth Check (Judge or Admin)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  // Check if user is assigned judge or admin
  const { data: assignment } = await supabase.from('program_judges').select('id').eq('program_id', programId).eq('judge_id', user.id).single()
  const isAdmin = user.user_metadata.role === 'admin'
  
  if (!assignment && !isAdmin) {
      return { error: "You are not authorized to finalize this program." }
  }

  try {
      // 2. Fetch all data needed for calculation
      const { data: program } = await supabase.from('programs').select('*').eq('id', programId).single()
      if (!program) throw new Error("Program not found")

      const { data: scores } = await supabase.from('scores').select('*').eq('program_id', programId)
      const { data: participants } = await supabase.from('program_participants').select('*').eq('program_id', programId)

      if (!scores || !participants) throw new Error("No data to finalize")

      // 3. Calculate Totals and Ranks
      const updates = await calculateProgramRankings(supabase, programId)
      
      // 4. Update Database
      // We need to update each participant. 
      // Supabase supports upsert, but we are updating specific fields.
      const upsertPayload = updates.map(u => {
          const original = participants.find(p => p.id === u.id)
          return {
            id: u.id,
            program_id: programId, 
            total_score: u.total_score,
            rank: u.rank,
            candidate_id: original?.candidate_id,
            team_id: original?.team_id,
            participant_no: original?.participant_no
          }
      })

      // Use Admin Client
      const { error: updateError } = await supabaseAdmin.from('program_participants').upsert(upsertPayload)
      if (updateError) {
          console.error("Update Participants Error:", updateError)
          throw new Error(`Failed to update scores: ${updateError.message} (${updateError.details})`)
      }

      // 5. Update Program Status
      const { error: statusError } = await supabaseAdmin
          .from('programs')
          .update({ status: 'completed' })
          .eq('id', programId)
      
      if (statusError) {
          console.error("Update Status Error:", statusError)
          throw new Error(`Failed to update status: ${statusError.message}`)
      }

      revalidatePath(`/judge/program/${programId}`)
      revalidatePath(`/admin/programs`)
      revalidatePath(`/`) // Public leaderboard

      // 6. Asynchronously update team points 
      // We await it here to ensure consistency for the immediate redirect/refresh
      await updateAllTeamPoints(supabaseAdmin)

      return { success: true }
  } catch (error: any) {
      console.error("Finalize Error (Full):", JSON.stringify(error, null, 2))
      const message = error.message || "Failed to finalize program"
      return { error: message }
  }
}
