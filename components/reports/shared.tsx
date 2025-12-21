// Reports Types and Shared Utilities
import React, { createContext, useContext } from 'react';
import { ThemeContext } from '../../App';
import { THEMES } from '../../types';

// --- Summary Card Component ---
export function SummaryCard({ label, value, subtext, icon, color, size = 'normal', action }: any) {
    const { isDarkMode } = useContext(ThemeContext);

    const colors: Record<string, string> = {
        blue: isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600',
        violet: isDarkMode ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600',
        emerald: isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
        red: isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600',
    };

    const padding = size === 'small' ? 'p-3' : 'p-5';
    const valueSize = size === 'small' ? 'text-lg' : 'text-2xl';

    return (
        <div className={`${padding} rounded-xl border transition-all ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${colors[color] || colors.blue}`}>
                    {icon}
                </div>
                {action && <div>{action}</div>}
            </div>
            <div>
                <h3 className={`${valueSize} font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{value}</h3>
                <div className={`text-xs font-medium mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</div>
                <div className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>{subtext}</div>
            </div>
        </div>
    );
}

// --- Daily Table Component with Pagination ---
export function DailyTable({ title, columns, data, renderRow, initialRowCount = 20 }: any) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];
    const [visibleCount, setVisibleCount] = React.useState(initialRowCount);

    if (!data || data.length === 0) return null;

    const visibleData = data.slice(0, visibleCount);
    const hasMore = visibleCount < data.length;

    return (
        <div className={`rounded-xl border overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'}`}>
            <div className={`px-4 py-3 border-b text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'border-zinc-800 text-zinc-100 bg-zinc-900/30' : 'border-zinc-100 text-zinc-800 bg-zinc-50'}`}>
                <div className={`w-1 h-4 rounded-full ${themeConfig.twBg}`}></div>
                {title}
                <span className={`ml-auto text-xs font-normal px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>{data.length} records</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-zinc-800 text-zinc-500' : 'border-zinc-100 text-zinc-500'}`}>
                            {columns.map((col: string, i: number) => (
                                <th key={i} className={`py-3 px-4 font-medium ${i > 0 && (col.includes('Amount') || col.includes('Price') || col === 'Total') ? 'text-right' : ''}`}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                        {visibleData.map((item: any, idx: number) => renderRow(item, idx))}
                    </tbody>
                </table>
            </div>
            {hasMore && (
                <div className={`px-4 py-3 border-t text-center ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <button
                        onClick={() => setVisibleCount(prev => prev + 20)}
                        className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                    >
                        Show More ({data.length - visibleCount} remaining)
                    </button>
                </div>
            )}
        </div>
    )
}


// --- Format Currency Helper ---
export const formatCurrency = (val: number) => `₹${val?.toLocaleString('en-IN') || '0'}`;

// --- PDF Header Component ---
export function PDFHeader() {
    return (
        <div className="w-full bg-[#1e3a8a] text-white py-6 px-8 mb-6 rounded-t-xl print:rounded-none">
            <h1 className="text-3xl font-bold tracking-wide">A R ENTERPRISES</h1>
        </div>
    );
}

// --- Report Skeleton for Suspense ---
export function ReportSkeleton() {
    const { isDarkMode } = useContext(ThemeContext);

    return (
        <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-24 rounded-xl ${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-100'}`}></div>
                ))}
            </div>
            <div className={`h-96 rounded-xl ${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-100'}`}></div>
        </div>
    );
}
