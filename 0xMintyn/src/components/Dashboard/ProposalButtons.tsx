import { Button } from "../ui/button";

function ProposalButtons() {
    const buttonsName: string[] = [
        "Yes",
        "No",
        "Abstain",
    ]
    return(
        <div className="flex justify-around items-center mt-4">
            {buttonsName.map((btn, idx) => (
                <Button 
                    key={idx} 
                    className="bg-green-900 font-semibold text-xs text-white hover:bg-green-800 rounded-3xl px-4 py-[2px]"
                    aria-label="proposal"
                >
                    {btn}
                </Button>
            ))}
        </div>
    )
}

export default ProposalButtons