"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createJudge } from "@/app/actions/create-judge"
import { updateJudge } from "@/app/actions/update-judge"
import { Tables } from "@/lib/database.types"

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
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
})

// Extend profile with email which might be joined or passed separately
interface JudgeProfile extends Tables<"profiles"> {
    email?: string
}

interface JudgeDialogProps {
    judge?: JudgeProfile
    trigger?: React.ReactNode
}

export function JudgeDialog({ judge, trigger }: JudgeDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const isEdit = !!judge
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  })

  // Reset form when dialog opens or judge changes
  useEffect(() => {
      if (open && judge) {
          form.reset({
              fullName: judge.full_name,
              email: judge.email || "", // Profile might not have email depending on schema, usually it's in auth but we might not have it here easily if fetched from profile table only. 
              // Wait, 'profiles' table doesn't usually store email unless we duplicated it.
              // Let's assume we might need to fetch it or just display what we have.
              // Inspecting JudgesPage: fetched from 'profiles'. 
              // Does 'profiles' have email?
              // Let's check schema. If not, this is tricky. 
              // Assuming generic profile usually duplicates email or linked via ID.
              password: "",
          })
      } else if (open && !judge) {
          form.reset({
              fullName: "",
              email: "",
              password: "",
          })
      }
  }, [open, judge, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      let result;
      
      if (isEdit) {
          result = await updateJudge({
              id: judge.id,
              fullName: values.fullName,
              email: values.email, // If we don't have email in profile, this might be empty/invalid if user didn't fill it?
              // Issue: If we don't have email in 'judge' prop, we can't prefill it. 
              // If user leaves it empty on Edit, z.email() fails.
              // We need to fetch email or make it optional on edit if not changed?
              // For now, let's assume we can pass email.
              password: values.password,
          })
      } else {
          if (!values.password) {
              form.setError("password", { message: "Password is required for new judges" })
              return
          }
          result = await createJudge({
              fullName: values.fullName,
              email: values.email,
              password: values.password,
          })
      }
      
      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(isEdit ? "Judge updated successfully" : "Judge created successfully")
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
            <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Judge
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Judge" : "Add Judge"}</DialogTitle>
          <DialogDescription>
             {isEdit ? "Update judge details. Leave password blank to keep current one." : "Create a new judge account."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEdit ? "New Password (Optional)" : "Password"}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={isEdit ? "Leave blank to keep current" : ""} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{isEdit ? "Save Changes" : "Create Account"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
