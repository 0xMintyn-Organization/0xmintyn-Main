import RoleBasedDashboard from "@/components/RoleBasedDashboard"
import Protected from "@/hooks/useProtected"

function Dashboard() {
    return (
        <Protected>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <RoleBasedDashboard />
                </div>
            </div>
        </Protected>
    )
}

export default Dashboard
