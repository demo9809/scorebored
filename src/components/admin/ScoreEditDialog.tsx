"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ScoreEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  program: any
  judge: any
  participant: any
  rules: any[]
  initialScores: any[] // Array of score objects for this specific pair
  onSaved: () => void
}

export function ScoreEditDialog({ 
  open, 
  onOpenChange, 
  program, 
  judge, 
  participant, 
  rules, 
  initialScores,
  onSaved 
}: ScoreEditDialogProps) {
  const [scores, setScores] = useState<Record<string, number>>({}) // ruleId -> score
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (open) {
        const scoreMap: Record<string, number> = {}
        initialScores.forEach(s => {
            scoreMap[s.rule_id] = s.score_value
        })
        setScores(scoreMap)
    }
  }, [open, initialScores])

  const handleScoreChange = (ruleId: string, value: string) => {
    const numValue = parseFloat(value)
    
    // Find rule max score
    const rule = rules.find(r => r.id === ruleId)
    if (rule && numValue > rule.max_score) {
        toast.error(`Max score for ${rule.name} is ${rule.max_score}`)
        return
    }

    setScores(prev => ({
        ...prev,
        [ruleId]: isNaN(numValue) ? 0 : numValue
    }))
  }

  const handleSave = async () => {
      if (!judge || !participant) return
      setIsSubmitting(true)

      try {
          // 1. Fetch existing scores to identify which ones to update (by ID) vs insert
          const { data: existingRecords, error: fetchError } = await supabase
             .from("scores")
             .select("id, rule_id")
             .eq("program_id", program.id)
             .eq("judge_id", judge.id)
             .eq("participant_id", participant.id)

          if (fetchError) throw fetchError

          // 2. Prepare payload
          const upsertPayload = rules.map(rule => {
              const existingRecord = existingRecords?.find(r => r.rule_id === rule.id)
              const id = existingRecord?.id || crypto.randomUUID()
              return {
                  id, 
                  program_id: program.id,
                  judge_id: judge.id,
                  participant_id: participant.id,
                  rule_id: rule.id,
                  score_value: scores[rule.id] || 0,
              }
          })
          
          // 3. Upsert
          const { error } = await supabase
             .from("scores")
             .upsert(upsertPayload)

          if (error) throw error

          toast.success("Scores updated successfully")
          onSaved()
          onOpenChange(false)
      } catch (err: any) {
          console.error("Save Error:", JSON.stringify(err, null, 2))
          toast.error(err.message || "Failed to save scores")
      } finally {
          setIsSubmitting(false)
      }
  }

  if (!judge || !participant) return null

  const participantName = program.participant_type === 'individual' 
    ? participant.candidates?.name 
    : participant.teams?.name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Scores</DialogTitle>
          <DialogDescription>
            Editing scores for <strong>{participantName}</strong> by <strong>{judge.full_name}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
             {rules.sort((a,b)=> (a.order_index??0)-(b.order_index??0)).map(rule => (
                 <div key={rule.id} className="grid grid-cols-4 items-center gap-4">
                     <div className="col-span-3">
                         <Label className="text-sm font-medium">{rule.name}</Label>
                         <p className="text-xs text-muted-foreground">Max: {rule.max_score}</p>
                     </div>
                     <Input 
                        type="number" 
                        className="col-span-1"
                        min="0"
                        max={rule.max_score}
                        step="0.5"
                        value={scores[rule.id] !== undefined ? scores[rule.id] : ""}
                        onChange={(e) => handleScoreChange(rule.id, e.target.value)}
                     />
                 </div>
             ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
