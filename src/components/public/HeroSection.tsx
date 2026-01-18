import { Badge } from "@/components/ui/badge"

export function HeroSection() {
  return (
    <section className="relative py-20 px-4 md:px-6 lg:py-32 overflow-hidden bg-white dark:bg-gray-950">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 -z-10" />
      <div className="container mx-auto text-center space-y-6">
        <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm rounded-full backdrop-blur-sm bg-white/50 dark:bg-white/10 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
             ✨ Live Arts Fest 2026
        </Badge>
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 dark:from-white dark:via-indigo-200 dark:to-white animate-fade-in">
          Experience the <br className="hidden sm:block" />
          <span className="text-primary">Thrill of Art</span>
        </h1>
        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400 font-light">
          Real-time scores, instant updates, and the championship race. <br />
          Follow your favorite teams and candidates as they compete for glory.
        </p>
      </div>
    </section>
  )
}
