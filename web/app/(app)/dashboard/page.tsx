import { redirect } from 'next/navigation';

export default function Dashboard() {
    console.log("DEBUG: Dashboard root hit");
    // redirect('/dashboard/play');
    return (
        <div className="p-10 text-white">
            <h1 className="text-2xl text-red-500 font-bold mb-4">HIT DASHBOARD ROOT</h1>
            <p>The app fell back to /dashboard (root).</p>
            <div className="mt-4">
                <a href="/dashboard/547362530826125313/admin" className="text-cyan-400 hover:underline">
                    Manual Link: Go to Admin (Guild 547362530826125313)
                </a>
            </div>
        </div>
    );
}

