import Link from "next/link"
import { LayoutDashboard, Trophy, Users, UserCheck } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:hidden md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <Trophy className="h-6 w-6" />
            <span className="">ArtsFest Admin</span>
          </Link>
        </div>
        <nav className="flex flex-col gap-4 px-4 py-8">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/programs"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
          >
            <Trophy className="h-4 w-4" />
            Programs
          </Link>
          <Link
            href="/admin/judges"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
          >
            <UserCheck className="h-4 w-4" />
            Judges
          </Link>
          <Link
            href="/admin/teams"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
          >
            <Users className="h-4 w-4" />
            Teams & Candidates
          </Link>
        </nav>
        <div className="mt-auto border-t px-6 py-4">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <UserCheck className="h-4 w-4 rotate-180" />
            Sign Out
          </Link>
        </div>
      </aside>
      <main className="flex flex-1 flex-col gap-4 p-4 md:ml-64 md:p-8">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
