"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Trophy, Users, UserCheck, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

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
    <>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <Trophy className="h-6 w-6" />
            <span className="">ArtsFest Admin</span>
          </Link>
        </div>
        <NavLinks pathname={pathname} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <SheetHeader>
               <SheetTitle className="text-left flex items-center gap-2">
                 <Trophy className="h-6 w-6" />
                 ArtsFest Admin
               </SheetTitle>
            </SheetHeader>
            <NavLinks pathname={pathname} onLinkClick={() => setOpen(false)} onSignOut={handleSignOut} />
          </SheetContent>
        </Sheet>
        <div className="font-semibold">Dashboard</div>
      </header>
    </>
  )
}

function NavLinks({ 
    pathname, 
    onLinkClick, 
    onSignOut 
}: { 
    pathname: string
    onLinkClick?: () => void
    onSignOut: () => void 
}) {
  return (
    <nav className="flex flex-col gap-4 px-4 py-4">
      <Link
        href="/admin"
        onClick={onLinkClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted",
          pathname === "/admin" ? "bg-muted text-primary font-medium" : "text-muted-foreground"
        )}
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </Link>
      <Link
        href="/admin/programs"
        onClick={onLinkClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted",
          pathname.startsWith("/admin/programs") ? "bg-muted text-primary font-medium" : "text-muted-foreground"
        )}
      >
        <Trophy className="h-4 w-4" />
        Programs
      </Link>
      <Link
        href="/admin/judges"
        onClick={onLinkClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted",
          pathname.startsWith("/admin/judges") ? "bg-muted text-primary font-medium" : "text-muted-foreground"
        )}
      >
        <UserCheck className="h-4 w-4" />
        Judges
      </Link>
      <Link
        href="/admin/teams"
        onClick={onLinkClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted",
          pathname.startsWith("/admin/teams") || pathname.startsWith("/admin/candidates") ? "bg-muted text-primary font-medium" : "text-muted-foreground"
        )}
      >
        <Users className="h-4 w-4" />
        Teams & Candidates
      </Link>

      <div className="mt-auto pt-4 border-t">
         <button
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-left"
         >
            <UserCheck className="h-4 w-4 rotate-180" />
            Sign Out
         </button>
      </div>
    </nav>
  )
}
