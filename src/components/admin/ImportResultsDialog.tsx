"use client"

import { useState, useRef } from "react"
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
import { FileSpreadsheet, Download } from "lucide-react"
import * as XLSX from "xlsx"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { importResults } from "@/app/actions/import-results"

export function ImportResultsDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [parsedData, setParsedData] = useState<any[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleDownloadTemplate = () => {
        const headers = ["Program Name", "Position (1, 2, 3)", "Candidate Name", "Team Name", "Type (Individual/Group)"]
        const data = [
            ["Oil Painting", "1", "Shana Sherin", "Warriors", "Individual"],
            ["Group Song", "1", "Group A", "Titans", "Group"],
            ["Monoline", "2", "Fayis MK", "Titans", "Individual"],
        ]
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Results")
        XLSX.writeFile(wb, "results_template_v2.xlsx")
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
                
                // Removing header if present
                if (data.length > 0 && String(data[0][0]).toLowerCase().includes("program")) {
                    data.shift()
                }

                // Map rows to object
                const results = data.map(row => ({
                    program_name: String(row[0] || "").trim(),
                    position: row[1], // Keep as is, backend will parse (1, "1st", etc)
                    candidate_name: String(row[2] || "").trim(),
                    team_name: String(row[3] || "").trim(),
                    program_type: String(row[4] || "").trim(), // Optional Type
                })).filter(r => r.program_name && r.candidate_name)

                setParsedData(results)
                toast.success(`Parsed ${results.length} results successfully`)
            } catch (error) {
                console.error(error)
                toast.error("Failed to parse file")
            }
        }
        reader.readAsBinaryString(file)
    }

    const handleImport = async () => {
        setLoading(true)
        try {
            const res = await importResults(parsedData)
            
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(`Results imported! Created ${res.counts.candidates} candidates, ${res.counts.scores} scores.`)
                setOpen(false)
                setParsedData([])
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
                    Import Results
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Import Past Results</DialogTitle>
                    <DialogDescription>
                        Bulk upload 1st, 2nd, and 3rd place winners.<br/>
                        For Group items, please specify <strong>Group</strong> in the 5th column, otherwise it defaults to Individual.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
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
                                <div className="max-h-[300px] overflow-auto border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Program</TableHead>
                                                <TableHead>Position</TableHead>
                                                <TableHead>Candidate</TableHead>
                                                <TableHead>Team</TableHead>
                                                <TableHead>Type</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {parsedData.map((row, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{row.program_name}</TableCell>
                                                    <TableCell>{row.position}</TableCell>
                                                    <TableCell>{row.candidate_name}</TableCell>
                                                    <TableCell>{row.team_name}</TableCell>
                                                    <TableCell>{row.program_type || <span className="text-muted-foreground opacity-50">Default (Ind)</span>}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleImport} disabled={loading || parsedData.length === 0}>
                        {loading ? "Importing..." : `Import ${parsedData.length} Results`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
