"use client"

import { useEffect, useState } from "react"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Pencil, Plus } from "lucide-react"
import { updateRule } from "@/app/actions/update-rule"
import { Tables } from "@/lib/database.types"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  max_score: z.coerce.number().min(1, "Score must be at least 1"),
  order_index: z.coerce.number().min(0, "Order must be positive"),
})

interface RuleDialogProps {
  programId: string
  rule?: Tables<'program_rules'> 
}

export function RuleDialog({ programId, rule }: RuleDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!rule

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      max_score: 10,
      order_index: 0,
    },
  })

  // Reset/Populate form on open/change
  useEffect(() => {
    if (open && rule) {
        form.reset({
            name: rule.name,
            max_score: rule.max_score,
            order_index: rule.order_index,
        })
    } else if (open && !rule) {
        form.reset({
            name: "",
            max_score: 10,
            order_index: 0,
        })
    }
  }, [open, rule, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isEdit) {
        const result = await updateRule({
            id: rule.id,
            ...values
        })
        if (result.error) {
            toast.error(result.error)
            return
        }
        toast.success("Rule updated")
      } else {
        const { error } = await supabase.from("program_rules").insert({
            program_id: programId,
            name: values.name,
            max_score: values.max_score,
            order_index: values.order_index,
        })
        if (error) throw error
        toast.success("Rule added")
      }

      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      toast.error(isEdit ? "Failed to update rule" : "Failed to add rule")
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
            <Button variant="ghost" size="sm">
                <Pencil className="h-4 w-4" />
            </Button>
        ) : (
            <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Rule
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Rule" : "Add Judging Rule"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Expression" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_score"
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
                name="order_index"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
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
              <Button type="submit">{isEdit ? "Save Changes" : "Add Rule"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
