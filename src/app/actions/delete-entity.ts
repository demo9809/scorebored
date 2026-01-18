"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function deleteEntity(table: string, id: string, path: string) {
  const supabase = createAdminClient()

  try {
    // If deleting a user (profile), we might need to delete from auth.users too if we want full cleanup.
    // However, Supabase usually handles cascade if configured, or we can just delete from public table and auth user remains (but inactive?).
    // Better to delete auth user if it's a Judge.
    
    if (table === "profiles") {
        const { error } = await supabase.auth.admin.deleteUser(id)
        if (error) throw error
    } else {
        const { error } = await supabase.from(table as any).delete().eq("id", id)
        if (error) throw error
    }

    revalidatePath(path)
    return { success: true }
  } catch (error: any) {
    console.error("Delete failed:", error)
    return { error: error.message }
  }
}
