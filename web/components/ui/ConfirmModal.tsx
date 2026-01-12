'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmModal({
    isOpen,
    onOpenChange,
    title,
    description,
    onConfirm,
    onCancel,
    isDestructive = false,
    confirmText = "CONFIRM",
    cancelText = "CANCEL"
}: ConfirmModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) onCancel();
        }}>
            <DialogContent className={`sm:max-w-[425px] bg-black/90 backdrop-blur-xl text-white shadow-2xl border ${isDestructive ? 'border-orange-500/30' : 'border-cyan-500/30'}`}>
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${isDestructive ? 'text-orange-500' : 'text-cyan-400'} font-orbitron tracking-wide`}>
                        {isDestructive ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 font-mono text-xs pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-mono text-xs uppercase tracking-widest"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className={`${isDestructive
                            ? 'bg-orange-500/10 border-orange-500/50 text-orange-500 hover:bg-orange-500/20'
                            : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20'} 
                            border font-bold font-orbitron tracking-widest text-xs uppercase transition-all hover:scale-105`}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
