import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    console.log("DEBUG: Middleware checking path", request.nextUrl.pathname)

    // if (request.nextUrl.pathname.startsWith('/auth')) {
    //     return NextResponse.next()
    // }
    // return await updateSession(request)
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
