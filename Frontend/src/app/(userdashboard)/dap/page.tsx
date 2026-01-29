import FundRaisingModel from "@/components/Dap/FundRaisingModel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Protected from "@/hooks/useProtected"

function Dap() {

    return(
        <Protected>

        <div className="flex flex-col mx-auto space-y-4 py-6 px-4">
            <Card>
                <CardHeader className="text-heading font-semibold">
                    <CardTitle>Equalmint DAP</CardTitle>
                    
                </CardHeader>
                <CardContent className="px-4">

                    {/* DAP Content */}
                    <div className="flex justify-around lg:flex-nowrap flex-wrap my-4">
                        <p className="text-center text-gray-600">DAP functionality coming soon...</p>
                    </div>

                </CardContent>
            </Card>


            {/* Fund Raising Component */}
            <FundRaisingModel />

            {/* DAP Features */}
            <Card>
                <CardHeader className="text-heading font-semibold">
                    <CardTitle>DAP Features</CardTitle>
                </CardHeader>
                <CardContent className="px-6">
                    <div className="text-center py-8">
                        <p className="text-gray-600">DAP features and functionality coming soon...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
        </Protected>
    )
}

export default Dap
