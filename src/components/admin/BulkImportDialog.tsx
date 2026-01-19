"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"

interface BulkImportDialogProps {
    teams: { id: string; name: string }[]
}

export function BulkImportDialog({ teams }: BulkImportDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState("")
    const [selectedTeamId, setSelectedTeamId] = useState<string>("mixed") // 'mixed' implies parsed from CSV, otherwise specific team
    const router = useRouter()
    const supabase = createClient()

    const handleImport = async () => {
        setLoading(true)
        try {
            const lines = data.split('\n').filter(l => l.trim().length > 0)
            const candidatesToInsert: any[] = []
            const errors: string[] = []

            for (const line of lines) {
                // Expected format: Name, ChestNumber, (Optional Team Name if mixed)
                const parts = line.split(',').map(p => p.trim())
                
                if (parts.length < 2) {
                    errors.push(`Invalid format: ${line}`)
                    continue
                }

                const name = parts[0]
                const chest_number = parts[1]
                let team_id = selectedTeamId !== 'mixed' ? selectedTeamId : null

                // If mixed, try to find team details
                if (selectedTeamId === 'mixed' && parts[2]) {
                    const teamName = parts[2].toLowerCase()
                    const foundTeam = teams.find(t => t.name.toLowerCase() === teamName)
                    if (foundTeam) team_id = foundTeam.id
                }

                candidatesToInsert.push({
                    name,
                    chest_number,
                    team_id
                })
            }

            if (candidatesToInsert.length === 0) {
                 toast.error("No valid data found to import")
                 return
            }

            const { error } = await supabase.from("candidates").insert(candidatesToInsert)
            
            if (error) {
                if (error.code === '23505') { // Unique violation
                    toast.error("Some chest numbers already exist.")
                } else {
                     throw error
                }
            } else {
                toast.success(`Successfully added ${candidatesToInsert.length} candidates`)
                if (errors.length > 0) {
                     toast.warning(`Skipped ${errors.length} lines due to formatting errors.`)
                     console.warn(errors)
                }
                setOpen(false)
                setData("")
                router.refresh()
            }

        } catch (e: any) {
            console.error(e)
            toast.error("Failed to import candidates: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Bulk Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Bulk Import Candidates</DialogTitle>
                    <DialogDescription>
                        Paste candidate data here. Format per line: <strong>Name, Chest No, [Team Name]</strong>
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                         <Label>Target Team</Label>
                         <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mixed">Auto-detect from CSV (3rd column)</SelectItem>
                                {teams.map(t => (
                                    <SelectItem key={t.id} value={t.id}>Assess to {t.name}</SelectItem>
                                ))}
                            </SelectContent>
                         </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Data (Name, ChestNo, Team?)</Label>
                        <Textarea 
                            value={data} 
                            onChange={(e) => setData(e.target.value)}
                            placeholder={`John Doe, 101\nJane Smith, 102`}
                            className="min-h-[200px] font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            Example: <br/>
                            Labeeb, 501, Orange House <br/>
                            Mazin, 502, Blue House
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleImport} disabled={loading}>
                        {loading ? "Importing..." : "Import Candidates"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
