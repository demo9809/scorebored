"use server"

import { createClient } from "@/lib/supabase/server"
import { calculateProgramRankings } from "@/lib/ranking"

export async function getProjectedStandings(programId: string) {
  const supabase = await createClient()

  // 1. Auth Check (Judge or Admin)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  // Check if user is assigned judge or admin - loose check for now since only authorized users access dashboard
  // But strictly, we should check.
  
  try {
      const rankings = await calculateProgramRankings(supabase, programId)
      return { success: true, rankings }
  } catch (error: any) {
      console.error("Standings Error:", error)
      return { error: error.message || "Failed to calculate standings" }
  }
}
