import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { ThemeContext, DataContext } from '../App';
import { THEMES } from '../types';
import { ChevronDown, ArrowUpDown, ArrowLeft, ChevronUp, Search, Plus, FileText, Pencil, Trash2, Check, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart } from 'recharts/es6/chart/LineChart';
import { Line } from 'recharts/es6/cartesian/Line';
import { XAxis } from 'recharts/es6/cartesian/XAxis';
import { YAxis } from 'recharts/es6/cartesian/YAxis';
import { CartesianGrid } from 'recharts/es6/cartesian/CartesianGrid';
import { Tooltip } from 'recharts/es6/component/Tooltip';
import { Legend } from 'recharts/es6/component/Legend';
import { ResponsiveContainer } from 'recharts/es6/component/ResponsiveContainer';
import { AddSaleModal, RecordPaymentModal } from './SalesPage';
import DeleteConfirmModal from './DeleteConfirmModal';
import { CustomCalendar, CustomDropdown } from './shared';

const BASE_CATEGORY_OPTIONS = ['Engineer', 'Contractor', 'Individual', 'Builder'];

export default function CustomerPage() {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const { customers, addCustomer, updateCustomer, dataLoading } = useContext(DataContext);
    const themeConfig = THEMES[theme];

    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);

    const [filterValue, setFilterValue] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
    const categoryFilterRef = useRef<HTMLDivElement>(null);
    // Increased items per page for grid view
    const itemsPerPage = 9;

    const categories = useMemo(() => {
        const cats = new Set(customers.map(c => c.category || 'Individual'));
        return ['All', ...Array.from(cats)];
    }, [customers]);

    // Dynamic category options for Add Customer modal - includes custom categories from existing customers
    const categoryOptions = useMemo(() => {
        const existingCategories = new Set(customers.map(c => c.category).filter(Boolean));
        const allCategories = new Set([...BASE_CATEGORY_OPTIONS, ...existingCategories]);
        return [...Array.from(allCategories), 'Custom'];
    }, [customers]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) { if (categoryFilterRef.current && !categoryFilterRef.current.contains(event.target as Node)) setIsCategoryFilterOpen(false); }
        document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Show loading state while data is being fetched (placed AFTER all hooks)
    if (dataLoading && !selectedCustomer) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className={`h-8 w-40 rounded-lg animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                    <div className={`h-10 w-36 rounded-lg animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                </div>
                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className={`p-4 rounded-xl border animate-pulse ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                <div className={`h-4 w-24 rounded mb-2 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                                <div className={`h-3 w-32 rounded mb-4 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                                <div className={`h-6 w-20 rounded ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: themeConfig.primary, borderTopColor: 'transparent' }} />
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Loading customers...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedCustomer) {
        return <CustomerDetails customer={selectedCustomer} onBack={() => setSelectedCustomer(null)} />;
    }

    const handleAddCustomer = (data: any) => {
        const registerDate = data.date || new Date();
        const registerDateString = `${String(registerDate.getDate()).padStart(2, '0')}-${String(registerDate.getMonth() + 1).padStart(2, '0')}-${registerDate.getFullYear()}`;

        const openingBalanceDate = data.openingBalanceDate || new Date();
        const openingBalanceDateString = `${String(openingBalanceDate.getDate()).padStart(2, '0')}-${String(openingBalanceDate.getMonth() + 1).padStart(2, '0')}-${openingBalanceDate.getFullYear()}`;

        const newCustomer = {
            id: editingCustomer ? editingCustomer.id : `ID_${Date.now()}`,
            name: data.name,
            phone: data.phone,
            registerDate: editingCustomer ? editingCustomer.registerDate : registerDateString,
            email: `${data.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            openingBalance: data.openingBalance || "0",
            openingBalanceDate: editingCustomer ? (data.openingBalanceDate ? openingBalanceDateString : editingCustomer.openingBalanceDate || editingCustomer.registerDate) : openingBalanceDateString,
            category: data.category
        };

        if (editingCustomer) {
            updateCustomer(newCustomer);
        } else {
            addCustomer(newCustomer);
        }
        setIsAddCustomerModalOpen(false);
        setEditingCustomer(null);
    };

    const filteredData = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(filterValue.toLowerCase()) || c.phone.includes(filterValue);
        const matchesCategory = filterCategory === 'All' || c.category === filterCategory;
        return matchesSearch && matchesCategory;
    });
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="w-full space-y-4 animate-in fade-in duration-500 pb-20 md:pb-0">
            <div className="flex items-center justify-between">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Customers</h1>
                <button onClick={() => setIsAddCustomerModalOpen(true)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 shadow-sm ${themeConfig.twBg}`}><Plus size={16} /> Add Customer</button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-row items-center justify-between gap-2">
                <div className="relative">
                    <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                    <input placeholder="Search..." value={filterValue} onChange={(e) => { setFilterValue(e.target.value); setCurrentPage(1); }} className={`w-40 md:w-64 pl-9 pr-3 py-1.5 rounded-md border text-xs outline-none transition-colors ${isDarkMode ? 'bg-[#09090b] border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-700' : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-300'}`} />
                </div>

                <div className="relative w-auto" ref={categoryFilterRef}>
                    <button onClick={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)} className={`w-auto flex items-center justify-between gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap ${isDarkMode ? 'bg-[#09090b] border-zinc-800 text-zinc-200 hover:bg-zinc-900' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}><span>{filterCategory === 'All' ? 'Category' : filterCategory}</span><ChevronDown size={12} className={`transition-transform ${isCategoryFilterOpen ? 'rotate-180' : ''}`} /></button>
                    {isCategoryFilterOpen && (<div className={`absolute right-0 top-full mt-2 w-40 rounded-lg border shadow-xl z-50 py-1 overflow-hidden ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>{categories.map((cat) => (<button key={cat} onClick={() => { setFilterCategory(cat); setIsCategoryFilterOpen(false); setCurrentPage(1); }} className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${filterCategory === cat ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900') : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')}`}>{cat}{filterCategory === cat && <Check size={12} />}</button>))}</div>)}
                </div>
            </div>

            {/* Cards List Grid - Replaces Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentData.length > 0 ? (
                    currentData.map((customer) => (
                        <div
                            key={customer.id}
                            onClick={() => setSelectedCustomer(customer)}
                            className={`
                    flex flex-col gap-1 p-4 rounded-xl border cursor-pointer transition-all duration-200 group
                    ${isDarkMode
                                    ? 'bg-[#09090b] border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                                    : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md'}
                `}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`text-sm font-semibold truncate pr-2 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                                    {customer.name}
                                </span>
                                <span className={`text-[10px] whitespace-nowrap ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                    {customer.registerDate}
                                </span>
                            </div>
                            <div className={`text-xs flex items-center ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                <span>{customer.phone}</span>
                                <span className="mx-1.5 opacity-50">·</span>
                                <span className="truncate">{customer.category || 'Individual'}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={`col-span-full h-24 flex items-center justify-center rounded-xl border border-dashed ${isDarkMode ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'}`}>
                        No results found.
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between space-x-2 py-4">
                <div className={`flex-1 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Total {filteredData.length} customers</div>
                <div className="space-x-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${isDarkMode ? 'bg-[#09090b] border-zinc-800 text-zinc-200 hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed'}`}>Previous</button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${isDarkMode ? 'bg-[#09090b] border-zinc-800 text-zinc-200 hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed'}`}>Next</button>
                </div>
            </div>

            {isAddCustomerModalOpen && <AddCustomerModal onClose={() => { setIsAddCustomerModalOpen(false); setEditingCustomer(null); }} onAdd={handleAddCustomer} initialData={editingCustomer} categoryOptions={categoryOptions} />}
        </div>
    );
}

function CustomerDetails({ customer, onBack }: { customer: any, onBack: () => void }) {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const { sales, payments, addSale, updateSale, deleteSale, addPayment, updatePayment, deletePayment, addGlobalTransaction, updateCustomer, settings } = useContext(DataContext);
    const themeConfig = THEMES[theme];
    const [isMetricsExpanded, setIsMetricsExpanded] = useState(true);
    const [activeSection, setActiveSection] = useState('Recent Sales');
    const [activeTab, setActiveTab] = useState('All Time');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);

    // Edit/Add States
    const [isAddSaleModalOpen, setIsAddSaleModalOpen] = useState(false);
    const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [pendingDelete, setPendingDelete] = useState<{ id: number, type: 'Sale' | 'Payment' } | null>(null);

    // Editable customer fields state
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(customer.name);
    const [isOpeningBalanceModalOpen, setIsOpeningBalanceModalOpen] = useState(false);

    // Local customer state to reflect changes immediately
    const [localCustomer, setLocalCustomer] = useState(customer);

    // Sync local state when customer prop changes
    useEffect(() => {
        setLocalCustomer(customer);
        setEditedName(customer.name);
    }, [customer]);

    const handleSaveName = () => {
        if (!editedName.trim()) return;
        const updatedCustomer = { ...localCustomer, name: editedName.trim() };
        updateCustomer(updatedCustomer);
        setLocalCustomer(updatedCustomer);
        setIsEditingName(false);
    };

    const handleSaveOpeningBalanceBoth = (amount: string, date: string) => {
        const updatedCustomer = { ...localCustomer, openingBalance: amount, openingBalanceDate: date };
        updateCustomer(updatedCustomer);
        setLocalCustomer(updatedCustomer);
        setIsOpeningBalanceModalOpen(false);
    };

    const visiblePayments = useMemo(() => payments, [payments]);

    // Calculate Real Metrics - filter by customerId with fallback to name for backward compatibility
    const metrics = useMemo(() => {
        const customerSales = sales.filter(s => s.customerId === localCustomer.id || s.customer === localCustomer.name);
        const customerPayments = visiblePayments.filter(p => p.customerId === localCustomer.id || p.customer === localCustomer.name);

        const totalSalesValue = customerSales.reduce((acc, curr) => acc + parseFloat(curr.amount.replace(/,/g, '')), 0);
        const totalPaymentsValue = customerPayments.reduce((acc, curr) => acc + parseFloat(curr.amount.replace(/,/g, '')), 0);
        const opening = parseFloat(localCustomer.openingBalance || '0');

        const currentBalance = opening + totalSalesValue - totalPaymentsValue;

        return {
            totalSalesValue,
            totalPaymentsValue,
            currentBalance,
            amountDue: currentBalance > 0 ? currentBalance : 0
        };
    }, [sales, visiblePayments, localCustomer]);

    const historyData = useMemo(() => {
        const monthly: Record<string, { sales: number; payments: number }> = {};
        const getMonthKey = (dateStr: string) => {
            const [d, m, y] = dateStr.split('-').map(Number);
            return `${y}-${String(m).padStart(2, '0')}`;
        };
        const ensureMonth = (key: string) => {
            if (!monthly[key]) monthly[key] = { sales: 0, payments: 0 };
        };

        sales.filter(s => s.customerId === localCustomer.id || s.customer === localCustomer.name).forEach(sale => {
            const amount = parseFloat(sale.amount.replace(/,/g, '')) || 0;
            const key = getMonthKey(sale.date);
            ensureMonth(key);
            monthly[key].sales += amount;
        });

        visiblePayments.filter(p => p.customerId === localCustomer.id || p.customer === localCustomer.name).forEach(payment => {
            const amount = parseFloat(payment.amount.replace(/,/g, '')) || 0;
            const key = getMonthKey(payment.date);
            ensureMonth(key);
            monthly[key].payments += amount;
        });

        return Object.entries(monthly)
            .map(([date, totals]) => ({ date, ...totals }))
            .sort((a, b) => new Date(a.date + '-01').getTime() - new Date(b.date + '-01').getTime());
    }, [sales, visiblePayments, localCustomer.name]);

    const toggleNote = (id: number) => setExpandedNoteId(prev => prev === id ? null : id);

    const handleDeleteTransaction = (id: number, type: string) => {
        setPendingDelete({ id, type: type === 'Sale' ? 'Sale' : 'Payment' });
    };

    const confirmDeleteTransaction = () => {
        if (!pendingDelete) return;
        if (pendingDelete.type === 'Sale') deleteSale(pendingDelete.id);
        else deletePayment(pendingDelete.id);
        setPendingDelete(null);
    };

    const handleEditTransaction = (item: any) => {
        setEditingTransaction(item);
        if (item.type === 'Sale') {
            setIsAddSaleModalOpen(true);
        } else {
            setIsRecordPaymentModalOpen(true);
        }
    };

    const handleSaveSale = (data: any) => {
        const dateStr = data.date ? formatDate(data.date) : formatDate(new Date());
        const totalAmount = (parseFloat(data.quantity) * parseFloat(data.price)).toLocaleString();

        const newSale = {
            id: editingTransaction ? editingTransaction.id : Date.now(),
            customerId: customer.id, // Always use customer.id for stable linking
            customer: customer.name,
            product: `${data.productType || 'Product'} • ${data.quantity} ${data.quantityUnit}`,
            amount: totalAmount,
            pricePerBag: parseFloat(data.price).toFixed(2),
            purchasePrice: parseFloat(data.originalPrice || '0').toFixed(2),
            date: dateStr,
            type: 'Sale' as const,
            note: data.notes
        };

        if (editingTransaction) {
            updateSale(newSale);
        } else {
            addSale(newSale);
        }
        setIsAddSaleModalOpen(false);
        setEditingTransaction(null);
    };

    const handleSavePayment = (data: any) => {
        const dateStr = data.date ? formatDate(data.date) : formatDate(new Date());

        const accountId = data.accountId ? parseInt(data.accountId) : undefined;
        const accountName = data.accountName || 'Unknown Account';
        const newPayment = {
            id: editingTransaction ? editingTransaction.id : Date.now(),
            customerId: customer.id, // Always use customer.id for stable linking
            customer: customer.name,
            method: accountName,
            amount: data.amount,
            date: dateStr,
            type: 'Payment' as const,
            note: data.notes,
            accountId
        };

        if (editingTransaction) {
            updatePayment(newPayment);
        } else {
            addPayment(newPayment);
        }

        if (!editingTransaction && accountId) {
            addGlobalTransaction({
                id: Date.now(),
                accountId,
                type: 'Credit',
                amount: data.amount,
                date: dateStr,
                description: `Payment from ${customer.name}`,
                category: 'Sales Payment',
                paymentId: newPayment.id  // Link to payment for deletion sync
            });
        }

        setIsRecordPaymentModalOpen(false);
        setEditingTransaction(null);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "dd-mm-yyyy";
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const parseDate = (dateStr: string) => { const [d, m, y] = dateStr.split('-').map(Number); return new Date(y, m - 1, d); };

    const customerTransactions = useMemo(() => {
        const customerSales = sales.filter(s => s.customerId === localCustomer.id || s.customer === localCustomer.name);
        const customerPayments = visiblePayments.filter(p => p.customerId === localCustomer.id || p.customer === localCustomer.name);
        return [...customerSales, ...customerPayments];
    }, [sales, visiblePayments, localCustomer.id, localCustomer.name]);

    const filteredTransactions = useMemo(() => {
        let data = customerTransactions.filter(t => activeSection === 'Recent Sales' ? t.type === 'Sale' : t.type === 'Payment');

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            data = data.filter(t =>
                (t.type === 'Sale' && t.product && t.product.toLowerCase().includes(query)) ||
                (t.type === 'Payment' && t.method && t.method.toLowerCase().includes(query))
            );
        }

        if (activeTab !== 'All Time') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            data = data.filter(item => {
                const itemDate = parseDate(item.date);
                switch (activeTab) {
                    case 'Today': return itemDate.getTime() === today.getTime();
                    case 'Last 7 Days': const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7); return itemDate >= sevenDaysAgo && itemDate <= today;
                    case 'This Month': return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
                    case 'Last 3 Months': const threeMonthsAgo = new Date(today); threeMonthsAgo.setMonth(today.getMonth() - 3); return itemDate >= threeMonthsAgo;
                    default: return true;
                }
            });
        }
        return data;
    }, [activeSection, activeTab, searchQuery, customerTransactions]);

    const handleClearAll = () => { setSearchQuery(''); setActiveTab('All Time'); };

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6 pb-20 md:pb-0">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800' : 'bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200'}`}><ArrowLeft size={14} />Back</button>
                {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className={`text-base md:text-2xl font-bold px-2 py-1 rounded-lg border outline-none ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'}`}
                            autoFocus
                        />
                        <button onClick={handleSaveName} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}><Check size={14} /></button>
                        <button onClick={() => { setIsEditingName(false); setEditedName(localCustomer.name); }} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-600'}`}><X size={14} /></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group">
                        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{localCustomer.name}'s Details</h1>
                        <button onClick={() => setIsEditingName(true)} className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600'}`}><Pencil size={14} /></button>
                    </div>
                )}
            </div>

            <div className="flex gap-3 mb-4">
                <button
                    onClick={() => setIsRecordPaymentModalOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95 ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'}`}
                >
                    <Plus size={16} /> Record Payment
                </button>
                <button
                    onClick={() => setIsAddSaleModalOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 shadow-sm active:scale-95 ${themeConfig.twBg}`}
                >
                    <Plus size={16} /> Add Sale
                </button>
            </div>

            <div className={`rounded-xl border transition-all ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <button onClick={() => setIsMetricsExpanded(!isMetricsExpanded)} className="w-full flex items-center justify-between p-4 focus:outline-none"><h2 className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>Key Financial Metrics</h2><div className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}><ChevronDown size={18} className={`transition-transform duration-300 ${isMetricsExpanded ? 'rotate-180' : ''}`} /></div></button>
                {isMetricsExpanded && (
                    <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-3 gap-3 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className={`p-3 md:p-4 rounded-lg border transition-all duration-300 relative overflow-hidden group ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`} style={{ borderColor: isDarkMode ? undefined : themeConfig.primary }}>
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${themeConfig.twBg}`} />
                            <div className="flex items-center justify-between relative z-10">
                                <div className={`text-lg md:text-2xl font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>₹{localCustomer.openingBalance || "0.00"}</div>
                                <button onClick={() => setIsOpeningBalanceModalOpen(true)} className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600'}`}><Pencil size={12} /></button>
                            </div>
                            <div className={`text-xs font-medium mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Opening Balance</div>
                            <div className="flex items-center gap-1">
                                <div className="text-[10px] text-zinc-500 leading-tight">as of {localCustomer.openingBalanceDate || localCustomer.registerDate}</div>
                                <button onClick={() => setIsOpeningBalanceModalOpen(true)} className={`p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600'}`}><Pencil size={10} /></button>
                            </div>
                        </div>
                        <div className={`p-3 md:p-4 rounded-lg border transition-all duration-300 relative overflow-hidden group ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${metrics.currentBalance > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            <div className={`text-lg md:text-2xl font-bold leading-tight ${metrics.currentBalance > 0 ? 'text-red-500' : (metrics.currentBalance < 0 ? 'text-emerald-500' : (isDarkMode ? 'text-white' : 'text-black'))}`}>
                                {metrics.currentBalance > 0 ? '-' : (metrics.currentBalance < 0 ? '+' : '')}₹{Math.abs(metrics.currentBalance).toLocaleString()}
                            </div>
                            <div className={`text-xs font-medium mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Current Balance</div>
                            <div className="text-[10px] text-zinc-500 leading-tight">{metrics.currentBalance > 0 ? 'Outstanding amount' : (metrics.currentBalance < 0 ? 'Advance paid' : 'Settled')}</div>
                        </div>
                        <div className={`p-3 md:p-4 rounded-lg border transition-all duration-300 relative overflow-hidden group ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-red-500`} />
                            <div className="text-lg md:text-2xl font-bold leading-tight text-red-500">₹{metrics.amountDue.toLocaleString()}</div>
                            <div className={`text-xs font-medium mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Amount Due</div>
                            <div className="text-[10px] text-zinc-500 leading-tight">Payable immediately</div>
                        </div>
                        <div className={`p-3 md:p-4 rounded-lg border transition-all duration-300 relative overflow-hidden group ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                            <div className={`text-lg md:text-2xl font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>₹{metrics.totalSalesValue.toLocaleString()}</div>
                            <div className={`text-xs font-medium mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Total Sales Value</div>
                            <div className="text-[10px] text-zinc-500 leading-tight">All time</div>
                        </div>
                        <div className={`p-3 md:p-4 rounded-lg border transition-all duration-300 relative overflow-hidden group ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                            <div className={`text-lg md:text-2xl font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>₹{metrics.totalPaymentsValue.toLocaleString()}</div>
                            <div className={`text-xs font-medium mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Total Payments</div>
                            <div className="text-[10px] text-zinc-500 leading-tight">All time</div>
                        </div>
                    </div>
                )}
            </div>
            <div className={`rounded-xl border p-6 ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <h2 className={`text-sm font-semibold mb-6 ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>Sales vs Payments History</h2>
                <div className="h-[300px] w-full min-h-[300px] min-w-0"><ResponsiveContainer width="100%" height="100%"><LineChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}><CartesianGrid vertical={true} horizontal={false} strokeDasharray="3 3" stroke={isDarkMode ? '#27272a' : '#f4f4f5'} /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#71717a' : '#a1a1aa', fontSize: 10 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#71717a' : '#a1a1aa', fontSize: 10 }} tickFormatter={(val) => `₹${val}`} /><Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#18181b' : '#ffffff', borderColor: isDarkMode ? '#27272a' : '#e4e4e7', borderRadius: '8px', color: isDarkMode ? '#fff' : '#18181b', }} itemStyle={{ fontSize: '12px' }} /><Legend wrapperStyle={{ paddingTop: '20px' }} /><Line type="monotone" dataKey="sales" stroke={themeConfig.primary} strokeWidth={2} dot={false} activeDot={{ r: 6, fill: themeConfig.primary }} name="Total Sales" style={{ filter: `drop-shadow(0 0 6px ${themeConfig.primary})` }} /><Line type="monotone" dataKey="payments" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#10b981' }} name="Total Payments" style={{ filter: `drop-shadow(0 0 6px #10b981)` }} /></LineChart></ResponsiveContainer></div>
            </div>
            <div className={`rounded-xl border overflow-hidden transition-colors mb-4 ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}><div className="flex items-center gap-6 text-sm flex-wrap pb-2 sm:pb-0">{['Recent Sales', 'Recent Payments'].map((tab) => (<button key={tab} onClick={() => setActiveSection(tab)} className={`font-medium whitespace-nowrap transition-colors relative py-1 ${activeSection === tab ? (isDarkMode ? 'text-white' : 'text-zinc-900') : (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700')}`}>{tab}{activeSection === tab && (<span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${themeConfig.twBg} -mb-4 sm:-mb-[17px]`}></span>)}</button>))}</div></div>
                <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className={`flex items-center p-1 rounded-lg border w-full sm:w-auto overflow-x-auto scrollbar-hide whitespace-nowrap ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                        {['All Time', 'Today', 'Last 7 Days', 'This Month', 'Last 3 Months'].map((filter) => (
                            <button key={filter} onClick={() => setActiveTab(filter)} className={`px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all ${activeTab === filter ? (isDarkMode ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm') : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900')}`}>
                                {filter}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto"><div className="relative flex-1 sm:w-64"><Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search transactions..." className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs border outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'}`} /></div><button onClick={handleClearAll} className={`text-xs font-medium transition-colors whitespace-nowrap ${isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}>Clear All</button></div>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((item: any) => {
                        const isExpanded = expandedNoteId === item.id;
                        return (
                            <div key={item.id} className={`flex flex-col p-0 rounded-xl border transition-all duration-200 group ${isDarkMode ? 'bg-[#09090b] border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300'}`} style={{ borderLeftWidth: '4px', borderLeftColor: themeConfig.primary }}>
                                <div className="flex flex-row items-center justify-between p-3 md:p-4 w-full"><div className="flex gap-3 items-center flex-1 min-w-0"><div className={`shrink-0 px-2 py-1 rounded text-[10px] font-medium ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>{item.type}</div><div className="min-w-0"><div className={`text-sm font-medium truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{activeSection === 'Recent Sales' ? item.product : item.method}</div><div className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>{item.date}</div></div></div><div className="flex flex-col items-end justify-center gap-1 ml-2"><div className="text-right shrink-0"><div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>+₹{item.amount}</div></div><div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><button onClick={() => toggleNote(item.id)} className={`p-1 rounded transition-colors ${isExpanded ? (isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800') : (isDarkMode ? 'text-zinc-500 hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-100')}`}><FileText size={12} /></button>
                                    <button onClick={() => handleEditTransaction(item)} className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><Pencil size={12} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(item.id, item.type); }} className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><Trash2 size={12} /></button>
                                </div></div></div>
                                {isExpanded && (<div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in duration-200"><div className={`p-3 rounded-lg text-xs border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}><div className={`font-medium mb-2 flex items-center gap-2 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}><FileText size={12} /><span>Notes</span></div><textarea className={`w-full bg-transparent outline-none resize-none h-16 ${isDarkMode ? 'text-zinc-400 placeholder:text-zinc-600' : 'text-zinc-600 placeholder:text-zinc-400'}`} placeholder="Add a note..." defaultValue={item.note || ""} /><div className="flex justify-end mt-2"><button className={`px-3 py-1 rounded text-[10px] font-medium transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>Save Note</button></div></div></div>)}
                            </div>
                        );
                    })
                ) : (<div className={`p-8 text-center rounded-xl border ${isDarkMode ? 'bg-[#09090b] border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400'}`}><p>No transactions found.</p></div>)}
            </div>

            <DeleteConfirmModal
                open={!!pendingDelete}
                title="Delete transaction?"
                description={pendingDelete?.type === 'Sale' ? 'This sale will be deleted permanently.' : 'This payment will be deleted permanently.'}
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDeleteTransaction}
            />

            {/* Modals for Editing */}
            {isAddSaleModalOpen && (
                <AddSaleModal
                    onClose={() => { setIsAddSaleModalOpen(false); setEditingTransaction(null); }}
                    onAddSale={handleSaveSale}
                    initialData={editingTransaction}
                    preselectedCustomer={localCustomer.name}
                />
            )}
            {isRecordPaymentModalOpen && (
                <RecordPaymentModal
                    onClose={() => { setIsRecordPaymentModalOpen(false); setEditingTransaction(null); }}
                    onRecordPayment={handleSavePayment}
                    initialData={editingTransaction}
                    preselectedCustomer={localCustomer.name}
                />
            )}
            {isOpeningBalanceModalOpen && (
                <EditOpeningBalanceModal
                    openingBalance={localCustomer.openingBalance || '0'}
                    openingBalanceDate={localCustomer.openingBalanceDate || localCustomer.registerDate}
                    onSave={handleSaveOpeningBalanceBoth}
                    onClose={() => setIsOpeningBalanceModalOpen(false)}
                />
            )}
        </div>
    );
}

function AddCustomerModal({ onClose, onAdd, initialData, categoryOptions }: { onClose: () => void, onAdd: (data: any) => void, initialData?: any, categoryOptions?: string[] }) {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];

    // Use provided categoryOptions or fallback to base options
    const options = categoryOptions || [...BASE_CATEGORY_OPTIONS, 'Custom'];

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [category, setCategory] = useState('Individual');
    const [customCategory, setCustomCategory] = useState('');
    const [openingBalance, setOpeningBalance] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [openingBalanceDate, setOpeningBalanceDate] = useState<Date | null>(new Date());

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isOBDateCalendarOpen, setIsOBDateCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);
    const obDateCalendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false);
            if (obDateCalendarRef.current && !obDateCalendarRef.current.contains(event.target as Node)) setIsOBDateCalendarOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setPhone(initialData.phone);
            const incomingCategory = initialData.category || 'Individual';
            if (!options.includes(incomingCategory) && incomingCategory !== 'Custom') {
                setCategory('Custom');
                setCustomCategory(incomingCategory);
            } else {
                setCategory(incomingCategory);
                setCustomCategory(incomingCategory === 'Custom' ? incomingCategory : '');
            }
            setOpeningBalance(initialData.openingBalance);
            if (initialData.openingBalanceDate) {
                const [obd, obm, oby] = initialData.openingBalanceDate.split('-').map(Number);
                setOpeningBalanceDate(new Date(oby, obm - 1, obd));
            } else if (initialData.registerDate) {
                const [d, m, y] = initialData.registerDate.split('-').map(Number);
                setOpeningBalanceDate(new Date(y, m - 1, d));
            }
            if (initialData.registerDate) {
                const [d, m, y] = initialData.registerDate.split('-').map(Number);
                setDate(new Date(y, m - 1, d));
            }
        }
    }, [initialData]);

    const ensureIndiaPrefix = (value: string) => {
        if (value.startsWith('+91')) return value;
        if (value.startsWith('91')) return `+${value}`;
        if (!value.trim()) return '+91 ';
        return `+91 ${value.replace(/^\+?91\s?/, '')}`;
    };

    const handleSubmit = () => {
        const finalCategory = category === 'Custom' ? customCategory.trim() : category;
        if (!name || !phone || !finalCategory) return;
        onAdd({ name, phone, category: finalCategory, openingBalance, date, openingBalanceDate });
    };

    const handleCategoryChange = (value: string) => {
        setCategory(value);
        if (value !== 'Custom') {
            setCustomCategory('');
        }
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
                    <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{initialData ? 'Edit Customer' : 'Add Customer'}</h2>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'} focus:ring-2 focus:ring-zinc-500/20`} />
                    </div>
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(ensureIndiaPrefix(e.target.value))}
                            onFocus={() => { if (!phone) setPhone('+91 '); }}
                            placeholder="+91 98765 43210"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'} focus:ring-2 focus:ring-zinc-500/20`}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Category</label>
                        <CustomDropdown options={options} value={category} onChange={handleCategoryChange} placeholder="Select Category" />
                        {category === 'Custom' && (
                            <input
                                type="text"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="Enter new category"
                                className={`w-full px-3 py-2 rounded-lg border text-xs outline-none mt-2 ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'} focus:ring-2 focus:ring-zinc-500/20`}
                            />
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Opening Balance (Optional)</label>
                        <input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="0.00" className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'} focus:ring-2 focus:ring-zinc-500/20`} />
                    </div>
                    <div className="space-y-1.5 relative" ref={obDateCalendarRef}>
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Opening Balance Date</label>
                        <button onClick={() => setIsOBDateCalendarOpen(!isOBDateCalendarOpen)} className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'}`}>
                            <span>{formatDate(openingBalanceDate)}</span>
                            <Calendar size={14} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />
                        </button>
                        {isOBDateCalendarOpen && (
                            <div className="absolute bottom-full mb-2 left-0 z-50">
                                <CustomCalendar value={openingBalanceDate} onChange={(d) => { setOpeningBalanceDate(d); setIsOBDateCalendarOpen(false); }} onClose={() => setIsOBDateCalendarOpen(false)} />
                            </div>
                        )}
                    </div>
                    <div className="space-y-1.5 relative" ref={calendarRef}>
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Register Date</label>
                        <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'}`}>
                            <span>{formatDate(date)}</span>
                            <Calendar size={14} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />
                        </button>
                        {isCalendarOpen && (
                            <div className="absolute bottom-full mb-2 left-0 z-50">
                                <CustomCalendar value={date} onChange={(d) => { setDate(d); setIsCalendarOpen(false); }} onClose={() => setIsCalendarOpen(false)} />
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 border-t dark:border-zinc-800">
                    <button onClick={handleSubmit} className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 ${themeConfig.twBg}`}>
                        {initialData ? 'Update Customer' : 'Add Customer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Modal for editing both opening balance amount and date
function EditOpeningBalanceModal({
    openingBalance,
    openingBalanceDate,
    onSave,
    onClose
}: {
    openingBalance: string,
    openingBalanceDate: string,
    onSave: (amount: string, date: string) => void,
    onClose: () => void
}) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];
    const [amount, setAmount] = useState(openingBalance || '0');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    const parseDate = (dateStr: string): Date => {
        const [d, m, y] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const formatDate = (date: Date): string => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const [date, setDate] = useState<Date>(parseDate(openingBalanceDate));

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsCalendarOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSave = () => {
        onSave(amount, formatDate(date));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={`relative w-full max-w-sm rounded-xl border shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
                    <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Edit Opening Balance</h2>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Opening Balance Amount (₹)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'} focus:ring-2 focus:ring-zinc-500/20`}
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1.5 relative" ref={calendarRef}>
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Opening Balance Date</label>
                        <button
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className={`w-full px-3 py-2 rounded-lg border text-sm text-left flex items-center justify-between outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'}`}
                        >
                            <span>{formatDate(date)}</span>
                            <Calendar size={14} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />
                        </button>
                        {isCalendarOpen && (
                            <div className="absolute bottom-full mb-2 left-0 z-50">
                                <CustomCalendar
                                    value={date}
                                    onChange={(d) => { if (d) { setDate(d); setIsCalendarOpen(false); } }}
                                    onClose={() => setIsCalendarOpen(false)}
                                />
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 border-t dark:border-zinc-800 flex gap-3">
                    <button onClick={onClose} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${isDarkMode ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}>Cancel</button>
                    <button onClick={handleSave} className={`flex-1 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 ${themeConfig.twBg}`}>Save Changes</button>
                </div>
            </div>
        </div>
    );
}