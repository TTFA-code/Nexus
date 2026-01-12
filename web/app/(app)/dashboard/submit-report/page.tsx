
import { MatchSubmissionForm } from '@/components/match/MatchSubmissionForm';

export default function MatchSubmissionPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
                    SUBMIT MATCH RESULT
                </h1>
                <p className="text-zinc-400">Report your match outcome manually.</p>
            </div>

            <MatchSubmissionForm />
        </div>
    );
}
