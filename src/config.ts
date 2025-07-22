// src/config.ts
const config = {
    API_BASE_URL: "https://continues-sussex-view-electric.trycloudflare.com/api",
    IMG_BASE_URL: "https://continues-sussex-view-electric.trycloudflare.com",
    WS_URL: "wss://continues-sussex-view-electric.trycloudflare.com/ws", // Add WebSocket URL
    menuItems: {
        buyer: [
            { label: 'All Gigs', path: '/' },
            { label: 'My Jobs', path: '/products' },
            { label: 'Contracts', path: '/orders' },
            { label: 'Finance', path: '/cart' },
            { label: 'Messeges', path: '/profile' }
        ],
        seller: [
            { label: 'Manage Gigs', path: '/seller/dashboard' },
            { label: 'Contracts', path: '/seller/products' },
            { label: 'Find Jobs', path: '/seller/orders' },
            { label: 'Messeges', path: '/seller/analytics' }
        ]
    }
};

export default config; 