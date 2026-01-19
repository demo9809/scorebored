"use client"

import { Button } from "@/components/ui/button"
import { backfillDefaultRules } from "@/app/actions/backfill-rules"
import { toast } from "sonner"
import { Wand2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function BackfillRulesButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleBackfill = async () => {
        setLoading(true)
        try {
            const res = await backfillDefaultRules()
            if (res.success) {
                toast.success(`Updated ${res.count} programs with default rules`)
                router.refresh()
            } else {
                toast.error("Failed to backfill rules")
            }
        } catch (e) {
            toast.error("Error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleBackfill} disabled={loading}>
            <Wand2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Fixing..." : "Auto-Fix Rules"}
        </Button>
    )
}
