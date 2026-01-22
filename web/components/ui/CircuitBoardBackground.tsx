import React from "react";

export const CircuitBoardBackground = () => {
    return (
        <div
            className="fixed inset-0 z-[-50] overflow-hidden"
            style={{
                backgroundColor: '#020205', // Cyber Black
            }}
        >
            {/* 1. Atmosphere - Deep Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950/40 via-transparent to-transparent" />

            {/* 2. The X-Grid Pattern (Robust CSS Gradient Version) */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(0, 243, 255, 0.1) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0, 243, 255, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    // Optional: Add X connectors if possible, or stick to clean grid for now
                }}
            />

            {/* 3. The Randomized Comet Beams */}
            {/* Horizontal Comets */}
            <div className="absolute top-[10%] left-0 h-[2px] w-32 animate-beam-h-fast opacity-0">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-[#00f3ff] to-white blur-[1px]"></div>
            </div>

            <div className="hidden md:block absolute top-[40%] left-0 h-[2px] w-48 animate-beam-h-slow opacity-0" style={{ animationDelay: '2s' }}>
                <div className="w-full h-full bg-gradient-to-r from-transparent via-[#bc13fe] to-white blur-[1px]"></div>
            </div>

            <div className="hidden md:block absolute top-[80%] left-0 h-[2px] w-64 animate-beam-h-slow opacity-0" style={{ animationDuration: '12s', animationDelay: '5s' }}>
                <div className="w-full h-full bg-gradient-to-r from-transparent via-[#ff00ff] to-white blur-[1px]"></div>
            </div>

            {/* Vertical Comets */}
            <div className="absolute left-[20%] top-0 w-[2px] h-32 animate-beam-v-fast opacity-0" style={{ animationDuration: '5s' }}>
                <div className="w-full h-full bg-gradient-to-b from-transparent via-[#00f3ff] to-white blur-[1px]"></div>
            </div>

            <div className="hidden md:block absolute left-[70%] top-0 w-[2px] h-56 animate-beam-v-slow opacity-0" style={{ animationDelay: '3s' }}>
                <div className="w-full h-full bg-gradient-to-b from-transparent via-[#bc13fe] to-white blur-[1px]"></div>
            </div>

            <div className="hidden md:block absolute left-[60%] top-0 w-[2px] h-24 animate-beam-v-fast opacity-0" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                <div className="w-full h-full bg-gradient-to-b from-transparent via-blue-400 to-white blur-[1px]"></div>
            </div>
        </div>
    );
};
