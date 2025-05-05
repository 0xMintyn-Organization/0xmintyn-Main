import { Button } from "../ui/button"

interface ActiveProposalsCardType {
    title: string;
    proStatus: string;
    description: string;
    yesValue: number;
    noValue: number;
}

function ActiveProposalsCard({ title, proStatus, description, yesValue, noValue }: ActiveProposalsCardType) {

    return(
        <div>
            <h3 className="font-semibold">
                {title}
            </h3>
            <p className="my-1 dark:text-white lg:text-base md:text-sm">
                {proStatus}
            </p>
            <p>
                {description}
            </p>

            {/* Yes No */}
            <div className="flex gap-2 items-center mt-2">
                <Button 
                    className="bg-black dark:bg-white font-semibold text-white dark:text-black rounded-md "
                    aria-label="yes"
                >
                    Yes
                </Button>
                <Button 
                    className="bg-black dark:bg-white font-semibold text-white dark:text-black rounded-md "
                    aria-label="no"
                >
                    No
                </Button>
            </div>

            {/* Value */}
            <p className="my-1">
                Yes: <span>{yesValue}</span> | No: {noValue}
            </p>
        </div>
    )
}

export default ActiveProposalsCard