'use client'

import Link from 'next/link'

export default function AuthErrorPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-8">
            <div className="max-w-md w-full bg-zinc-900 p-8 rounded-lg border border-zinc-800 text-center">
                <h1 className="text-3xl font-bold mb-6 text-red-500">Authentication Error</h1>
                <p className="text-zinc-400 mb-8">
                    There was an error signing you in. This usually happens if the login was cancelled or the session expired.
                </p>
                <Link
                    href="/login"
                    className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
                >
                    Back to Login
                </Link>
            </div>
        </div>
    )
}
