import RoleBasedDashboard from "@/components/RoleBasedDashboard"
import Protected from "@/hooks/useProtected"

function Dashboard() {

    return(
        <Protected>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
            <div className="w-full px-6">
                <RoleBasedDashboard />
            </div>
        </div>
        </Protected>
    )
}

export default Dashboard
