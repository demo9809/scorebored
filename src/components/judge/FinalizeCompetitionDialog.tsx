"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { finalizeProgram } from "@/app/actions/finalize-program"
import { getProjectedStandings } from "@/app/actions/get-projected-standings"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Trophy } from "lucide-react"

interface FinalizeCompetitionDialogProps {
  programId: string
  programName: string
}

export function FinalizeCompetitionDialog({ programId, programName }: FinalizeCompetitionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [projectedWinner, setProjectedWinner] = useState<{name: string, score: number} | null>(null)
  
  const router = useRouter()

  // Fetch projected standings when dialog opens
  useEffect(() => {
    if (open) {
        getProjectedStandings(programId).then(res => {
            if (res.success && res.rankings && res.rankings.length > 0) {
                const winner = res.rankings[0]
                setProjectedWinner({ name: winner.name, score: winner.total_score })
            } else {
                setProjectedWinner(null)
            }
        })
    }
  }, [open, programId])

  async function handleFinalize() {
    setLoading(true)
    try {
        const result = await finalizeProgram(programId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Competition finalized successfully!")
            setOpen(false)
            router.refresh()
        }
    } catch (err) {
        toast.error("An unexpected error occurred")
        console.error(err)
    } finally {
        setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button className="font-semibold bg-green-600 hover:bg-green-700 text-white">
          <CheckCircle2 className="mr-2 h-4 w-4" /> Finalize Competition
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Finalize {programName}?</AlertDialogTitle>
          <AlertDialogDescription asChild className="space-y-4">
            <div>
              <p>
                  This action will mark the program as <strong>Completed</strong>.
              </p>
              
              {projectedWinner && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-1">Current Projected Winner</p>
                      <div className="flex items-center justify-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          <span className="font-bold text-lg text-foreground">{projectedWinner.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Score: {projectedWinner.score}</p>
                  </div>
              )}

              <ul className="list-disc pl-5 text-sm">
                  <li>Ranking will be locked.</li>
                  <li>Results will be published instantly.</li>
              </ul>
              <p className="text-yellow-600 font-medium text-sm">
                  Ensure all participants have been scored.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button 
            onClick={handleFinalize} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? "Finalizing..." : "Confirm & Submit"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
