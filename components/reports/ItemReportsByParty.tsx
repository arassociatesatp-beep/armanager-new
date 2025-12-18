// Item Reports by Party - Extracted Component
import React, { useContext, memo, useState } from 'react';
import { ThemeContext } from '../../App';
import { THEMES } from '../../types';
import { Users, Package, TrendingUp, Filter } from 'lucide-react';
import { SummaryCard, formatCurrency } from './shared';

interface ItemReportsByPartyProps {
    itemReportsByPartyData: Array<{
        id: string;
        customer: string;
        productName: string;
        unit: string;
        quantity: number;
        amount: number;
    }>;
    summaries: {
        totalCustomers?: number;
        totalAmount?: number;
        totalQty?: number;
    };
}

function ItemReportsByPartyComponent({ itemReportsByPartyData, summaries }: ItemReportsByPartyProps) {
    const { isDarkMode } = useContext(ThemeContext);
    const [visibleCount, setVisibleCount] = useState(20);

    // Group by customer
    const grouped: Record<string, typeof itemReportsByPartyData> = {};
    itemReportsByPartyData.forEach(row => {
        if (!grouped[row.customer]) grouped[row.customer] = [];
        grouped[row.customer].push(row);
    });

    // Flatten for pagination
    const allRows = Object.keys(grouped).flatMap(customer =>
        grouped[customer].map((row, idx) => ({ ...row, showCustomer: idx === 0 }))
    );
    const visibleRows = allRows.slice(0, visibleCount);
    const hasMore = visibleCount < allRows.length;

    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                <SummaryCard label="Total Customers" value={summaries.totalCustomers} subtext="Active in selection" icon={<Users size={20} />} color="blue" size="small" />
                <SummaryCard label="Total Qty" value={summaries.totalQty?.toLocaleString()} subtext="Units sold" icon={<Package size={20} />} color="violet" size="small" />
            </div>
            <div className={`rounded-xl border overflow-hidden flex-1 ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead><tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-zinc-800 text-zinc-500 bg-zinc-900/50' : 'border-zinc-100 text-zinc-500 bg-zinc-50'}`}><th className="py-3 px-4 font-semibold">Customer</th><th className="py-3 px-4 font-semibold">Product</th><th className="py-3 px-4 font-semibold text-right">Sales Qty.</th></tr></thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                            {visibleRows.map((row, idx) => (
                                <tr key={`${row.id}_${idx}`} className={`group transition-colors ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-50/60'}`}>
                                    <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{row.showCustomer ? row.customer : ''}</td>
                                    <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.productName} <span className="text-[10px] ml-1 opacity-70">({row.unit})</span></td>
                                    <td className={`py-3 px-4 text-right font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{row.quantity}</td>
                                </tr>
                            ))}
                            {itemReportsByPartyData.length === 0 && <tr><td colSpan={3} className={`py-12 text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><div className="flex flex-col items-center gap-2"><Filter size={24} className="opacity-50" /><p>No data found.</p></div></td></tr>}
                        </tbody>
                    </table>
                </div>
                {hasMore && (
                    <div className={`px-4 py-3 border-t text-center ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                        <button
                            onClick={() => setVisibleCount(prev => prev + 20)}
                            className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        >
                            Show More ({allRows.length - visibleCount} remaining)
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

export const ItemReportsByParty = memo(ItemReportsByPartyComponent);
export default ItemReportsByParty;

