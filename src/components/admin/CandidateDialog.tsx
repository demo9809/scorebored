"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Check, ChevronsUpDown } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  chest_number: z.string().optional(),
  team_id: z.string().optional(),
  year: z.string().optional(),
  department: z.string().optional(),
})

interface Program {
    id: string
    name: string
    participant_type: string
}

interface CandidateDialogProps {
  defaultTeamId?: string
  teams: { id: string; name: string }[]
  programs?: Program[]
  candidateToEdit?: {
    id: string
    name: string
    chest_number: string | null
    team_id: string | null
    year?: string | null
    department?: string | null
    program_participants?: { program_id: string }[]
  }
  trigger?: React.ReactNode
}

export function CandidateDialog({ teams, programs = [], candidateToEdit, trigger, defaultTeamId }: CandidateDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])
  const [openCombobox, setOpenCombobox] = useState(false)

  // Initialize selected programs when editing
  useEffect(() => {
    if (candidateToEdit?.program_participants) {
        setSelectedPrograms(candidateToEdit.program_participants.map(p => p.program_id))
    } else {
        setSelectedPrograms([])
    }
  }, [candidateToEdit])

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: candidateToEdit?.name || "",
      chest_number: candidateToEdit?.chest_number || "",
      team_id: candidateToEdit?.team_id || defaultTeamId || "none",
      year: candidateToEdit?.year || "",
      department: candidateToEdit?.department || "",
    },
  })

  // Basic MultiSelect Logic
  const toggleProgram = (programId: string) => {
      setSelectedPrograms(current => 
          current.includes(programId) 
              ? current.filter(id => id !== programId)
              : [...current, programId]
      )
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        name: values.name,
        chest_number: values.chest_number || null,
        team_id: values.team_id === "none" ? null : values.team_id,
        year: values.year || null,
        department: values.department || null,
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
         toast.error("You are not logged in")
         return
      }

      let candidateId = candidateToEdit?.id
      let error;

      // 1. Create or Update Candidate
      if (candidateId) {
         const { error: updateError } = await supabase
          .from("candidates")
          .update(payload)
          .eq("id", candidateId)
         error = updateError
      } else {
         const { data: newCandidate, error: insertError } = await supabase
            .from("candidates")
            .insert(payload)
            .select('id')
            .single()
         
         if (newCandidate) candidateId = newCandidate.id
         error = insertError
      }

      if (error) throw error
      if (!candidateId) throw new Error("Failed to get candidate ID")

      // 2. Handle Program Enrollment (Only if team is selected, as individual needs team_id in participant table usually)
      // Actually import logic sets team_id. We should set it if available.
      if (selectedPrograms.length > 0 || (candidateToEdit && selectedPrograms.length === 0)) {
          const teamId = (values.team_id === "none" || !values.team_id) ? null : values.team_id
          
          if (!teamId) {
             console.warn("No team_id provided for enrollment")
          }

          // Fetch existing to determine additions/removals is complex client side. 
          // Simpler approach: 
          // 1. Get current participants for this candidate
          // 2. Add missing
          // 3. Remove unselected (Optional, maybe we don't want to double delete? But for "Edit" it's expected)
          
          if (candidateToEdit) {
             // Delete removed
             const { error: delError } = await supabase
                 .from('program_participants')
                 .delete()
                 .eq('candidate_id', candidateId)
                 .not('program_id', 'in', `(${selectedPrograms.length > 0 ? selectedPrograms.join(',') : '00000000-0000-0000-0000-000000000000'})`) // Safe hack for empty list
             
             if (delError) console.error("Error removing programs", delError)
          }

          // Insert new ones (upsert safe)
          if (selectedPrograms.length > 0) {
              const participantsToInsert = selectedPrograms.map(pid => ({
                  program_id: pid,
                  candidate_id: candidateId,
                  team_id: teamId, // Important for points
                  status: 'active'
              }))

              console.log("Upserting participants:", participantsToInsert)

              // We use upsert on (program_id, candidate_id) if constraint exists, 
              // or just insert and ignore conflicts if we can't easily upsert
              // program_participants typically has unique(program_id, candidate_id)
              
              const { error: enrollError } = await supabase
                  .from('program_participants')
                  .upsert(participantsToInsert, { onConflict: 'program_id, candidate_id' })
              
              if (enrollError) console.error("Enrollment error", enrollError)
          }
      }

      toast.success(candidateToEdit ? "Candidate updated" : "Candidate created")
      setOpen(false)
      if (!candidateToEdit) {
          form.reset()
          setSelectedPrograms([])
      }
      router.refresh()
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error("A candidate with this Chest Number already exists.")
      } else {
        toast.error("Operation failed: " + error.message)
      }
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
            <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Candidate
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{candidateToEdit ? "Edit Candidate" : "Add Candidate"}</DialogTitle>
          <DialogDescription>
            {candidateToEdit ? "Update candidate details." : "Register a new candidate."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
                <FormField
                control={form.control}
                name="chest_number"
                render={({ field }) => (
                    <FormItem className="flex-1">
                    <FormLabel>Chest Number</FormLabel>
                    <FormControl>
                        <Input placeholder="101" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                  control={form.control}
                  name="team_id"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Team</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Team (Individual)</SelectItem>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Year (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 1st Year" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Department (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. CS" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

             {/* Programs Multi-Select */}
             <div className="space-y-2">
                <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Enrolled Programs</div>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCombobox}
                            className="w-full justify-between h-auto min-h-[40px]"
                        >
                            {selectedPrograms.length > 0 
                                ? <div className="flex flex-wrap gap-1">
                                    {selectedPrograms.map(id => {
                                        const p = programs.find(p => p.id === id)
                                        return p ? <Badge key={id} variant="secondary" className="mr-1">{p.name}</Badge> : null
                                    })}
                                  </div>
                                : "Select programs..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                        <Command>
                            <CommandInput placeholder="Search programs..." />
                            <CommandList>
                                <CommandEmpty>No program found.</CommandEmpty>
                                <CommandGroup className="max-h-[200px] overflow-y-auto">
                                    {programs.map((program) => (
                                        <CommandItem
                                            key={program.id}
                                            value={program.name}
                                            onSelect={() => toggleProgram(program.id)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedPrograms.includes(program.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {program.name} <span className="text-xs text-muted-foreground ml-2">({program.participant_type})</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
             </div>

            <DialogFooter>
              <Button type="submit">{candidateToEdit ? "Save Changes" : "Create Candidate"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
