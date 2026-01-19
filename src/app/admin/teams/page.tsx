import { createClient } from "@/lib/supabase/server"


import { TeamDialog } from "@/components/admin/TeamDialog"
import { TeamsTable } from "@/components/admin/TeamsTable"
import { RecalculatePointsButton } from "@/components/admin/RecalculatePointsButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TeamsPage() {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("total_points", { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage teams and track their overall points.
          </p>
        </div>
        <div className="flex gap-2">
           <RecalculatePointsButton />
           <TeamDialog />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Teams</CardTitle>
        </CardHeader>
        <CardContent>
           <TeamsTable teams={teams || []} />
        </CardContent>
      </Card>
    </div>
  )
}
