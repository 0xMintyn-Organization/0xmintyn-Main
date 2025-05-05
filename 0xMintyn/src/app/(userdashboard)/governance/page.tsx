import ActiveProposalsCard from "@/components/Dap/ActiveProposalsCard"
import FundRaisingModel from "@/components/Dap/FundRaisingModel"
import ProposalCard from "@/components/Governance/ProposalCard"
import ProposalComponent from "@/components/Governance/ProposalComponent"
import SnapshotComponent from "@/components/Governance/SnapshotComponent"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Protected from "@/hooks/useProtected"
import { activeProposalsDetail, proposalCard, proposalsSnapshot } from "@/lib/utils"

function Governance() {

    return(
        <Protected>

        <div className="flex flex-col mx-auto space-y-4 py-6 px-4">

            {/* Active Proposals */}
            <Card>
                <CardHeader className="text-heading font-semibold">
                    <CardTitle>Active Proposals</CardTitle>
                </CardHeader>
                <CardContent className="px-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {activeProposalsDetail.map((proposal, idx) => (
                            <div key={idx} className="lg:w-1/3">
                                <ProposalComponent title={proposal.title} description={proposal.description} favorPercent={proposal.favor} days={proposal.days} />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Your Voting Power */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-heading font-semibold">Your Voting Power</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4">

                    {/* Total Staked OXM */}
                    <div className="bg-slate-200 dark:bg-zinc-900 rounded-xl px-3 py-4 text-sm">
                        <h6 className="text-heading font-semibold mb-2">Total Staked OXM</h6>
                        <p className="text-xs mt-4">500 OXM</p>
                    </div>

                    {/* Voting Power */}
                    <div className="bg-slate-200 dark:bg-zinc-900 rounded-xl px-3 py-4 text-sm">
                        <h6 className="text-heading font-semibold mb-2">Voting Power</h6>
                        <p className="text-xs mt-4 mb-2">5%</p>
                        <Progress value={5} />
                    </div>
                </CardContent>
            </Card>
            
            {/* CTA */}
            <div>
                <Button 
                    aria-label="create-new-proposal" 
                    className="p-4 my-4 text-xs bg-green-900 font-semibold text-white hover:bg-green-800 rounded-3xl"
                >
                    Create New Proposal
                </Button>
            </div>

            {/* Create New Proposal */}
            <Card>
                <CardHeader className="text-heading font-semibold">
                    <CardTitle>Oxmintyn Governance</CardTitle>
                    
                </CardHeader>
                <CardContent className="px-4">

                    {/* CTA */}
                    <div>
                        <Button 
                            className="w-full bg-green-900 font-semibold text-white hover:bg-green-800 rounded-lg"
                            aria-label="create-new-listing"
                        >
                            Create New Listing
                        </Button>
                    </div>

                    {/* Proposals Snapshot */}
                    <div className="flex justify-around lg:flex-nowrap flex-wrap my-8">
                        {proposalsSnapshot && proposalsSnapshot.map((proposal, idx) => (
                            <SnapshotComponent key={idx} propsalSate={proposal.propsalSate} states={proposal.states} />
                        ))}
                    </div>

                    <div className="flex lg:flex-nowrap flex-wrap justify-start lg:gap-4 gap-0 my-8">
                        {proposalCard && proposalCard.map((card, idx) => (
                            <div key={idx} className="w-[50%]">
                                <ProposalCard 
                                    title={card.title}
                                    proStatus={card.proStatus}
                                    description={card.description}
                                    yesValue={card.yesVal}
                                    noValue={card.noVal}
                                />
                            </div>
                        ))}
                    </div>

                </CardContent>
            </Card>

            <Card>
                <CardHeader className="text-heading font-semibold">
                    <CardTitle>Oxmintyn Governance</CardTitle>
                    
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

export default Governance