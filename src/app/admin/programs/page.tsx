import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { ProgramDialog } from "@/components/admin/ProgramDialog"
import { ProgramsList } from "@/components/admin/ProgramsList"
import { ProgramToolbar } from "@/components/admin/ProgramToolbar"
import { Pagination } from "@/components/admin/Pagination"
import { ImportResultsDialog } from "@/components/admin/ImportResultsDialog"


const ITEMS_PER_PAGE = 10

type SearchParams = {
  q?: string
  status?: string
  type?: string
  page?: string
}

async function getPrograms(searchParams: SearchParams) {
  const supabase = await createClient()
  const { q, status, type, page } = searchParams
  
  let query = supabase
    .from("programs")
    .select("*", { count: "exact" })

  if (q) {
    query = query.ilike("name", `%${q}%`)
  }

  if (status && status !== "all") {
    query = query.eq("status", status as any)
  }

  if (type && type !== "all") {
    query = query.eq("participant_type", type as any)
  }

  const currentPage = Number(page) || 1
  const from = (currentPage - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to)
  
  if (error) {
      console.error("Error fetching programs", error)
      return { data: [], count: 0 }
  }

  return { data: data || [], count: count || 0 }
}

export default async function ProgramsPage({
    searchParams,
  }: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }) {
  const resolvedSearchParams = await searchParams
  const { data: programs, count } = await getPrograms(resolvedSearchParams)
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE)
  const currentPage = Number(resolvedSearchParams.page) || 1
  
  const supabase = await createClient()
  const { data: judges } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "judge")
    .order("full_name", { ascending: true })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
         <div className="flex gap-2">
            <ImportResultsDialog />
            <ProgramDialog />
        </div>
      </div>

      <div className="space-y-4">
        <ProgramToolbar />

        <ProgramsList programs={programs} judges={judges || []} />

        <Pagination totalPages={totalPages} currentPage={currentPage} />
      </div>
    </div>
  )
}
