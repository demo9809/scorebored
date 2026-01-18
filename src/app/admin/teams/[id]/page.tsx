import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { calculateTeamPoints } from "@/lib/points"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy } from "lucide-react"
import Link from "next/link"

export default async function AdminTeamDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .single()

  if (!team) notFound()

  // Calculate points
  const pointsData = await calculateTeamPoints(supabase, id)

  // Fetch candidates strictly for this team
  const { data: candidates } = await supabase
    .from("candidates")
    .select("*")
    .eq("team_id", id)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
           <Link href="/admin/teams">
             <ArrowLeft className="h-4 w-4" />
           </Link>
        </Button>
        <div>
           <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
           <p className="text-muted-foreground">Team Score Card & Details</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         {/* Overall Score Card */}
         <Card className="md:col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    Championship Points
                </CardTitle>
                <CardDescription>Total points earned across all competitions</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-5xl font-bold text-primary mb-6">
                    {pointsData.totalPoints} <span className="text-lg text-muted-foreground font-normal">pts</span>
                </div>
                
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Program</TableHead>
                            <TableHead>Participant</TableHead>
                            <TableHead>Rank</TableHead>
                            <TableHead className="text-right">Points</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pointsData.programBreakdown.map((item, idx) => (
                            <TableRow key={idx}>
                                <TableCell className="font-medium">{item.programName}</TableCell>
                                <TableCell>{item.participantName || team.name}</TableCell>
                                <TableCell>
                                    <Badge variant={item.rank === 1 ? "default" : "secondary"}>
                                        #{item.rank}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold">+{item.points}</TableCell>
                            </TableRow>
                        ))}
                         {pointsData.programBreakdown.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No points earned yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
         </Card>

         {/* Candidates List */}
         <Card>
            <CardHeader>
                <CardTitle>Team Candidates</CardTitle>
            </CardHeader>
             <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Chest No</TableHead>
                            <TableHead>Name</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {candidates?.map(c => (
                            <TableRow key={c.id}>
                                <TableCell><Badge variant="outline">{c.chest_number}</Badge></TableCell>
                                <TableCell>{c.name}</TableCell>
                            </TableRow>
                        ))}
                         {(!candidates || candidates.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">
                                    No candidates registered.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
             </CardContent>
         </Card>
      </div>
    </div>
  )
}
