import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Activity } from "lucide-react"

interface ProgramGridProps {
  programs: any[]
  type: 'live' | 'completed' | 'upcoming'
}

export function ProgramGrid({ programs, type }: ProgramGridProps) {
  if (programs.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50/50 dark:bg-gray-900/50 animate-in fade-in zoom-in-95 duration-500">
        <p className="text-muted-foreground">No {type} competitions at the moment.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {programs.map((p, index) => (
        <Card 
            key={p.id} 
            className="group relative overflow-hidden border-border/50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
            style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Hover Gradient Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <CardHeader className="relative z-10">
            <div className="flex justify-between items-start mb-2">
               {type === 'live' ? (
                   <Badge variant="default" className="bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/30 border-0">
                       <Activity className="w-3 h-3 mr-1" /> LIVE NOW
                   </Badge>
               ) : (
                   <Badge variant={type === 'completed' ? 'secondary' : 'outline'} className="font-semibold">
                       {type === 'completed' ? 'Ended' : 'Upcoming'}
                   </Badge>
               )}
               <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase bg-muted/50 px-2 py-1 rounded-sm">{p.participant_type}</span>
            </div>
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300">{p.name}</CardTitle>
            <CardDescription className="line-clamp-2">
               {p.description || "Live scoring and results."}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
             <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                   <span className="text-xs font-medium">Max Score: {p.max_score_per_judge}</span>
                </div>
             </div>
          </CardContent>
          <CardFooter className="bg-gray-50/30 dark:bg-gray-950/30 border-t border-border/50 p-4 relative z-10">
            <Button className="w-full rounded-lg h-10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm" variant={type === 'live' ? 'default' : 'outline'} asChild>
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
