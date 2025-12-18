import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { ThemeContext, DataContext } from '../App';
import { THEMES, PurchaseTransaction, ExpenseTransaction } from '../types';
import { Plus, FileText, Pencil, Trash2, Search, Receipt, ChevronDown, X, Check, Calendar, AlertCircle, Info, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';
import { VirtualizedList } from './VirtualizedList';
import { CustomCalendar, CustomDropdown } from './shared';

const dateFilterOptions = ['All Time', 'Today', 'Last 7 Days', 'This Month', 'Last 3 Months', 'Custom'];
// Brands will be populated dynamically from products context
const initialExpenseCategories = ['All', 'Fuel', 'Hamali', 'Auto', 'Maintenance'];
const categories = ['Direct', 'GL', 'GV'];

// Products are now fetched from the DataContext instead of being hardcoded

const PURCHASE_TYPES = ['Direct', 'GL', 'GV'];
const QUANTITY_UNITS = ['bags', 'tons', 'kg', 'm3', 'buckets', 'pieces'];

export default function PurchasePage() {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const { settings, purchases, addPurchase, updatePurchase, deletePurchase, expenses, addExpense, updateExpense, deleteExpense, addGlobalTransaction, updateGlobalTransactionByExpenseId, deleteGlobalTransactionByExpenseId, updateAccountBalance, accounts, products, dataLoading } = useContext(DataContext);
    const themeConfig = THEMES[theme];

    // Show loading state while data is being fetched
    if (dataLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className={`h-8 w-40 rounded-lg animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                    <div className="flex gap-3">
                        <div className={`h-10 w-28 rounded-lg animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                        <div className={`h-10 w-28 rounded-lg animate-pulse ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                    </div>
                </div>
                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: themeConfig.primary, borderTopColor: 'transparent' }} />
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Loading purchases...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Filter States
    const [activeSection, setActiveSection] = useState('Recent Purchases');
    const [activeDateTab, setActiveDateTab] = useState('All Time');

    // Purchase Filters - Manual only, persisted in localStorage
    const [selectedBrand, setSelectedBrand] = useState('All');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [savedFilters, setSavedFilters] = useState<string[]>(() => {
        // Load saved filters from localStorage on mount
        const saved = localStorage.getItem('purchaseFilters');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedBrandToAdd, setSelectedBrandToAdd] = useState('');

    // Brands list = 'All' + manually saved filters (no auto-population from products)
    const brands = useMemo(() => {
        return ['All', ...savedFilters];
    }, [savedFilters]);

    // Save filters to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('purchaseFilters', JSON.stringify(savedFilters));
    }, [savedFilters]);

    // Expense Filters
    const [selectedExpenseCategory, setSelectedExpenseCategory] = useState('All');
    const [expenseFilterCategories, setExpenseFilterCategories] = useState(initialExpenseCategories);

    const [searchQuery, setSearchQuery] = useState('');
    const [pendingDelete, setPendingDelete] = useState<{ id: number, type: 'Purchase' | 'Expense' } | null>(null);

    // Custom Date Range State
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);

    // UI States
    const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Dropdown refs
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const dateDropdownRef = useRef<HTMLDivElement>(null);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    // Summary Card Date Pickers
    const [isFromDateOpen, setIsFromDateOpen] = useState(false);
    const [isToDateOpen, setIsToDateOpen] = useState(false);
    const fromDateRef = useRef<HTMLDivElement>(null);
    const toDateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) setIsDateDropdownOpen(false);
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) setIsCategoryDropdownOpen(false);
            if (fromDateRef.current && !fromDateRef.current.contains(event.target as Node)) setIsFromDateOpen(false);
            if (toDateRef.current && !toDateRef.current.contains(event.target as Node)) setIsToDateOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Effect to sync activeDateTab presets to fromDate/toDate
    useEffect(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (activeDateTab === 'All Time') {
            setFromDate(null);
            setToDate(null);
        } else if (activeDateTab === 'Today') {
            setFromDate(today);
            setToDate(today);
        } else if (activeDateTab === 'Last 7 Days') {
            const past = new Date(today);
            past.setDate(today.getDate() - 7);
            setFromDate(past);
            setToDate(today);
        } else if (activeDateTab === 'This Month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            setFromDate(firstDay);
            setToDate(today);
        } else if (activeDateTab === 'Last 3 Months') {
            const past = new Date(today);
            past.setMonth(today.getMonth() - 3);
            setFromDate(past);
            setToDate(today);
        }
    }, [activeDateTab]);

    const handleDateRangeChange = (type: 'from' | 'to', value: Date | null) => {
        if (type === 'from') {
            setFromDate(value);
            setIsFromDateOpen(false);
        } else {
            setToDate(value);
            setIsToDateOpen(false);
        }
        setActiveDateTab('Custom');
    };

    const toggleNote = (id: number) => {
        setExpandedNoteId(prev => prev === id ? null : id);
    };

    const handleConfirmDelete = () => {
        if (!pendingDelete) return;
        if (pendingDelete.type === 'Purchase') {
            deletePurchase(pendingDelete.id);
        } else {
            // For expenses, restore the balance and delete the linked globalTransaction
            const expenseToDelete = expenses.find((e: any) => e.id === pendingDelete.id);
            if (expenseToDelete && expenseToDelete.accountId && expenseToDelete.amount) {
                // Credit back the amount directly (positive value to add back)
                const amountToRestore = parseFloat(expenseToDelete.amount.toString().replace(/,/g, ''));
                updateAccountBalance(expenseToDelete.accountId, amountToRestore);
                // Delete the linked globalTransaction
                deleteGlobalTransactionByExpenseId(expenseToDelete.id);
            }
            deleteExpense(pendingDelete.id);
        }
        setPendingDelete(null);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        if (activeSection === 'Recent Purchases') {
            setIsPurchaseModalOpen(true);
        } else {
            setIsExpenseModalOpen(true);
        }
    };

    const handleAddCustomBrand = (brandName: string) => {
        if (brandName && !brands.includes(brandName)) {
            setSavedFilters(prev => [...prev, brandName]);
            setSelectedBrand(brandName);
        }
    };

    const handleRemoveBrand = (e: React.MouseEvent, brandToRemove: string) => {
        e.stopPropagation();
        // Remove from saved filters
        setSavedFilters(prev => prev.filter(b => b !== brandToRemove));
        if (selectedBrand === brandToRemove) {
            setSelectedBrand('All');
        }
    };

    // Available options = All products from context that aren't already in the filter list
    const productNames = useMemo(() => products?.map((p: any) => p.name) || [], [products]);
    const availableBrandOptions = useMemo(() => productNames.filter(p => !brands.includes(p)), [brands, productNames]);

    const handleAddBrandFromPicker = () => {
        if (!selectedBrandToAdd) return;
        handleAddCustomBrand(selectedBrandToAdd);
        setSelectedBrandToAdd('');
    };

    const handleSavePurchase = (data: any) => {
        const newItem: PurchaseTransaction & { _docId?: string } = {
            id: editingItem ? editingItem.id : Date.now(),
            vendor: 'Unknown Vendor', // Vendor logic simplified/removed as requested
            item: data.product,
            subCategory: data.subCategory,
            quantity: data.quantity,
            billedQuantity: data.billedQuantity || '0',
            unit: data.unit,
            date: data.date ? formatDate(data.date) : formatDate(new Date()),
            amount: '0',
            type: 'Purchase',
            note: data.note,
            vehicleNumber: data.vehicleNumber,
            ...(editingItem?._docId && { _docId: editingItem._docId }) // Only include _docId when editing
        };

        if (editingItem) {
            updatePurchase(newItem);
        } else {
            addPurchase(newItem);
        }
        setIsPurchaseModalOpen(false);
        setEditingItem(null);
    };

    const handleSaveExpense = (data: any) => {
        // If a new category was created (custom), add it to filters for next time
        if (data.item && !expenseFilterCategories.includes(data.item)) {
            setExpenseFilterCategories(prev => [...prev, data.item]);
        }

        const newItem: ExpenseTransaction & { _docId?: string } = {
            id: editingItem ? editingItem.id : (data.expenseId || Date.now()),
            vendor: data.vendor,
            item: data.item,
            date: data.date ? formatDate(data.date) : formatDate(new Date()),
            amount: data.amount,
            type: 'Expense',
            note: data.note,
            accountId: data.accountId, // Store which account was used
            ...(editingItem?._docId && { _docId: editingItem._docId })
        };

        if (editingItem) {
            // When editing: calculate the balance difference and apply it directly
            const oldAmount = parseFloat((editingItem.amount || '0').toString().replace(/,/g, ''));
            const newAmount = parseFloat((data.amount || '0').toString().replace(/,/g, ''));
            const oldAccountId = editingItem.accountId;
            const newAccountId = data.accountId;

            // If same account, just adjust by the difference
            if (oldAccountId === newAccountId && oldAccountId) {
                // Difference: if old=500, new=200, we need to credit back 300 (positive)
                // if old=200, new=500, we need to debit 300 more (negative)
                const balanceAdjustment = oldAmount - newAmount;
                if (balanceAdjustment !== 0) {
                    updateAccountBalance(oldAccountId, balanceAdjustment);
                }
            } else {
                // Different accounts: credit back to old, debit from new
                if (oldAccountId && oldAmount > 0) {
                    updateAccountBalance(oldAccountId, oldAmount); // Credit back old amount
                }
                if (newAccountId && newAmount > 0) {
                    updateAccountBalance(newAccountId, -newAmount); // Debit new amount
                }
            }

            // Update the linked globalTransaction to reflect the new amount
            updateGlobalTransactionByExpenseId(editingItem.id, data.amount, `Expense: ${data.item} (${data.vendor})`);

            updateExpense(newItem);
        } else {
            // For new expenses, balance is already handled in AddExpenseModal
            addExpense(newItem);
        }
        setIsExpenseModalOpen(false);
        setEditingItem(null);
    };

    const handleCloseModal = () => {
        setIsPurchaseModalOpen(false);
        setIsExpenseModalOpen(false);
        setEditingItem(null);
    };

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

    const filteredTransactions = useMemo(() => {
        let data: (PurchaseTransaction | ExpenseTransaction)[] = activeSection === 'Recent Purchases' ? purchases : expenses;

        if (activeSection === 'Recent Purchases') {
            if (selectedBrand !== 'All') {
                const lowerBrand = selectedBrand.toLowerCase();
                data = (data as PurchaseTransaction[]).filter(item =>
                    item.vendor.toLowerCase().includes(lowerBrand) ||
                    item.item.toLowerCase().includes(lowerBrand)
                );
            }

            // Category filter independent of brand selection
            if (selectedCategory) {
                const lowerCat = selectedCategory.toLowerCase();
                data = (data as PurchaseTransaction[]).filter(item => item.subCategory?.toLowerCase() === lowerCat || item.item.toLowerCase().includes(lowerCat));
            }
        } else {
            // Expenses Filter
            if (selectedExpenseCategory !== 'All') {
                const lowerCat = selectedExpenseCategory.toLowerCase();
                data = (data as ExpenseTransaction[]).filter(item =>
                    item.item.toLowerCase() === lowerCat
                );
            }
        }

        // Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            data = data.filter(item =>
                item.vendor.toLowerCase().includes(query) ||
                item.item.toLowerCase().includes(query)
            );
        }

        // Date Filter based on fromDate and toDate
        if (fromDate || toDate) {
            data = data.filter(item => {
                const itemDate = parseDate(item.date);
                itemDate.setHours(0, 0, 0, 0);

                let start = fromDate ? new Date(fromDate) : null;
                if (start) start.setHours(0, 0, 0, 0);

                let end = toDate ? new Date(toDate) : null;
                if (end) end.setHours(0, 0, 0, 0);

                if (start && itemDate < start) return false;
                if (end && itemDate > end) return false;
                return true;
            });
        }
        return data;
    }, [searchQuery, fromDate, toDate, activeSection, purchases, expenses, selectedBrand, selectedCategory, selectedExpenseCategory]);

    // Calculate combined GL and GV stats based on filtered transactions
    const glGvStats = useMemo(() => {
        let totalPurchasedBags = 0;
        let totalBilledBags = 0;

        // Use filteredTransactions to ensure stats update with filters
        filteredTransactions.forEach((t) => {
            if (t.type === 'Purchase') {
                const p = t as PurchaseTransaction;
                if (['GL', 'GV'].includes(p.subCategory)) {
                    let qty = parseFloat(p.quantity || '0');
                    if (p.unit === 'tons') {
                        qty = qty * settings.bagsPerTon;
                    }

                    let billed = parseFloat(p.billedQuantity || '0');
                    if (p.unit === 'tons') {
                        billed = billed * settings.bagsPerTon;
                    }

                    totalPurchasedBags += qty;
                    totalBilledBags += billed;
                }
            }
        });

        const netBags = totalPurchasedBags - totalBilledBags;
        const netTons = netBags / settings.bagsPerTon;

        return {
            totalPurchasedBags,
            totalBilledBags,
            netBags,
            status: netBags >= 0 ? 'Unbilled' : 'Advance',
            value: Math.abs(netTons)
        };
    }, [filteredTransactions, settings.bagsPerTon]);


    const summaryStats = useMemo(() => {
        let pCount = 0;
        let pBags = 0;

        filteredTransactions.forEach((t: any) => {
            if (t.type === 'Purchase') {
                pCount++;
                let qty = parseFloat(t.quantity || '0');
                if (t.unit === 'tons') {
                    qty = qty * settings.bagsPerTon;
                }
                if (!t.unit || t.unit === 'bags') {
                    // already in bags
                } else if (!t.quantity) {
                    const bagMatch = t.item.match(/(\d+)\s*bags/i);
                    if (bagMatch) qty = parseInt(bagMatch[1]);
                }

                pBags += qty;
            } else if (t.type === 'Expense') {
                pCount++;
                // Expenses don't usually have bags, so keep 0
            }
        });

        const pTons = pBags / settings.bagsPerTon;

        return { pCount, pBags, pTons };
    }, [filteredTransactions, settings.bagsPerTon]);

    const handleClearAll = () => {
        setSearchQuery('');
        setActiveDateTab('All Time');
        setSelectedBrand('All');
        setSelectedExpenseCategory('All');
        setSelectedCategory('');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Purchases</h1>
                <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
                    <button onClick={() => setIsExpenseModalOpen(true)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'}`}><Receipt size={14} /><span>Expense</span></button>
                    <button onClick={() => setIsPurchaseModalOpen(true)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 shadow-sm active:scale-95 ${themeConfig.twBg}`}><Plus size={16} /><span>Purchase</span></button>
                </div>
            </div>

            {/* GL/GV Status Card - Reacts to filters now */}
            {activeSection === 'Recent Purchases' && (glGvStats.totalPurchasedBags > 0 || glGvStats.totalBilledBags > 0) && (
                <div className={`rounded-xl border p-4 flex items-center justify-between ${isDarkMode ? 'bg-zinc-900/20 border-zinc-800' : 'bg-indigo-50 border-indigo-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                            <Info size={18} />
                        </div>
                        <div>
                            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>GL / GV Status {selectedBrand !== 'All' ? `(${selectedBrand})` : ''}</h3>
                            <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Combined tracking for selected GL and GV stocks</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-xl font-bold ${glGvStats.status === 'Advance' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {glGvStats.status === 'Advance' ? '+' : ''}{glGvStats.value.toFixed(2)} tons
                        </div>
                        <div className={`text-[10px] font-medium uppercase tracking-wide ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                            {glGvStats.status === 'Advance' ? 'Advance Paid' : 'Unbilled Stock'}
                        </div>
                    </div>
                </div>
            )}

            <div className={`rounded-xl border overflow-visible transition-colors mb-4 ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                {/* Header Row: Tabs and Date Filter Dropdown */}
                <div className={`flex flex-row items-center justify-between gap-4 p-4 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <div className="flex items-center gap-4 sm:gap-6 text-sm flex-wrap pb-0">
                        {['Recent Purchases', 'Expenses'].map((tab) => (
                            <button key={tab} onClick={() => setActiveSection(tab)} className={`font-medium whitespace-nowrap transition-colors relative py-1 ${activeSection === tab ? (isDarkMode ? 'text-white' : 'text-zinc-900') : (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700')}`}>{tab}{activeSection === tab && <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${themeConfig.twBg} -mb-4 sm:-mb-[17px]`}></span>}</button>
                        ))}
                    </div>

                    <div className="relative" ref={dateDropdownRef}>
                        <button
                            onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-all whitespace-nowrap ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}
                        >
                            <Calendar size={14} className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} />
                            <span className="hidden sm:inline">{activeDateTab}</span>
                            <span className="sm:hidden">{activeDateTab === 'All Time' ? 'Date' : activeDateTab}</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDateDropdownOpen && (
                            <div className={`absolute right-0 top-full mt-2 w-40 rounded-lg border shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                {dateFilterOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => { setActiveDateTab(option); setIsDateDropdownOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${activeDateTab === option ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900') : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')}`}
                                    >
                                        {option}
                                        {activeDateTab === option && <Check size={12} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter Row - Swaps based on Active Section */}
                <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    {activeSection === 'Recent Purchases' ? (
                        <div className="flex items-center gap-3 w-full">
                            <div className={`flex items-center p-1 rounded-lg border flex-1 min-w-0 overflow-x-auto scrollbar-hide whitespace-nowrap ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                                {brands.map((brand) => (
                                    <div key={brand} className="relative group/brand flex items-center">
                                        <button
                                            onClick={() => {
                                                setSelectedBrand(brand);
                                                setSelectedCategory('');
                                            }}
                                            className={`
                                                px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-2
                                                ${selectedBrand === brand
                                                    ? (isDarkMode ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm')
                                                    : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900')}
                                            `}
                                        >
                                            {brand}
                                        </button>
                                        {brand !== 'All' && (
                                            <button
                                                onClick={(e) => handleRemoveBrand(e, brand)}
                                                className={`mr-1 p-0.5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}
                                            >
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="w-32 sm:w-44">
                                    <CustomDropdown
                                        options={availableBrandOptions}
                                        value={selectedBrandToAdd}
                                        onChange={setSelectedBrandToAdd}
                                        placeholder="Select product"
                                        className="text-xs"
                                        searchable
                                    />
                                </div>
                                <button
                                    onClick={handleAddBrandFromPicker}
                                    disabled={!selectedBrandToAdd}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${selectedBrandToAdd
                                        ? (isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-zinc-900 text-white hover:bg-zinc-800')
                                        : (isDarkMode ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-zinc-200 text-zinc-500 cursor-not-allowed')
                                        }`}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`flex items-center p-1 rounded-lg border w-full sm:w-auto overflow-x-auto scrollbar-hide whitespace-nowrap ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                            {expenseFilterCategories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedExpenseCategory(cat)}
                                    className={`
                                        px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all
                                        ${selectedExpenseCategory === cat
                                            ? (isDarkMode ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm')
                                            : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900')}
                                    `}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative flex-1 w-full sm:w-64">
                        <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search ${activeSection === 'Expenses' ? 'expenses' : 'purchases'}...`} className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs border outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'}`} />
                    </div>
                </div>

                {/* Purchase Category Filter (Conditional) */}
                {activeSection === 'Recent Purchases' && selectedBrand !== 'All' && (
                    <div className="px-4 pb-4 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Category:</span>
                        <div className="relative" ref={categoryDropdownRef}>
                            <button
                                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'} ${selectedCategory ? (isDarkMode ? 'text-white border-zinc-600' : 'text-zinc-900 border-zinc-400') : ''}`}
                            >
                                <span>{selectedCategory || 'Select category'}</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isCategoryDropdownOpen && (
                                <div className={`absolute left-0 top-full mt-2 w-40 rounded-lg border shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                    <button onClick={() => { setSelectedCategory(''); setIsCategoryDropdownOpen(false); }} className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${!selectedCategory ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900') : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')}`}>All Categories{!selectedCategory && <Check size={12} />}</button>
                                    {categories.map((cat) => (<button key={cat} onClick={() => { setSelectedCategory(cat); setIsCategoryDropdownOpen(false); }} className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${selectedCategory === cat ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900') : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')}`}>{cat}{selectedCategory === cat && <Check size={12} />}</button>))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Card - Redesigned with Custom Date Picker */}
            {activeSection === 'Recent Purchases' && selectedCategory && (
                <div className={`mb-4 p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between shadow-sm animate-in slide-in-from-top-2 duration-300 relative ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-gradient-to-r from-zinc-50 to-white border-zinc-200'}`}>
                    {/* Background accent wrapper to prevent overflow clipping of popups */}
                    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl -mr-10 -mt-10 ${themeConfig.twBg}`} />
                    </div>

                    <div className="w-full sm:w-auto relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-white border border-zinc-200 text-zinc-600'}`}>
                                <Filter size={16} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                    {selectedBrand === 'All' ? 'All Brands' : selectedBrand} {selectedCategory ? `${selectedCategory} ` : ''}Summary
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`px-2 py-1 rounded-md text-[10px] font-medium border flex items-center gap-2 ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-300 text-zinc-600'}`}>
                                        <Calendar size={12} className="opacity-70" />

                                        {/* From Date Picker */}
                                        <div className="relative" ref={fromDateRef}>
                                            <button
                                                onClick={() => setIsFromDateOpen(!isFromDateOpen)}
                                                className="hover:underline focus:outline-none"
                                            >
                                                {formatDate(fromDate) === 'dd-mm-yyyy' ? 'Start Date' : formatDate(fromDate)}
                                            </button>
                                            {isFromDateOpen && (
                                                <div className="absolute top-full left-0 mt-2 z-50">
                                                    <CustomCalendar
                                                        value={fromDate}
                                                        onChange={(d) => handleDateRangeChange('from', d)}
                                                        onClose={() => setIsFromDateOpen(false)}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <span className="opacity-50">to</span>

                                        {/* To Date Picker */}
                                        <div className="relative" ref={toDateRef}>
                                            <button
                                                onClick={() => setIsToDateOpen(!isToDateOpen)}
                                                className="hover:underline focus:outline-none"
                                            >
                                                {formatDate(toDate) === 'dd-mm-yyyy' ? 'End Date' : formatDate(toDate)}
                                            </button>
                                            {isToDateOpen && (
                                                <div className="absolute top-full left-0 mt-2 z-50">
                                                    <CustomCalendar
                                                        value={toDate}
                                                        onChange={(d) => handleDateRangeChange('to', d)}
                                                        onClose={() => setIsToDateOpen(false)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 mt-4 sm:mt-0 relative z-10 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                            <div className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Transactions</div>
                            <div className={`text-xl font-bold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{summaryStats.pCount}</div>
                        </div>
                        <div className="text-right">
                            <div className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Total Tons</div>
                            <div className={`text-3xl font-bold ${themeConfig.twText}`}>{summaryStats.pTons.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* List Section */}
            {filteredTransactions.length > 0 ? (
                <VirtualizedList<PurchaseTransaction | ExpenseTransaction>
                    items={filteredTransactions}
                    estimatedItemHeight={100}
                    containerHeight="calc(100vh - 320px)"
                    columns={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
                    gap={12}
                    overscan={5}
                    renderItem={(item: PurchaseTransaction | ExpenseTransaction) => {
                        const isExpanded = expandedNoteId === item.id;
                        const isPurchase = item.type === 'Purchase';
                        const purchaseItem = item as PurchaseTransaction;
                        const expenseItem = item as ExpenseTransaction;

                        return (
                            <div
                                className={`flex flex-col rounded-xl border transition-all duration-200 group ${isDarkMode ? 'bg-[#09090b] border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300'}`}
                                style={{ borderLeftWidth: '4px', borderLeftColor: themeConfig.primary, height: isExpanded ? 'auto' : '100px' }}
                            >
                                <div className="flex flex-row items-center justify-between p-3 md:p-4 w-full h-full">
                                    <div className="flex gap-3 items-center flex-1 min-w-0">
                                        <div className={`shrink-0 px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wide ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
                                            {item.type}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                                {item.item}
                                            </div>
                                            {isPurchase ? (
                                                <>
                                                    <div className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                                        {purchaseItem.subCategory}{purchaseItem.vehicleNumber ? ` • ${purchaseItem.vehicleNumber}` : ''}
                                                    </div>
                                                    {purchaseItem.billedQuantity && parseInt(purchaseItem.billedQuantity) < parseInt(purchaseItem.quantity) && (
                                                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-amber-500 font-medium">
                                                            <AlertCircle size={10} />
                                                            {parseInt(purchaseItem.quantity) - parseInt(purchaseItem.billedQuantity)} unbilled
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                                    {expenseItem.note || 'Expense'}
                                                </div>
                                            )}
                                            <div className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                {item.date}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end justify-center gap-1 ml-2">
                                        <div className="text-right shrink-0">
                                            {isPurchase ? (
                                                <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                                    {purchaseItem.quantity} {purchaseItem.unit}
                                                </div>
                                            ) : (
                                                <div className={`text-sm font-bold text-red-500`}>
                                                    -₹{expenseItem.amount}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => toggleNote(item.id)} className={`p-1 rounded transition-colors ${isExpanded ? (isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800') : (isDarkMode ? 'text-zinc-500 hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-100')}`} title="Notes"><FileText size={12} /></button>
                                            <button onClick={() => handleEdit(item)} className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} title="Edit"><Pencil size={12} /></button>
                                            <button onClick={() => setPendingDelete({ id: item.id, type: item.type === 'Expense' ? 'Expense' : 'Purchase' })} className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} title="Delete"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
                                        <div className={`p-3 rounded-lg text-xs border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                                            <div className={`font-medium mb-2 flex items-center gap-2 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}><FileText size={12} /><span>Notes</span></div>
                                            <textarea className={`w-full bg-transparent outline-none resize-none h-16 ${isDarkMode ? 'text-zinc-400 placeholder:text-zinc-600' : 'text-zinc-600 placeholder:text-zinc-400'}`} placeholder="Add a note..." defaultValue={item.note || ""} />
                                            <div className="flex justify-end mt-2"><button className={`px-3 py-1 rounded text-[10px] font-medium transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}>Save Note</button></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }}
                />
            ) : (
                <div className={`p-8 text-center rounded-xl border ${isDarkMode ? 'bg-[#09090b] border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400'}`}><p>No items found matching your filters.</p></div>
            )}

            {isPurchaseModalOpen && <AddPurchaseModal onClose={handleCloseModal} onSave={handleSavePurchase} initialData={editingItem} glGvStats={glGvStats} />}
            {isExpenseModalOpen && <AddExpenseModal onClose={handleCloseModal} onSave={handleSaveExpense} initialData={editingItem} expenseCategories={expenseFilterCategories} />}

            <DeleteConfirmModal
                open={!!pendingDelete}
                title="Delete transaction?"
                description={pendingDelete?.type === 'Purchase' ? 'This purchase will be removed permanently.' : 'This expense will be removed permanently.'}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}

// Compact & Redesigned AddPurchaseModal
function AddPurchaseModal({ onClose, onSave, initialData, glGvStats }: any) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const { settings, products } = useContext(DataContext);
    const themeConfig = THEMES[theme];

    // Get product names from database
    const productOptions = useMemo(() => products?.map((p: any) => p.name) || [], [products]);

    const [product, setProduct] = useState(initialData?.item || '');
    const [subCategory, setSubCategory] = useState(initialData?.subCategory || 'Direct');
    const [quantity, setQuantity] = useState(initialData?.quantity || '');
    const [unit, setUnit] = useState(initialData?.unit || 'tons');
    const [billedQuantity, setBilledQuantity] = useState(initialData?.billedQuantity || '');
    const [note, setNote] = useState(initialData?.note || '');
    const [vehicleNumber, setVehicleNumber] = useState(initialData?.vehicleNumber || '');
    const [date, setDate] = useState<Date | null>(initialData?.date ? new Date(initialData.date.split('-').reverse().join('-')) : new Date());

    const newStats = useMemo(() => {
        if (subCategory !== 'GL' && subCategory !== 'GV') return null;
        if (!glGvStats) return null;
        const currentNetBags = glGvStats.netBags;

        let qtyBags = parseFloat(quantity || '0');
        if (unit === 'tons') qtyBags = qtyBags * settings.bagsPerTon;

        let billedBags = parseFloat(billedQuantity || '0');
        // Assume billed quantity is in same unit as entered, so convert if tons
        if (unit === 'tons') billedBags = billedBags * settings.bagsPerTon;

        const impactBags = qtyBags - billedBags;
        const futureNetBags = currentNetBags + impactBags;
        const futureNetTons = futureNetBags / settings.bagsPerTon;
        const impactTons = impactBags / settings.bagsPerTon;
        const currentNetTons = currentNetBags / settings.bagsPerTon;

        return {
            currentNet: currentNetTons,
            impact: impactTons,
            futureNet: futureNetTons,
            futureStatus: futureNetBags >= 0 ? 'Unbilled' : 'Advance'
        };
    }, [subCategory, quantity, unit, billedQuantity, glGvStats, settings.bagsPerTon]);

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) { if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false); }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = () => {
        if (!product) return;
        const safeQuantity = quantity === '' ? '0' : quantity;
        const safeBilled = billedQuantity === '' ? '0' : billedQuantity;
        onSave({ product, subCategory, quantity: safeQuantity, unit, billedQuantity: safeBilled, note, date, vehicleNumber });
    };
    const formatDate = (date: Date | null) => { if (!date) return "dd-mm-yyyy"; return date.toLocaleDateString('en-GB').replace(/\//g, '-'); };

    const inputClass = `w-full px-3 py-2 rounded-lg border text-xs outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:ring-1 focus:ring-zinc-700 focus:border-transparent' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-300 focus:border-transparent'}`;
    const labelClass = `text-[10px] font-semibold mb-1 block uppercase tracking-wide ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-xl border shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto scrollbar-hide animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800 sticky top-0 bg-inherit z-10">
                    <h2 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{initialData ? 'Edit Purchase' : 'New Purchase'}</h2>
                    <button onClick={onClose} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}><X size={16} /></button>
                </div>
                <div className="p-5 space-y-3">
                    <div><label className={labelClass}>Product</label><CustomDropdown options={productOptions} value={product} onChange={setProduct} placeholder="Select Product" className="w-full text-xs" /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>Type</label><CustomDropdown options={PURCHASE_TYPES} value={subCategory} onChange={setSubCategory} placeholder="Direct/GL/GV" className="w-full text-xs" /></div>
                        <div className="relative" ref={calendarRef}>
                            <label className={labelClass}>Date</label>
                            <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}><span>{formatDate(date)}</span><Calendar size={14} className="opacity-50" /></button>
                            {isCalendarOpen && <div className="absolute top-full mt-2 right-0 z-50"><CustomCalendar value={date} onChange={(d) => { setDate(d); setIsCalendarOpen(false) }} onClose={() => setIsCalendarOpen(false)} /></div>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className={labelClass}>Quantity</label>
                                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" className={inputClass} />
                            </div>
                            <div className="w-24">
                                <label className={labelClass}>Unit</label>
                                <CustomDropdown options={QUANTITY_UNITS} value={unit} onChange={setUnit} className="w-full text-xs" />
                            </div>
                        </div>
                        {['GL', 'GV'].includes(subCategory) && (
                            <div><label className={labelClass}>Billed Qty</label><input type="number" value={billedQuantity} onChange={e => setBilledQuantity(e.target.value)} placeholder="0" className={inputClass} /></div>
                        )}
                    </div>
                    <div>
                        <label className={labelClass}>Vehicle Number (Optional)</label>
                        <input
                            type="text"
                            value={vehicleNumber}
                            onChange={e => setVehicleNumber(e.target.value)}
                            placeholder="e.g. KA 01 AB 1234"
                            className={inputClass}
                        />
                    </div>
                    {newStats && (
                        <div className={`p-2 rounded-lg border text-[10px] flex flex-col gap-1 ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-indigo-50 border-indigo-100'}`}>
                            <div className="flex items-center gap-1"><Info size={10} className="text-indigo-500" /><span className="font-semibold">Impact Analysis (Tons)</span></div>
                            <div className="flex justify-between text-center"><div className="flex-1"><div>Cur</div><div className={newStats.currentNet >= 0 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>{Math.abs(newStats.currentNet).toFixed(2)}</div></div><div className="flex-1 border-l border-r border-dashed border-zinc-700"><div>Txn</div><div className={newStats.impact >= 0 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>{newStats.impact > 0 ? '+' : ''}{newStats.impact.toFixed(2)}</div></div><div className="flex-1"><div>New</div><div className={newStats.futureNet >= 0 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>{Math.abs(newStats.futureNet).toFixed(2)}</div></div></div>
                        </div>
                    )}
                    <div><label className={labelClass}>Notes</label><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional notes..." className={`${inputClass} resize-none h-16`} /></div>
                </div>
                <div className="p-4 border-t dark:border-zinc-800 flex gap-3"><button onClick={onClose} className={`flex-1 py-2 rounded-lg text-xs font-medium border ${isDarkMode ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}>Cancel</button><button onClick={handleSubmit} className={`flex-1 py-2 rounded-lg text-xs font-medium text-white shadow-sm hover:opacity-90 ${themeConfig.twBg}`}>Save</button></div>
            </div>
        </div>
    );
}

// Compact & Redesigned AddExpenseModal with Account Integration
function AddExpenseModal({ onClose, onSave, initialData, expenseCategories }: any) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const { accounts, addGlobalTransaction } = useContext(DataContext);
    const themeConfig = THEMES[theme];

    const [vendor, setVendor] = useState(initialData?.vendor || '');
    const [item, setItem] = useState(initialData?.item || '');
    const [customItem, setCustomItem] = useState(''); // For Custom category entry
    const [amount, setAmount] = useState(initialData?.amount?.replace(/,/g, '') || '');
    const [note, setNote] = useState(initialData?.note || '');
    const [date, setDate] = useState<Date | null>(initialData?.date ? new Date(initialData.date.split('-').reverse().join('-')) : new Date());
    // Initialize selectedAccountId from initialData when editing
    const [selectedAccountId, setSelectedAccountId] = useState(initialData?.accountId?.toString() || '');

    const isEditing = !!initialData;

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) { if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false); }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = () => {
        // Use custom item if 'Custom' is selected, otherwise use dropdown value
        const finalItem = item === 'Custom' ? customItem : item;

        if (!vendor || !finalItem || !amount || !selectedAccountId) return;

        const dateStr = date ? formatDate(date) : formatDate(new Date());
        const accountIdNum = parseInt(selectedAccountId);

        // Generate expenseId upfront so we can link the globalTransaction to the expense
        const expenseId = Date.now();

        // Only add global transaction for NEW expenses (not edits)
        // Edit balance handling is done in handleSaveExpense
        if (!isEditing) {
            addGlobalTransaction({
                id: Date.now(),
                accountId: accountIdNum,
                type: 'Debit', // Expense reduces balance
                amount: amount,
                date: dateStr,
                description: `Expense: ${finalItem} (${vendor})`,
                category: 'Expense',
                expenseId: expenseId // Link to the expense
            });
        }

        // Pass expenseId and accountId so they can be stored in the expense record
        onSave({ vendor, item: finalItem, amount, note, date, accountId: accountIdNum, expenseId });
    };

    const formatDate = (date: Date | null) => { if (!date) return "dd-mm-yyyy"; return date.toLocaleDateString('en-GB').replace(/\//g, '-'); };
    const inputClass = `w-full px-3 py-2 rounded-lg border text-xs outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:ring-1 focus:ring-zinc-700 focus:border-transparent' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-300 focus:border-transparent'}`;
    const labelClass = `text-[10px] font-semibold mb-1 block uppercase tracking-wide ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`;

    // Filter out 'All' for the modal dropdown
    const modalCategories = expenseCategories ? expenseCategories.filter((c: string) => c !== 'All') : [];
    // Ensure Custom is available
    if (!modalCategories.includes('Custom')) modalCategories.push('Custom');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-xl border shadow-2xl flex flex-col p-0 space-y-0 ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800 sticky top-0 bg-inherit z-10">
                    <h2 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{initialData ? 'Edit Expense' : 'Record Expense'}</h2>
                    <button onClick={onClose} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}><X size={16} /></button>
                </div>

                <div className="p-5 space-y-3">
                    <div><label className={labelClass}>Payee / Vendor</label><input type="text" value={vendor} onChange={e => setVendor(e.target.value)} placeholder="e.g. Shell, Office Depot" className={inputClass} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className={labelClass}>Category</label>
                            <CustomDropdown options={modalCategories} value={item} onChange={setItem} placeholder="Select Category" className="w-full text-xs" />
                            {item === 'Custom' && (
                                <input
                                    type="text"
                                    value={customItem}
                                    onChange={e => setCustomItem(e.target.value)}
                                    placeholder="Enter new category"
                                    className={`${inputClass} animate-in fade-in slide-in-from-top-1`}
                                />
                            )}
                        </div>
                        <div className="relative" ref={calendarRef}><label className={labelClass}>Date</label><button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}><span>{formatDate(date)}</span><Calendar size={14} className="opacity-50" /></button>{isCalendarOpen && <div className="absolute bottom-full mb-2 right-0 z-50"><CustomCalendar value={date} onChange={(d) => { setDate(d); setIsCalendarOpen(false) }} onClose={() => setIsCalendarOpen(false)} /></div>}</div>
                    </div>
                    <div><label className={labelClass}>Amount (₹)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className={inputClass} /></div>

                    {/* Account Selection */}
                    <div>
                        <label className={labelClass}>Deduct From Account</label>
                        <CustomDropdown
                            options={accounts.map(a => ({ id: a.id, label: `${a.name} (₹${a.balance})` }))}
                            value={selectedAccountId}
                            onChange={setSelectedAccountId}
                            placeholder="Select Account"
                            className="w-full text-xs"
                        />
                    </div>

                    <div><label className={labelClass}>Notes</label><input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Details..." className={inputClass} /></div>
                </div>

                <div className="p-4 border-t dark:border-zinc-800 flex gap-3">
                    <button onClick={onClose} className={`flex-1 py-2 rounded-lg text-xs font-medium border ${isDarkMode ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}>Cancel</button>
                    <button onClick={handleSubmit} className={`flex-1 py-2 rounded-lg text-xs font-medium text-white ${themeConfig.twBg} hover:opacity-90`}>Save</button>
                </div>
            </div>
        </div>
    );
}
