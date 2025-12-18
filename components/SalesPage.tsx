
import React, { useContext, useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { ThemeContext, DataContext } from '../App';
import { THEMES, SalesTransaction, PaymentTransaction } from '../types';
import { AreaChart } from 'recharts/es6/chart/AreaChart';
import { Area } from 'recharts/es6/cartesian/Area';
import { XAxis } from 'recharts/es6/cartesian/XAxis';
import { YAxis } from 'recharts/es6/cartesian/YAxis';
import { CartesianGrid } from 'recharts/es6/cartesian/CartesianGrid';
import { Tooltip } from 'recharts/es6/component/Tooltip';
import { ResponsiveContainer } from 'recharts/es6/component/ResponsiveContainer';
import { Plus, Search, Pencil, Trash2, FileText, X, ChevronDown, Calendar, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';
import { VirtualizedList } from './VirtualizedList';
import { CustomCalendar, CustomDropdown } from './shared';



type TransactionItem = SalesTransaction | PaymentTransaction;

// Products are now fetched from the DataContext instead of being hardcoded

export default function SalesPage() {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const { sales, payments, customers, addSale, updateSale, deleteSale, addPayment, updatePayment, deletePayment, addGlobalTransaction, dataLoading } = useContext(DataContext);
    const themeConfig = THEMES[theme];
    const [activeTab, setActiveTab] = useState('All Time');
    const [activeSection, setActiveSection] = useState('Recent Sales');
    const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);

    const [isAddSaleModalOpen, setIsAddSaleModalOpen] = useState(false);
    const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingDelete, setPendingDelete] = useState<{ id: number, type: 'Sale' | 'Payment' } | null>(null);

    // Edit State
    const [editingItem, setEditingItem] = useState<any>(null);

    const formatDate = (date: Date | null) => {
        if (!date) return "dd-mm-yyyy";
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const parseDate = (dateStr: string) => {
        const [d, m, y] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const visiblePayments = useMemo(() => payments.filter(p => !p.isGandhi), [payments]);

    const chartData = useMemo(() => {
        const totals: Record<string, number> = {};
        sales.forEach((sale) => {
            const amount = parseFloat(sale.amount.replace(/,/g, '')) || 0;
            totals[sale.date] = (totals[sale.date] || 0) + amount;
        });
        return Object.entries(totals)
            .map(([date, total]) => ({ date, total }))
            .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
    }, [sales]);

    const toggleNote = (id: number) => {
        setExpandedNoteId(prev => prev === id ? null : id);
    };

    // --- CRUD Handlers ---

    const handleConfirmDelete = () => {
        if (!pendingDelete) return;
        if (pendingDelete.type === 'Sale') {
            deleteSale(pendingDelete.id);
        } else {
            deletePayment(pendingDelete.id);
        }
        setPendingDelete(null);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        if (activeSection === 'Recent Sales') {
            setIsAddSaleModalOpen(true);
        } else {
            setIsRecordPaymentModalOpen(true);
        }
    };

    const handleAddSale = (saleData: any) => {
        const totalAmount = (parseFloat(saleData.quantity) * parseFloat(saleData.price)).toLocaleString();

        // Find customer ID from customers list for stable linking
        const customerObj = customers.find((c: any) => c.name === saleData.customer);
        const customerId = customerObj?.id || editingItem?.customerId;

        const newSale: SalesTransaction & { _docId?: string } = {
            id: editingItem ? editingItem.id : Date.now(),
            customerId,
            customer: saleData.customer,
            product: `${saleData.productType || 'Product'} • ${saleData.quantity} ${saleData.quantityUnit}`,
            date: saleData.date ? formatDate(saleData.date) : formatDate(new Date()),
            amount: totalAmount,
            pricePerBag: parseFloat(saleData.price).toFixed(2),
            purchasePrice: parseFloat(saleData.originalPrice || '0').toFixed(2),
            type: 'Sale',
            note: saleData.notes,
            ...(editingItem?._docId && { _docId: editingItem._docId }) // Only include _docId when editing
        };

        if (editingItem) {
            updateSale(newSale);
        } else {
            addSale(newSale);
        }

        setIsAddSaleModalOpen(false);
        setEditingItem(null);
    };

    const handleRecordPayment = (paymentData: any) => {
        const dateStr = paymentData.date ? formatDate(paymentData.date) : formatDate(new Date());

        const accountId = paymentData.accountId ? parseInt(paymentData.accountId) : undefined;
        const accountName = paymentData.accountName || 'Unknown Account';
        // Find customer ID from customers list for stable linking
        const customerObj = customers.find((c: any) => c.name === paymentData.customer);
        const customerId = customerObj?.id || editingItem?.customerId;

        const newPayment: PaymentTransaction & { _docId?: string } = {
            id: editingItem ? editingItem.id : Date.now(),
            customerId,
            customer: paymentData.customer,
            method: accountName,
            date: dateStr,
            amount: paymentData.amount,
            type: 'Payment',
            note: paymentData.notes,
            accountId,
            isGandhi: accountName === 'Gandhi Account',
            ...(editingItem?._docId && { _docId: editingItem._docId }) // Only include _docId when editing
        };

        if (editingItem) {
            updatePayment(newPayment);
        } else {
            addPayment(newPayment);
        }

        // --- ADD TO GLOBAL PAYMENTS CONTEXT ---
        // Only create globalTransaction for NEW payments, not edits
        if (!editingItem && accountId) {
            addGlobalTransaction({
                id: Date.now(),
                accountId,
                type: 'Credit',
                amount: paymentData.amount,
                date: dateStr,
                description: `Payment from ${paymentData.customer}`,
                category: 'Sales Payment',
                paymentId: newPayment.id  // Link to payment for deletion sync
            });
        }

        setIsRecordPaymentModalOpen(false);
        setEditingItem(null);
    };

    const handleCloseModal = () => {
        setIsAddSaleModalOpen(false);
        setIsRecordPaymentModalOpen(false);
        setEditingItem(null);
    };

    const filteredData = useMemo(() => {
        let data: TransactionItem[] = activeSection === 'Recent Sales' ? sales : visiblePayments;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            data = data.filter(item =>
                item.customer.toLowerCase().includes(query) ||
                (activeSection === 'Recent Sales' && 'product' in item && item.product.toLowerCase().includes(query)) ||
                (activeSection === 'Recent Payments' && 'method' in item && item.method.toLowerCase().includes(query))
            );
        }

        if (activeTab !== 'All Time') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            data = data.filter(item => {
                const itemDate = parseDate(item.date);

                switch (activeTab) {
                    case 'Today':
                        return itemDate.getTime() === today.getTime();
                    case 'Last 7 Days':
                        const sevenDaysAgo = new Date(today);
                        sevenDaysAgo.setDate(today.getDate() - 7);
                        return itemDate >= sevenDaysAgo && itemDate <= today;
                    case 'This Month':
                        return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
                    case 'Last 3 Months':
                        const threeMonthsAgo = new Date(today);
                        threeMonthsAgo.setMonth(today.getMonth() - 3);
                        return itemDate >= threeMonthsAgo;
                    default:
                        return true;
                }
            });
        }

        return data;
    }, [activeSection, sales, visiblePayments, searchQuery, activeTab]);

    const handleClearAll = () => {
        setSearchQuery('');
        setActiveTab('All Time');
    };

    // Show loading state while data is being fetched (placed AFTER all hooks)
    if (dataLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className={`h-8 w-32 rounded-lg animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                    <div className="flex gap-3">
                        <div className={`h-10 w-32 rounded-lg animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                        <div className={`h-10 w-28 rounded-lg animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                    </div>
                </div>
                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <div className={`h-4 w-32 rounded animate-pulse mb-6 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                    <div className={`h-[300px] rounded-lg animate-pulse ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
                </div>
                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: themeConfig.primary, borderTopColor: 'transparent' }} />
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Loading sales data...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Sales</h1>

                <div className="grid grid-cols-2 gap-3 w-full md:flex md:w-auto md:items-center">
                    <button
                        onClick={() => setIsRecordPaymentModalOpen(true)}
                        className={`
                            flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 w-full md:w-auto
                            ${isDarkMode
                                ? 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                                : 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50'}
                        `}
                    >
                        <Plus size={14} />
                        <span className="whitespace-nowrap">Record Payment</span>
                    </button>

                    <button
                        onClick={() => setIsAddSaleModalOpen(true)}
                        className={`
                            flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all shadow-sm active:scale-95 hover:opacity-90 w-full md:w-auto
                            ${themeConfig.twBg}
                        `}
                    >
                        <Plus size={14} />
                        <span className="whitespace-nowrap">Add Sale</span>
                    </button>
                </div>
            </div>

            <div className={`
                p-6 rounded-xl border transition-all duration-300
                ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}
            `}>
                <h2 className={`text-sm font-semibold mb-6 ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>Sales Overview</h2>

                <div className="h-[300px] w-full min-h-[300px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={themeConfig.primary} stopOpacity={isDarkMode ? 0.3 : 0.2} />
                                    <stop offset="95%" stopColor={themeConfig.primary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={true} horizontal={false} strokeDasharray="3 3" stroke={isDarkMode ? '#27272a' : '#f4f4f5'} strokeOpacity={0.5} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#71717a' : '#a1a1aa', fontSize: 10 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#71717a' : '#a1a1aa', fontSize: 10 }} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: isDarkMode ? '#18181b' : '#ffffff', borderColor: isDarkMode ? '#27272a' : '#e4e4e7', borderRadius: '8px', color: isDarkMode ? '#fff' : '#18181b' }}
                                itemStyle={{ fontSize: '12px', color: themeConfig.primary }}
                                labelStyle={{ marginBottom: '0.5rem', color: isDarkMode ? '#a1a1aa' : '#71717a', fontSize: '12px' }}
                                formatter={(value: number) => [`₹${value}`, 'Sales']}
                            />
                            <Area type="monotone" dataKey="total" stroke={themeConfig.primary} fill="url(#salesGradient)" strokeWidth={2} style={{ filter: `drop-shadow(0 0 6px ${themeConfig.primary})` }} activeDot={{ r: 6, strokeWidth: 0, fill: themeConfig.primary, style: { filter: `drop-shadow(0 0 8px ${themeConfig.primary})` } }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={`
                rounded-xl border overflow-hidden transition-colors mb-4
                ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}
            `}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <div className="flex items-center gap-6 text-sm flex-wrap pb-2 sm:pb-0">
                        {['Recent Sales', 'Recent Payments'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveSection(tab)}
                                className={`
                                    font-medium whitespace-nowrap transition-colors relative py-1
                                    ${activeSection === tab
                                        ? (isDarkMode ? 'text-white' : 'text-zinc-900')
                                        : (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700')}
                                `}
                            >
                                {tab}
                                {activeSection === tab && (
                                    <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${themeConfig.twBg} -mb-4 sm:-mb-[17px]`}></span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className={`flex items-center p-1 rounded-lg border w-full sm:w-auto overflow-x-auto scrollbar-hide whitespace-nowrap ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                        {['All Time', 'Today', 'Last 7 Days', 'This Month', 'Last 3 Months'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveTab(filter)}
                                className={`
                                    px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md whitespace-nowrap transition-all
                                    ${activeTab === filter ? (isDarkMode ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm') : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900')}
                                `}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by customer or location"
                                className={`
                                    w-full pl-9 pr-4 py-2 rounded-lg text-xs border outline-none transition-all
                                    ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'}
                                `}
                            />
                        </div>
                        <button onClick={handleClearAll} className={`text-xs font-medium transition-colors whitespace-nowrap ${isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}>Clear All</button>
                    </div>
                </div>
            </div>

            {filteredData.length > 0 ? (
                <VirtualizedList<TransactionItem>
                    items={filteredData}
                    estimatedItemHeight={expandedNoteId ? 180 : 90}
                    containerHeight="calc(100vh - 320px)"
                    columns={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
                    gap={12}
                    overscan={5}
                    renderItem={(item: TransactionItem) => {
                        const isExpanded = expandedNoteId === item.id;
                        return (
                            <div
                                className={`
                                    flex flex-col h-full p-0 rounded-xl border transition-all duration-200 group
                                    ${isDarkMode ? 'bg-[#09090b] border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300'}
                                `}
                                style={{ borderLeftWidth: '4px', borderLeftColor: themeConfig.primary }}
                            >
                                <div className="flex flex-row items-center justify-between p-3 md:p-4 w-full">
                                    <div className="flex gap-3 items-center flex-1 min-w-0">
                                        <div className={`shrink-0 px-2 py-1 rounded text-[10px] font-medium ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
                                            {item.type}
                                        </div>
                                        <div className="min-w-0">
                                            <div className={`text-sm font-medium truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>
                                                <span className="hidden sm:inline">{activeSection === 'Recent Sales' ? 'Sale to ' : 'Payment from '}</span>
                                                <span className={isDarkMode ? 'text-white' : 'text-black font-semibold'}>{item.customer}</span>
                                            </div>
                                            <div className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                                {'product' in item ? item.product : item.method}
                                            </div>
                                            <div className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                {item.date}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-center gap-1 ml-2">
                                        <div className="text-right shrink-0">
                                            <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>+₹{item.amount}</div>
                                            {'rate' in item && <div className={`text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>₹{item.rate}/bag</div>}
                                        </div>

                                        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => toggleNote(item.id)} className={`p-1 rounded transition-colors ${isExpanded ? (isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800') : (isDarkMode ? 'text-zinc-500 hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-100')}`} title="Notes">
                                                <FileText size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                                                title="Edit"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                onClick={() => setPendingDelete({ id: item.id, type: item.type })}
                                                className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
                                                title="Delete"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
                                        <div className={`p-3 rounded-lg text-xs border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                                            <div className={`font-medium mb-2 flex items-center gap-2 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                                <FileText size={12} />
                                                <span>Notes</span>
                                            </div>
                                            <textarea className={`w-full bg-transparent outline-none resize-none h-16 ${isDarkMode ? 'text-zinc-400 placeholder:text-zinc-600' : 'text-zinc-600 placeholder:text-zinc-400'}`} placeholder="Add a note..." defaultValue={item.note || ""} />
                                            <div className="flex justify-end mt-2">
                                                <button className={`px-3 py-1 rounded text-[10px] font-medium transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>Save Note</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }}
                />
            ) : (
                <div className={`p-8 text-center rounded-xl border ${isDarkMode ? 'bg-[#09090b] border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400'}`}>
                    <p>No transactions found matching your filters.</p>
                </div>
            )}

            {isAddSaleModalOpen && (
                <AddSaleModal onClose={handleCloseModal} onAddSale={handleAddSale} initialData={editingItem} />
            )}

            {isRecordPaymentModalOpen && (
                <RecordPaymentModal onClose={handleCloseModal} onRecordPayment={handleRecordPayment} initialData={editingItem} />
            )}

            <DeleteConfirmModal
                open={!!pendingDelete}
                title="Delete transaction?"
                description={pendingDelete?.type === 'Sale' ? 'This sale will be removed permanently.' : 'This payment will be removed permanently.'}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}

// Export modals for reuse
export function AddSaleModal({ onClose, onAddSale, initialData, preselectedCustomer }: { onClose: () => void, onAddSale: (data: any) => void, initialData?: any, preselectedCustomer?: string }) {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { customers, products } = useContext(DataContext);
    const themeConfig = THEMES[theme];

    // Get product names from database
    const productOptions = useMemo(() => products?.map((p: any) => p.name) || [], [products]);
    const [selectedCustomer, setSelectedCustomer] = useState(preselectedCustomer || '');
    const [selectedProductType, setSelectedProductType] = useState('');
    const [quantity, setQuantity] = useState('');
    const [quantityUnit, setQuantityUnit] = useState('bags');
    const [price, setPrice] = useState('');
    const [originalPrice, setOriginalPrice] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    const customerOptions = useMemo(() => {
        const names = customers?.map((c: any) => c.name) || [];
        return [...new Set(names)];
    }, [customers]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) { if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false); }
        document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (initialData) {
            setSelectedCustomer(initialData.customer);
            const productParts = initialData.product.split(' • ');
            if (productParts.length > 0) setSelectedProductType(productParts[0]);
            if (productParts.length > 1) {
                const qtyParts = productParts[1].split(' ');
                setQuantity(qtyParts[0]);
                setQuantityUnit(qtyParts[1] || 'bags');
            }
            setPrice(initialData.pricePerBag || '');
            setOriginalPrice(initialData.purchasePrice || '');
            setNotes(initialData.note || '');
            if (initialData.date) {
                const [d, m, y] = initialData.date.split('-').map(Number);
                setSelectedDate(new Date(y, m - 1, d));
            }
        } else if (preselectedCustomer) {
            setSelectedCustomer(preselectedCustomer);
        }
    }, [initialData, preselectedCustomer]);

    const handleSubmit = () => {
        if (!selectedCustomer || !selectedProductType || !quantity || !price || !originalPrice) return;
        onAddSale({ customer: selectedCustomer, productType: selectedProductType, quantity, quantityUnit, price, originalPrice, date: selectedDate, notes });
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "dd-mm-yyyy";
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-xl border shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
                    <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{initialData ? 'Edit Sale' : 'Add New Sale'}</h2>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}><X size={18} /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Customer</label>
                        {preselectedCustomer ? (
                            <input
                                type="text"
                                value={selectedCustomer}
                                disabled
                                className={`w-full px-3 py-2 rounded-lg border text-xs outline-none bg-zinc-100 border-zinc-200 text-zinc-500 cursor-not-allowed ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : ''}`}
                            />
                        ) : (
                            <CustomDropdown options={customerOptions} value={selectedCustomer} onChange={setSelectedCustomer} placeholder="Select customer" searchable />
                        )}
                    </div>
                    <div className="space-y-1.5"><label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Product Type</label><CustomDropdown options={productOptions} value={selectedProductType} onChange={setSelectedProductType} placeholder="Select product type" searchable /></div>
                    <div className="space-y-1.5"><label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Quantity</label><div className="flex gap-2"><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Enter quantity" className={`flex-1 px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`} /><CustomDropdown options={['bags', 'kg', 'm3', 'tons']} value={quantityUnit} onChange={setQuantityUnit} className="w-24" /></div></div>
                    <div className="space-y-1.5"><label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Price per {quantityUnit} (₹)</label><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter price" className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`} /></div>
                    <div className="space-y-1.5"><label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Purchase Price (₹)</label><input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="Enter purchase price" className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`} /></div>
                    <div className="space-y-1.5 relative" ref={calendarRef}><label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Date</label><button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between transition-all outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'} ${isCalendarOpen ? 'ring-2 ring-zinc-500/20 border-transparent' : ''}`}><span className={!selectedDate ? (isDarkMode ? 'text-zinc-500' : 'text-zinc-400') : ''}>{formatDate(selectedDate)}</span><Calendar size={14} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} /></button>{isCalendarOpen && (<div className="absolute bottom-full mb-2 left-0 z-50 animate-in fade-in zoom-in-95 duration-100"><CustomCalendar value={selectedDate} onChange={(d) => setSelectedDate(d)} onClose={() => setIsCalendarOpen(false)} /></div>)}</div>
                    <div className="space-y-1.5"><label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Notes (Optional)</label><input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter sale notes..." className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`} /></div>
                </div>
                <div className="p-4 border-t dark:border-zinc-800"><button onClick={handleSubmit} className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 ${themeConfig.twBg}`}>{initialData ? 'Update Sale' : 'Add Sale'}</button></div>
            </div>
        </div>
    );
}

export function RecordPaymentModal({ onClose, onRecordPayment, initialData, preselectedCustomer }: { onClose: () => void, onRecordPayment: (data: any) => void, initialData?: any, preselectedCustomer?: string }) {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { accounts, customers } = useContext(DataContext);
    const themeConfig = THEMES[theme];
    const [selectedCustomer, setSelectedCustomer] = useState(preselectedCustomer || '');
    const [amount, setAmount] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [notes, setNotes] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => { function handleClickOutside(event: MouseEvent) { if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false); } document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);

    useEffect(() => {
        if (initialData) {
            setSelectedCustomer(initialData.customer);
            setAmount(initialData.amount.replace(/,/g, ''));
            setNotes(initialData.note || '');
            // In a real app, we'd try to match the method name to an account ID
            if (initialData.date) {
                const [d, m, y] = initialData.date.split('-').map(Number);
                setSelectedDate(new Date(y, m - 1, d));
            }
        } else if (preselectedCustomer) {
            setSelectedCustomer(preselectedCustomer);
        }
    }, [initialData, preselectedCustomer]);

    const handleSubmit = () => {
        if (!amount) return;
        // If editing, we might not change account, but for new payments we need one.
        // For simplicity in editing, we assume account is optional or just updating amount/date
        const account = accounts.find(a => a.id === parseInt(selectedAccountId));
        const accountName = account ? account.name : (initialData?.method || 'Unknown');

        onRecordPayment({ customer: selectedCustomer, amount, accountId: selectedAccountId, accountName, date: selectedDate, notes });
    };

    const formatDate = (date: Date | null) => { if (!date) return "dd-mm-yyyy"; const d = date.getDate().toString().padStart(2, '0'); const m = (date.getMonth() + 1).toString().padStart(2, '0'); const y = date.getFullYear(); return `${d}-${m}-${y}`; };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-xl border shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
                    <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{initialData ? 'Edit Payment' : 'Record Payment'}</h2>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}><X size={18} /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Select Customer</label>
                        {preselectedCustomer ? (
                            <input
                                type="text"
                                value={selectedCustomer}
                                disabled
                                className={`w-full px-3 py-2 rounded-lg border text-xs outline-none bg-zinc-100 border-zinc-200 text-zinc-500 cursor-not-allowed ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : ''}`}
                            />
                        ) : (
                            <CustomDropdown options={customers.map(c => c.name)} value={selectedCustomer} onChange={setSelectedCustomer} placeholder="Choose customer" searchable />
                        )}
                    </div>
                    <div className="space-y-1.5"><label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Payment Amount (₹)</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter payment amount" className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`} /></div>
                    <div className="space-y-1.5"><label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Deposit To Account</label><CustomDropdown options={accounts.map(a => ({ id: a.id, label: a.name }))} value={selectedAccountId} onChange={setSelectedAccountId} placeholder="Select account" /></div>
                    <div className="space-y-1.5 relative" ref={calendarRef}><label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Payment Date</label><button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between transition-all outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'} ${isCalendarOpen ? 'ring-2 ring-zinc-500/20 border-transparent' : ''}`}><span className={!selectedDate ? (isDarkMode ? 'text-zinc-500' : 'text-zinc-400') : ''}>{formatDate(selectedDate)}</span><Calendar size={14} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} /></button>{isCalendarOpen && (<div className="absolute bottom-full mb-2 left-0 z-50 animate-in fade-in zoom-in-95 duration-100"><CustomCalendar value={selectedDate} onChange={(d) => setSelectedDate(d)} onClose={() => setIsCalendarOpen(false)} /></div>)}</div>
                    <div className="space-y-1.5"><label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Notes (Optional)</label><input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter payment notes..." className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`} /></div>
                </div>
                <div className="p-4 border-t dark:border-zinc-800"><button onClick={handleSubmit} className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 ${themeConfig.twBg}`}>{initialData ? 'Update Payment' : 'Record Payment'}</button></div>
            </div>
        </div>
    );
}
