// Item Sale Summary - Extracted Component
import React, { useContext, memo, useState } from 'react';
import { ThemeContext } from '../../App';
import { Package, TrendingUp, Filter } from 'lucide-react';
import { SummaryCard, PDFHeader } from './shared';

interface ItemSaleSummaryProps {
    itemSaleSummaryData: Array<{
        id: string;
        productName: string;
        unit: string;
        quantity: number;
    }>;
    summaries: {
        totalItems?: number;
        totalQty?: number;
    };
}

function ItemSaleSummaryComponent({ itemSaleSummaryData, summaries }: ItemSaleSummaryProps) {
    const { isDarkMode } = useContext(ThemeContext);
    const [visibleCount, setVisibleCount] = useState(20);

    const visibleData = itemSaleSummaryData.slice(0, visibleCount);
    const hasMore = visibleCount < itemSaleSummaryData.length;

    return (
        <>
            <PDFHeader />
            <div className="grid grid-cols-2 gap-4">
                <SummaryCard label="Total Items" value={summaries.totalItems} subtext="Unique products sold" icon={<Package size={20} />} color="blue" size="small" />
                <SummaryCard label="Total Quantity" value={summaries.totalQty?.toLocaleString()} subtext="Total units sold" icon={<TrendingUp size={20} />} color="emerald" size="small" />
            </div>
            <div className={`rounded-xl border overflow-hidden flex-1 ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead><tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-zinc-800 text-zinc-500 bg-zinc-900/50' : 'border-zinc-100 text-zinc-500 bg-zinc-50'}`}><th className="py-3 px-4 font-semibold">Item Name</th><th className="py-3 px-4 font-semibold">Unit</th><th className="py-3 px-4 font-semibold text-right">Quantity</th></tr></thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                            {visibleData.map((row) => (<tr key={row.id} className={`group transition-colors ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-50/60'}`}><td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{row.productName}</td><td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.unit.toUpperCase()}</td><td className={`py-3 px-4 text-right font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{row.quantity}</td></tr>))}
                            {itemSaleSummaryData.length === 0 && <tr><td colSpan={3} className={`py-12 text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><div className="flex flex-col items-center gap-2"><Filter size={24} className="opacity-50" /><p>No data found.</p></div></td></tr>}
                        </tbody>
                    </table>
                </div>
                {hasMore && (
                    <div className={`px-4 py-3 border-t text-center ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                        <button
                            onClick={() => setVisibleCount(prev => prev + 20)}
                            className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        >
                            Show More ({itemSaleSummaryData.length - visibleCount} remaining)
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

export const ItemSaleSummary = memo(ItemSaleSummaryComponent);
export default ItemSaleSummary;
