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
    defaultTeamId?: string
}

export function BulkImportDialog({ teams, defaultTeamId }: BulkImportDialogProps) {
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
        const headers = ["Name", "Chest Number", "Team Name (Optional if selected above)", "Year", "Department"]
        const data = [
            ["John Doe", "101", "Orange House", "1st Year", "CS"],
            ["Jane Smith", "102", "Blue House", "2nd Year", "Mech"]
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
                // Parse as array of arrays to be safe with varied column names
                const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })
                
                // Remove header row if it looks like a header (contains "Name" or "Chest")
                if (data.length > 0 && (String(data[0][0]).toLowerCase().includes("name") || String(data[0][1]).toLowerCase().includes("chest"))) {
                    data.shift()
                }

                const candidates = data.map(row => ({
                    name: row[0],
                    chest_number: row[1],
                    team_name: row[2],
                    year: row[3],
                    department: row[4]
                })).filter(c => c.name && c.chest_number)

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
             if (parts.length < 2) return null
             return {
                 name: parts[0],
                 chest_number: parts[1],
                 team_name: parts[2],
                 year: parts[3],
                 department: parts[4]
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
                chest_number: String(c.chest_number),
                team_id: getTeamId(c.team_name),
                year: c.year ? String(c.year) : null,
                department: c.department ? String(c.department) : null
            }))

            if (toInsert.length === 0) {
                 toast.error("No valid data to import")
                 return
            }

            const { error } = await supabase.from("candidates").insert(toInsert)
            
            if (error) {
                if (error.code === '23505') {
                    toast.error("Some chest numbers already exist.")
                } else {
                     throw error
                }
            } else {
                toast.success(`Successfully imported ${toInsert.length} candidates`)
                setOpen(false)
                setTextData("")
                setParsedData([])
                if (fileInputRef.current) fileInputRef.current.value = ""
                router.refresh()
            }

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
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Import Candidates</DialogTitle>
                    <DialogDescription>
                        Add candidates via Excel file or Copy-Paste text.
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
                                                 <TableHead>Chest No</TableHead>
                                                 <TableHead>Team</TableHead>
                                                 <TableHead>Year</TableHead>
                                                 <TableHead>Dept</TableHead>
                                             </TableRow>
                                         </TableHeader>
                                         <TableBody>
                                             {parsedData.slice(0, 5).map((row, i) => (
                                                 <TableRow key={i}>
                                                     <TableCell>{row.name}</TableCell>
                                                     <TableCell>{row.chest_number}</TableCell>
                                                     <TableCell>{row.team_name || (selectedTeamId !== "mixed" ? "Selected Team" : "-")}</TableCell>
                                                     <TableCell>{row.year}</TableCell>
                                                     <TableCell>{row.department}</TableCell>
                                                 </TableRow>
                                             ))}
                                             {parsedData.length > 5 && (
                                                 <TableRow>
                                                     <TableCell colSpan={3} className="text-center text-muted-foreground">
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
                            <Label>Paste Data (Name, ChestNo, [Team])</Label>
                            <Textarea 
                                value={textData} 
                                onChange={(e) => setTextData(e.target.value)}
                                placeholder={`John Doe, 101, Orange House, 1st Year, CS\nJane Smith, 102,, 2nd Year, Mech`}
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
