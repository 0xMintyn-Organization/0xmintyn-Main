import Dropdown1 from "@/components/Exchange/Dropdown1"
import Dropdown2 from "@/components/Exchange/Dropdown2"
import { OpenOrdersTable } from "@/components/Exchange/OpenOrdersTable"
import { OrderBookTable } from "@/components/Exchange/OrderBookTable"
import PlaceOrderDropdown from "@/components/Exchange/PlaceOrderDropdown"
import { TradeHistoryTable } from "@/components/Exchange/TradeHistoryTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Protected from "@/hooks/useProtected"
import formatNumber from "@/lib/formatters"
import { swapRate } from "@/lib/utils"

function Exchange() {

    return(
        <Protected>

        <div className="flex flex-col mx-auto space-y-4 py-6 px-4">
            {/* Exchange Dashboard & Quick Swap */}
            <div className="grid lg:grid-cols-2 gap-2">
                {/* Exchange Dashboard */}
                <Card>
                    <CardHeader className="text-heading font-semibold">
                        <CardTitle>Exchange Dashboard</CardTitle>
                        
                    </CardHeader>
                    <CardContent className="space-y-3">

                        {/* Market Overview */}
                        <div className="bg-slate-200 dark:bg-zinc-900 rounded-lg">
                            <h6 className="text-heading font-semibold text-sm py-3 px-4">Market Overview</h6>

                            {/* Swap Rates */}
                            <div className="flex justify-between gap-4 my-2 mx-4">
                                {swapRate.map((rate, idx) => (
                                    <div key={idx} className="bg-zinc-300 dark:bg-zinc-800 w-1/3 rounded-xl text-center py-4 mb-4">
                                        <h6>{rate.currency}</h6>
                                        <p className="text-heading font-semibold text-base">{rate.swapRate}</p>
                                        <p className={`${rate.marginPercentage.startsWith('-') ? 'text-red-500' : 'text-green-800'} text-[10px] font-semibold`}>{rate.marginPercentage}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 24h Trading Volume */}
                        <div className="bg-slate-200 dark:bg-zinc-900 rounded-lg py-2 px-4">
                            <h6 className="text-heading font-semibold text-sm">24h Trading Volume</h6>
                            <h6 className="text-heading font-semibold text-sm mt-2">{formatNumber(1234567)}</h6>
                        </div>

                    </CardContent>
                </Card>

                {/* Quick Swap */}
                <Card>
                    <CardHeader className="text-heading font-semibold">
                        <CardTitle>Quick Swap</CardTitle>
                        
                    </CardHeader>
                    <CardContent className=" space-y-4">

                        {/* Market Overview */}
                        <div className="bg-slate-200 dark:bg-zinc-900 rounded-lg p-4 space-y-3">
                            <Input placeholder="Amount" className="bg-zinc-300 dark:bg-zinc-800"/>
                            <Dropdown1 />
                            <Dropdown2 />
                            <p className="text-sm">1 OXM = $1.05 USD</p>
                            {/* CTA Button */}
                            <Button aria-label="swap" className=" bg-green-900 font-semibold text-white hover:bg-green-800 rounded-3xl">
                                Swap
                            </Button> 
                        </div>

                    </CardContent>
                </Card>
            </div>
            
            {/* Order Book & Place Order */}
            <div className="grid lg:grid-cols-2 gap-2">
                {/* Order Book */}
                <Card>
                    <CardHeader className="text-heading font-semibold">
                        <CardTitle>Order Book</CardTitle>
                        
                    </CardHeader>
                    <CardContent className="space-y-3">

                        {/* Table */}
                        <div className="">
                            <OrderBookTable />
                        </div>

                    </CardContent>
                </Card>

                {/* Place Order */}
                <Card>
                    <CardHeader className="text-heading font-semibold">
                        <CardTitle>Place Order</CardTitle>
                        
                    </CardHeader>
                    <CardContent className=" space-y-4">

                        <div className="flex justify-between items-center">
                            <Button aria-label="market" className="bg-green-900 font-semibold text-white hover:bg-green-800">
                                Market
                            </Button>
                            <p>Limit</p>
                            <p>Stop</p>
                        </div>

                        <div className="bg-slate-200 dark:bg-zinc-900 rounded-lg p-4 space-y-3">
                            <PlaceOrderDropdown />
                            <Input placeholder="Amount (OXM)" className="bg-zinc-300 dark:bg-zinc-800"/>
                            <p className="text-sm">Total = $0.00</p>
                            {/* CTA Button */}
                            <Button aria-label="place-order" className=" bg-green-900 font-semibold text-white hover:bg-green-800 rounded-3xl">
                                Place Order
                            </Button> 
                        </div>

                    </CardContent>
                </Card>
            </div>

            {/* Open Orders & Trade History */}
            <div className="grid lg:grid-cols-2 gap-2">
                {/* Open Orders */}
                <Card>
                    <CardHeader className="text-heading font-semibold">
                        <CardTitle>Open Orders</CardTitle>
                        
                    </CardHeader>
                    <CardContent className="space-y-3">

                        {/* Table */}
                        <div className="">
                            <OpenOrdersTable />
                        </div>

                    </CardContent>
                </Card>

                {/* Trade History */}
                <Card>
                    <CardHeader className="text-heading font-semibold">
                        <CardTitle>Trade History</CardTitle>
                        
                    </CardHeader>
                    <CardContent className=" space-y-4">

                        {/* Table */}
                        <div className="">
                            <TradeHistoryTable />
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
        </Protected>
    )
}

export default Exchange