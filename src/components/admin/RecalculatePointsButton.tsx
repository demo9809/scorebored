"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { recalculatePointsAction } from "@/app/actions/recalculate-points"
import { toast } from "sonner"
import { useState } from "react"

export function RecalculatePointsButton() {
    const [loading, setLoading] = useState(false)

    const handleRecalculate = async () => {
        setLoading(true)
        try {
            const res = await recalculatePointsAction()
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Points recalculated successfully")
            }
        } catch (e) {
            toast.error("Failed to recalculate")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRecalculate} 
            disabled={loading}
            className="gap-2"
        >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Recalculating..." : "Refresh Points"}
        </Button>
    )
}
