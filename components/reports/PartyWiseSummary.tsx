// Party Wise Summary - Extracted Component
import React, { useContext, memo, useState } from 'react';
import { ThemeContext } from '../../App';
import { TrendingUp, FileText, Users, Filter } from 'lucide-react';
import { SummaryCard, formatCurrency, PDFHeader } from './shared';

interface PartyWiseSummaryProps {
    partySummaryData: Array<{
        customerName: string;
        category: string;
        totalSales: number;
        totalPayments: number;
        balance: number;
        status: string;
        lastTransactionStr: string;
        daysSince: number;
    }>;
    summaries: {
        totalSales?: number;
        totalPayments?: number;
        totalBalance?: number;
    };
}

function PartyWiseSummaryComponent({ partySummaryData, summaries }: PartyWiseSummaryProps) {
    const { isDarkMode } = useContext(ThemeContext);
    const [visibleCount, setVisibleCount] = useState(20);

    const visibleData = partySummaryData.slice(0, visibleCount);
    const hasMore = visibleCount < partySummaryData.length;

    return (
        <>
            <PDFHeader />
            <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Total Sales" value={formatCurrency(summaries.totalSales as number)} subtext="Across all parties" icon={<TrendingUp size={20} />} color="blue" size="small" />
                <SummaryCard label="Total Payments" value={formatCurrency(summaries.totalPayments as number)} subtext="Total collected" icon={<FileText size={20} />} color="violet" size="small" />
                <SummaryCard label="Net Balance" value={formatCurrency(summaries.totalBalance as number)} subtext="Total Outstanding" icon={<Users size={20} />} color="emerald" size="small" />
            </div>
            <div className={`rounded-xl border overflow-hidden flex-1 ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead><tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-zinc-800 text-zinc-500 bg-zinc-900/50' : 'border-zinc-100 text-zinc-500 bg-zinc-50'}`}>
                            <th className="py-3 px-4 font-semibold">Customer Name</th>
                            <th className="py-3 px-4 font-semibold">Category</th>
                            <th className="py-3 px-4 font-semibold text-right">Total Sales (₹)</th>
                            <th className="py-3 px-4 font-semibold text-right">Total Payments (₹)</th>
                            <th className="py-3 px-4 font-semibold text-right">Balance (₹)</th>
                            <th className="py-3 px-4 font-semibold text-center">Status</th>
                            <th className="py-3 px-4 font-semibold text-right">Last Txn</th>
                            <th className="py-3 px-4 font-semibold text-right">Days Since</th>
                        </tr></thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                            {visibleData.map((row, idx) => (
                                <tr key={idx} className={`group transition-colors ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-50/60'}`}>
                                    <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{row.customerName}</td>
                                    <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}><span className={`px-2 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800`}>{row.category}</span></td>
                                    <td className={`py-3 px-4 text-right font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatCurrency(row.totalSales)}</td>
                                    <td className={`py-3 px-4 text-right font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{formatCurrency(row.totalPayments)}</td>
                                    <td className={`py-3 px-4 text-right font-bold ${row.balance > 0 ? 'text-red-500' : (row.balance < 0 ? 'text-emerald-500' : (isDarkMode ? 'text-zinc-400' : 'text-zinc-600'))}`}>{formatCurrency(row.balance)}</td>
                                    <td className={`py-3 px-4 text-center text-xs`}>
                                        <span className={`px-2 py-1 rounded-full font-medium ${row.status === 'Due' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' : (row.status === 'Advance' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400')}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className={`py-3 px-4 text-right text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.lastTransactionStr}</td>
                                    <td className={`py-3 px-4 text-right text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.daysSince}</td>
                                </tr>
                            ))}
                            {partySummaryData.length === 0 && <tr><td colSpan={8} className={`py-12 text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><div className="flex flex-col items-center gap-2"><Filter size={24} className="opacity-50" /><p>No data found.</p></div></td></tr>}
                        </tbody>
                    </table>
                </div>
                {hasMore && (
                    <div className={`px-4 py-3 border-t text-center ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                        <button
                            onClick={() => setVisibleCount(prev => prev + 20)}
                            className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        >
                            Show More ({partySummaryData.length - visibleCount} remaining)
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

export const PartyWiseSummary = memo(PartyWiseSummaryComponent);
export default PartyWiseSummary;

