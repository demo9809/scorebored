"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function backfillDefaultRules() {
  const supabase = await createClient()

  try {
    // 1. Get all programs
    const { data: programs, error } = await supabase.from("programs").select("id, name")
    if (error) throw error

    let updatedCount = 0

    // 2. Iterate and check rules
    for (const program of programs) {
        // Check existing rules
        const { count } = await supabase
            .from("program_rules")
            .select("*", { count: 'exact', head: true })
            .eq("program_id", program.id)
        
        if (count === 0) {
            // Insert defaults
            const defaultRules = [
                { name: "Performance", max_score: 10, order_index: 1, program_id: program.id },
                { name: "Technical Perfection", max_score: 10, order_index: 2, program_id: program.id },
                { name: "Overall Impression", max_score: 10, order_index: 3, program_id: program.id },
            ]
            
            const { error: insertError } = await supabase.from("program_rules").insert(defaultRules)
            if (insertError) {
                console.error(`Failed to update ${program.name}`, insertError)
            } else {
                updatedCount++
            }
        }
    }

    revalidatePath("/admin/programs")
    return { success: true, count: updatedCount }

  } catch (error) {
    console.error("Backfill failed", error)
    return { success: false, error }
  }
}
