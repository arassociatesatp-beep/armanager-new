// Expenses Report - Extracted Component
import React, { useContext, memo } from 'react';
import { ThemeContext } from '../../App';
import { Receipt, ListChecks } from 'lucide-react';
import { SummaryCard, DailyTable, formatCurrency } from './shared';

interface ExpensesReportProps {
    expensesByCategory: Record<string, any[]>;
    summaries: {
        totalExpenses?: number;
        count?: number;
    };
}

function ExpensesReportComponent({ expensesByCategory, summaries }: ExpensesReportProps) {
    const { isDarkMode } = useContext(ThemeContext);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <SummaryCard label="Total Expenses" value={formatCurrency(summaries.totalExpenses as number)} subtext="Total outgoing amount" icon={<Receipt size={20} />} color="red" size="small" />
                <SummaryCard label="Transactions" value={summaries.count} subtext="Total expense records" icon={<ListChecks size={20} />} color="blue" size="small" />
            </div>

            {Object.keys(expensesByCategory).length > 0 ? (
                Object.entries(expensesByCategory).map(([category, items]) => (
                    <DailyTable
                        key={category}
                        title={`Expenses: ${category}`}
                        columns={['Date', 'Vendor', 'Amount', 'Note']}
                        data={items}
                        renderRow={(expense: any, idx: number) => (
                            <tr key={idx} className={`border-b last:border-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                                <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{expense.date}</td>
                                <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{expense.vendor}</td>
                                <td className={`py-3 px-4 font-medium text-red-500`}>-₹{expense.amount}</td>
                                <td className={`py-3 px-4 text-xs italic ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{expense.note || '-'}</td>
                            </tr>
                        )}
                    />
                ))
            ) : (
                <div className={`col-span-full p-8 text-center rounded-xl border border-dashed ${isDarkMode ? 'border-zinc-800 bg-zinc-900/20' : 'border-zinc-200 bg-zinc-50'}`}>
                    <p className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}>No expenses found for the selected period.</p>
                </div>
            )}
        </div>
    );
}

export const ExpensesReport = memo(ExpensesReportComponent);
export default ExpensesReport;
