import { SidebarWrapper } from "@/components/admin/SidebarWrapper"
import { Toaster } from "@/components/ui/sonner"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-muted/40">
      <SidebarWrapper />
      <main className="flex flex-1 flex-col gap-4 p-4 md:ml-64 md:p-8">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
