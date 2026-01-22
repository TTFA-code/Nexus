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
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
