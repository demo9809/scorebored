"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { Tables } from "@/lib/database.types"

interface DownloadScoreSheetButtonProps {
  programName: string
  judgeName?: string
  rules: Tables<'program_rules'>[]
  participants: any[] 
  type: "individual" | "team"
}

export function DownloadScoreSheetButton({
  programName,
  judgeName,
  rules,
  participants,
  type
}: DownloadScoreSheetButtonProps) {
  
  
  const generatePDF = async () => {
    // Auto-switch to Landscape if there are more than 3 rules to provide more writing space
    const isLandscape = rules.length > 3
    const doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait'
    })

    // Load Logo
    const logoUrl = "/score-sheet-header.png"
    try {
        const img = new Image()
        img.src = logoUrl
        await new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
        })
        
        // Maintain Aspect Ratio
        const imgProps = doc.getImageProperties(img)
        const pdfWidth = doc.internal.pageSize.getWidth()
        
        // Define max dimensions for the logo
        const maxLogoWidth = 100 
        const maxLogoHeight = 25
        
        // Calculate dimensions maintaining aspect ratio
        let finalWidth = imgProps.width
        let finalHeight = imgProps.height
        const ratio = finalWidth / finalHeight

        // Scale down if needed
        if (finalHeight > maxLogoHeight) {
             finalHeight = maxLogoHeight
             finalWidth = finalHeight * ratio
        }
        
        if (finalWidth > maxLogoWidth) {
            finalWidth = maxLogoWidth
            finalHeight = finalWidth / ratio
        }

        // Left align logo (same as margin)
        const x = 14 
        doc.addImage(img, "PNG", x, 10, finalWidth, finalHeight)

    } catch (e) {
        console.error("Failed to load logo", e)
    }

    // Helper for Title Case
    const toTitleCase = (str: string) => {
        return str.replace(
            /\w\S*/g,
            text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
        );
    }
    
    // Page Width for alignment
    const pageWidth = doc.internal.pageSize.getWidth()
    const contentStartY = 50

    // Row 1: Item Name (Left) & SCORE SHEET (Right)
    doc.setFont("helvetica", "bold")
    
    // Item Name
    doc.setFontSize(16) // Larger Item Name
    doc.text(`Item Name: ${toTitleCase(programName)}`, 14, contentStartY)
    
    // SCORE SHEET (Right Aligned)
    doc.setFontSize(14)
    doc.text("SCORE SHEET", pageWidth - 14, contentStartY, { align: "right" })
    
    // Row 2: Judge (Left) & Date (Right)
    const infoY = contentStartY + 10
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    
    if (judgeName) {
        doc.text(`Judge: ${judgeName}`, 14, infoY)
    }
    
    // Date (Right Aligned, below Score Sheet)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, infoY, { align: 'right' })

    // Prepare Columns
    const tableColumn = [
       "Chest No",
       type === 'individual' ? "Candidate Name" : "Team Name",
       type === 'individual' ? "Team" : "Members (Lead)",
       ...rules.map(r => `${r.name} (${r.max_score})`),
       "Total",
       "Remarks"
    ]

    // Prepare Rows
    const tableRows = participants.map(p => {
        let chestNo = "-"
        let name = "-"
        let teamOrMembers = "-"

        if (type === 'individual') {
            chestNo = p.candidates?.chest_number || p.participant_no || "-"
            name = p.candidates?.name || "Unknown"
            teamOrMembers = p.candidates?.teams?.name || "-"
        } else {
            // Team Program
            chestNo = p.participant_no || "-" // Use manually assigned participant no for teams if available
            name = p.teams?.name || "Unknown Team"
            
            // For members, list first few or lead
            if (p.program_participant_members && p.program_participant_members.length > 0) {
               teamOrMembers = p.program_participant_members.map((m: any) => m.candidates?.name).join(", ")
            }
        }

       return [
          chestNo,
          name,
          teamOrMembers,
          ...rules.map(() => ""), // Empty cells for scores
          "", // Total
          ""  // Remarks
       ]
    })

    // Generate Table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: infoY + 10, // Dynamic startY based on info row
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [65, 80, 160], // Logo Blue-ish
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Chest No
        1: { cellWidth: 40 }, // Name
        2: { cellWidth: 30 }, // Team/Members
        // Dynamic columns for rules? autoTable handles it usually.
      }
    })

    doc.save(`${programName.replace(/\s+/g, "_")}_ScoreSheet.pdf`)
  }

  return (
    <Button variant="outline" size="sm" onClick={generatePDF}>
      <Printer className="mr-2 h-4 w-4" />
      Download Score Sheet
    </Button>
  )
}
