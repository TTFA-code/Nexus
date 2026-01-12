import { CommsDeck } from "@/components/admin/CommsDeck"
import { getGuildChannels } from "@/utils/discord/channels"

export default async function CommsPage({ params }: { params: Promise<{ guildId: string }> }) {
    const { guildId } = await params
    const channels = await getGuildChannels(guildId)

    return (
        <div className="h-full p-4">
            <h1 className="text-2xl font-bold mb-6 text-white font-orbitron">COMMS ARRAY</h1>
            <div className="max-w-4xl h-[600px]">
                <CommsDeck guildId={guildId} channels={channels} />
            </div>
        </div>
    )
}
