"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ScoringInterfaceProps {
  program: any
  judgeId: string
  rules: any[]
  participants: any[]
  initialScores: any[]
  readOnly?: boolean
}

export function ScoringInterface({ program, judgeId, rules, participants, initialScores, readOnly = false }: ScoringInterfaceProps) {
  const [activeParticipantId, setActiveParticipantId] = useState<string>("")
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({}) // participantId -> ruleId -> score
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const supabase = createClient()

  // Initialize scores state from props
  useEffect(() => {
    const scoreMap: Record<string, Record<string, number>> = {}

    // Reconstruct score map from flat list
    initialScores.forEach(s => {
       if (!scoreMap[s.participant_id]) scoreMap[s.participant_id] = {}
       scoreMap[s.participant_id][s.rule_id] = s.score_value
    })
    
    setScores(scoreMap)

    // Set first participant as active if not set
    if (participants.length > 0 && !activeParticipantId) {
        setActiveParticipantId(participants[0].id)
    }
  }, [initialScores, participants, activeParticipantId])

  const handleScoreChange = (ruleId: string, value: string) => {
    if (readOnly) return
    if (!activeParticipantId) return
    const numValue = parseFloat(value)
    
    // Find rule max score
    const rule = rules.find(r => r.id === ruleId)
    if (rule && numValue > rule.max_score) {
        toast.error(`Max score for ${rule.name} is ${rule.max_score}`)
        return
    }

    setScores(prev => ({
        ...prev,
        [activeParticipantId]: {
            ...prev[activeParticipantId],
            [ruleId]: isNaN(numValue) ? 0 : numValue
        }
    }))
  }

  const handleSave = async (participantId: string) => {
      if (!participantId) return
      setIsSubmitting(true)

      try {
          // 1. Fetch existing scores to identify which ones to update (by ID) vs insert
          const { data: existingRecords, error: fetchError } = await supabase
             .from("scores")
             .select("id, rule_id")
             .eq("program_id", program.id)
             .eq("judge_id", judgeId)
             .eq("participant_id", participantId)

          if (fetchError) throw fetchError

          const participantScores = scores[participantId] || {}
          
          // 2. Prepare payload with IDs where available
          const upsertPayload = rules.map(rule => {
              const existingRecord = existingRecords?.find(r => r.rule_id === rule.id)
              return {
                  id: existingRecord?.id, // If ID exists, Upsert performs Update. If undefined, it performs Insert.
                  program_id: program.id,
                  judge_id: judgeId,
                  participant_id: participantId,
                  rule_id: rule.id,
                  score_value: participantScores[rule.id] || 0,
              }
          })
          
          // 3. Upsert
          const { error } = await supabase
             .from("scores")
             .upsert(upsertPayload)

          if (error) throw error

          toast.success("Scores saved successfully")
      } catch (err: any) {
          console.error("Save Error:", JSON.stringify(err, null, 2))
          toast.error(err.message || "Failed to save scores")
      } finally {
          setIsSubmitting(false)
      }
  }

  const currentParticipant = participants.find(p => p.id === activeParticipantId)
  const currentScores = scores[activeParticipantId] || {}

  // Calculate total
  const totalScore = Object.values(currentScores).reduce((a, b) => a + b, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Participant List (Sidebar) */}
      <Card className="md:col-span-1 h-fit">
         <CardHeader>
           <CardTitle>Participants</CardTitle>
         </CardHeader>
         <CardContent className="p-0">
             <div className="max-h-[70vh] overflow-y-auto">
                 {participants.map((p) => (
                     <button
                        key={p.id}
                        onClick={() => setActiveParticipantId(p.id)}
                        className={cn(
                            "w-full text-left p-4 hover:bg-muted transition-colors border-b last:border-0",
                            activeParticipantId === p.id && "bg-muted border-l-4 border-l-primary"
                        )}
                     >
                         <div className="font-semibold">{p.participant_no}</div>
                         <div className="text-sm text-muted-foreground truncate">
                             {program.participant_type === 'individual' ? p.candidates?.name : p.teams?.name}
                         </div>
                     </button>
                 ))}
             </div>
         </CardContent>
      </Card>

      {/* Scoring Area */}
      <Card className="md:col-span-3">
         <CardHeader>
            <CardTitle className="text-2xl flex justify-between items-center">
                <span>
                   {currentParticipant 
                      ? (program.participant_type === 'individual' ? currentParticipant.candidates?.name : currentParticipant.teams?.name) 
                      : "Select Participant"}
                   {readOnly && <Badge variant="secondary" className="ml-3">Read Only</Badge>}
                </span>
                <span className="text-primary">{totalScore} <span className="text-sm font-normal text-muted-foreground">/ {program.max_score_per_judge}</span></span>
            </CardTitle>
         </CardHeader>
         <CardContent>
             {currentParticipant && (
                 <div className="space-y-6">
                     {rules.sort((a: any,b: any)=> (a.order_index??0)-(b.order_index??0)).map((rule: any) => (
                         <div key={rule.id} className="grid grid-cols-12 gap-4 items-center">
                             <div className="col-span-8">
                                 <Label className="text-base">{rule.name}</Label>
                                 <p className="text-xs text-muted-foreground">Max: {rule.max_score}</p>
                             </div>
                             <div className="col-span-4">
                                 <Input 
                                    type="number" 
                                    min="0"
                                    max={rule.max_score}
                                    step="0.5"
                                    value={currentScores[rule.id] !== undefined ? currentScores[rule.id] : ""}
                                    onChange={(e) => handleScoreChange(rule.id, e.target.value)}
                                    disabled={readOnly}
                                    className={readOnly ? "bg-muted text-muted-foreground" : ""}
                                 />
                             </div>
                         </div>
                     ))}
                     
                     {!readOnly && (
                        <div className="pt-4 flex justify-end">
                            <Button onClick={() => handleSave(currentParticipant.id)} disabled={isSubmitting} size="lg">
                                {isSubmitting ? "Saving..." : "Submit Scores"}
                            </Button>
                        </div>
                     )}
                 </div>
             )}
         </CardContent>
      </Card>
    </div>
  )
}
