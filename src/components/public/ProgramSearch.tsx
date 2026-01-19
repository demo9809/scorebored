"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { ProgramGrid } from "@/components/public/ProgramGrid"

interface ProgramSearchProps {
  programs: any[]
  type: 'live' | 'completed' | 'upcoming'
}

export function ProgramSearch({ programs, type }: ProgramSearchProps) {
  const [query, setQuery] = useState("")

  const filteredPrograms = programs.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search programs..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-white dark:bg-gray-900 border-border/60"
        />
      </div>
      
      <ProgramGrid programs={filteredPrograms} type={type} />
    </div>
  )
}
