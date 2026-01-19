"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function JudgeHeader({ userName }: { userName: string }) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Failed to sign out")
      return
    }
    toast.success("Signed out successfully")
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium hidden sm:inline-block">{userName}</span>
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  )
}
