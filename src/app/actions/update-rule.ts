"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const updateRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  max_score: z.coerce.number().min(1, "Score must be at least 1"),
  order_index: z.coerce.number().min(0, "Order must be positive"),
})

export async function updateRule(values: z.infer<typeof updateRuleSchema>) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("program_rules")
      .update({
        name: values.name,
        max_score: values.max_score,
        order_index: values.order_index,
      })
      .eq("id", values.id)

    if (error) {
      return { error: "Failed to update rule: " + error.message }
    }

    revalidatePath("/admin/programs/[id]", "page")
    return { success: true }
  } catch (error: any) {
    console.error("Update Rule Error:", error)
    return { error: "Internal Server Error" }
  }
}
