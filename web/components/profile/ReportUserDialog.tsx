'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { submitReport } from '@/actions/submitReport';
import { AlertTriangle, Loader2 } from 'lucide-react';
// import { useToast } from '@/components/ui/use-toast'; 

interface ReportUserDialogProps {
    reportedId: string;
    reportedName: string;
    guildId: string;
}

export function ReportUserDialog({ reportedId, reportedName, guildId }: ReportUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState<string>('');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // const { toast } = useToast();

    async function handleSubmit() {
        if (!reason) {
            alert('Please select a reason.');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('guildId', guildId);
            formData.append('reportedId', reportedId);
            formData.append('reason', reason);
            formData.append('details', details);

            const result = await submitReport(formData);

            if (result.success) {
                alert(result.message); // Fallback feedback
                // toast({
                //     title: "Report Transmitted",
                //     description: result.message,
                //     variant: "default", // or custom style
                // });
                setOpen(false);
                setReason('');
                setDetails('');
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to transmit report.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    className="p-2 rounded-full hover:bg-red-500/10 text-zinc-600 hover:text-red-500 transition-colors"
                    title="Report Player"
                >
                    <AlertTriangle size={16} />
                </button>
            </DialogTrigger>
            <DialogContent className="bg-black/95 border-red-500/20 text-white max-w-md backdrop-blur-3xl shadow-[0_0_50px_-12px_rgba(239,68,68,0.25)]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold font-orbitron text-red-500 tracking-wider flex items-center gap-2 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                        <AlertTriangle size={20} />
                        FILE OFFICIAL REPORT
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-zinc-400 text-sm border-l-2 border-red-500/50 pl-3">
                        You are flagging <span className="font-bold text-white tracking-wide">{reportedName}</span> for admin review.
                    </p>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Violation Type</Label>
                        <Select onValueChange={setReason} value={reason}>
                            <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:ring-red-500/20">
                                <SelectValue placeholder="Select Reason..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                <SelectItem value="Toxic Behavior">Toxic Behavior</SelectItem>
                                <SelectItem value="Cheating">Cheating</SelectItem>
                                <SelectItem value="Griefing/AFK">Griefing / AFK</SelectItem>
                                <SelectItem value="Offensive ID">Offensive ID</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-zinc-500">Incident Details</Label>
                        <Textarea
                            placeholder="Specific round or message..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="bg-zinc-900/50 border-zinc-800 min-h-[100px] text-zinc-200 focus:ring-red-500/20 resize-none"
                        />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold font-orbitron tracking-widest mt-4 shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)] hover:shadow-[0_0_30px_-5px_rgba(220,38,38,0.7)] transition-all"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                TRANSMITTING...
                            </>
                        ) : (
                            "TRANSMIT"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
