import { Card, CardContent } from "@/components/ui/card"
import { Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StandingsListProps {
  rankings: any[]
}

export function StandingsList({ rankings }: StandingsListProps) {
  if (rankings.length === 0) {
     return <div className="text-center py-20 text-muted-foreground bg-white/50 rounded-xl border-dashed border-2">Waiting for results...</div>
  }

  const top3 = rankings.slice(0, 3)
  const rest = rankings.slice(3)

  return (
    <div className="space-y-12 pb-12 pt-12 md:pt-32">

        {/* TOP 3 CARDS LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto px-4 relative z-10">
             {/* 2nd Place */}
             <div className="order-2 md:order-1">
                 {top3[1] && <WinnerCard team={top3[1]} rank={2} color="from-gray-300 to-gray-400" shadow="shadow-gray-400/20" delay={100} />}
             </div>
             
             {/* 1st Place */}
             <div className="order-1 md:order-2 -mt-12 md:-mt-24 relative z-10">
                 {top3[0] && <WinnerCard team={top3[0]} rank={1} isFirst color="from-yellow-300 to-yellow-500" shadow="shadow-yellow-500/40" delay={0} />}
             </div>
             
             {/* 3rd Place */}
             <div className="order-3 md:order-3">
                 {top3[2] && <WinnerCard team={top3[2]} rank={3} color="from-orange-300 to-amber-600" shadow="shadow-orange-600/20" delay={200} />}
             </div>
        </div>

        {/* REST OF THE PACK LIST */}
        {rest.length > 0 && (
            <div className="max-w-3xl mx-auto pt-8 px-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/30 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                         <div className="col-span-2 text-center">Rank</div>
                         <div className="col-span-7">Team</div>
                         <div className="col-span-3 text-right">Points</div>
                    </div>
                    {rest.map((team, idx) => (
                        <div key={team.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors border-b last:border-0 group">
                            <div className="col-span-2 flex justify-center">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 font-bold text-gray-500 text-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                    {idx + 4}
                                </span>
                            </div>
                            <div className="col-span-7">
                                <h4 className="font-bold text-gray-900 dark:text-gray-100">{team.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                   <div className="h-1 w-12 rounded-full bg-gray-200 overflow-hidden">
                                      <div className="h-full bg-primary/50" style={{ width: `${Math.min((team.totalPoints / (top3[0]?.totalPoints || 1)) * 100, 100)}%` }}></div>
                                   </div>
                                   <span className="text-[10px] text-muted-foreground">{team.programBreakdown?.length || 0} events</span>
                                </div>
                            </div>
                            <div className="col-span-3 text-right font-mono font-bold text-lg text-gray-700 dark:text-gray-300">
                                {team.totalPoints}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  )
}

function WinnerCard({ team, rank, isFirst = false, color, shadow, delay }: { team: any, rank: number, isFirst?: boolean, color: string, shadow: string, delay: number }) {
    return (
        <div 
             className={cn(
                 "relative group transition-all duration-700 animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards",
                 isFirst ? "scale-110" : "hover:-translate-y-2"
             )}
             style={{ animationDelay: `${delay}ms` }}
        >
             <div className={cn("absolute inset-0 bg-gradient-to-br rounded-3xl blur-2xl opacity-40 transition-opacity duration-500", color, isFirst ? "opacity-60" : "opacity-30 group-hover:opacity-50")} />
             
             <Card className={cn(
                 "relative border-0 overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl rounded-3xl", 
                 isFirst ? "h-[320px]" : "h-[250px]"
             )}>
                {/* Background Decor */}
                <div className={cn("absolute top-0 inset-x-0 h-32 bg-gradient-to-b opacity-10", color)} />
                
                <CardContent className="h-full flex flex-col items-center justify-center p-6 text-center z-10 relative">
                     {/* Rank Badge */}
                     <div className={cn(
                         "flex items-center justify-center rounded-full shadow-lg mb-4 ring-4 ring-white dark:ring-gray-950",
                         isFirst ? "w-16 h-16 text-3xl mb-6 bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900" : 
                         rank === 2 ? "w-12 h-12 text-xl bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800" :
                         "w-12 h-12 text-xl bg-gradient-to-br from-orange-200 to-amber-600 text-amber-900"
                     )}>
                         {isFirst ? <Crown className="w-8 h-8 animate-pulse" /> : <span className="font-black">{rank}</span>}
                     </div>

                     <h3 className={cn("font-black leading-tight mb-1 text-gray-900 dark:text-white", isFirst ? "text-3xl" : "text-xl")}>
                        {team.name}
                     </h3>
                     
                     <div className="mt-auto">
                        <span className={cn("block font-black tracking-tighter", isFirst ? "text-6xl bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400" : "text-4xl text-muted-foreground")}>
                            {team.totalPoints}
                        </span>
                        <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Total Points</span>
                     </div>
                </CardContent>
             </Card>
        </div>
    )
}
