// Monthly Business Summary - Extracted Component
import React, { useContext, memo } from 'react';
import { ThemeContext } from '../../App';
import { Filter } from 'lucide-react';
import { formatCurrency } from './shared';

interface MonthlyBusinessSummaryProps {
    monthlySummaryData: Array<{
        monthKey: string;
        displayMonth: string;
        totalSales: number;
        totalCollections: number;
    }>;
    summaries: {
        totalSales?: number;
        totalCollections?: number;
        difference?: number;
    };
    dateRange: { from: string; to: string };
}

function MonthlyBusinessSummaryComponent({ monthlySummaryData, summaries, dateRange }: MonthlyBusinessSummaryProps) {
    const { isDarkMode } = useContext(ThemeContext);

    return (
        <>
            <div className={`w-full rounded-xl border p-4 sm:p-5 transition-all ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div><div className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Duration: {dateRange.from} - {dateRange.to}</div><div className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>Monthly Business Summary Report</div></div>
                    <div className="text-right space-y-1"><div className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}><span className="opacity-70 mr-2">Total Sales:</span> <span className="font-bold">{formatCurrency(summaries.totalSales as number)}</span></div><div className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}><span className="opacity-70 mr-2">Total Collections:</span> <span className={`font-bold ${summaries.totalCollections ? 'text-green-600 dark:text-green-400' : ''}`}>{formatCurrency(summaries.totalCollections as number)}</span></div><div className="text-base font-bold text-red-500 mt-2"><span className={`mr-2 text-sm font-normal opacity-80 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Difference:</span>{formatCurrency(summaries.difference as number)} {(summaries.difference as number) > 0 ? '(Outstanding)' : ''}</div></div>
                </div>
            </div>
            <div className={`rounded-xl border overflow-hidden flex-1 ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead><tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-zinc-800 text-zinc-500 bg-zinc-900/50' : 'border-zinc-100 text-zinc-500 bg-zinc-50'}`}><th className="py-3 px-4 font-bold text-zinc-600 dark:text-zinc-400">Month</th><th className="py-3 px-4 font-bold text-right text-zinc-600 dark:text-zinc-400">Total Sales (₹)</th><th className="py-3 px-4 font-bold text-right text-zinc-600 dark:text-zinc-400">Total Collections (₹)</th><th className="py-3 px-4 font-bold text-right text-zinc-600 dark:text-zinc-400">Difference (₹)</th></tr></thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                            {monthlySummaryData.map((row) => { const diff = row.totalSales - row.totalCollections; return (<tr key={row.monthKey} className={`group transition-colors ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-50/60'}`}><td className={`py-4 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{row.displayMonth}</td><td className={`py-4 px-4 text-right font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatCurrency(row.totalSales)}</td><td className={`py-4 px-4 text-right font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{formatCurrency(row.totalCollections)}</td><td className={`py-4 px-4 text-right font-bold ${diff > 0 ? 'text-red-500' : (isDarkMode ? 'text-zinc-400' : 'text-zinc-600')}`}>{formatCurrency(diff)} {diff > 0 ? '(Due)' : ''}</td></tr>); })}
                            {monthlySummaryData.length === 0 && <tr><td colSpan={4} className={`py-12 text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><div className="flex flex-col items-center gap-2"><Filter size={24} className="opacity-50" /><p>No data found.</p></div></td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export const MonthlyBusinessSummary = memo(MonthlyBusinessSummaryComponent);
export default MonthlyBusinessSummary;
