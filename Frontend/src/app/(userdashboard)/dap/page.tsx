import ActiveProposalsCard from "@/components/Dap/ActiveProposalsCard"
import FundRaisingModel from "@/components/Dap/FundRaisingModel"
import SnapshotComponent from "@/components/Governance/SnapshotComponent"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Protected from "@/hooks/useProtected"
import { proposalCard, proposalsSnapshot } from "@/lib/utils"

function Dap() {

    return(
        <Protected>

        <div className="flex flex-col mx-auto space-y-4 py-6 px-4">
            <Card>
                <CardHeader className="text-heading font-semibold">
                    <CardTitle>0xMintyn Governance</CardTitle>
                    
                </CardHeader>
                <CardContent className="px-4">

                    {/* Proposals Snapshot */}
                    <div className="flex justify-around lg:flex-nowrap flex-wrap my-4">
                        {proposalsSnapshot && proposalsSnapshot.map((proposal, idx) => (
                            <SnapshotComponent key={idx} propsalSate={proposal.propsalSate} states={proposal.states} />
                        ))}
                    </div>

                </CardContent>
            </Card>


            {/* Fund Raising Component */}
            <FundRaisingModel />

            {/* Active Proposals */}
            <Card>
                <CardHeader className="text-heading font-semibold">
                    <CardTitle>Active Proposals</CardTitle>
                </CardHeader>
                <CardContent className="px-6">

                    {/* Active Proposals */}
                    {proposalCard && proposalCard.slice(0, 3).map((proposal, idx) => (
                        <ActiveProposalsCard 
                            key={idx} 
                            title={proposal.title} 
                            proStatus={proposal.proStatus} 
                            description={proposal.description} 
                            yesValue={proposal.yesVal} 
                            noValue={proposal.noVal} 
                        />
                    ))}

                </CardContent>
            </Card>
        </div>
        </Protected>
    )
}

export default Dap