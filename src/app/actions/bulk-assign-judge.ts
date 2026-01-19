"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function bulkAssignJudge(programIds: string[], judgeId: string) {
  const supabase = await createClient()

  try {
    const payload = programIds.map(program_id => ({
      program_id,
      judge_id: judgeId
    }))

    // Using upsert with explicit conflict handling if constraint exists, 
    // or just insert dependent on schema. 
    // Assuming (program_id, judge_id) is unique.
    const { error } = await supabase
      .from("program_judges")
      .upsert(payload, { onConflict: 'program_id, judge_id', ignoreDuplicates: true })

    if (error) throw error

    revalidatePath("/admin/programs")
    return { success: true }
  } catch (error: any) {
    console.error("Bulk Assign Error:", error)
    return { error: error.message || "Failed to assign judge" }
  }
}
