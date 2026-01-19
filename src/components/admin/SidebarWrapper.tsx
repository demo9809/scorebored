"use client"

import dynamic from "next/dynamic"

const AdminSidebar = dynamic(
  () => import("@/components/admin/AdminSidebar").then((mod) => mod.AdminSidebar),
  { ssr: false }
)

export function SidebarWrapper() {
  return <AdminSidebar />
}
