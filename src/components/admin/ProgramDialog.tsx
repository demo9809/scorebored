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
  participant_type: z.enum(["individual", "team"]),
  status: z.enum(["upcoming", "live", "completed"]),
  max_score_per_judge: z.coerce.number().min(1, "Max score must be at least 1"),
  best_of_judge_count: z.coerce.number().min(1, "Must be at least 1 judge"),
})

export function ProgramDialog() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      participant_type: "individual",
      status: "upcoming",
      max_score_per_judge: 10,
      best_of_judge_count: 3,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { error } = await supabase.from("programs").insert({
        name: values.name,
        participant_type: values.participant_type,
        status: values.status,
        max_score_per_judge: values.max_score_per_judge,
        best_of_judge_count: values.best_of_judge_count,
      })

      if (error) throw error

      toast.success("Program created successfully")
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      toast.error("Failed to create program")
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button suppressHydrationWarning>
          <Plus className="mr-2 h-4 w-4" /> Add Program
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Program</DialogTitle>
          <DialogDescription>
            Create a new competition program.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Classical Dance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="participant_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_score_per_judge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Score</FormLabel>
                      <FormControl>
                        <Input 
                            type="number" 
                            {...field}
                            value={(field.value as number) || ""}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)} 
                        />
                      </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="best_of_judge_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Best of N Judges</FormLabel>
                      <FormControl>
                        <Input 
                            type="number" 
                            {...field}
                            value={(field.value as number) || ""}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)} 
                        />
                      </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Create Program</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
