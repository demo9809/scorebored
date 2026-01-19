"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDashboardStats() {
    const supabase = await createClient()

    // 1. Basic Counts
    const { count: programsCount } = await supabase.from("programs").select("*", { count: "exact", head: true })
    const { count: candidatesCount } = await supabase.from("candidates").select("*", { count: "exact", head: true })
    const { count: teamsCount } = await supabase.from("teams").select("*", { count: "exact", head: true })

    // 2. Department Analytics
    // Group candidates by department
    // Since Supabase JS doesn't support convenient GROUP BY easily without RPC, we'll fetch fields and aggregate in JS for now (assuming dataset < 10k)
    const { data: candidates } = await supabase.from("candidates").select("year, department")
    
    const deptStats: Record<string, number> = {}
    const yearStats: Record<string, number> = {}

    candidates?.forEach(c => {
        const dept = c.department || "Unknown"
        const year = c.year || "Unknown"
        deptStats[dept] = (deptStats[dept] || 0) + 1
        yearStats[year] = (yearStats[year] || 0) + 1
    })

    // 4. Live Programs
    const { count: livePrograms } = await supabase
        .from("programs")
        .select("*", { count: "exact", head: true })
        .eq("status", "live")

    return {
        counts: {
            programs: programsCount || 0,
            candidates: candidatesCount || 0,
            teams: teamsCount || 0,
            livePrograms: livePrograms || 0
        },
        analytics: {
            department: Object.entries(deptStats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
            year: Object.entries(yearStats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)
        }
    }
}
