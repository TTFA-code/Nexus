
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trophy, X, Send, Loader2 } from 'lucide-react';

export function MatchSubmissionForm() {
    const [loading, setLoading] = useState(false);
    const [gameModes, setGameModes] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        game_mode_id: '',
        outcome: 'win',
        score: '',
        opponent_username: ''
    });

    const supabase = createClient();

    useEffect(() => {
        async function fetchGameModes() {
            const { data } = await supabase.from('game_modes').select('*, games(name)').eq('is_active', true);
            if (data) setGameModes(data);
        }
        fetchGameModes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/match-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to submit report');

            toast.success('Match Report Submitted!');
            setFormData({
                game_mode_id: '',
                outcome: 'win',
                score: '',
                opponent_username: ''
            }); // Reset form
        } catch (error) {
            console.error(error);
            toast.error('Submission Failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-cyan-500/30">
            <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-cyan-400" />
                    MATCH REPORTING
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    Submit match results manually. Upload screenshot evidence to the <span className="text-cyan-400 font-bold">#admin-logs</span> channel in Discord.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Game Mode</Label>
                        <Select
                            value={formData.game_mode_id}
                            onValueChange={(val) => setFormData({ ...formData, game_mode_id: val })}
                        >
                            <SelectTrigger className="bg-black/20 border-white/10 text-white">
                                <SelectValue placeholder="Select Game" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                {gameModes.map(mode => (
                                    <SelectItem key={mode.id} value={mode.id.toString()}>
                                        {mode.games?.name}: {mode.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Result</Label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, outcome: 'loss' })}
                                className={`p-3 rounded-lg border font-bold transition-all ${formData.outcome === 'loss'
                                    ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                    : 'bg-black/20 border-white/10 text-zinc-500 hover:bg-white/5'
                                    }`}
                            >
                                DEFEAT
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, outcome: 'win' })}
                                className={`p-3 rounded-lg border font-bold transition-all ${formData.outcome === 'win'
                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                                    : 'bg-black/20 border-white/10 text-zinc-500 hover:bg-white/5'
                                    }`}
                            >
                                VICTORY
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, outcome: 'draw' })}
                                className={`p-3 rounded-lg border font-bold transition-all ${formData.outcome === 'draw'
                                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                                    : 'bg-black/20 border-white/10 text-zinc-500 hover:bg-white/5'
                                    }`}
                            >
                                DRAW
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Final Score</Label>
                            <Input
                                placeholder="e.g. 2-1"
                                value={formData.score}
                                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                                className="bg-black/20 border-white/10 text-white font-mono placeholder:text-zinc-600"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Opponent</Label>
                            <Input
                                placeholder="Username"
                                value={formData.opponent_username}
                                onChange={(e) => setFormData({ ...formData, opponent_username: e.target.value })}
                                className="bg-black/20 border-white/10 text-white placeholder:text-zinc-600"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        SUBMIT REPORT
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
