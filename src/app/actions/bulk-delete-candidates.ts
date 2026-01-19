"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function bulkDeleteCandidates(ids: string[], path: string) {
    if (!ids || ids.length === 0) return { error: "No candidates selected" }

    const supabase = createAdminClient()
    
    try {
        const { error } = await supabase.from("candidates").delete().in("id", ids)
        if (error) throw error
        
        revalidatePath(path)
        return { success: true, count: ids.length }
    } catch (error: any) {
        console.error("Bulk delete error:", error)
        return { error: error.message || "Failed to delete candidates" }
    }
}
