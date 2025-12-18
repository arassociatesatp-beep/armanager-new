// Customer Category Report - Extracted Component
import React, { useContext, memo, useMemo, useState } from 'react';
import { ThemeContext } from '../../App';
import { Users, Filter } from 'lucide-react';
import { SummaryCard } from './shared';

interface CustomerCategoryReportProps {
    customerCategoryList: Array<{
        id: string;
        name: string;
        phone: string;
        category: string;
    }>;
    selectedCategory: string;
    summaries: {
        total?: number;
    };
    sales?: Array<{ customerId?: string; customer: string; date: string }>;
    payments?: Array<{ customerId?: string; customer: string; date: string }>;
}

function CustomerCategoryReportComponent({ customerCategoryList, selectedCategory, summaries, sales = [], payments = [] }: CustomerCategoryReportProps) {
    const { isDarkMode } = useContext(ThemeContext);
    const [visibleCount, setVisibleCount] = useState(20);

    // Calculate last transaction and status for each customer
    const customerData = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        return customerCategoryList.map(customer => {
            // Find all transactions for this customer
            const customerSales = sales.filter(s => s.customerId === customer.id || s.customer === customer.name);
            const customerPayments = payments.filter(p => p.customerId === customer.id || p.customer === customer.name);

            // Parse dates and find the most recent transaction
            const parseDate = (dateStr: string) => {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    if (parts[0].length === 4) {
                        return new Date(dateStr);
                    } else {
                        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    }
                }
                return new Date(0);
            };

            const allTxDates = [
                ...customerSales.map(s => parseDate(s.date)),
                ...customerPayments.map(p => parseDate(p.date))
            ].filter(d => d.getTime() > 0);

            let lastTxDate: Date | null = null;
            let lastTxText = 'No transactions';
            let isActive = false;

            if (allTxDates.length > 0) {
                lastTxDate = new Date(Math.max(...allTxDates.map(d => d.getTime())));
                const daysDiff = Math.floor((now.getTime() - lastTxDate.getTime()) / (24 * 60 * 60 * 1000));

                if (daysDiff === 0) {
                    lastTxText = 'Today';
                } else if (daysDiff === 1) {
                    lastTxText = 'Yesterday';
                } else {
                    lastTxText = `${daysDiff} days ago`;
                }

                isActive = lastTxDate >= thirtyDaysAgo;
            }

            return {
                ...customer,
                lastTxText,
                isActive
            };
        });
    }, [customerCategoryList, sales, payments]);

    return (
        <>
            <div className="grid grid-cols-1 gap-4">
                <SummaryCard
                    label={`Total ${selectedCategory} Customers`}
                    value={summaries.total}
                    subtext="Registered count"
                    icon={<Users size={20} />}
                    color="blue"
                    size="small"
                />
            </div>
            <div className={`rounded-xl border overflow-hidden flex-1 ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead><tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-zinc-800 text-zinc-500 bg-zinc-900/50' : 'border-zinc-100 text-zinc-500 bg-zinc-50'}`}>
                            <th className="py-3 px-4 font-semibold">Customer Name</th>
                            <th className="py-3 px-4 font-semibold">Phone</th>
                            <th className="py-3 px-4 font-semibold">Category</th>
                            <th className="py-3 px-4 font-semibold">Status</th>
                            <th className="py-3 px-4 font-semibold">Last Transaction</th>
                        </tr></thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                            {customerData.slice(0, visibleCount).map((row, idx) => (
                                <tr key={idx} className={`group transition-colors ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-50/60'}`}>
                                    <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{row.name}</td>
                                    <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.phone}</td>
                                    <td className={`py-3 px-4`}><span className={`px-2 py-0.5 text-[10px] rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400`}>{row.category}</span></td>
                                    <td className={`py-3 px-4`}>
                                        <span className={`px-2 py-0.5 text-[10px] rounded font-medium ${row.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                            {row.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className={`py-3 px-4 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{row.lastTxText}</td>
                                </tr>
                            ))}
                            {customerData.length === 0 && <tr><td colSpan={5} className={`py-12 text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><div className="flex flex-col items-center gap-2"><Filter size={24} className="opacity-50" /><p>No customers found.</p></div></td></tr>}
                        </tbody>
                    </table>
                </div>
                {visibleCount < customerData.length && (
                    <div className={`px-4 py-3 border-t text-center ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                        <button
                            onClick={() => setVisibleCount(prev => prev + 20)}
                            className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        >
                            Show More ({customerData.length - visibleCount} remaining)
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

export const CustomerCategoryReport = memo(CustomerCategoryReportComponent);
export default CustomerCategoryReport;

