
import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeContext } from '../App';
import { THEMES } from '../types';
import { AreaChart } from 'recharts/es6/chart/AreaChart';
import { Area } from 'recharts/es6/cartesian/Area';
import { XAxis } from 'recharts/es6/cartesian/XAxis';
import { YAxis } from 'recharts/es6/cartesian/YAxis';
import { CartesianGrid } from 'recharts/es6/cartesian/CartesianGrid';
import { Tooltip } from 'recharts/es6/component/Tooltip';
import { ResponsiveContainer } from 'recharts/es6/component/ResponsiveContainer';
import { ChevronDown, Check } from 'lucide-react';

const data = [
    { name: 'Jun 24', this_month: 4000, last_month: 2400 },
    { name: 'Jun 25', this_month: 3000, last_month: 2200 },
    { name: 'Jun 26', this_month: 5000, last_month: 2290 },
    { name: 'Jun 27', this_month: 4200, last_month: 2000 },
    { name: 'Jun 28', this_month: 6100, last_month: 2180 },
    { name: 'Jun 29', this_month: 5800, last_month: 2300 },
    { name: 'Jun 30', this_month: 6900, last_month: 2100 },
];

const timeRanges = ['Last 3 months', 'Last 30 days', 'Last 7 days'];

export default function VisitorChart() {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const config = THEMES[theme];
    const [timeRange, setTimeRange] = useState('Last 3 months');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`
            p-6 rounded-xl border mb-6 relative overflow-visible transition-all duration-300
            ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}
        `}>
            {/* Header */}
            <div className="flex flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Total Visitors</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Total for the {timeRange.toLowerCase()}</p>
                </div>

                {/* Desktop View: Button Group */}
                <div className={`hidden sm:flex items-center p-1 rounded-lg border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                    {timeRanges.map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`
                                px-4 py-1.5 text-xs font-medium rounded-md shadow-sm border transition-all
                                ${timeRange === range
                                    ? (isDarkMode ? 'text-zinc-100 bg-zinc-800 border-zinc-700' : 'text-zinc-900 bg-white border-zinc-200')
                                    : (isDarkMode ? 'text-zinc-400 border-transparent hover:text-zinc-200' : 'text-zinc-500 border-transparent hover:text-zinc-900')}
                            `}
                        >
                            {range}
                        </button>
                    ))}
                </div>

                {/* Mobile View: Dropdown */}
                <div className="relative sm:hidden" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors
                            ${isDarkMode
                                ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-zinc-500'
                                : 'bg-white border-zinc-300 text-zinc-900 hover:border-zinc-400'}
                        `}
                    >
                        <span>{timeRange}</span>
                        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                        <div className={`
                            absolute right-0 top-full mt-2 w-40 rounded-lg border shadow-xl z-50 py-1 overflow-hidden
                            ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}
                        `}>
                            {timeRanges.map((range) => (
                                <button
                                    key={range}
                                    onClick={() => {
                                        setTimeRange(range);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors
                                        ${timeRange === range
                                            ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900')
                                            : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')}
                                    `}
                                >
                                    {range}
                                    {timeRange === range && <Check size={12} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div className="h-[350px] w-full min-h-[350px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            {/* Dynamic Theme Color Gradient */}
                            <linearGradient id="colorThisMonth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={config.primary} stopOpacity={isDarkMode ? 0.3 : 0.4} />
                                <stop offset="95%" stopColor={config.primary} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorLastMonth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={isDarkMode ? 0.3 : 0.4} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            vertical={true}
                            horizontal={false}
                            strokeDasharray="3 3"
                            stroke={isDarkMode ? '#27272a' : '#f4f4f5'}
                        />

                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDarkMode ? '#71717a' : '#a1a1aa', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDarkMode ? '#71717a' : '#a1a1aa', fontSize: 12 }}
                            tickFormatter={(value) => `₹${value / 1000}k`}
                            dx={-10}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                                borderColor: isDarkMode ? '#27272a' : '#e4e4e7',
                                borderRadius: '8px',
                                color: isDarkMode ? '#fff' : '#18181b',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ fontSize: '12px' }}
                            cursor={{ stroke: isDarkMode ? '#52525b' : '#d4d4d8', strokeWidth: 1 }}
                            labelStyle={{ marginBottom: '0.5rem', color: isDarkMode ? '#a1a1aa' : '#71717a' }}
                        />

                        {/* Comparison Line (Static Green or could be secondary) */}
                        <Area
                            type="monotone"
                            dataKey="last_month"
                            stroke="#22c55e"
                            fillOpacity={1}
                            fill="url(#colorLastMonth)"
                            strokeWidth={2}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#22c55e' }}
                            name="last_month"
                        />

                        {/* Primary Line (Dynamic Theme Color) */}
                        <Area
                            type="monotone"
                            dataKey="this_month"
                            stroke={config.primary}
                            fillOpacity={1}
                            fill="url(#colorThisMonth)"
                            strokeWidth={3}
                            activeDot={{ r: 6, strokeWidth: 0, fill: config.primary }}
                            name="this_month"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
