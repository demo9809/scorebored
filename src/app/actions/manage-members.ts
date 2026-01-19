"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addTeamMember(programParticipantId: string, candidateId: string) {
    const supabase = await createClient()
    
    try {
        const { error } = await supabase.from("program_participant_members").insert({
            program_participant_id: programParticipantId,
            candidate_id: candidateId
        })
        
        if (error) {
            if (error.code === '23505') return { error: "Member already added" }
            throw error
        }
        
        revalidatePath("/admin/programs/[id]") 
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function removeTeamMember(memberId: string) {
    const supabase = await createClient()
    
    try {
        const { error } = await supabase.from("program_participant_members").delete().eq("id", memberId)
        if (error) throw error
        
        revalidatePath("/admin/programs/[id]")
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}
