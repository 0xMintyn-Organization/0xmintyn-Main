import { Button } from "../ui/button"

interface ProposalCardType {
    title: string;
    proStatus: string;
    description: string;
    yesValue: number;
    noValue: number;
}

function ProposalCard({ title, proStatus, description, yesValue, noValue }: ProposalCardType) {

    const statusBgClass = proStatus === 'closed' ? 'bg-red-600' : 'bg-green-600'
    return(
        <div>
            <h3 className="text-green-700 font-semibold text-lg">
                {title}
            </h3>
            <p className={`inline-block py-1 px-3 rounded-3xl my-2 text-white lg:text-base md:text-sm ${statusBgClass}`}>
                {proStatus}
            </p>
            <p className="md:text-xs">
                {description}
            </p>

            {/* Yes No | Value */}
            <div className="lg:flex justify-between items-center mt-4 flex-none lg:space-x-0 lg:space-y-0 space-x-2 space-y-2">
                <Button 
                    className="bg-green-600 font-semibold text-white hover:bg-green-800 rounded-3xl text-xs px-3"
                    aria-label="yes"
                >
                    Yes
                </Button>
                <Button 
                    className="bg-red-600 font-semibold text-white hover:bg-red-800 rounded-3xl text-xs px-3"
                    aria-label="no"
                >
                    No
                </Button>
                <p className="text-xs">
                    Yes: <span>{yesValue}</span> | No: {noValue}
                </p>
            </div>
        </div>
    )
}

export default ProposalCard