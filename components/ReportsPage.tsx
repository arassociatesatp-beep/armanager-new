import React, { useContext, useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { ThemeContext, DataContext } from '../App';
import { THEMES } from '../types';
import {
    FileText, Calendar, Filter, Search, Download,
    Users, Package, TrendingUp, ChevronDown, Check,
    ArrowRight, LayoutList, PieChart, BarChart3, ListChecks,
    CalendarRange, Briefcase, Wallet, ClipboardList, Coins,
    Tags, Layers, Activity, ChevronLeft, ChevronRight, StickyNote, ArrowLeft,
    Receipt, X
} from 'lucide-react';
import { CustomCalendar, CustomDropdown } from './shared';
import { verifyPassword } from '../src/utils/hash';

// Lazy load report components for code splitting
const ItemReportsByParty = lazy(() => import('./reports/ItemReportsByParty'));
const ItemSaleSummary = lazy(() => import('./reports/ItemSaleSummary'));
const ExpensesReport = lazy(() => import('./reports/ExpensesReport'));
const PartyWiseSummary = lazy(() => import('./reports/PartyWiseSummary'));
const MonthlyBusinessSummary = lazy(() => import('./reports/MonthlyBusinessSummary'));
const CustomerCategoryReport = lazy(() => import('./reports/CustomerCategoryReport'));

// Import shared components for non-lazy loaded sections
import { SummaryCard, DailyTable, formatCurrency, ReportSkeleton } from './reports/shared';

// --- Date Range Filter Wrapper ---
function DateRangeFilter({ from, to, onChange }: { from: string, to: string, onChange: (range: { from: string, to: string }) => void }) {
    const { isDarkMode } = useContext(ThemeContext);
    const [openPicker, setOpenPicker] = useState<'from' | 'to' | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpenPicker(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const parseDate = (dStr: string) => {
        if (!dStr) return null;
        if (dStr.includes('-')) {
            const parts = dStr.split('-');
            if (parts[0].length === 4) return new Date(dStr); // yyyy-mm-dd
            // Fallback
        }
        return new Date(dStr);
    };

    const formatDateForDisplay = (dStr: string) => {
        if (!dStr) return 'Select Date';
        const date = parseDate(dStr);
        if (!date || isNaN(date.getTime())) return 'Invalid Date';
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const handleDateSelect = (date: Date | null, type: 'from' | 'to') => {
        let newDateStr = '';
        if (date) {
            // Store as yyyy-mm-dd
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            newDateStr = `${y}-${m}-${d}`;
        }

        if (type === 'from') onChange({ from: newDateStr, to });
        else onChange({ from, to: newDateStr });

        setOpenPicker(null);
    };

    return (
        <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border relative ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`} ref={containerRef}>
            <Calendar size={14} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />

            {/* From Date */}
            <div className="flex flex-col relative min-w-[65px] sm:min-w-[80px]">
                <span className={`text-[9px] uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>From</span>
                <button
                    onClick={() => setOpenPicker(openPicker === 'from' ? null : 'from')}
                    className={`text-xs font-medium outline-none text-left whitespace-nowrap ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}
                >
                    {formatDateForDisplay(from)}
                </button>
                {openPicker === 'from' && (
                    <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto top-1/3 sm:top-full sm:left-0 sm:right-auto sm:mt-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <CustomCalendar
                            value={parseDate(from)}
                            onChange={(d) => handleDateSelect(d, 'from')}
                            onClose={() => setOpenPicker(null)}
                        />
                    </div>
                )}
            </div>

            <ArrowRight size={12} className={isDarkMode ? 'text-zinc-600' : 'text-zinc-400'} />

            {/* To Date */}
            <div className="flex flex-col relative min-w-[65px] sm:min-w-[80px]">
                <span className={`text-[9px] uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>To</span>
                <button
                    onClick={() => setOpenPicker(openPicker === 'to' ? null : 'to')}
                    className={`text-xs font-medium outline-none text-left whitespace-nowrap ${isDarkMode ? 'text-zinc-200' : 'text-zinc-700'}`}
                >
                    {formatDateForDisplay(to)}
                </button>
                {openPicker === 'to' && (
                    <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto top-1/3 sm:top-full sm:left-0 sm:right-auto sm:mt-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <CustomCalendar
                            value={parseDate(to)}
                            onChange={(d) => handleDateSelect(d, 'to')}
                            onClose={() => setOpenPicker(null)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ReportsPage() {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const { sales, payments, customers, accounts, globalTransactions, purchases, expenses, stocks, stockTransactions, settings } = useContext(DataContext);
    const themeConfig = THEMES[theme];

    // --- State ---
    const [activeReport, setActiveReport] = useState('Item Reports by Party');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [selectedCustomer, setSelectedCustomer] = useState('All');
    const [selectedProduct, setSelectedProduct] = useState('All');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedAccount, setSelectedAccount] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Password Lock State
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [enteredPassword, setEnteredPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const customerPayments = useMemo(() => payments.filter(p => !p.isGandhi), [payments]);

    // Daily Report Filters
    const [dailyReportFilter, setDailyReportFilter] = useState('All');
    const [dailyAccountFilter, setDailyAccountFilter] = useState('All');

    // Customer Ledger (New Details Page State)
    const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<string | null>(null);
    const [ledgerDateRange, setLedgerDateRange] = useState({ from: '', to: '' });

    // Sub Category Report Filters
    const [selectedSubCatProduct, setSelectedSubCatProduct] = useState('All');
    const [selectedMetric, setSelectedMetric] = useState('tons'); // Default to tons

    // Notes Report State
    const [reportNotes, setReportNotes] = useState('');

    // Customer Category Status Filter
    const [customerStatusFilter, setCustomerStatusFilter] = useState('All');

    // Password unlock handler
    const handleUnlock = async () => {
        if (!settings.reportsPassword) return;

        const isValid = await verifyPassword(enteredPassword, settings.reportsPassword);
        if (isValid) {
            setIsUnlocked(true);
            setPasswordError('');
        } else {
            setPasswordError('Incorrect password');
        }
    };

    // --- Initial Date Setup (This Month) ---
    useEffect(() => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        // Default to first day of current month
        const firstDayStr = `${yyyy}-${mm}-01`;
        const todayStr = `${yyyy}-${mm}-${dd}`;
        setDateRange({ from: firstDayStr, to: todayStr });
    }, []);

    // --- Data Processing ---

    // 1. Get Unique Options for Dropdowns
    const uniqueCustomers = useMemo(() => {
        const custs = new Set(sales.map(s => s.customer));
        // Also add customers who might have payments but no sales
        customerPayments.forEach(p => custs.add(p.customer));
        customers.forEach(c => custs.add(c.name));
        return ['All', ...Array.from(custs).sort()];
    }, [sales, customerPayments, customers]);

    const uniqueProducts = useMemo(() => {
        const products = new Set(sales.map(s => s.product.split(' • ')[0]));
        return ['All', ...Array.from(products).sort()];
    }, [sales]);

    const uniquePurchasedProducts = useMemo(() => {
        const products = new Set(purchases.map(p => p.item));
        return ['All', ...Array.from(products).sort()];
    }, [purchases]);

    const uniqueCategories = useMemo(() => {
        if (activeReport === 'Sub Category Report') {
            return ['All', 'Direct', 'GL', 'GV'];
        }
        const cats = new Set(customers.map(c => c.category || 'Individual'));
        return ['All', ...Array.from(cats).sort()];
    }, [customers, activeReport]);

    const uniqueAccounts = useMemo(() => {
        return ['All', ...accounts.map(a => a.name)];
    }, [accounts]);

    // 2. Helper to filter by date range
    const isWithinDateRange = (dateStr: string) => {
        if (!dateRange.from || !dateRange.to) return true;

        let itemDate;
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts[0].length === 4) {
                // yyyy-mm-dd
                itemDate = new Date(dateStr);
            } else {
                // dd-mm-yyyy
                const [d, m, y] = parts.map(Number);
                itemDate = new Date(y, m - 1, d);
            }
        } else {
            return false;
        }

        const from = new Date(dateRange.from);
        const to = new Date(dateRange.to);
        itemDate.setHours(0, 0, 0, 0);
        from.setHours(0, 0, 0, 0);
        to.setHours(0, 0, 0, 0);
        return itemDate >= from && itemDate <= to;
    };

    // 3. Filter Data Sources
    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            if (!isWithinDateRange(sale.date)) return false;

            // Report Specific Filters
            if (activeReport === 'Item Reports by Party') {
                if (selectedCustomer !== 'All' && sale.customer !== selectedCustomer) return false;
            } else if (activeReport === 'Item Sale Summary') {
                const prodName = sale.product.split(' • ')[0];
                if (selectedProduct !== 'All' && prodName !== selectedProduct) return false;
            } else if (activeReport === 'Party Wise Summary') {
                if (selectedCategory !== 'All') {
                    const cust = customers.find(c => c.name === sale.customer);
                    const cat = cust?.category || 'Individual';
                    if (cat !== selectedCategory) return false;
                }
            }

            // Search Filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!sale.customer.toLowerCase().includes(q) && !sale.product.toLowerCase().includes(q)) return false;
            }

            return true;
        });
    }, [sales, dateRange, selectedCustomer, selectedProduct, selectedCategory, searchQuery, activeReport, customers]);

    const filteredPayments = useMemo(() => {
        return customerPayments.filter(payment => {
            if (!isWithinDateRange(payment.date)) return false;

            if (activeReport === 'Party Wise Summary') {
                if (selectedCategory !== 'All') {
                    const cust = customers.find(c => c.name === payment.customer);
                    const cat = cust?.category || 'Individual';
                    if (cat !== selectedCategory) return false;
                }
            }

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!payment.customer.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [customerPayments, dateRange, searchQuery, activeReport, selectedCategory, customers]);

    const filteredPurchases = useMemo(() => {
        return purchases.filter(p => {
            if (!isWithinDateRange(p.date)) return false;

            if (activeReport === 'Sub Category Report') {
                // If filtering by purchase category (Direct/GL/GV)
                if (selectedCategory !== 'All' && p.subCategory !== selectedCategory) return false;
                // If filtering by product
                if (selectedSubCatProduct !== 'All' && p.item !== selectedSubCatProduct) return false;
            }

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!p.vendor.toLowerCase().includes(q) && !p.item.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [purchases, dateRange, activeReport, selectedCategory, selectedSubCatProduct, searchQuery]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            if (!isWithinDateRange(e.date)) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return e.vendor.toLowerCase().includes(q) || e.item.toLowerCase().includes(q);
            }
            return true;
        })
    }, [expenses, dateRange, searchQuery]);


    // 4. Aggregate Data

    // A. For "Item Reports by Party" (Formerly Item Sales)
    const itemReportsByPartyData = useMemo(() => {
        const groups: Record<string, { id: string; customer: string; productName: string; unit: string; quantity: number; amount: number; }> = {};
        filteredSales.forEach(sale => {
            const parts = sale.product.split(' • ');
            const productName = parts[0];
            let qty = 0, unit = '';
            if (parts[1]) { const qtyParts = parts[1].split(' '); qty = parseFloat(qtyParts[0]) || 0; unit = qtyParts[1] || ''; }
            const amount = parseFloat(sale.amount.replace(/,/g, '')) || 0;
            const key = `${sale.customer}_${productName}_${unit}`;
            if (!groups[key]) groups[key] = { id: key, customer: sale.customer, productName, unit, quantity: 0, amount: 0 };
            groups[key].quantity += qty;
            groups[key].amount += amount;
        });
        return Object.values(groups).sort((a, b) => b.amount - a.amount);
    }, [filteredSales]);

    // B. For "Item Sale Summary" (Formerly Item Reports by Party)
    const itemSaleSummaryData = useMemo(() => {
        const groups: Record<string, { id: string; productName: string; unit: string; quantity: number; }> = {};
        filteredSales.forEach(sale => {
            const parts = sale.product.split(' • ');
            const productName = parts[0];
            let qty = 0, unit = '';
            if (parts[1]) { const qtyParts = parts[1].split(' '); qty = parseFloat(qtyParts[0]) || 0; unit = qtyParts[1] || ''; }
            const key = `${productName}_${unit}`;
            if (!groups[key]) groups[key] = { id: key, productName, unit, quantity: 0 };
            groups[key].quantity += qty;
        });
        return Object.values(groups).sort((a, b) => b.quantity - a.quantity);
    }, [filteredSales]);

    // C. For "Monthly Business Summary"
    const monthlySummaryData = useMemo(() => {
        const groups: Record<string, { monthKey: string; displayMonth: string; totalSales: number; totalCollections: number; }> = {};
        const processDate = (dateStr: string) => {
            const [d, m, y] = dateStr.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            return { monthKey: `${y}-${String(m).padStart(2, '0')}`, displayMonth: date.toLocaleString('default', { month: 'short', year: 'numeric' }) };
        };
        filteredSales.forEach(sale => {
            const { monthKey, displayMonth } = processDate(sale.date);
            if (!groups[monthKey]) groups[monthKey] = { monthKey, displayMonth, totalSales: 0, totalCollections: 0 };
            groups[monthKey].totalSales += parseFloat(sale.amount.replace(/,/g, '')) || 0;
        });
        filteredPayments.forEach(payment => {
            const { monthKey, displayMonth } = processDate(payment.date);
            if (!groups[monthKey]) groups[monthKey] = { monthKey, displayMonth, totalSales: 0, totalCollections: 0 };
            groups[monthKey].totalCollections += parseFloat(payment.amount.replace(/,/g, '')) || 0;
        });
        return Object.values(groups).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    }, [filteredSales, filteredPayments]);

    // D. For "Party Wise Summary"
    const partySummaryData = useMemo(() => {
        const groups: Record<string, {
            customerName: string;
            category: string;
            totalSales: number;
            totalPayments: number;
            lastTransactionDate: Date | null;
            lastTransactionStr: string;
        }> = {};

        const parseDate = (dStr: string) => { const [d, m, y] = dStr.split('-').map(Number); return new Date(y, m - 1, d); };

        filteredSales.forEach(sale => {
            const name = sale.customer;
            if (!groups[name]) {
                const cust = customers.find(c => c.name === name);
                groups[name] = { customerName: name, category: cust?.category || 'Individual', totalSales: 0, totalPayments: 0, lastTransactionDate: null, lastTransactionStr: '-' };
            }
            groups[name].totalSales += parseFloat(sale.amount.replace(/,/g, '')) || 0;
            const date = parseDate(sale.date);
            if (!groups[name].lastTransactionDate || date > groups[name].lastTransactionDate!) {
                groups[name].lastTransactionDate = date;
                groups[name].lastTransactionStr = sale.date;
            }
        });

        filteredPayments.forEach(payment => {
            const name = payment.customer;
            if (!groups[name]) {
                const cust = customers.find(c => c.name === name);
                groups[name] = { customerName: name, category: cust?.category || 'Individual', totalSales: 0, totalPayments: 0, lastTransactionDate: null, lastTransactionStr: '-' };
            }
            groups[name].totalPayments += parseFloat(payment.amount.replace(/,/g, '')) || 0;
            const date = parseDate(payment.date);
            if (!groups[name].lastTransactionDate || date > groups[name].lastTransactionDate!) {
                groups[name].lastTransactionDate = date;
                groups[name].lastTransactionStr = payment.date;
            }
        });

        const today = new Date();
        return Object.values(groups).map(g => {
            const balance = g.totalSales - g.totalPayments;
            let daysSince = 0;
            if (g.lastTransactionDate) {
                const diff = Math.abs(today.getTime() - g.lastTransactionDate.getTime());
                daysSince = Math.ceil(diff / (1000 * 60 * 60 * 24));
            }
            return { ...g, balance, daysSince, status: balance > 0 ? 'Due' : (balance < 0 ? 'Advance' : 'Settled') };
        }).sort((a, b) => b.balance - a.balance);
    }, [filteredSales, filteredPayments, customers]);

    // E. For "Account's Report"
    const accountReportData = useMemo(() => {
        return accounts.filter(acc => {
            // Keep all accounts in list view, but highlighting selected logic if needed
            return true;
        }).map(acc => {
            const balance = parseFloat(acc.balance.replace(/,/g, ''));
            return {
                id: acc.id,
                name: acc.name,
                balance: balance,
                status: balance !== 0 ? 'Active' : 'Inactive'
            };
        });
    }, [accounts]);

    const specificAccountTransactions = useMemo(() => {
        if (selectedAccount === 'All') return [];
        const account = accounts.find(a => a.name === selectedAccount);
        if (!account) return [];

        const sortedTx = globalTransactions
            .filter(tx => tx.accountId === account.id && isWithinDateRange(tx.date))
            .sort((a, b) => {
                const [da, ma, ya] = a.date.split('-').map(Number);
                const [db, mb, yb] = b.date.split('-').map(Number);
                return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
            });

        // Calculate running balance starting from account's opening balance
        const openingBalance = parseFloat(account.balance.replace(/,/g, '')) || 0;
        let runningBalance = openingBalance;

        // Subtract all transaction impacts to get true opening balance before transactions
        sortedTx.forEach(tx => {
            const amount = parseFloat(tx.amount.replace(/,/g, '')) || 0;
            if (tx.type === 'Credit') runningBalance -= amount;
            else runningBalance += amount;
        });

        // Now add back with running balance
        const startBalance = runningBalance;
        runningBalance = startBalance;

        return sortedTx.map(tx => {
            const amount = parseFloat(tx.amount.replace(/,/g, '')) || 0;
            if (tx.type === 'Credit') runningBalance += amount;
            else runningBalance -= amount;
            return { ...tx, balance: runningBalance };
        });
    }, [globalTransactions, selectedAccount, dateRange, accounts]);

    // F. For "Daily Report"
    const dailyReportData = useMemo(() => {
        // Filter account transactions if needed
        const accs = globalTransactions.filter(g => isWithinDateRange(g.date));
        const filteredAccounts = dailyAccountFilter === 'All'
            ? accs
            : accs.filter(g => {
                const acc = accounts.find(a => a.id === g.accountId);
                return acc?.name === dailyAccountFilter;
            });

        return {
            sales: sales.filter(s => isWithinDateRange(s.date)),
            payments: customerPayments.filter(p => isWithinDateRange(p.date)),
            purchases: purchases.filter(p => isWithinDateRange(p.date)),
            expenses: expenses.filter(e => isWithinDateRange(e.date)),
            stocks: stockTransactions.filter(s => isWithinDateRange(s.date)),
            accounts: filteredAccounts,
            newCustomers: customers.filter(c => isWithinDateRange(c.registerDate))
        };
    }, [dateRange, sales, customerPayments, purchases, expenses, stockTransactions, globalTransactions, customers, dailyAccountFilter, accounts]);

    // G. Profit & Loss Logic
    const profitAndLossData = useMemo(() => {
        const groups: Record<string, { monthKey: string; displayMonth: string; totalQty: number; totalRevenue: number; totalCost: number; }> = {};

        filteredSales.forEach(sale => {
            const [d, m, y] = sale.date.split('-').map(Number);
            const monthKey = `${y}-${String(m).padStart(2, '0')}`;
            const displayMonth = new Date(y, m - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' });

            if (!groups[monthKey]) groups[monthKey] = { monthKey, displayMonth, totalQty: 0, totalRevenue: 0, totalCost: 0 };

            // Parse Quantity
            const parts = sale.product.split(' • ');
            let qty = 0;
            if (parts[1]) {
                const qtyParts = parts[1].split(' ');
                qty = parseFloat(qtyParts[0]) || 0;
            }

            const revenue = parseFloat(sale.amount.replace(/,/g, '')) || 0;
            const purchasePrice = parseFloat(sale.purchasePrice || '0');
            const cost = qty * purchasePrice;

            groups[monthKey].totalQty += qty;
            groups[monthKey].totalRevenue += revenue;
            groups[monthKey].totalCost += cost;
        });

        return Object.values(groups).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    }, [filteredSales]);

    // H. Sub Category Report Logic
    const subCategoryReportData = useMemo(() => {
        const groups: Record<string, { date: string; dateObj: Date; direct: number; gl: number; gv: number; billed: number; total: number; product: string }> = {};

        filteredPurchases.forEach(p => {
            const dateStr = p.date;
            const key = `${dateStr}_${p.item}`;

            if (!groups[key]) {
                const [d, m, y] = dateStr.split('-').map(Number);
                groups[key] = {
                    date: dateStr,
                    dateObj: new Date(y, m - 1, d),
                    product: p.item,
                    direct: 0, gl: 0, gv: 0, billed: 0, total: 0
                };
            }

            let qty = parseFloat(p.quantity || '0');
            let billedQty = parseFloat((p as any).billedQuantity || '0');

            if (p.unit === 'tons' && selectedMetric === 'bags') {
                qty = qty * settings.bagsPerTon;
                billedQty = billedQty * settings.bagsPerTon;
            } else if (p.unit === 'bags' && selectedMetric === 'tons') {
                qty = qty / settings.bagsPerTon;
                billedQty = billedQty / settings.bagsPerTon;
            }

            const cat = p.subCategory || 'Direct';
            if (cat === 'Direct') groups[key].direct += qty;
            else if (cat === 'GL') groups[key].gl += qty;
            else if (cat === 'GV') groups[key].gv += qty;

            groups[key].billed += billedQty;
            groups[key].total += qty;
        });

        const chronologicalRows = Object.values(groups).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
        let carryUnbilled = 0;

        const withBilling = chronologicalRows.map(row => {
            const inflow = row.gl + row.gv; // Direct is separate
            const totalBilled = row.billed;
            const totalUnbilled = carryUnbilled + (inflow - totalBilled);
            carryUnbilled = totalUnbilled;
            return { ...row, totalBilled, totalUnbilled };
        });

        return withBilling; // already chronological ascending
    }, [filteredPurchases, settings.bagsPerTon, selectedMetric]);

    const subCategoryColumnTotals = useMemo(() => {
        const totals = { direct: 0, gv: 0, gl: 0, total: 0, totalBilled: 0, totalUnbilled: 0 };
        subCategoryReportData.forEach((row) => {
            totals.direct += row.direct;
            totals.gv += row.gv;
            totals.gl += row.gl;
            totals.total += row.total;
            totals.totalBilled += row.totalBilled;
        });
        if (subCategoryReportData.length > 0) {
            totals.totalUnbilled = subCategoryReportData[subCategoryReportData.length - 1].totalUnbilled; // last row in ascending order
        }
        return totals;
    }, [subCategoryReportData]);

    // I. Customer Ledger List Data (Filtered by Category)
    const customerLedgerList = useMemo(() => {
        return customers.filter(cust => {
            if (selectedCategory !== 'All' && (cust.category || 'Individual') !== selectedCategory) return false;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return cust.name.toLowerCase().includes(q) || cust.phone.includes(q);
            }
            return true;
        }).map(cust => {
            // Calculate current balance - filter by customerId with fallback to name
            const custSales = sales.filter(s => s.customerId === cust.id || s.customer === cust.name);
            const custPayments = customerPayments.filter(p => p.customerId === cust.id || p.customer === cust.name);
            const totalDebit = custSales.reduce((acc, s) => acc + parseFloat(s.amount.replace(/,/g, '')), 0);
            const totalCredit = custPayments.reduce((acc, p) => acc + parseFloat(p.amount.replace(/,/g, '')), 0);
            const opening = parseFloat(cust.openingBalance || '0');
            const balance = opening + totalDebit - totalCredit;

            return {
                ...cust,
                category: cust.category || 'Individual',
                balance: balance
            };
        });
    }, [customers, sales, customerPayments, selectedCategory, searchQuery]);

    // J. Detailed Ledger Data for Selected Customer (with date filtering)
    const ledgerDetails = useMemo(() => {
        if (!selectedLedgerCustomer) return null;
        // Find customer by ID (selectedLedgerCustomer now stores customer ID)
        const customer = customers.find(c => c.id === selectedLedgerCustomer);
        if (!customer) return null;

        const baseOpeningBalance = parseFloat(customer.openingBalance || '0');
        const openingBalanceDate = customer.openingBalanceDate || customer.registerDate;

        // Filter by customerId with fallback to name for backward compatibility
        const custSales = sales.filter(s => s.customerId === customer.id || s.customer === customer.name);
        const custPayments = customerPayments.filter(p => p.customerId === customer.id || p.customer === customer.name);

        // Normalize transactions
        const allTx = [
            ...custSales.map(s => ({
                id: s.id,
                dateStr: s.date,
                date: new Date(s.date.split('-').reverse().join('-')),
                details: s.product, // e.g. "JSW OPC - 12 bags"
                note: s.note,
                debit: parseFloat(s.amount.replace(/,/g, '')),
                credit: 0
            })),
            ...custPayments.map(p => ({
                id: p.id,
                dateStr: p.date,
                date: new Date(p.date.split('-').reverse().join('-')),
                details: `Payment (${p.method})`,
                note: p.note,
                debit: 0,
                credit: parseFloat(p.amount.replace(/,/g, ''))
            }))
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        // Parse date range filters
        const fromDate = ledgerDateRange.from ? new Date(ledgerDateRange.from) : null;
        const toDate = ledgerDateRange.to ? new Date(ledgerDateRange.to) : null;
        if (toDate) toDate.setHours(23, 59, 59, 999);

        // Calculate effective opening balance (base + transactions before from date)
        let effectiveOpeningBalance = baseOpeningBalance;
        let effectiveOpeningBalanceDate = openingBalanceDate;

        if (fromDate) {
            const txBeforeFrom = allTx.filter(tx => tx.date < fromDate);
            effectiveOpeningBalance = baseOpeningBalance + txBeforeFrom.reduce((sum, tx) => sum + tx.debit - tx.credit, 0);
            // Update opening balance date to the filter from date
            const dd = String(fromDate.getDate()).padStart(2, '0');
            const mm = String(fromDate.getMonth() + 1).padStart(2, '0');
            const yyyy = fromDate.getFullYear();
            effectiveOpeningBalanceDate = `${dd}-${mm}-${yyyy}`;
        }

        // Filter transactions by date range
        let filteredTx = allTx;
        if (fromDate) {
            filteredTx = filteredTx.filter(tx => tx.date >= fromDate);
        }
        if (toDate) {
            filteredTx = filteredTx.filter(tx => tx.date <= toDate);
        }

        // Calculate running balance for filtered transactions
        let runningBalance = effectiveOpeningBalance;
        let totalDebit = 0;
        let totalCredit = 0;

        const transactionsWithBalance = filteredTx.map(tx => {
            runningBalance = runningBalance + tx.debit - tx.credit;
            totalDebit += tx.debit;
            totalCredit += tx.credit;
            return { ...tx, balance: runningBalance };
        });

        // Group by Month Year
        const grouped = transactionsWithBalance.reduce((groups, tx) => {
            const monthYear = tx.date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!groups[monthYear]) {
                groups[monthYear] = {
                    title: monthYear,
                    transactions: [],
                    totalDebit: 0,
                    totalCredit: 0
                };
            }
            groups[monthYear].transactions.push(tx);
            groups[monthYear].totalDebit += tx.debit;
            groups[monthYear].totalCredit += tx.credit;
            return groups;
        }, {} as Record<string, any>);

        return {
            customer,
            openingBalance: effectiveOpeningBalance,
            openingBalanceDate: effectiveOpeningBalanceDate,
            totalDebit,
            totalCredit,
            closingBalance: effectiveOpeningBalance + totalDebit - totalCredit,
            groupedTransactions: Object.values(grouped)
        };

    }, [selectedLedgerCustomer, customers, sales, customerPayments, ledgerDateRange]);

    // K. Expense Grouping for Expenses Report (sorted by date)
    const expensesByCategory = useMemo(() => {
        const groups: Record<string, typeof expenses> = {};
        const parseDate = (dStr: string) => { const [d, m, y] = dStr.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };

        filteredExpenses.forEach(e => {
            const key = e.item;
            if (!groups[key]) groups[key] = [];
            groups[key].push(e);
        });

        // Sort each group by date (chronological order)
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => parseDate(a.date) - parseDate(b.date));
        });

        return groups;
    }, [filteredExpenses]);

    // L. Customer Category Report Data (with Status and Last Transaction)
    const customerCategoryList = useMemo(() => {
        const parseDate = (dStr: string) => { const [d, m, y] = dStr.split('-').map(Number); return new Date(y, m - 1, d); };
        const today = new Date();

        return customers.filter(c => {
            if (selectedCategory !== 'All' && (c.category || 'Individual') !== selectedCategory) return false;
            return true;
        }).map(cust => {
            // Calculate customer transactions for balance and last transaction
            const custSales = sales.filter(s => s.customerId === cust.id || s.customer === cust.name);
            const custPayments = customerPayments.filter(p => p.customerId === cust.id || p.customer === cust.name);

            const totalDebit = custSales.reduce((acc, s) => acc + parseFloat(s.amount.replace(/,/g, '')), 0);
            const totalCredit = custPayments.reduce((acc, p) => acc + parseFloat(p.amount.replace(/,/g, '')), 0);
            const opening = parseFloat(cust.openingBalance || '0');
            const balance = opening + totalDebit - totalCredit;

            // Find last transaction date
            let lastTransactionDate: Date | null = null;
            let lastTransactionStr = '-';

            [...custSales, ...custPayments].forEach(tx => {
                const txDate = parseDate(tx.date);
                if (!lastTransactionDate || txDate > lastTransactionDate) {
                    lastTransactionDate = txDate;
                    lastTransactionStr = tx.date;
                }
            });

            // Calculate status
            const status = balance > 0 ? 'Due' : (balance < 0 ? 'Advance' : 'Settled');

            return {
                ...cust,
                category: cust.category || 'Individual',
                balance,
                status,
                lastTransactionStr
            };
        });
    }, [customers, sales, customerPayments, selectedCategory]);


    // 5. Calculate Summaries
    const summaries = useMemo(() => {
        if (activeReport === 'Item Reports by Party') {
            const totalCustomers = new Set(filteredSales.map(s => s.customer)).size;
            const totalAmount = itemReportsByPartyData.reduce((sum, item) => sum + item.amount, 0);
            const totalQty = itemReportsByPartyData.reduce((sum, item) => sum + item.quantity, 0);
            return { totalCustomers, totalAmount, totalQty };
        } else if (activeReport === 'Item Sale Summary') {
            const totalItems = itemSaleSummaryData.length;
            const totalQty = itemSaleSummaryData.reduce((sum, item) => sum + item.quantity, 0);
            return { totalItems, totalQty };
        } else if (activeReport === 'Monthly Business Summary') {
            const totalSales = monthlySummaryData.reduce((sum, item) => sum + item.totalSales, 0);
            const totalCollections = monthlySummaryData.reduce((sum, item) => sum + item.totalCollections, 0);
            return { totalSales, totalCollections, difference: totalSales - totalCollections };
        } else if (activeReport === 'Party Wise Summary') {
            const totalSales = partySummaryData.reduce((sum, item) => sum + item.totalSales, 0);
            const totalPayments = partySummaryData.reduce((sum, item) => sum + item.totalPayments, 0);
            const totalBalance = partySummaryData.reduce((sum, item) => sum + item.balance, 0);
            return { totalSales, totalPayments, totalBalance };
        } else if (activeReport === "Account's Report") {
            const totalBalance = accountReportData.reduce((sum, item) => sum + item.balance, 0);
            const activeCount = accountReportData.filter(a => a.status === 'Active').length;
            return { totalBalance, activeCount };
        } else if (activeReport === "Daily Report") {
            return {
                salesCount: dailyReportData.sales.length,
                purchaseCount: dailyReportData.purchases.length,
                paymentCount: dailyReportData.payments.length
            };
        } else if (activeReport === 'Profit & Loss Analysis') {
            const totalRevenue = profitAndLossData.reduce((sum, item) => sum + item.totalRevenue, 0);
            const totalCost = profitAndLossData.reduce((sum, item) => sum + item.totalCost, 0);
            const netProfit = totalRevenue - totalCost;
            const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
            return { netProfit, margin };
        } else if (activeReport === 'Sub Category Report') {
            return {
                total: subCategoryColumnTotals.total,
                direct: subCategoryColumnTotals.direct,
                gv: subCategoryColumnTotals.gv,
                gl: subCategoryColumnTotals.gl,
                totalBilled: subCategoryColumnTotals.totalBilled,
                totalUnbilled: subCategoryColumnTotals.totalUnbilled
            };
        } else if (activeReport === 'Customer Ledger') {
            const total = customerLedgerList.length;
            const active = customerLedgerList.filter(c => c.balance !== 0).length;
            return { total, active };
        } else if (activeReport === 'Expenses Report') {
            const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount.replace(/,/g, '')), 0);
            return { totalExpenses, count: filteredExpenses.length };
        } else if (activeReport === 'Customer Category Report') {
            return { total: customerCategoryList.length };
        }
        return {};
    }, [activeReport, filteredSales, itemReportsByPartyData, itemSaleSummaryData, monthlySummaryData, partySummaryData, accountReportData, dailyReportData, profitAndLossData, subCategoryReportData, customerLedgerList, filteredExpenses, customerCategoryList]);


    // --- Download Handler ---
    const handleDownload = async () => {
        // Dynamic import for better performance
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable')
        ]);

        const doc = new jsPDF();
        let csvContent = "data:text/csv;charset=utf-8,";
        const baseTableStartY = 32; // extra spacing below header/meta

        const parseDate = (dateStr: string) => {
            const parts = dateStr.split('-').map(Number);
            if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
            return 0;
        };

        const addHeader = (title: string, y: number) => {
            doc.setFontSize(14);
            doc.text(title, 14, y);
            doc.setFontSize(10);
            doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, y + 6);
            if (activeReport !== 'Customer Ledger' && activeReport !== 'Notes Report' && activeReport !== 'Customer Category Report') {
                doc.text(`Duration: ${dateRange.from || 'Start'} to ${dateRange.to || 'Today'}`, 14, y + 11);
            }
        };

        // --- Notes Report ---
        if (activeReport === 'Notes Report') {
            addHeader("Notes Report", 15);
            doc.setFontSize(12);
            doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 25);
            doc.setFontSize(10);

            const splitNotes = doc.splitTextToSize(reportNotes, 180); // Split text to fit A4 width
            doc.text(splitNotes, 14, 35);

            doc.save("Notes_Report.pdf");
            return; // No CSV for notes
        }

        // --- Customer Category Report ---
        if (activeReport === 'Customer Category Report') {
            addHeader(`Customer List: ${selectedCategory}`, 15);

            // Add summary card data
            autoTable(doc, {
                startY: baseTableStartY,
                head: [['Metric', 'Value']],
                body: [
                    ['Total Customers', customerCategoryList.length.toString()],
                    ['Category', selectedCategory]
                ],
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                headStyles: { fillColor: [40, 40, 40], textColor: 255 }
            });

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 10,
                head: [['Customer Name', 'Phone', 'Category', 'Status', 'Last Transaction']],
                body: customerCategoryList.map(row => [row.name, row.phone, row.category, row.status, row.lastTransactionStr]),
            });
            doc.save("Customer_Category_Report.pdf");

            csvContent += "Customer Name,Phone,Category,Status,Last Transaction\n";
            customerCategoryList.forEach(row => csvContent += `"${row.name}","${row.phone}","${row.category}","${row.status}","${row.lastTransactionStr}"\n`);
        }

        // --- Expenses Report ---
        else if (activeReport === 'Expenses Report') {
            addHeader("Expenses Report", 15);

            // Add summary card data
            const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount.replace(/,/g, '')), 0);
            autoTable(doc, {
                startY: baseTableStartY,
                head: [['Metric', 'Value']],
                body: [
                    ['Total Expenses', `Rs. ${totalExpenses.toLocaleString()}`],
                    ['Transactions', filteredExpenses.length.toString()]
                ],
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                headStyles: { fillColor: [40, 40, 40], textColor: 255 }
            });

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 10,
                head: [['Date', 'Vendor', 'Item', 'Amount']],
                body: [...filteredExpenses].sort((a, b) => parseDate(a.date) - parseDate(b.date)).map(row => [row.date, row.vendor, row.item, `Rs. ${row.amount}`]),
            });
            doc.save("Expenses_Report.pdf");

            csvContent += "Date,Vendor,Item,Amount\n";
            filteredExpenses.forEach(row => csvContent += `"${row.date}","${row.vendor}","${row.item}",${row.amount}\n`);
        }

        // --- Customer Ledger ---
        else if (activeReport === 'Customer Ledger') {
            // Check if we're in detailed customer view
            if (selectedLedgerCustomer && ledgerDetails) {
                // Detailed Customer Ledger PDF - Simple Format matching user's original design
                const customer = ledgerDetails.customer;

                // Format date for display (DD-MM-YYYY)
                const formatDisplayDate = (dateStr: string) => {
                    if (!dateStr) return '';
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                        // Check if already DD-MM-YYYY or YYYY-MM-DD
                        if (parts[0].length === 4) {
                            return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD to DD-MM-YYYY
                        }
                        return dateStr; // Already DD-MM-YYYY
                    }
                    return dateStr;
                };

                // Header - Simple format
                doc.setFontSize(18);
                doc.setFont(undefined as any, 'bold');
                doc.text(`Customer Ledger: ${customer.name}`, 14, 20);

                doc.setFontSize(10);
                doc.setFont(undefined as any, 'normal');
                doc.text(`Report Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 28);
                doc.text(`Phone: ${customer.phone}`, 14, 35);
                doc.text(`Opening Balance: Rs. ${ledgerDetails.openingBalance.toLocaleString()} (as on ${formatDisplayDate(ledgerDetails.openingBalanceDate)})`, 14, 42);

                // Prepare all transactions for table
                const allTxForPDF: any[] = [];

                ledgerDetails.groupedTransactions.forEach((group: any) => {
                    group.transactions.forEach((tx: any) => {
                        allTxForPDF.push([
                            formatDisplayDate(tx.dateStr),
                            tx.details,
                            tx.note || '',
                            tx.debit > 0 ? `Rs. ${tx.debit.toLocaleString()}` : '',
                            tx.credit > 0 ? `Rs. ${tx.credit.toLocaleString()}` : '',
                            `Rs. ${tx.balance.toLocaleString()}`
                        ]);
                    });
                });

                // Add TOTAL row
                const closingBalance = ledgerDetails.closingBalance;
                allTxForPDF.push([
                    'TOTAL',
                    '',
                    '',
                    `Rs. ${ledgerDetails.totalDebit.toLocaleString()}`,
                    `Rs. ${ledgerDetails.totalCredit.toLocaleString()}`,
                    `Rs. ${closingBalance.toLocaleString()}`
                ]);

                autoTable(doc, {
                    startY: 52,
                    head: [['Date', 'Details', 'Notes', 'Debit(-)', 'Credit(+)', 'Balance']],
                    body: allTxForPDF,
                    theme: 'grid',
                    styles: { fontSize: 9, cellPadding: 3 },
                    headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
                    columnStyles: {
                        0: { cellWidth: 25 },
                        1: { cellWidth: 45 },
                        2: { cellWidth: 30 },
                        3: { cellWidth: 28, halign: 'right' },
                        4: { cellWidth: 28, halign: 'right' },
                        5: { cellWidth: 28, halign: 'right' }
                    },
                    didParseCell: (data) => {
                        // Style the TOTAL row (last row)
                        if (data.section === 'body' && data.row.index === allTxForPDF.length - 1) {
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.fillColor = [240, 240, 240];
                        }
                    }
                });

                // Footer - Summary line
                const finalY = (doc as any).lastAutoTable.finalY + 15;
                doc.setFontSize(11);
                doc.setFont(undefined as any, 'bold');
                doc.text(`Total Debit: Rs. ${ledgerDetails.totalDebit.toLocaleString()}`, 14, finalY);
                doc.text(`Total Credit: Rs. ${ledgerDetails.totalCredit.toLocaleString()}`, 85, finalY);
                doc.text(`Closing Balance: Rs. ${closingBalance.toLocaleString()}`, 155, finalY);

                doc.save(`Customer_Ledger_${customer.name}.pdf`);

                // CSV for detailed view
                csvContent += "Date,Details,Notes,Debit,Credit,Balance\n";
                allTxForPDF.forEach(row => csvContent += `"${row[0]}","${row[1]}","${row[2]}","${row[3]}","${row[4]}","${row[5]}"\n`);
            } else {
                // Customer Ledger List View
                addHeader(activeReport, 15);

                // Add summary stats
                const total = customerLedgerList.length;
                const active = customerLedgerList.filter(c => c.balance !== 0).length;
                const totalBalance = customerLedgerList.reduce((sum, c) => sum + c.balance, 0);

                autoTable(doc, {
                    startY: baseTableStartY,
                    head: [['Metric', 'Value']],
                    body: [
                        ['Total Customers', total.toString()],
                        ['Active Accounts', active.toString()],
                        ['Total Outstanding', `Rs. ${totalBalance.toLocaleString()}`]
                    ],
                    theme: 'plain',
                    styles: { fontSize: 10, cellPadding: 2 },
                    headStyles: { fillColor: [40, 40, 40], textColor: 255 }
                });

                autoTable(doc, {
                    startY: (doc as any).lastAutoTable.finalY + 10,
                    head: [['Customer', 'Phone', 'Category', 'Current Balance']],
                    body: customerLedgerList.map(row => [row.name, row.phone, row.category, `Rs. ${row.balance.toLocaleString()}`]),
                });
                doc.save("Customer_Ledger_List.pdf");

                csvContent += "Customer,Phone,Category,Current Balance\n";
                customerLedgerList.forEach(row => csvContent += `"${row.name}","${row.phone}","${row.category}",${row.balance}\n`);
            }
        }

        // --- Party Wise Summary ---
        else if (activeReport === 'Party Wise Summary') {
            addHeader(activeReport, 15);

            // Add summary card data
            const totalSales = partySummaryData.reduce((sum, item) => sum + item.totalSales, 0);
            const totalPayments = partySummaryData.reduce((sum, item) => sum + item.totalPayments, 0);
            const totalBalance = partySummaryData.reduce((sum, item) => sum + item.balance, 0);

            autoTable(doc, {
                startY: baseTableStartY,
                head: [['Metric', 'Value']],
                body: [
                    ['Total Sales', `Rs. ${totalSales.toLocaleString()}`],
                    ['Total Payments', `Rs. ${totalPayments.toLocaleString()}`],
                    ['Net Balance', `Rs. ${totalBalance.toLocaleString()}`]
                ],
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                headStyles: { fillColor: [40, 40, 40], textColor: 255 }
            });

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 10,
                head: [['Customer Name', 'Category', 'Total Sales', 'Total Payments', 'Balance', 'Status', 'Last Txn', 'Days Since']],
                body: partySummaryData.map(row => [row.customerName, row.category, `Rs. ${row.totalSales.toLocaleString()}`, `Rs. ${row.totalPayments.toLocaleString()}`, `Rs. ${row.balance.toLocaleString()}`, row.status, row.lastTransactionStr, row.daysSince.toString()]),
            });
            doc.save("Party_Wise_Summary.pdf");

            csvContent += "Customer Name,Category,Total Sales,Total Payments,Balance,Status,Last Txn,Days Since\n";
            partySummaryData.forEach(row => csvContent += `"${row.customerName}","${row.category}",${row.totalSales},${row.totalPayments},${row.balance},${row.status},${row.lastTransactionStr},${row.daysSince}\n`);
        }

        // --- Account's Report ---
        else if (activeReport === "Account's Report") {
            addHeader(activeReport, 15);
            autoTable(doc, {
                startY: baseTableStartY,
                head: [['Account Name', 'Balance (Rs.)', 'Status']],
                body: accountReportData.map(row => [row.name, `Rs. ${row.balance.toLocaleString()}`, row.status]),
                theme: 'striped'
            });

            if (selectedAccount !== 'All' && specificAccountTransactions.length > 0) {
                doc.text(`Transaction History: ${selectedAccount}`, 14, (doc as any).lastAutoTable.finalY + 10);
                autoTable(doc, {
                    startY: (doc as any).lastAutoTable.finalY + 15,
                    head: [['Date', 'Description', 'Category', 'Type', 'Amount (Rs.)', 'Balance']],
                    body: specificAccountTransactions.map(tx => [tx.date, tx.description, tx.category, tx.type, `Rs. ${tx.amount}`, `Rs. ${tx.balance.toLocaleString()}`]),
                    theme: 'grid',
                    headStyles: { fillColor: [63, 63, 70] }
                });
            }
            doc.save("Accounts_Report.pdf");

            csvContent += "Account Name,Balance,Status\n";
            accountReportData.forEach(row => csvContent += `"${row.name}",${row.balance},${row.status}\n`);
            if (selectedAccount !== 'All') {
                csvContent += `\nTransaction History: ${selectedAccount}\nDate,Description,Category,Type,Amount,Balance\n`;
                specificAccountTransactions.forEach(tx => csvContent += `"${tx.date}","${tx.description}","${tx.category}",${tx.type},${tx.amount},${tx.balance}\n`);
            }
        }

        // --- Item Reports by Party ---
        else if (activeReport === 'Item Reports by Party') {
            addHeader(activeReport, 15);

            // Add summary card data
            const totalCustomers = new Set(itemReportsByPartyData.map(r => r.customer)).size;
            const totalQty = itemReportsByPartyData.reduce((sum, item) => sum + item.quantity, 0);
            const totalAmount = itemReportsByPartyData.reduce((sum, item) => sum + item.amount, 0);

            autoTable(doc, {
                startY: baseTableStartY,
                head: [['Metric', 'Value']],
                body: [
                    ['Total Customers', totalCustomers.toString()],
                    ['Total Qty', totalQty.toLocaleString()],
                    ['Total Amount', `Rs. ${totalAmount.toLocaleString()}`]
                ],
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                headStyles: { fillColor: [40, 40, 40], textColor: 255 }
            });

            const grouped = itemReportsByPartyData.reduce((acc: Record<string, any[]>, row) => {
                if (!acc[row.customer]) acc[row.customer] = [];
                acc[row.customer].push(row);
                return acc;
            }, {});

            const body: any[] = [];
            Object.keys(grouped).forEach((customer) => {
                grouped[customer].forEach((row, idx) => {
                    body.push([
                        idx === 0 ? customer : '',
                        row.productName,
                        row.unit,
                        row.quantity,
                        `Rs. ${row.amount.toLocaleString()}`
                    ]);
                });
            });

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 10,
                head: [['Customer', 'Product', 'Unit', 'Quantity', 'Amount']],
                body,
            });
            doc.save("Item_Reports_by_Party.pdf");

            csvContent += "Customer,Product,Unit,Quantity,Amount\n";
            Object.keys(grouped).forEach(customer => {
                const rows = grouped[customer];
                rows.forEach((row, idx) => {
                    csvContent += `"${idx === 0 ? customer : ''}","${row.productName}","${row.unit}",${row.quantity},${row.amount}\n`;
                });
            });
        }

        // --- Item Sale Summary ---
        else if (activeReport === 'Item Sale Summary') {
            addHeader(activeReport, 15);

            // Add summary card data
            const totalItems = itemSaleSummaryData.length;
            const totalQty = itemSaleSummaryData.reduce((sum, item) => sum + item.quantity, 0);

            autoTable(doc, {
                startY: baseTableStartY,
                head: [['Metric', 'Value']],
                body: [
                    ['Total Items', totalItems.toString()],
                    ['Total Quantity', totalQty.toLocaleString()]
                ],
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                headStyles: { fillColor: [40, 40, 40], textColor: 255 }
            });

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 10,
                head: [['Item Name', 'Unit', 'Quantity']],
                body: itemSaleSummaryData.map(row => [row.productName, row.unit, row.quantity]),
            });
            doc.save("Item_Sale_Summary.pdf");

            csvContent += "Item Name,Unit,Quantity\n";
            itemSaleSummaryData.forEach(row => csvContent += `"${row.productName}","${row.unit}",${row.quantity}\n`);
        }

        // --- Monthly Business Summary ---
        else if (activeReport === 'Monthly Business Summary') {
            addHeader(activeReport, 15);
            autoTable(doc, {
                startY: baseTableStartY,
                head: [['Month', 'Total Sales', 'Total Collections', 'Difference']],
                body: monthlySummaryData.map(row => [row.displayMonth, row.totalSales.toLocaleString(), row.totalCollections.toLocaleString(), (row.totalSales - row.totalCollections).toLocaleString()]),
            });
            doc.save("Monthly_Business_Summary.pdf");

            csvContent += "Month,Total Sales,Total Collections,Difference\n";
            monthlySummaryData.forEach(row => csvContent += `"${row.displayMonth}",${row.totalSales},${row.totalCollections},${row.totalSales - row.totalCollections}\n`);
        }

        // --- Profit & Loss Analysis ---
        else if (activeReport === 'Profit & Loss Analysis') {
            addHeader(activeReport, 15);
            autoTable(doc, {
                startY: baseTableStartY,
                head: [['Month', 'Avg Purchase Price', 'Avg Selling Price', 'Status']],
                body: profitAndLossData.map(row => {
                    const avgSell = row.totalQty > 0 ? row.totalRevenue / row.totalQty : 0;
                    const avgBuy = row.totalQty > 0 ? row.totalCost / row.totalQty : 0;
                    const status = avgSell > avgBuy ? 'Profit' : 'Loss';
                    return [
                        row.displayMonth,
                        avgBuy.toFixed(2),
                        avgSell.toFixed(2),
                        status
                    ];
                }),
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 3) {
                        data.cell.styles.textColor = data.cell.raw === 'Profit' ? [22, 163, 74] : [220, 38, 38]; // Green or Red
                    }
                }
            });
            doc.save("Profit_Loss_Analysis.pdf");

            csvContent += "Month,Avg Purchase Price,Avg Selling Price,Status\n";
            profitAndLossData.forEach(row => {
                const avgSell = row.totalQty > 0 ? row.totalRevenue / row.totalQty : 0;
                const avgBuy = row.totalQty > 0 ? row.totalCost / row.totalQty : 0;
                const status = avgSell > avgBuy ? 'Profit' : 'Loss';
                csvContent += `"${row.displayMonth}",${avgBuy.toFixed(2)},${avgSell.toFixed(2)},${status}\n`;
            });
        }

        // --- Sub Category Report ---
        else if (activeReport === 'Sub Category Report') {
            addHeader(activeReport, 15);
            autoTable(doc, {
                startY: baseTableStartY,
                head: [['Date', 'Product', 'Direct', 'G.V', 'GL', 'Total Billed', 'Total Unbilled', 'TOTAL']],
                body: subCategoryReportData.map(row => [
                    row.date,
                    row.product,
                    row.direct.toFixed(2),
                    row.gv.toFixed(2),
                    row.gl.toFixed(2),
                    row.totalBilled.toFixed(2),
                    row.totalUnbilled.toFixed(2),
                    row.total.toFixed(2)
                ]),
                foot: [[
                    'Totals',
                    '',
                    subCategoryColumnTotals.direct.toFixed(2),
                    subCategoryColumnTotals.gv.toFixed(2),
                    subCategoryColumnTotals.gl.toFixed(2),
                    subCategoryColumnTotals.totalBilled.toFixed(2),
                    subCategoryColumnTotals.totalUnbilled.toFixed(2),
                    subCategoryColumnTotals.total.toFixed(2)
                ]],
            });
            doc.save("Sub_Category_Report.pdf");

            csvContent += "Date,Product,Direct,G.V,GL,Total Billed,Total Unbilled,TOTAL\n";
            subCategoryReportData.forEach(row => {
                csvContent += `"${row.date}","${row.product}",${row.direct},${row.gv},${row.gl},${row.totalBilled},${row.totalUnbilled},${row.total}\n`;
            });
            csvContent += `Totals,,${subCategoryColumnTotals.direct},${subCategoryColumnTotals.gv},${subCategoryColumnTotals.gl},${subCategoryColumnTotals.totalBilled},${subCategoryColumnTotals.totalUnbilled},${subCategoryColumnTotals.total}\n`;
        }

        // --- Daily Report ---
        else if (activeReport === "Daily Report") {
            addHeader("Daily Transaction Report", 15);
            let currentY = 25;
            const pageHeight = doc.internal.pageSize.getHeight();

            // Prevent content collisions at page bottom
            const ensureSpace = (minSpace: number) => {
                if (currentY + minSpace > pageHeight - 15) {
                    doc.addPage();
                    currentY = 15;
                }
            };

            // Helper to add table to PDF
            const addTableToPDF = (title: string, head: string[], body: any[]) => {
                if (body.length === 0) return;
                ensureSpace(25);
                doc.setFontSize(12);
                doc.text(title, 14, currentY + 5);
                autoTable(doc, {
                    startY: currentY + 8,
                    head: [head],
                    body: body,
                    theme: 'grid',
                    headStyles: { fillColor: [40, 40, 40] }
                });
                currentY = (doc as any).lastAutoTable.finalY + 10;
            };

            // Helper to add table to CSV
            const addTableToCSV = (title: string, head: string[], body: any[]) => {
                if (body.length === 0) return;
                csvContent += `\n${title}\n${head.join(",")}\n`;
                body.forEach(row => csvContent += row.map((cell: any) => `"${cell}"`).join(",") + "\n");
            };

            const totalTransactions = Object.values(dailyReportData).reduce((acc: number, curr: any) => acc + curr.length, 0);
            const summaryRows = [
                ['Total Transactions', totalTransactions.toString()],
                ['Sales Transactions', summaries.salesCount?.toString() || '0'],
                ['Purchase Transactions', summaries.purchaseCount?.toString() || '0'],
                ['Payment Transactions', dailyReportData.payments.length.toString()],
                ['Filter Applied', dailyReportFilter]
            ];

            // Add summary cards to PDF & CSV so exported view matches on-screen cards
            ensureSpace(30);
            doc.setFontSize(12);
            doc.text('Summary', 14, currentY + 5);
            autoTable(doc, {
                startY: currentY + 8,
                head: [['Metric', 'Value']],
                body: summaryRows,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                headStyles: { fillColor: [40, 40, 40], textColor: 255 }
            });
            currentY = (doc as any).lastAutoTable.finalY + 10;

            csvContent += `Summary\nMetric,Value\n`;
            summaryRows.forEach(row => { csvContent += `${row[0]},${row[1]}\n`; });

            // 1. Sales
            if (dailyReportFilter === 'All' || dailyReportFilter === 'Sales') {
                const salesBody = [...dailyReportData.sales].sort((a, b) => parseDate(a.date) - parseDate(b.date)).map(s => [s.date, s.customer, s.product, s.amount]);
                addTableToPDF("Sales Transactions", ['Date', 'Customer', 'Product', 'Amount'], salesBody);
                addTableToCSV("Sales Transactions", ['Date', 'Customer', 'Product', 'Amount'], salesBody);
            }

            // 2. Payments (Received)
            if (dailyReportFilter === 'All' || dailyReportFilter === 'Payments') {
                const paymentsBody = [...dailyReportData.payments].sort((a, b) => parseDate(a.date) - parseDate(b.date)).map(p => [p.date, p.customer, p.method, p.amount]);
                addTableToPDF("Payment Transactions (Received)", ['Date', 'Customer', 'Method', 'Amount'], paymentsBody);
                addTableToCSV("Payment Transactions (Received)", ['Date', 'Customer', 'Method', 'Amount'], paymentsBody);
            }

            // 3. Purchases (Removed Amount)
            if (dailyReportFilter === 'All' || dailyReportFilter === 'Purchases') {
                const purchasesBody = [...dailyReportData.purchases].sort((a, b) => parseDate(a.date) - parseDate(b.date)).map(p => [p.date, p.vendor, p.item, p.quantity, p.unit]);
                addTableToPDF("Purchase Transactions", ['Date', 'Vendor', 'Item', 'Qty', 'Unit'], purchasesBody);
                addTableToCSV("Purchase Transactions", ['Date', 'Vendor', 'Item', 'Qty', 'Unit'], purchasesBody);
            }

            // 4. Expenses
            if (dailyReportFilter === 'All' || dailyReportFilter === 'Expenses') {
                const expensesBody = [...dailyReportData.expenses].sort((a, b) => parseDate(a.date) - parseDate(b.date)).map(e => [e.date, e.vendor, e.item, e.amount]);
                addTableToPDF("Expense Transactions", ['Date', 'Vendor', 'Item', 'Amount'], expensesBody);
                addTableToCSV("Expense Transactions", ['Date', 'Vendor', 'Item', 'Amount'], expensesBody);
            }

            // 5. Stock
            if (dailyReportFilter === 'All' || dailyReportFilter === 'Stocks') {
                const stockBody = [...dailyReportData.stocks].sort((a, b) => parseDate(a.date) - parseDate(b.date)).map(s => [s.date, s.type, s.product, s.quantity + ' ' + s.unit]);
                addTableToPDF("Stock Transactions", ['Date', 'Type', 'Product', 'Qty'], stockBody);
                addTableToCSV("Stock Transactions", ['Date', 'Type', 'Product', 'Qty'], stockBody);
            }

            // 6. Account
            if (dailyReportFilter === 'All' || dailyReportFilter === 'Accounts') {
                const accountsBody = [...dailyReportData.accounts].sort((a, b) => parseDate(a.date) - parseDate(b.date)).map(a => [a.date, a.type, a.description, a.amount]);
                addTableToPDF("Account Transactions", ['Date', 'Type', 'Description', 'Amount'], accountsBody);
                addTableToCSV("Account Transactions", ['Date', 'Type', 'Description', 'Amount'], accountsBody);
            }

            // 7. New Customers
            if (dailyReportFilter === 'All' || dailyReportFilter === 'New Customers') {
                const customersBody = dailyReportData.newCustomers.map(c => [c.registerDate, c.name, c.category]);
                addTableToPDF("New Customers", ['Date', 'Name', 'Category'], customersBody);
                addTableToCSV("New Customers", ['Date', 'Name', 'Category'], customersBody);
            }

            doc.save("Daily_Report.pdf");
        }

        // Trigger CSV download
        if (activeReport !== 'Unknown' && activeReport !== 'Notes Report' && !csvContent.endsWith(',')) {
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            const safeName = activeReport.replace(/\s+/g, '_');
            link.setAttribute("download", `${safeName}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };


    // --- UI Helpers ---
    const reportsList = [
        { id: 'Daily Report', icon: <ClipboardList size={18} />, desc: 'Comprehensive daily activity' },
        { id: 'Item Reports by Party', icon: <LayoutList size={18} />, desc: 'Sales by item & customer' },
        { id: 'Item Sale Summary', icon: <ListChecks size={18} />, desc: 'Product summary & totals' },
        { id: 'Monthly Business Summary', icon: <CalendarRange size={18} />, desc: 'Sales vs Collections by month' },
        { id: 'Party Wise Summary', icon: <Users size={18} />, desc: 'Customer balances & status' },
        { id: 'Customer Category Report', icon: <Users size={18} />, desc: 'Customers list by category' },
        { id: "Account's Report", icon: <Wallet size={18} />, desc: 'Account balances & history' },
        { id: 'Profit & Loss Analysis', icon: <Coins size={18} />, desc: 'Margins and net profit' },
        { id: 'Sub Category Report', icon: <Layers size={18} />, desc: 'Purchase breakdown by type' },
        { id: 'Customer Ledger', icon: <Activity size={18} />, desc: 'Detailed customer transactions' },
        { id: 'Expenses Report', icon: <Receipt size={18} />, desc: 'Track business expenses' },
        { id: 'Notes Report', icon: <StickyNote size={18} />, desc: 'General business notes' },
    ];

    // formatCurrency, DailyTable, and SummaryCard are now imported from ./reports/shared

    // --- Password Lock Screen ---
    if (settings.reportsPassword && !isUnlocked) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
                <div className={`w-full max-w-sm p-8 rounded-2xl border shadow-xl ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <div className="text-center">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                            <svg className={`w-8 h-8 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Reports Locked</h2>
                        <p className={`text-sm mb-6 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                            This area contains sensitive financial data. Please enter your password to continue.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="password"
                            value={enteredPassword}
                            onChange={(e) => setEnteredPassword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                            placeholder="Enter password"
                            className={`w-full px-4 py-3 rounded-xl border text-center text-sm outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500' : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400'}`}
                        />

                        {passwordError && (
                            <p className="text-xs text-red-500 text-center">{passwordError}</p>
                        )}

                        <button
                            onClick={handleUnlock}
                            className={`w-full py-3 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 ${themeConfig.twBg} hover:opacity-90 active:scale-[0.98]`}
                        >
                            Unlock Reports
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Detail View for Customer Ledger ---
    if (activeReport === 'Customer Ledger' && selectedLedgerCustomer && ledgerDetails) {
        return (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right-8 duration-500">
                {/* Header - Mobile Responsive */}
                <div className="flex flex-col gap-4">
                    {/* Top Row: Back button and Customer Info */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedLedgerCustomer(null)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className={`text-lg sm:text-xl font-bold truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{ledgerDetails.customer.name}</h1>
                            <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{ledgerDetails.customer.phone}</p>
                        </div>
                    </div>
                    {/* Bottom Row: Date Filter and PDF Button */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <DateRangeFilter from={ledgerDateRange.from} to={ledgerDateRange.to} onChange={setLedgerDateRange} />
                        <button
                            onClick={handleDownload}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-white transition-opacity hover:opacity-90 ${themeConfig.twBg}`}
                        >
                            <Download size={16} /> <span className="hidden sm:inline">Download</span> PDF
                        </button>
                    </div>
                </div>

                {/* Ledger Summary Card */}
                <div className={`p-4 rounded-xl border grid grid-cols-4 items-center gap-4 ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-indigo-50/50 border-indigo-100'}`}>
                    <div className="text-left">
                        <div className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Opening</div>
                        <div className={`text-lg font-bold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>₹{ledgerDetails.openingBalance.toLocaleString()}</div>
                        <div className={`text-[10px] ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>({ledgerDetails.openingBalanceDate})</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-xs font-medium uppercase tracking-wide text-red-500`}>Debit(-)</div>
                        <div className="text-lg font-bold text-red-500">₹{ledgerDetails.totalDebit.toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-xs font-medium uppercase tracking-wide text-emerald-500`}>Credit(+)</div>
                        <div className="text-lg font-bold text-emerald-500">₹{ledgerDetails.totalCredit.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                        <div className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Balance</div>
                        <div className={`text-lg font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>₹{ledgerDetails.closingBalance.toLocaleString()}</div>
                    </div>
                </div>

                {/* Monthly Tables */}
                <div className="space-y-6">
                    {ledgerDetails.groupedTransactions.map((group: any, idx: number) => (
                        <div key={idx} className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                            <div className={`px-4 py-3 border-b text-sm font-bold flex justify-between items-center ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-100 text-zinc-900'}`}>
                                <span>{group.title}</span>
                                <div className="flex gap-4 text-xs font-normal opacity-80">
                                    <span className="text-red-500">Dr: ₹{group.totalDebit.toLocaleString()}</span>
                                    <span className="text-emerald-500">Cr: ₹{group.totalCredit.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead>
                                        <tr className={`border-b ${isDarkMode ? 'border-zinc-800 text-zinc-500' : 'border-zinc-100 text-zinc-500'}`}>
                                            <th className="py-3 px-4 font-semibold w-24">Date</th>
                                            <th className="py-3 px-4 font-semibold">Details</th>
                                            <th className="py-3 px-4 font-semibold w-32">Notes</th>
                                            <th className="py-3 px-4 font-semibold text-right text-red-500 w-32">Debit(-)</th>
                                            <th className="py-3 px-4 font-semibold text-right text-emerald-500 w-32">Credit(+)</th>
                                            <th className="py-3 px-4 font-semibold text-right w-32">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                                        {group.transactions.map((tx: any) => (
                                            <tr key={tx.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors`}>
                                                <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{tx.dateStr}</td>
                                                <td className="py-3 px-4">
                                                    <div className={`font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{tx.details}</div>
                                                </td>
                                                <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                    {tx.note && <span className="truncate block max-w-[200px]">{tx.note}</span>}
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium text-red-500">
                                                    {tx.debit > 0 ? `₹${tx.debit.toLocaleString()}` : ''}
                                                </td>
                                                <td className="py-3 px-4 text-right font-medium text-emerald-500">
                                                    {tx.credit > 0 ? `₹${tx.credit.toLocaleString()}` : ''}
                                                </td>
                                                <td className={`py-3 px-4 text-right font-bold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
                                                    ₹{tx.balance.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-full gap-6 animate-in fade-in duration-500 pb-20 md:pb-0">

            {/* Left Sidebar / Navigation for Reports */}
            <div className={`lg:w-64 flex-shrink-0 flex flex-col gap-2`}>
                <h2 className={`text-lg font-bold mb-2 px-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Reports</h2>
                {/* Scrollable Report List */}
                <div className={`rounded-xl border overflow-hidden p-2 lg:h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    {reportsList.map((report) => (
                        <button
                            key={report.id}
                            onClick={() => {
                                setActiveReport(report.id);
                                setSelectedCustomer('All'); setSelectedProduct('All'); setSelectedCategory('All'); setSelectedAccount('All'); setSelectedLedgerCustomer(null);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all mb-1 last:mb-0 ${activeReport === report.id ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900') : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50')}`}
                        >
                            <span className={activeReport === report.id ? themeConfig.twText : ''}>{report.icon}</span>
                            <div className="text-left"><div className="leading-none">{report.id}</div><div className={`text-[10px] mt-1 font-normal ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{report.desc}</div></div>
                            {activeReport === report.id && <div className={`ml-auto w-1.5 h-1.5 rounded-full ${themeConfig.twBg}`} />}
                        </button>
                    ))}
                </div>

                {/* Export Card */}
                <div className={`mt-4 p-4 rounded-xl border border-dashed text-center ${isDarkMode ? 'border-zinc-800 bg-zinc-900/20' : 'border-zinc-300 bg-zinc-50'}`}>
                    <Download size={20} className={`mx-auto mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                    <h3 className={`text-xs font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Export Data</h3>
                    <p className={`text-[10px] mb-3 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                        Download current report
                    </p>
                    <div className="flex gap-2">
                        <button onClick={handleDownload} className={`flex-1 text-xs px-3 py-1.5 rounded border transition-colors ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-white'}`}>
                            PDF
                        </button>
                        <button onClick={handleDownload} disabled={activeReport === 'Notes Report'} className={`flex-1 text-xs px-3 py-1.5 rounded border transition-colors ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-700 hover:bg-white'} ${activeReport === 'Notes Report' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">

                {/* 1. Filters Bar */}
                {activeReport !== 'Notes Report' && (
                    <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center justify-between ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            {/* Hide Date Range for Customer Ledger List View (it shows current balances usually) */}
                            {activeReport !== 'Customer Ledger' && activeReport !== 'Customer Category Report' && (
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <DateRangeFilter from={dateRange.from} to={dateRange.to} onChange={setDateRange} />
                                </div>
                            )}

                            {/* Conditional Dropdown Filter */}
                            <div className="w-full sm:w-auto flex gap-2 flex-wrap">
                                {activeReport === 'Item Reports by Party' && <CustomDropdown options={uniqueCustomers} value={selectedCustomer} onChange={setSelectedCustomer} icon={<Users size={14} />} placeholder="Select Party" className="w-48" />}
                                {activeReport === 'Item Sale Summary' && <CustomDropdown options={uniqueProducts} value={selectedProduct} onChange={setSelectedProduct} icon={<Package size={14} />} placeholder="Select Product" className="w-48" />}
                                {activeReport === 'Party Wise Summary' && <CustomDropdown options={uniqueCategories} value={selectedCategory} onChange={setSelectedCategory} icon={<Briefcase size={14} />} placeholder="Select Category" className="w-48" />}
                                {activeReport === 'Customer Category Report' && (
                                    <>
                                        <CustomDropdown options={uniqueCategories} value={selectedCategory} onChange={setSelectedCategory} icon={<Users size={14} />} placeholder="Select Category" className="w-48" />
                                        <CustomDropdown options={['All', 'Active', 'Inactive']} value={customerStatusFilter} onChange={setCustomerStatusFilter} icon={<Activity size={14} />} placeholder="Status" className="w-36" />
                                    </>
                                )}
                                {activeReport === 'Sub Category Report' && (
                                    <>
                                        <CustomDropdown options={uniqueCategories} value={selectedCategory} onChange={setSelectedCategory} icon={<Layers size={14} />} placeholder="Select Category" className="w-40" />
                                        <CustomDropdown options={uniquePurchasedProducts} value={selectedSubCatProduct} onChange={setSelectedSubCatProduct} icon={<Package size={14} />} placeholder="Select Product" className="w-40" />
                                    </>
                                )}
                                {activeReport === "Account's Report" && <CustomDropdown options={uniqueAccounts} value={selectedAccount} onChange={setSelectedAccount} icon={<Wallet size={14} />} placeholder="Select Account" className="w-48" />}

                                {/* Customer Ledger - List View Filters */}
                                {activeReport === 'Customer Ledger' && (
                                    <>
                                        <CustomDropdown options={uniqueCategories} value={selectedCategory} onChange={setSelectedCategory} icon={<Briefcase size={14} />} placeholder="Category" className="w-40" />
                                        {/* Direct Customer Select for Quick Jump */}
                                        <CustomDropdown options={uniqueCustomers} value={selectedLedgerCustomer ? (customers.find(c => c.id === selectedLedgerCustomer)?.name || '') : ''} onChange={(val: string) => { if (val !== 'All' && val !== '') { const cust = customers.find(c => c.name === val); if (cust) setSelectedLedgerCustomer(cust.id); } else { setSelectedLedgerCustomer(null); } }} icon={<Users size={14} />} placeholder="Select Customer" className="w-48" />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="w-full md:w-64 relative">
                            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs border outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'}`} />
                        </div>
                    </div>
                )}

                {/* 2. Content Sections based on Active Report */}

                {/* --- DAILY REPORT --- */}
                {activeReport === 'Daily Report' && (
                    <div className="space-y-2">
                        {/* Daily Report Toolbar / Filter */}
                        <div className={`mb-4 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1`}>
                            {['All', 'Sales', 'Payments', 'Purchases', 'Expenses', 'Stocks', 'Accounts', 'New Customers'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setDailyReportFilter(filter)}
                                    className={`
                                        px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border
                                        ${dailyReportFilter === filter
                                            ? `${themeConfig.twBg} text-white border-transparent`
                                            : (isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900')}
                                    `}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {/* Stats Summary - Always show or conditionally? Showing always gives context */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <SummaryCard label="Transactions" value={Object.values(dailyReportData).reduce((acc: number, curr: any) => acc + curr.length, 0)} subtext="Total activity count" icon={<ListChecks size={20} />} color="blue" size="small" />
                            <SummaryCard label="Sales" value={summaries.salesCount} subtext="Transactions" icon={<TrendingUp size={20} />} color="emerald" size="small" />
                            <SummaryCard label="Purchases" value={summaries.purchaseCount} subtext="Transactions" icon={<Package size={20} />} color="violet" size="small" />
                        </div>

                        {/* 1. Sales */}
                        {(dailyReportFilter === 'All' || dailyReportFilter === 'Sales') && (
                            <DailyTable title="Sales Transactions" columns={['Date', 'Customer', 'Product', 'Amount']} data={dailyReportData.sales}
                                renderRow={(item: any, idx: number) => (
                                    <tr key={idx} className={`border-b last:border-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.date}</td>
                                        <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{item.customer}</td>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.product}</td>
                                        <td className={`py-3 px-4 font-medium text-emerald-500`}>+₹{item.amount}</td>
                                    </tr>
                                )}
                            />
                        )}

                        {/* 2. Payments */}
                        {(dailyReportFilter === 'All' || dailyReportFilter === 'Payments') && (
                            <DailyTable title="Payment Transactions (Received)" columns={['Date', 'Customer', 'Method', 'Amount']} data={dailyReportData.payments}
                                renderRow={(item: any, idx: number) => (
                                    <tr key={idx} className={`border-b last:border-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.date}</td>
                                        <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{item.customer}</td>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.method}</td>
                                        <td className={`py-3 px-4 font-medium text-emerald-500`}>+₹{item.amount}</td>
                                    </tr>
                                )}
                            />
                        )}

                        {/* 3. Purchases */}
                        {(dailyReportFilter === 'All' || dailyReportFilter === 'Purchases') && (
                            <DailyTable title="Purchase Transactions" columns={['Date', 'Vendor', 'Item', 'Qty', 'Unit']} data={dailyReportData.purchases}
                                renderRow={(item: any, idx: number) => (
                                    <tr key={idx} className={`border-b last:border-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.date}</td>
                                        <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{item.vendor}</td>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.item}</td>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.quantity}</td>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.unit}</td>
                                    </tr>
                                )}
                            />
                        )}

                        {/* 4. Expenses */}
                        {(dailyReportFilter === 'All' || dailyReportFilter === 'Expenses') && (
                            <DailyTable title="Expense Transactions" columns={['Date', 'Vendor', 'Item', 'Amount']} data={dailyReportData.expenses}
                                renderRow={(item: any, idx: number) => (
                                    <tr key={idx} className={`border-b last:border-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.date}</td>
                                        <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{item.vendor}</td>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.item}</td>
                                        <td className={`py-3 px-4 font-medium text-red-500`}>-₹{item.amount}</td>
                                    </tr>
                                )}
                            />
                        )}

                        {/* 5. Stock */}
                        {(dailyReportFilter === 'All' || dailyReportFilter === 'Stocks') && (
                            <DailyTable title="Stock Transactions" columns={['Date', 'Type', 'Shop ID', 'Product', 'Qty']} data={dailyReportData.stocks}
                                renderRow={(item: any, idx: number) => (
                                    <tr key={idx} className={`border-b last:border-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.date}</td>
                                        <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{item.type}</td>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.shopId}</td>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.product}</td>
                                        <td className={`py-3 px-4 font-medium ${item.type === 'Add Stock' ? 'text-emerald-500' : 'text-amber-500'}`}>{item.quantity} {item.unit}</td>
                                    </tr>
                                )}
                            />
                        )}

                        {/* 6. Accounts */}
                        {(dailyReportFilter === 'All' || dailyReportFilter === 'Accounts') && (
                            <>
                                {/* Account Filter specific to this table */}
                                <div className="mb-2 flex justify-end">
                                    <CustomDropdown options={uniqueAccounts} value={dailyAccountFilter} onChange={setDailyAccountFilter} icon={<Wallet size={14} />} placeholder="Filter Account" className="w-48" />
                                </div>
                                <DailyTable title="Record Payment / Account Transactions" columns={['Date', 'Type', 'Description', 'Category', 'Amount']} data={dailyReportData.accounts}
                                    renderRow={(item: any, idx: number) => (
                                        <tr key={idx} className={`border-b last:border-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                                            <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.date}</td>
                                            <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{item.type}</td>
                                            <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.description}</td>
                                            <td className={`py-3 px-4 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{item.category}</td>
                                            <td className={`py-3 px-4 font-medium ${item.type === 'Credit' ? 'text-emerald-500' : 'text-red-500'}`}>₹{item.amount}</td>
                                        </tr>
                                    )}
                                />
                            </>
                        )}

                        {/* 7. New Customers */}
                        {(dailyReportFilter === 'All' || dailyReportFilter === 'New Customers') && (
                            <DailyTable title="New Customers Added" columns={['Register Date', 'Name', 'Phone', 'Category']} data={dailyReportData.newCustomers}
                                renderRow={(item: any, idx: number) => (
                                    <tr key={idx} className={`border-b last:border-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.registerDate}</td>
                                        <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{item.name}</td>
                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.phone}</td>
                                        <td className={`py-3 px-4 text-xs`}>{item.category}</td>
                                    </tr>
                                )}
                            />
                        )}

                        {Object.values(dailyReportData).every((arr) => (arr as any[]).length === 0) && (
                            <div className={`p-12 text-center rounded-xl border border-dashed ${isDarkMode ? 'border-zinc-800 bg-zinc-900/20' : 'border-zinc-200 bg-zinc-50'}`}>
                                <p className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}>No activity found for the selected date range.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* --- EXPENSES REPORT (Redesigned) --- */}
                {activeReport === 'Expenses Report' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <SummaryCard label="Total Expenses" value={formatCurrency(summaries.totalExpenses as number)} subtext="Total outgoing amount" icon={<Receipt size={20} />} color="red" size="small" />
                            <SummaryCard label="Transactions" value={summaries.count} subtext="Total expense records" icon={<ListChecks size={20} />} color="blue" size="small" />
                        </div>

                        {/* Grouped Tables */}
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
                )}

                {/* --- ITEM REPORTS BY PARTY --- */}
                {activeReport === 'Item Reports by Party' && (
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
                                        {(() => {
                                            const grouped: Record<string, typeof itemReportsByPartyData> = {};
                                            itemReportsByPartyData.forEach(row => {
                                                if (!grouped[row.customer]) grouped[row.customer] = [];
                                                grouped[row.customer].push(row);
                                            });

                                            return Object.keys(grouped).flatMap((customer) => {
                                                const rows = grouped[customer];
                                                return rows.map((row, idx) => (
                                                    <tr key={`${row.id}_${idx}`} className={`group transition-colors ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-50/60'}`}>
                                                        <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{idx === 0 ? row.customer : ''}</td>
                                                        <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.productName} <span className="text-[10px] ml-1 opacity-70">({row.unit})</span></td>
                                                        <td className={`py-3 px-4 text-right font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{row.quantity}</td>
                                                    </tr>
                                                ));
                                            });
                                        })()}
                                        {itemReportsByPartyData.length === 0 && <tr><td colSpan={3} className={`py-12 text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><div className="flex flex-col items-center gap-2"><Filter size={24} className="opacity-50" /><p>No data found.</p></div></td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* --- ITEM SALE SUMMARY --- */}
                {activeReport === 'Item Sale Summary' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <SummaryCard label="Total Items" value={summaries.totalItems} subtext="Unique products sold" icon={<Package size={20} />} color="blue" size="small" />
                            <SummaryCard label="Total Quantity" value={summaries.totalQty?.toLocaleString()} subtext="Total units sold" icon={<TrendingUp size={20} />} color="emerald" size="small" />
                        </div>
                        <div className={`rounded-xl border overflow-hidden flex-1 ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead><tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-zinc-800 text-zinc-500 bg-zinc-900/50' : 'border-zinc-100 text-zinc-500 bg-zinc-50'}`}><th className="py-3 px-4 font-semibold">Item Name</th><th className="py-3 px-4 font-semibold">Unit</th><th className="py-3 px-4 font-semibold text-right">Quantity</th></tr></thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                                        {itemSaleSummaryData.map((row) => (<tr key={row.id} className={`group transition-colors ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-50/60'}`}><td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{row.productName}</td><td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.unit.toUpperCase()}</td><td className={`py-3 px-4 text-right font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{row.quantity}</td></tr>))}
                                        {itemSaleSummaryData.length === 0 && <tr><td colSpan={3} className={`py-12 text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><div className="flex flex-col items-center gap-2"><Filter size={24} className="opacity-50" /><p>No data found.</p></div></td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* --- MONTHLY BUSINESS SUMMARY REPORT --- */}
                {activeReport === 'Monthly Business Summary' && (
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
                )}

                {/* --- PARTY WISE SUMMARY REPORT --- */}
                {activeReport === 'Party Wise Summary' && (
                    <>
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
                                        {partySummaryData.map((row, idx) => (
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
                        </div>
                    </>
                )}

                {/* --- CUSTOMER CATEGORY REPORT (NEW REPORT) --- */}
                {activeReport === 'Customer Category Report' && (() => {
                    // Calculate last transaction and status for each customer
                    const now = new Date();
                    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                    const parseDate = (dateStr: string) => {
                        const parts = dateStr.split('-');
                        if (parts.length === 3) {
                            if (parts[0].length === 4) return new Date(dateStr);
                            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                        }
                        return new Date(0);
                    };

                    const customerDataWithStatus = customerCategoryList.map(customer => {
                        const customerSales = sales.filter(s => s.customerId === customer.id || s.customer === customer.name);
                        const custPayments = customerPayments.filter(p => p.customerId === customer.id || p.customer === customer.name);

                        const allTxDates = [
                            ...customerSales.map(s => parseDate(s.date)),
                            ...custPayments.map(p => parseDate(p.date))
                        ].filter(d => d.getTime() > 0);

                        let lastTxText = 'No transactions';
                        let isActive = false;

                        if (allTxDates.length > 0) {
                            const lastTxDate = new Date(Math.max(...allTxDates.map(d => d.getTime())));
                            const daysDiff = Math.floor((now.getTime() - lastTxDate.getTime()) / (24 * 60 * 60 * 1000));
                            lastTxText = daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Yesterday' : `${daysDiff} days ago`;
                            isActive = lastTxDate >= thirtyDaysAgo;
                        }

                        return { ...customer, lastTxText, isActive };
                    });

                    // Apply status filter
                    const filteredCustomerData = customerDataWithStatus.filter(c => {
                        if (customerStatusFilter === 'Active') return c.isActive;
                        if (customerStatusFilter === 'Inactive') return !c.isActive;
                        return true; // All
                    });

                    return (
                        <>
                            <div className="grid grid-cols-1 gap-4">
                                <SummaryCard
                                    label={`${customerStatusFilter === 'All' ? 'Total' : customerStatusFilter} ${selectedCategory} Customers`}
                                    value={filteredCustomerData.length}
                                    subtext={customerStatusFilter === 'All' ? 'Registered count' : `Based on 30-day activity`}
                                    icon={<Users size={20} />}
                                    color={customerStatusFilter === 'Active' ? 'emerald' : customerStatusFilter === 'Inactive' ? 'red' : 'blue'}
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
                                            {filteredCustomerData.map((row, idx) => (
                                                <tr key={idx} className={`group transition-colors ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-50/60'}`}>
                                                    <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{row.name}</td>
                                                    <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.phone}</td>
                                                    <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}><span className={`px-2 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800`}>{row.category}</span></td>
                                                    <td className={`py-3 px-4`}>
                                                        <span className={`px-2 py-0.5 text-[10px] rounded font-medium ${row.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                            {row.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className={`py-3 px-4 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{row.lastTxText}</td>
                                                </tr>
                                            ))}
                                            {filteredCustomerData.length === 0 && <tr><td colSpan={5} className={`py-12 text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><div className="flex flex-col items-center gap-2"><Filter size={24} className="opacity-50" /><p>No customers found.</p></div></td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    );
                })()}

                {/* --- CUSTOMER LEDGER --- */}
                {activeReport === 'Customer Ledger' && !selectedLedgerCustomer && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <SummaryCard label="Total Customers" value={summaries.total} subtext="Registered customers" icon={<Users size={20} />} color="blue" size="small" />
                            <SummaryCard label="Active Customers" value={summaries.active} subtext="Non-zero balance" icon={<Activity size={20} />} color="emerald" size="small" />
                        </div>
                        <div className={`rounded-xl border overflow-hidden flex-1 ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead><tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-zinc-800 text-zinc-500 bg-zinc-900/50' : 'border-zinc-100 text-zinc-500 bg-zinc-50'}`}>
                                        <th className="py-3 px-4 font-semibold">Customer</th>
                                        <th className="py-3 px-4 font-semibold">Phone</th>
                                        <th className="py-3 px-4 font-semibold">Category</th>
                                        <th className="py-3 px-4 font-semibold text-right">Current Balance</th>
                                        <th className="py-3 px-4 w-12"></th>
                                    </tr></thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                                        {customerLedgerList.map((row, idx) => (
                                            <tr
                                                key={idx}
                                                onClick={() => { setSelectedLedgerCustomer(row.id); setLedgerDateRange({ from: '', to: '' }); }}
                                                className={`group transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-50/60'}`}
                                            >
                                                <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{row.name}</td>
                                                <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.phone}</td>
                                                <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}><span className={`px-2 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800`}>{row.category}</span></td>
                                                <td className={`py-3 px-4 text-right font-bold ${row.balance > 0 ? 'text-red-500' : (row.balance < 0 ? 'text-emerald-500' : (isDarkMode ? 'text-zinc-400' : 'text-zinc-600'))}`}>
                                                    {formatCurrency(row.balance)}
                                                </td>
                                                <td className="py-3 px-4 text-right text-zinc-400 group-hover:text-zinc-200">
                                                    <ChevronRight size={16} />
                                                </td>
                                            </tr>
                                        ))}
                                        {customerLedgerList.length === 0 && <tr><td colSpan={5} className={`py-12 text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><div className="flex flex-col items-center gap-2"><Filter size={24} className="opacity-50" /><p>No customers found.</p></div></td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* --- PROFIT & LOSS ANALYSIS --- */}
                {activeReport === 'Profit & Loss Analysis' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <SummaryCard
                                label="Net Profit"
                                value={formatCurrency((summaries.netProfit as number))}
                                subtext="Total Revenue - Total Cost"
                                icon={<Coins size={20} />}
                                color={(summaries.netProfit as number) >= 0 ? "emerald" : "red"}
                                size="small"
                            />
                            <SummaryCard
                                label="Profit Margin"
                                value={`${(summaries.margin as number || 0).toFixed(2)}%`}
                                subtext="Average margin"
                                icon={<TrendingUp size={20} />}
                                color={(summaries.margin as number) >= 0 ? "blue" : "red"}
                                size="small"
                            />
                        </div>
                        <div className={`rounded-xl border overflow-hidden flex-1 ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead><tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-zinc-800 text-zinc-500 bg-zinc-900/50' : 'border-zinc-100 text-zinc-500 bg-zinc-50'}`}>
                                        <th className="py-3 px-4 font-semibold">Month</th>
                                        <th className="py-3 px-4 font-semibold text-right">Avg Purchase Price</th>
                                        <th className="py-3 px-4 font-semibold text-right">Avg Selling Price</th>
                                        <th className="py-3 px-4 font-semibold text-right">Status</th>
                                    </tr></thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                                        {profitAndLossData.map((row) => {
                                            const avgSell = row.totalQty > 0 ? row.totalRevenue / row.totalQty : 0;
                                            const avgBuy = row.totalQty > 0 ? row.totalCost / row.totalQty : 0;
                                            const isProfit = avgSell > avgBuy;
                                            return (
                                                <tr key={row.monthKey} className={`group transition-colors ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-50/60'}`}>
                                                    <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{row.displayMonth}</td>
                                                    <td className={`py-3 px-4 text-right ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{formatCurrency(avgBuy)}</td>
                                                    <td className={`py-3 px-4 text-right ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{formatCurrency(avgSell)}</td>
                                                    <td className={`py-3 px-4 text-right font-bold ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {isProfit ? 'Profit' : 'Loss'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {profitAndLossData.length === 0 && <tr><td colSpan={4} className={`py-12 text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><div className="flex flex-col items-center gap-2"><Filter size={24} className="opacity-50" /><p>No data found.</p></div></td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* --- SUB CATEGORY REPORT --- */}
                {activeReport === 'Sub Category Report' && (
                    <>
                        <div className="grid grid-cols-1 gap-4">
                            <SummaryCard
                                label={`Total ${selectedMetric}`}
                                value={summaries.total?.toLocaleString()}
                                subtext="Across all sub-categories"
                                icon={<Package size={20} />}
                                color="violet"
                                size="small"
                                action={
                                    <div className="w-32">
                                        <CustomDropdown
                                            options={['bags', 'tons', 'kg', 'litre']}
                                            value={selectedMetric}
                                            onChange={setSelectedMetric}
                                            icon={<Activity size={14} />}
                                            placeholder="Metric"
                                        />
                                    </div>
                                }
                            />
                        </div>
                        <div className={`rounded-xl border overflow-hidden flex-1 ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead><tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-zinc-800 text-zinc-500 bg-zinc-900/50' : 'border-zinc-100 text-zinc-500 bg-zinc-50'}`}>
                                        <th className="py-3 px-4 font-semibold">Date</th>
                                        <th className="py-3 px-4 font-semibold">Product</th>
                                        <th className="py-3 px-4 font-semibold text-right">Direct</th>
                                        <th className="py-3 px-4 font-semibold text-right">G.V</th>
                                        <th className="py-3 px-4 font-semibold text-right">GL</th>
                                        <th className="py-3 px-4 font-semibold text-right">Total Billed</th>
                                        <th className="py-3 px-4 font-semibold text-right">Total Unbilled</th>
                                        <th className="py-3 px-4 font-semibold text-right">TOTAL</th>
                                    </tr></thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                                        {subCategoryReportData.map((row, idx) => (
                                            <tr key={idx} className={`group transition-colors ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-50/60'}`}>
                                                <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{row.date}</td>
                                                <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.product}</td>
                                                <td className={`py-3 px-4 text-right ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.direct.toFixed(2)}</td>
                                                <td className={`py-3 px-4 text-right ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.gv.toFixed(2)}</td>
                                                <td className={`py-3 px-4 text-right ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.gl.toFixed(2)}</td>
                                                <td className={`py-3 px-4 text-right ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.totalBilled.toFixed(2)}</td>
                                                <td className={`py-3 px-4 text-right ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.totalUnbilled.toFixed(2)}</td>
                                                <td className={`py-3 px-4 text-right font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{row.total.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        {subCategoryReportData.length === 0 && <tr><td colSpan={8} className={`py-12 text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><div className="flex flex-col items-center gap-2"><Filter size={24} className="opacity-50" /><p>No data found.</p></div></td></tr>}
                                        {subCategoryReportData.length > 0 && (
                                            <tr className={`font-semibold ${isDarkMode ? 'bg-zinc-900/40 text-zinc-200' : 'bg-zinc-50 text-zinc-800'}`}>
                                                <td className="py-3 px-4" colSpan={2}>Totals</td>
                                                <td className="py-3 px-4 text-right">{subCategoryColumnTotals.direct.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-right">{subCategoryColumnTotals.gv.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-right">{subCategoryColumnTotals.gl.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-right">{subCategoryColumnTotals.totalBilled.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-right">{subCategoryColumnTotals.totalUnbilled.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-right font-bold">{subCategoryColumnTotals.total.toFixed(2)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* --- ACCOUNT'S REPORT --- */}
                {activeReport === "Account's Report" && (
                    <div className="space-y-6">
                        {/* ... existing code ... */}
                        <div className="grid grid-cols-2 gap-4">
                            <SummaryCard label="Total Balance" value={formatCurrency(summaries.totalBalance as number)} subtext="Across all accounts" icon={<Wallet size={20} />} color="emerald" size="small" />
                            <SummaryCard label="Active Accounts" value={summaries.activeCount} subtext="Non-zero balance" icon={<Users size={20} />} color="blue" size="small" />
                        </div>

                        {/* Account Summary Table */}
                        <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead><tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-zinc-800 text-zinc-500 bg-zinc-900/50' : 'border-zinc-100 text-zinc-500 bg-zinc-50'}`}>
                                        <th className="py-3 px-4 font-semibold">Account Name</th>
                                        <th className="py-3 px-4 font-semibold text-right">Balance (₹)</th>
                                        <th className="py-3 px-4 font-semibold text-center">Status</th>
                                        <th className="py-3 px-4 w-12"></th>
                                    </tr></thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                                        {accountReportData.map((row) => (
                                            <tr
                                                key={row.id}
                                                onClick={() => setSelectedAccount(row.name)}
                                                className={`group transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-50/60'}`}
                                            >
                                                <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{row.name}</td>
                                                <td className={`py-3 px-4 text-right font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{row.balance.toLocaleString()}</td>
                                                <td className={`py-3 px-4 text-center text-xs`}>
                                                    <span className={`px-2 py-1 rounded-full font-medium ${row.status === 'Active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right text-zinc-400 group-hover:text-zinc-200">
                                                    <ChevronRight size={16} />
                                                </td>
                                            </tr>
                                        ))}
                                        {accountReportData.length === 0 && <tr><td colSpan={4} className={`py-12 text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><p>No account data found for the selected date range</p></td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Detailed Transaction Table (Conditionally Rendered) */}
                        {selectedAccount !== 'All' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'}`}><ListChecks size={16} /></div>
                                    <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>Transaction History: {selectedAccount}</h3>
                                </div>
                                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'}`}>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead><tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-zinc-800 text-zinc-500 bg-zinc-900/50' : 'border-zinc-100 text-zinc-500 bg-zinc-50'}`}>
                                                <th className="py-3 px-4 font-semibold">Date</th>
                                                <th className="py-3 px-4 font-semibold">Description</th>
                                                <th className="py-3 px-4 font-semibold">Category</th>
                                                <th className="py-3 px-4 font-semibold">Type</th>
                                                <th className="py-3 px-4 font-semibold text-right">Amount (₹)</th>
                                                <th className="py-3 px-4 font-semibold text-right">Balance (₹)</th>
                                            </tr></thead>
                                            <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                                                {(() => {
                                                    // Calculate running balance for oldest-first order
                                                    // First, calculate the opening balance by reversing all transactions from current balance
                                                    const currentAccountBalance = accountReportData.find(a => a.name === selectedAccount)?.balance || 0;
                                                    let openingBalance = currentAccountBalance;

                                                    // Reverse all transactions to get opening balance
                                                    specificAccountTransactions.forEach(tx => {
                                                        const amount = parseFloat(String(tx.amount).replace(/,/g, '')) || 0;
                                                        if (tx.type === 'Credit') {
                                                            openingBalance -= amount;
                                                        } else {
                                                            openingBalance += amount;
                                                        }
                                                    });

                                                    // Now calculate running balance going forward (oldest to newest)
                                                    let runningBalance = openingBalance;
                                                    const txWithBalances = specificAccountTransactions.map((tx) => {
                                                        const amount = parseFloat(String(tx.amount).replace(/,/g, '')) || 0;
                                                        if (tx.type === 'Credit') {
                                                            runningBalance += amount;
                                                        } else {
                                                            runningBalance -= amount;
                                                        }
                                                        return { ...tx, runningBalance };
                                                    });

                                                    return txWithBalances.map((tx) => (
                                                        <tr key={tx.id} className={`group transition-colors ${isDarkMode ? 'hover:bg-zinc-900/40' : 'hover:bg-zinc-50/60'}`}>
                                                            <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{tx.date}</td>
                                                            <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{tx.description}</td>
                                                            <td className={`py-3 px-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{tx.category}</td>
                                                            <td className={`py-3 px-4 text-xs`}><span className={`px-2 py-0.5 rounded ${tx.type === 'Credit' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{tx.type}</span></td>
                                                            <td className={`py-3 px-4 text-right font-medium ${tx.type === 'Credit' ? 'text-emerald-500' : 'text-red-500'}`}>{tx.type === 'Credit' ? '+' : '-'}{tx.amount}</td>
                                                            <td className={`py-3 px-4 text-right font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>₹{tx.runningBalance.toLocaleString()}</td>
                                                        </tr>
                                                    ));
                                                })()}
                                                {specificAccountTransactions.length === 0 && <tr><td colSpan={6} className={`py-8 text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>No transactions found in this period.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- NOTES REPORT --- */}
                {activeReport === 'Notes Report' && (
                    <div className={`p-6 rounded-xl border flex flex-col gap-6 h-full ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                        <div>
                            <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Business Notes</h3>
                            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Record general notes, ideas, or reminders for your business. You can export these as a PDF.</p>
                        </div>

                        {/* Date Option Removed as per request */}

                        <div className="flex-1 flex flex-col gap-2">
                            <label className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Notes Content</label>
                            <textarea
                                value={reportNotes}
                                onChange={(e) => setReportNotes(e.target.value)}
                                placeholder="Type your notes here..."
                                className={`flex-1 w-full p-4 rounded-lg border text-sm resize-none outline-none transition-all ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'}`}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}