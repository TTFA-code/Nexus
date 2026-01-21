"use client"

import { Switch } from "@/components/ui/switch"
import { createClient } from "@/utils/supabase/client"
import { useState } from "react"
import { toast } from "sonner"

interface QueueToggleProps {
    gameModeId: string
    initialIsActive: boolean | null
}

export function QueueToggle({ gameModeId, initialIsActive }: QueueToggleProps) {
    const [isActive, setIsActive] = useState(!!initialIsActive)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleToggle = async (checked: boolean) => {
        setIsLoading(true)
        // Optimistic update
        setIsActive(checked)

        const { error } = await supabase
            .from('game_modes')
            .update({ is_active: checked })
            .eq('id', gameModeId)

        if (error) {
            // Revert on error
            setIsActive(!checked)
            toast.error("Failed to update queue status")
            console.error(error)
        } else {
            toast.success(`Queue ${checked ? 'opened' : 'closed'}`)
        }
        setIsLoading(false)
    }

    return (
        <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={isLoading}
        />
    )
}
