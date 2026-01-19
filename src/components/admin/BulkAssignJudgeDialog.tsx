"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { bulkAssignJudge } from "@/app/actions/bulk-assign-judge"

interface BulkAssignJudgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: string[]
  judges: any[]
  onSuccess: () => void
}

export function BulkAssignJudgeDialog({ 
  open, 
  onOpenChange, 
  selectedIds, 
  judges, 
  onSuccess 
}: BulkAssignJudgeDialogProps) {
  const [selectedJudgeId, setSelectedJudgeId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleAssign = async () => {
    if (!selectedJudgeId) return

    setLoading(true)
    try {
      const result = await bulkAssignJudge(selectedIds, selectedJudgeId)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Assigned judge to ${selectedIds.length} programs`)
        onSuccess()
        onOpenChange(false)
        setSelectedJudgeId("")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Assign Judge</DialogTitle>
          <DialogDescription>
            Assign a judge to the {selectedIds.length} selected programs.
            Duplicates will be ignored.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select value={selectedJudgeId} onValueChange={setSelectedJudgeId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a judge..." />
            </SelectTrigger>
            <SelectContent>
              {judges.map((judge) => (
                <SelectItem key={judge.id} value={judge.id}>
                  {judge.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedJudgeId || loading}>
            {loading ? "Assigning..." : "Assign Judge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
