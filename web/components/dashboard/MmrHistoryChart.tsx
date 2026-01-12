"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface MmrHistoryChartProps {
    data: { date: string; mmr: number }[]
}

export function MmrHistoryChart({ data }: MmrHistoryChartProps) {
    return (
        <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorMmr" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ccff00" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ccff00" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="date"
                        hide
                    />
                    <YAxis
                        hide
                        domain={['dataMin - 50', 'dataMax + 50']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#121214',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#ccff00' }}
                        cursor={{ stroke: '#ccff00', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="mmr"
                        stroke="#ccff00"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorMmr)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
