"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { updateAllTeamPoints } from "@/lib/points"
import { revalidatePath } from "next/cache"

export async function recalculatePointsAction() {
    const supabase = await createClient()
    
    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata.role !== 'admin') {
        return { error: "Unauthorized" }
    }

    // Use Admin Client for writes
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

    try {
        await updateAllTeamPoints(supabaseAdmin)
        revalidatePath("/admin/teams")
        revalidatePath("/") // Leaderboard
        return { success: true }
    } catch (error: any) {
        console.error("Recalculate Error:", error)
        return { error: error.message }
    }
}
