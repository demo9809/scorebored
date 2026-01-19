"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

export const updateJudgeSchema = z.object({
  id: z.string(),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().optional().or(z.literal("")),
})

export async function updateJudge(values: z.infer<typeof updateJudgeSchema>) {
  try {
    const supabaseAdmin = createAdminClient()
    
    // 1. Update Profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: values.fullName,
      })
      .eq("id", values.id)

    if (profileError) {
      return { error: "Failed to update profile: " + profileError.message }
    }

    // 2. Update Auth User (Email/Password)
    const updateData: any = {
        email: values.email,
        user_metadata: {
            full_name: values.fullName
        }
    }

    if (values.password && values.password.length >= 6) {
        updateData.password = values.password
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        values.id,
        updateData
    )

    if (authError) {
       return { error: "Failed to update auth user: " + authError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Update Judge Error:", error)
    return { error: "Internal Server Error" }
  }
}
