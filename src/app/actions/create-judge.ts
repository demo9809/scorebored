"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const createJudgeSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function createJudge(values: z.infer<typeof createJudgeSchema>) {
  try {
    const supabaseAdmin = createAdminClient()
    
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: values.email,
      password: values.password,
      email_confirm: true,
      user_metadata: {
        full_name: values.fullName,
        role: "judge"
      }
    })

    if (authError) {
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: "Failed to create user" }
    }

    // 2. Profile should be created automatically via Trigger (if set up)
    // checking if trigger exists? Usually safe to assume or manually insert if trigger not present.
    // Given the task "Setup Supabase" included "profiles" table, but did IT include a trigger?
    // If not, we must insert manually.
    // Let's try to insert manually to be safe, handling updated_at conflict if trigger exists.
    
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authData.user.id,
        full_name: values.fullName,
        role: "judge",
      })

    if (profileError) {
      // If profile creation fails, we might want to delete the auth user? 
      // OR just return error.
      console.error("Profile creation failed:", profileError)
      return { error: "User created but profile failed: " + profileError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Create Judge Error:", error)
    if (error.message?.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Server configuration error: Missing Service Role Key." }
    }
    return { error: "Internal Server Error" }
  }
}
