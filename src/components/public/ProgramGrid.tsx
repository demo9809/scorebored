import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Activity, CheckCircle2 } from "lucide-react"

interface ProgramGridProps {
  programs: any[]
  type: 'live' | 'completed' | 'upcoming'
}

export function ProgramGrid({ programs, type }: ProgramGridProps) {
  if (programs.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
        <p className="text-muted-foreground">No {type} competitions at the moment.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {programs.map((p) => (
        <Card key={p.id} className="group overflow-hidden border-border/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
               <Badge variant={type === 'live' ? 'default' : type === 'completed' ? 'secondary' : 'outline'} className={type === 'live' ? 'animate-pulse' : ''}>
                  {type === 'live' ? 'LIVE NOW' : type === 'completed' ? 'Ended' : 'Upcoming'}
               </Badge>
               <span className="text-xs font-mono text-muted-foreground uppercase">{p.participant_type}</span>
            </div>
            <CardTitle className="text-xl group-hover:text-primary transition-colors">{p.name}</CardTitle>
            <CardDescription className="line-clamp-2">
               {p.description || "Live scoring and results."}
            </CardDescription>
          </CardHeader>
          <CardContent>
             {/* Add some metrics here if available, e.g. # of participants */}
             <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                   <Activity className="h-4 w-4" />
                   <span>Max Score: {p.max_score_per_judge}</span>
                </div>
             </div>
          </CardContent>
          <CardFooter className="bg-gray-50/50 dark:bg-gray-950/50 border-t p-4">
            <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all" asChild>
              <Link href={`/leaderboard/${p.id}`} className="flex items-center justify-center gap-2">
                {type === 'completed' ? 'View Results' : 'Watch Live'}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
