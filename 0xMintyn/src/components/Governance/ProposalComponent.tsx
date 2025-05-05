import ProposalButtons from "../Dashboard/ProposalButtons"
import { Progress } from "@/components/ui/progress"

interface ProposalBarType {
    favorPercent: number;
    days: number;
    title: string;
    description: string;
}

function ProposalComponent({ title, description, favorPercent, days }: ProposalBarType) {
    return(
        <div className=" rounded-xl text-sm">
            <h6 className="text-heading font-semibold mb-2 text-sm">{title}</h6>
            <p className="text-[10px]">{description}</p>
            <div className="flex justify-between items-center text-xs text-center my-2">
                <div>
                    <p className="font-semibold">{favorPercent}%</p>
                    <p className="text-[10px]">In Favor</p>
                </div>
                <div>
                    <p className="font-semibold">{100 - favorPercent}%</p>
                    <p className="text-[10px]">Against</p>
                </div>
                <div>
                    <p className="font-semibold">{days} days</p>
                    <p className="text-[10px]">Remaining</p> 
                </div>
                
            </div>
            <Progress value={favorPercent} className="w-[100%]" />
            <ProposalButtons />
        </div>
    )
}

export default ProposalComponent