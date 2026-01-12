import { IncidentReports } from "@/components/admin/IncidentReports"
import { getRecentReports } from "@/actions/getAdminIntel"

export default async function IntelPage({ params }: { params: Promise<{ guildId: string }> }) {
    const { guildId } = await params
    const reports = await getRecentReports(guildId)

    return (
        <div className="h-full p-4">
            <h1 className="text-2xl font-bold mb-6 text-white font-orbitron">SECTOR INTEL</h1>
            <IncidentReports reports={reports} guildId={guildId} />
        </div>
    )
}
