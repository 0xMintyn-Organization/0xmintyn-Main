import Dropdown from "@/components/Dashboard/Dropdown"
import ProgressBar from "@/components/Dashboard/ProgressBar"
import ProposalButtons from "@/components/Dashboard/ProposalButtons"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Protected from "@/hooks/useProtected"
import { commFeedDetail, popularCategoriesDetails, swapRate, topSellersDetails } from "@/lib/utils"
import Image from "next/image"

function Dashboard() {

    return(
        <Protected>

        <div className="lg:flex mx-auto py-6 px-4 gap-4">

            {/* Left Section */}
            <div className="lg:w-[50%] ">

                {/* Marketplace Overview */}
                <Card className="rounded-xl">
                    <CardHeader className="p-3">
                        <CardTitle className="text-heading font-semibold">Marketplace Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-3">

                        {/* Top Sellers */}
                        <div className="bg-slate-200 dark:bg-zinc-900 rounded-xl p-3 text-sm">
                            <h6 className="text-heading font-semibold mb-2">Top Sellers</h6>
                            {topSellersDetails.map((seller, idx) => (
                                <div key={idx} className="flex justify-between items-center mb-1 text-xs">
                                    <h6>{seller.name}</h6>
                                    <p>{seller.rate} OXM</p>
                                </div>
                            ))}
                        </div>

                        {/* Popular Categories */}
                        <div className="bg-slate-200 dark:bg-zinc-900 rounded-xl p-3 text-sm">
                            <h6 className="text-heading font-semibold mb-2">Popular Categories</h6>
                            {popularCategoriesDetails.map((category, idx) => (
                                <div key={idx} className="text-xs mt-3">
                                    <ProgressBar category={category.category} progressPercentage={category.percentage} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                    
                {/* Exchange Dashboard */}
                <Card className="rounded-xl mt-3 pb-2">
                    <CardHeader className="p-3">
                        <CardTitle className="text-heading font-semibold">Exchange Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-3">

                        {/* OXM/USD Rate */}
                        <div className="bg-slate-200 dark:bg-zinc-900 rounded-xl p-3 text-sm">
                            <h6 className="text-heading font-semibold mb-2">OXM/USD Rate</h6>
                             <div className="h-20 w-full"></div>
                        </div>

                        {/* Quick Swap */}
                        <div className="bg-slate-200 dark:bg-zinc-900 rounded-xl p-3 text-sm w-full">
                            <h6 className="text-heading font-semibold mb-2">Quick Swap</h6>
                            <Input placeholder="Amount" className="bg-zinc-300 dark:bg-zinc-800 mb-2"/>
                            <Dropdown />
                            {/* CTA Button */}
                            <Button aria-label="swap" className="w-full mt-5 bg-green-900 font-semibold text-white hover:bg-green-800 rounded-3xl">
                                Swap
                            </Button>              
                        </div>
                    </CardContent>

                    {/* Different Currency Rates */}
                    <div className="flex justify-between px-3 text-center text-xs mb-4">
                        {swapRate.map((rate, idx) => (
                            <div key={idx}>
                                <p className="">{rate.currency}</p>
                                <p className="text-heading font-semibold text-base">{rate.swapRate}</p>
                                <p className={`${rate.marginPercentage.startsWith('+') ? 'text-green-700' : 'text-red-600'} text-[10px] font-semibold` }>{rate.marginPercentage}</p>   
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
            
            {/* Border Line */}
            <div className="h-screen border-r-2 border-slate-300 dark:border-zinc-800 hidden lg:block"></div>
            
            {/* Right Section */}
            <div className="lg:w-[50%] ">

                 {/* Governance Center */}
                <Card className="rounded-xl">
                    <CardHeader className="p-3">
                        <CardTitle className="text-heading font-semibold">Governance Center</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-3">

                        {/* Active Proposals */}
                        <div className="bg-slate-200 dark:bg-zinc-900 rounded-xl p-3 text-sm">
                            <h6 className="text-heading font-semibold mb-2">Active Proposals</h6>
                            <div className="flex justify-between text-xs">
                                <h6>Increase Block Size</h6>
                                <p>Ends in 2 Days</p>
                            </div>
                            <ProposalButtons />
                        </div>

                        {/* Your Voting Power */}
                        <div className="bg-slate-200 dark:bg-zinc-900 rounded-xl p-3 text-sm">
                            <h6 className="text-heading font-semibold mb-2">Your Voting Power</h6>
                            <div className="flex justify-between text-xs">
                                <h6>Total Staked OXM</h6>
                                <p>500 OXM</p>
                            </div>
                            <div className="text-xs mt-3">
                                <ProgressBar category='Voting Power' progressPercentage={5} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                 {/* Community Feed */}
                 <Card className="rounded-xl mt-3">
                    <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-heading font-semibold">Community Feed</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-3">

                        {/* Users on Community Feed */}
                        <div className="bg-slate-200 dark:bg-zinc-800 rounded-xl p-3 mt-2 text-sm">
                            {commFeedDetail.map((feed, idx) => {
                                const words = feed.description.split(" ");
                                const firstWord = words.shift();
                                return(
                                    <div key={idx} className="flex items-center gap-2 py-3 border-b-[1px] border-zinc-700">
                                        <div className="relative w-8 h-8">
                                        <Image
                                            src={feed.proImage}
                                            alt="User Profile"
                                            fill
                                            className="object-cover rounded-full "
                                        />
                                        </div>
                                        <p>
                                            <strong>{firstWord}</strong> {words.join(" ")}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
                
            </div>
        </div>
        </Protected>
    )
}

export default Dashboard