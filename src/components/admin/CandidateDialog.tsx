"use client"

import { useState } from "react"
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
import { Plus } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  chest_number: z.string().optional(),
  team_id: z.string().optional(),
  year: z.string().optional(),
  department: z.string().optional(),
})

interface CandidateDialogProps {
  defaultTeamId?: string
  teams: { id: string; name: string }[]
  candidateToEdit?: {
    id: string
    name: string
    chest_number: string | null
    team_id: string | null
    year?: string | null
    department?: string | null
  }
  trigger?: React.ReactNode
}

export function CandidateDialog({ teams, candidateToEdit, trigger, defaultTeamId }: CandidateDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
      console.log("Current User for Candidate Action:", user?.id, user?.user_metadata)

      if (!user) {
         toast.error("You are not logged in")
         return
      }

      let error;
      if (candidateToEdit) {
         const { error: updateError } = await supabase
          .from("candidates")
          .update(payload)
          .eq("id", candidateToEdit.id)
         error = updateError
      } else {
         const { error: insertError } = await supabase.from("candidates").insert(payload)
         error = insertError
      }

      if (error) throw error

      toast.success(candidateToEdit ? "Candidate updated successfully" : "Candidate created successfully")
      setOpen(false)
      if (!candidateToEdit) form.reset()
      router.refresh()
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error("A candidate with this Chest Number already exists.")
      } else {
        toast.error(candidateToEdit ? "Failed to update candidate: " + error.message : "Failed to create candidate: " + error.message)
      }
      console.error("Candidate creation error:", JSON.stringify(error, null, 2))
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
      <DialogContent className="sm:max-w-[425px]">
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
            <FormField
              control={form.control}
              name="chest_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chest Number</FormLabel>
                  <FormControl>
                    <Input placeholder="101" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

             <FormField
              control={form.control}
              name="team_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team (Optional)</FormLabel>
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
            <DialogFooter>
              <Button type="submit">{candidateToEdit ? "Save Changes" : "Create Candidate"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
