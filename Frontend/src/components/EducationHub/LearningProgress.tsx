"use client"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"

export function LearningProgress() {
  const [progress, setProgress] = useState<number>(70)

  useEffect(() => {
    const timer = setTimeout(() => setProgress(70), 500)
    return () => clearTimeout(timer)
  }, [])

  return(
    <div className="space-y-4 shadow-lg p-5">
        <h2 className="text-heading font-semibold">Your Learning progress</h2>
        <Progress value={progress} className="w-[100%]" />
        <p>You&apos;ve completed 70% of your enrolled courses. Keep up the good work!</p>
    </div>
  )
}

export default LearningProgress
