'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { approveMatchAction } from '@/actions/adminActions'
import { Loader2, Check } from 'lucide-react'
import { toast } from 'sonner' // Assuming sonner or similar toast is installed, else alert

export function ApproveMatchButton({ matchId }: { matchId: string }) {
    const [isPending, startTransition] = useTransition()

    const handleApprove = () => {
        startTransition(async () => {
            const res = await approveMatchAction(matchId)

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Match approved. MMR updated.')
            }
        })
    }

    return (
        <Button
            onClick={handleApprove}
            disabled={isPending}
            variant="default" // Success variant if available, else default/emerald styled
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                </>
            ) : (
                <>
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                </>
            )}
        </Button>
    )
}
