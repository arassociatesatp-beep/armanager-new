
import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { ThemeContext, DataContext } from '../App';
import { THEMES } from '../types';
import { AreaChart } from 'recharts/es6/chart/AreaChart';
import { Area } from 'recharts/es6/cartesian/Area';
import { XAxis } from 'recharts/es6/cartesian/XAxis';
import { YAxis } from 'recharts/es6/cartesian/YAxis';
import { CartesianGrid } from 'recharts/es6/cartesian/CartesianGrid';
import { Tooltip } from 'recharts/es6/component/Tooltip';
import { ResponsiveContainer } from 'recharts/es6/component/ResponsiveContainer';
import { ChevronDown, Check } from 'lucide-react';

const timeRanges = ['Last 3 months', 'Last 30 days', 'Last 7 days'];

export default function VisitorChart() {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { sales, payments } = useContext(DataContext);
    const config = THEMES[theme];
    const [timeRange, setTimeRange] = useState('Last 7 days');
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

    // Calculate chart data based on time range and real sales/payments
    const chartData = useMemo(() => {
        const parseDate = (dateStr: string) => {
            const [d, m, y] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        const formatDateLabel = (date: Date) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}`;
        };

        // Determine date range based on selection
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let daysBack = 7;
        if (timeRange === 'Last 30 days') daysBack = 30;
        else if (timeRange === 'Last 3 months') daysBack = 90;

        // Calculate current and previous period start dates
        const currentPeriodStart = new Date(today);
        currentPeriodStart.setDate(currentPeriodStart.getDate() - daysBack + 1);

        const previousPeriodEnd = new Date(currentPeriodStart);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);

        const previousPeriodStart = new Date(previousPeriodEnd);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - daysBack + 1);

        // Group sales by date for current and previous periods
        const currentPeriodSales: Record<string, number> = {};
        const previousPeriodSales: Record<string, number> = {};

        // Initialize all dates in range
        for (let i = 0; i < daysBack; i++) {
            const currentDate = new Date(currentPeriodStart);
            currentDate.setDate(currentDate.getDate() + i);
            const dateKey = currentDate.toISOString().split('T')[0];
            currentPeriodSales[dateKey] = 0;

            const previousDate = new Date(previousPeriodStart);
            previousDate.setDate(previousDate.getDate() + i);
            const prevDateKey = previousDate.toISOString().split('T')[0];
            previousPeriodSales[prevDateKey] = 0;
        }

        // Aggregate sales data
        sales.forEach(sale => {
            const saleDate = parseDate(sale.date);
            const dateKey = saleDate.toISOString().split('T')[0];
            const amount = parseFloat(sale.amount.replace(/,/g, '')) || 0;

            if (saleDate >= currentPeriodStart && saleDate <= today) {
                currentPeriodSales[dateKey] = (currentPeriodSales[dateKey] || 0) + amount;
            } else if (saleDate >= previousPeriodStart && saleDate <= previousPeriodEnd) {
                previousPeriodSales[dateKey] = (previousPeriodSales[dateKey] || 0) + amount;
            }
        });

        // Convert to chart data format
        const currentKeys = Object.keys(currentPeriodSales).sort();
        const previousKeys = Object.keys(previousPeriodSales).sort();

        const data = currentKeys.map((dateKey, index) => {
            const currentDate = new Date(dateKey);
            const previousAmount = previousKeys[index] ? previousPeriodSales[previousKeys[index]] : 0;

            return {
                name: formatDateLabel(currentDate),
                current_period: currentPeriodSales[dateKey],
                previous_period: previousAmount
            };
        });

        // For "Last 3 months", group by week to reduce data points
        if (timeRange === 'Last 3 months' && data.length > 14) {
            const weeklyData: { name: string; current_period: number; previous_period: number }[] = [];
            for (let i = 0; i < data.length; i += 7) {
                const weekSlice = data.slice(i, i + 7);
                const weekTotal = weekSlice.reduce((sum, d) => sum + d.current_period, 0);
                const prevWeekTotal = weekSlice.reduce((sum, d) => sum + d.previous_period, 0);
                weeklyData.push({
                    name: weekSlice[0].name,
                    current_period: weekTotal,
                    previous_period: prevWeekTotal
                });
            }
            return weeklyData;
        }

        return data;
    }, [sales, timeRange]);

    // Calculate totals for display
    const totals = useMemo(() => {
        const currentTotal = chartData.reduce((sum, d) => sum + d.current_period, 0);
        const previousTotal = chartData.reduce((sum, d) => sum + d.previous_period, 0);
        const percentChange = previousTotal > 0
            ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1)
            : currentTotal > 0 ? '100' : '0';
        return { currentTotal, previousTotal, percentChange };
    }, [chartData]);

    return (
        <div className={`
            p-6 rounded-xl border mb-6 relative overflow-visible transition-all duration-300
            ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}
        `}>
            {/* Header */}
            <div className="flex flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Sales Overview</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        ₹{totals.currentTotal.toLocaleString()} total •
                        <span className={Number(totals.percentChange) >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                            {' '}{Number(totals.percentChange) >= 0 ? '+' : ''}{totals.percentChange}%
                        </span> vs previous period
                    </p>
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
                        data={chartData}
                        margin={{
                            top: 10,
                            right: 10,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            {/* Dynamic Theme Color Gradient */}
                            <linearGradient id="colorCurrentPeriod" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={config.primary} stopOpacity={isDarkMode ? 0.3 : 0.4} />
                                <stop offset="95%" stopColor={config.primary} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorPreviousPeriod" x1="0" y1="0" x2="0" y2="1">
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
                            tickFormatter={(value) => value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`}
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
                            formatter={(value: number, name: string) => [
                                `₹${value.toLocaleString()}`,
                                name === 'current_period' ? 'Current Period' : 'Previous Period'
                            ]}
                        />

                        {/* Previous Period Line (Green) */}
                        <Area
                            type="monotone"
                            dataKey="previous_period"
                            stroke="#22c55e"
                            fillOpacity={1}
                            fill="url(#colorPreviousPeriod)"
                            strokeWidth={2}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#22c55e' }}
                            name="previous_period"
                        />

                        {/* Current Period Line (Theme Color) */}
                        <Area
                            type="monotone"
                            dataKey="current_period"
                            stroke={config.primary}
                            fillOpacity={1}
                            fill="url(#colorCurrentPeriod)"
                            strokeWidth={3}
                            activeDot={{ r: 6, strokeWidth: 0, fill: config.primary }}
                            name="current_period"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
