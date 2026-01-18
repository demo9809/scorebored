import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  // Check if we have a session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  revalidatePath("/", "layout")
  
  const url = req.nextUrl.clone()
  url.pathname = "/login"
  return NextResponse.redirect(url)
}
