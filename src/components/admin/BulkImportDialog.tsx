"use client"

import { useState, useRef } from "react"
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
import { Upload, FileSpreadsheet, Download, FileUp } from "lucide-react"
import * as XLSX from "xlsx"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface BulkImportDialogProps {
    teams: { id: string; name: string }[]
    programs: { id: string; name: string; participant_type: string }[]
    defaultTeamId?: string
}

export function BulkImportDialog({ teams, programs = [], defaultTeamId }: BulkImportDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<"text" | "file">("file")
    const [textData, setTextData] = useState("")
    const [parsedData, setParsedData] = useState<any[]>([])
    const [selectedTeamId, setSelectedTeamId] = useState<string>(defaultTeamId || "mixed")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleDownloadTemplate = () => {
        const headers = ["Name", "Team Name (Optional if selected above)", "Year", "Department", "PROGRAM", "Chest Number (Optional)"]
        const data = [
            ["John Doe", "Orange House", "1st Year", "CS", "Dheshabakthiganam", "101"],
            ["Jane Smith", "Blue House", "2nd Year", "Mech", "Western Music Group", ""]
        ]
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Candidates")
        XLSX.writeFile(wb, "candidates_template.xlsx")
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: "binary" })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })
                
                if (data.length > 0 && (String(data[0][0]).toLowerCase().includes("name"))) {
                    data.shift()
                }

                const candidates = data.map(row => ({
                    name: row[0],
                    team_name: row[1],
                    year: row[2],
                    department: row[3],
                    program_name: row[4] ? String(row[4]).trim() : null,
                    chest_number: row[5] // Now optional and at the end
                })).filter(c => c.name) // Only filter by name

                setParsedData(candidates)
                toast.success(`Parsed ${candidates.length} rows successfully`)
            } catch (error) {
                console.error(error)
                toast.error("Failed to parse file")
            }
        }
        reader.readAsBinaryString(file)
    }

    const getTeamId = (teamNameOrId: string | undefined) => {
        if (selectedTeamId !== "mixed") return selectedTeamId
        if (!teamNameOrId) return null
        
        const found = teams.find(t => t.name.toLowerCase() === String(teamNameOrId).toLowerCase().trim())
        return found ? found.id : null
    }

    const handleImportText = async () => {
        const lines = textData.split('\n').filter(l => l.trim().length > 0)
        const candidates = lines.map(line => {
             const parts = line.split(',').map(p => p.trim())
             if (parts.length < 1) return null
             return {
                 name: parts[0],
                 team_name: parts[1],
                 year: parts[2],
                 department: parts[3],
                 program_name: parts[4] || null,
                 chest_number: parts[5] // Optional
             }
        }).filter(Boolean) as any[]
        
        await processImport(candidates)
    }

    const handleImportFile = async () => {
        await processImport(parsedData)
    }

    const processImport = async (candidates: any[]) => {
        setLoading(true)
        try {
            const toInsert = candidates.map(c => ({
                name: c.name,
                chest_number: c.chest_number ? String(c.chest_number) : null,
                team_id: getTeamId(c.team_name),
                year: c.year ? String(c.year) : null,
                department: c.department ? String(c.department) : null
            }))

            if (toInsert.length === 0) {
                 toast.error("No valid data to import")
                 return
            }

            // 1. Insert Candidates
            const { data: insertedCandidates, error } = await supabase
                .from("candidates")
                .insert(toInsert)
                .select()
            
            if (error) {
                if (error.code === '23505') {
                    toast.error("Some chest numbers already exist.")
                } else {
                     throw error
                }
                return 
            }

            // 2. Process Program Assignments
            // Group by Program -> Team -> Candidates
            const assignments: Record<string, { program: any, teams: Record<string, string[]> }> = {}
            const individualAssignments: { program_id: string, candidate_id: string, participant_no: string | null }[] = []

            for (let i = 0; i < insertedCandidates.length; i++) {
                const inserted = insertedCandidates[i]
                const original = candidates[i]
                
                if (original.program_name) {
                    const program = programs.find(p => p.name.toLowerCase() === original.program_name.toLowerCase())
                    
                    if (program) {
                        if (program.participant_type === 'individual') {
                            individualAssignments.push({
                                program_id: program.id,
                                candidate_id: inserted.id,
                                participant_no: inserted.chest_number
                            })
                        } else {
                            // Team Grouping
                            if (inserted.team_id) {
                                if (!assignments[program.id]) {
                                    assignments[program.id] = { program, teams: {} }
                                }
                                if (!assignments[program.id].teams[inserted.team_id]) {
                                    assignments[program.id].teams[inserted.team_id] = []
                                }
                                assignments[program.id].teams[inserted.team_id].push(inserted.id)
                            }
                        }
                    }
                }
            }

            let assignedCount = 0

            // Batch Assign Individuals
            if (individualAssignments.length > 0) {
                const { error: indError } = await supabase
                    .from('program_participants')
                    .insert(individualAssignments.map(a => ({
                        program_id: a.program_id,
                        candidate_id: a.candidate_id,
                        participant_no: a.participant_no,
                        status: 'active'
                    })))
                if (!indError) assignedCount += individualAssignments.length
            }

            // Batch Assign Teams
            for (const programId in assignments) {
                const { teams: teamGroups } = assignments[programId]
                
                for (const teamId in teamGroups) {
                    const candidateIds = teamGroups[teamId]
                    if (candidateIds.length === 0) continue

                    // Check if team entry exists
                    let programParticipantId: string | null = null

                    const { data: existingTeamEntry } = await supabase
                        .from('program_participants')
                        .select('id')
                        .eq('program_id', programId)
                        .eq('team_id', teamId)
                        .maybeSingle()

                    if (existingTeamEntry) {
                        programParticipantId = existingTeamEntry.id
                    } else {
                        // Create new entry using the first candidate as lead
                        const leadCandidate = insertedCandidates.find(c => c.id === candidateIds[0])
                        
                        const { data: newEntry, error: createError } = await supabase
                            .from('program_participants')
                            .insert({
                                program_id: programId,
                                team_id: teamId,
                                candidate_id: candidateIds[0], // Set first as lead
                                participant_no: leadCandidate?.chest_number,
                                status: 'active'
                            })
                            .select('id')
                            .single()
                        
                        if (!createError && newEntry) {
                            programParticipantId = newEntry.id
                            assignedCount++
                        }
                    }

                    if (programParticipantId) {
                        // Add ALL candidates as members
                        const membersPayload = candidateIds.map(cid => ({
                            program_participant_id: programParticipantId! as string,
                            candidate_id: cid
                        }))
                        
                        const { error: memberError } = await supabase
                            .from('program_participant_members')
                            .upsert(membersPayload, { onConflict: 'program_participant_id, candidate_id', ignoreDuplicates: true })
                        
                        if (!memberError) assignedCount += candidateIds.length
                    }
                }
            }

            toast.success(`Imported ${insertedCandidates.length} candidates. Processed assignments.`)
            setOpen(false)
            setTextData("")
            setParsedData([])
            if (fileInputRef.current) fileInputRef.current.value = ""
            router.refresh()

        } catch (e: any) {
            console.error(e)
            toast.error("Import failed: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" /> 
                    Import / Upload
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Import Candidates</DialogTitle>
                    <DialogDescription>
                        Import candidates and optionally auto-register them to programs.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                    <div className="flex flex-col gap-2">
                         <Label>Assign To Team</Label>
                         <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mixed">Auto-detect from File (Team Column)</SelectItem>
                                {teams.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                         </Select>
                    </div>

                    <div className="flex gap-4 border-b pb-2">
                        <Button 
                            variant={activeTab === "file" ? "default" : "ghost"} 
                            onClick={() => setActiveTab("file")}
                            size="sm"
                        >
                            <FileUp className="mr-2 h-4 w-4" /> Excel / CSV Upload
                        </Button>
                        <Button 
                            variant={activeTab === "text" ? "default" : "ghost"} 
                            onClick={() => setActiveTab("text")}
                            size="sm"
                        >
                            <Upload className="mr-2 h-4 w-4" /> Copy Paste Text
                        </Button>
                    </div>

                    {activeTab === "file" && (
                        <div className="flex flex-col gap-4">
                             <div className="flex items-center gap-4 p-4 border rounded-md border-dashed bg-muted/30">
                                <Input 
                                    type="file" 
                                    ref={fileInputRef}
                                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                    onChange={handleFileUpload}
                                    className="cursor-pointer"
                                />
                                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="whitespace-nowrap">
                                    <Download className="mr-2 h-4 w-4" /> Download Template
                                </Button>
                             </div>
                             
                             {parsedData.length > 0 && (
                                 <div className="max-h-[200px] overflow-auto border rounded-md">
                                     <Table>
                                         <TableHeader>
                                             <TableRow>
                                                 <TableHead>Name</TableHead>
                                                 <TableHead>Team</TableHead>
                                                 <TableHead>Year</TableHead>
                                                 <TableHead>Dept</TableHead>
                                                 <TableHead>Program</TableHead>
                                                 <TableHead>Chest No</TableHead>
                                             </TableRow>
                                         </TableHeader>
                                         <TableBody>
                                             {parsedData.slice(0, 5).map((row, i) => (
                                                 <TableRow key={i}>
                                                     <TableCell>{row.name}</TableCell>
                                                     <TableCell>{row.team_name || (selectedTeamId !== "mixed" ? "Selected Team" : "-")}</TableCell>
                                                     <TableCell>{row.year}</TableCell>
                                                     <TableCell>{row.department}</TableCell>
                                                     <TableCell>{row.program_name || "-"}</TableCell>
                                                     <TableCell>{row.chest_number || "-"}</TableCell>
                                                 </TableRow>
                                             ))}
                                             {parsedData.length > 5 && (
                                                 <TableRow>
                                                     <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                         ...and {parsedData.length - 5} more
                                                     </TableCell>
                                                 </TableRow>
                                             )}
                                         </TableBody>
                                     </Table>
                                 </div>
                             )}
                        </div>
                    )}

                    {activeTab === "text" && (
                        <div className="flex flex-col gap-2">
                            <Label>Paste Data (Name, Team, Year, Dept, Program)</Label>
                            <Textarea 
                                value={textData} 
                                onChange={(e) => setTextData(e.target.value)}
                                placeholder={`John Doe, Orange House, 1st Year, CS, Dheshabakthiganam\nJane Smith, Blue House, 2nd Year, Mech, Western Music Group`}
                                className="min-h-[200px] font-mono"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={activeTab === "file" ? handleImportFile : handleImportText} disabled={loading || (activeTab === "file" && parsedData.length === 0)}>
                        {loading ? "Importing..." : `Import ${activeTab === 'file' ? parsedData.length : ''} Candidates`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
