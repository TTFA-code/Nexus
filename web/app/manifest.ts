import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'NEXUS',
        short_name: 'NEXUS',
        description: 'Competitive Discord Bot Dashboard',
        start_url: '/',
        display: 'standalone',
        background_color: '#020205',
        theme_color: '#00f3ff',
        icons: [
            {
                src: '/favicon.ico',
                sizes: '192x192',
                type: 'image/x-icon',
            },
            {
                src: '/favicon.ico',
                sizes: '512x512',
                type: 'image/x-icon',
            },
        ],
    }
}
