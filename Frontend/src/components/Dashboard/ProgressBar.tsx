import { Progress } from "@/components/ui/progress"

interface ProgressBarType {
  category: string;
  progressPercentage: number;
}

export function ProgressBar({category, progressPercentage}: ProgressBarType) {
  return(
    <div className="space-y-1 shadow-lg">
      <div className="flex justify-between">
        <p>{category}</p>
        <p>{progressPercentage}%</p>
      </div>
        
      <Progress value={progressPercentage} className="w-[100%]" />
    </div>
  )
}

export default ProgressBar
