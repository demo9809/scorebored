"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deletePrograms(ids: string[]) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("programs")
      .delete()
      .in("id", ids)

    if (error) throw error

    revalidatePath("/admin/programs")
    return { success: true }
  } catch (error) {
    console.error("Error deleting programs:", error)
    return { error: "Failed to delete programs" }
  }
}
