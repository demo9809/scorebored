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
import { Plus } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  avatar_url: z.string().optional(),
})

interface TeamDialogProps {
  teamToEdit?: {
    id: string
    name: string
    avatar_url: string | null
  }
  trigger?: React.ReactNode
}

export function TeamDialog({ teamToEdit, trigger }: TeamDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: teamToEdit?.name || "",
      avatar_url: teamToEdit?.avatar_url || "",
    },
  })

  // Reset form when dialog opens/closes or teamToEdit changes
  // actually react-hook-form might need manual reset if defaultValues change
  // but for now, keying the component or simple usage is fine. 
  // Better: validation on open? No, let's keep it simple.

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      let error;
      if (teamToEdit) {
        const { error: updateError } = await supabase
          .from("teams")
          .update({
            name: values.name,
            avatar_url: values.avatar_url || null,
          })
          .eq("id", teamToEdit.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase.from("teams").insert({
          name: values.name,
          avatar_url: values.avatar_url || null,
        })
        error = insertError
      }

      if (error) throw error

      toast.success(teamToEdit ? "Team updated successfully" : "Team created successfully")
      setOpen(false)
      if (!teamToEdit) form.reset() 
      router.refresh()
    } catch (error) {
      toast.error(teamToEdit ? "Failed to update team" : "Failed to create team")
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{teamToEdit ? "Edit Team" : "Add Team"}</DialogTitle>
          <DialogDescription>
            {teamToEdit ? "Update team details." : "Create a new team/house for the competition."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Red House" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{teamToEdit ? "Save Changes" : "Create Team"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
