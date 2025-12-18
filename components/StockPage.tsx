import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { ThemeContext, DataContext } from '../App';
import { THEMES, StockItem, StockTransaction } from '../types';
import {
    Plus, ArrowRightLeft, Store, X, ArrowLeft, History,
    TrendingDown, TrendingUp, ShoppingCart, PackagePlus, Receipt,
    ChevronDown, Check, Calendar, FileText, Search, Filter, Pencil, Trash2, Trash,
    ChevronLeft, ChevronRight, AlertTriangle, Box, Copy
} from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';
import { VirtualizedList } from './VirtualizedList';
import { CustomCalendar, CustomDropdown } from './shared';

// Products are now fetched from the DataContext instead of being hardcoded

export default function StockPage() {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const { stocks, addStock, updateStock, deleteStock, stockTransactions, addStockTransaction, updateStockTransaction, deleteStockTransaction, products } = useContext(DataContext);
    const themeConfig = THEMES[theme];

    // Get product names from database
    const productOptions = useMemo(() => products?.map((p: any) => p.name) || [], [products]);

    // Use data from context
    const stocksList = stocks;
    const allTransactions = stockTransactions;

    const [selectedShop, setSelectedShop] = useState<any>(null);

    // Modals State
    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
    const [isDumpModalOpen, setIsDumpModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isAddShopModalOpen, setIsAddShopModalOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<{ id: number, shopId: number, type: string, quantity: string } | null>(null);

    // --- Logic Handlers ---

    const handleUpdateStock = async (shopId: number, change: number) => {
        const shop = stocksList.find(s => s.id === shopId);
        if (!shop) return;

        const newQuantity = parseInt(shop.quantity) + change;
        const thresholdVal = parseInt(shop.threshold);
        const updatedShop = {
            ...shop,
            quantity: newQuantity.toString(),
            status: newQuantity > thresholdVal ? 'Normal' : 'Low Stock'
        };
        await updateStock(updatedShop);
    };

    const handleAddTransaction = async (transaction: StockTransaction) => {
        await addStockTransaction(transaction);

        // Update stock quantity based on transaction type
        const qty = parseInt(transaction.quantity || '0');

        // Sale and Transfer Out SUBTRACT from stock
        if (transaction.type === 'Sale' || transaction.type === 'Transfer Out') {
            handleUpdateStock(transaction.shopId, -qty);
            // Add Stock, Transfer In, and Dump ADD to stock
        } else if (transaction.type === 'Add Stock' || transaction.type === 'Transfer In' || transaction.type === 'Dump') {
            handleUpdateStock(transaction.shopId, qty);
        }
    };

    const handleEditTransaction = async (updatedTx: StockTransaction & { _docId?: string }) => {
        const oldTx = allTransactions.find(t => t.id === updatedTx.id);
        if (!oldTx) return;

        const oldQty = parseInt(oldTx.quantity || '0');
        const newQty = parseInt(updatedTx.quantity || '0');

        // Calculate NET stock change in a single operation to avoid race conditions
        // For Sale: old was -oldQty effect, new is -newQty effect
        // Net change = revert old + apply new = +oldQty + (-newQty) = oldQty - newQty

        // For Add Stock/Dump: old was +oldQty effect, new is +newQty effect  
        // Net change = revert old + apply new = -oldQty + (+newQty) = newQty - oldQty

        let netChange = 0;

        // Sale and Transfer Out SUBTRACT from stock
        if (oldTx.type === 'Sale' || oldTx.type === 'Transfer Out') {
            // These subtract from stock, so to revert we add, to apply new we subtract
            // Net = +oldQty - newQty
            netChange = oldQty - newQty;
            // Add Stock, Transfer In, and Dump ADD to stock
        } else if (oldTx.type === 'Add Stock' || oldTx.type === 'Transfer In' || oldTx.type === 'Dump') {
            // These add to stock, so to revert we subtract, to apply new we add
            // Net = -oldQty + newQty = newQty - oldQty
            netChange = newQty - oldQty;
        }

        // Apply the net change in a single operation
        if (netChange !== 0) {
            await handleUpdateStock(oldTx.shopId, netChange);
        }

        // Update transaction in Firebase
        await updateStockTransaction(updatedTx);
    };

    const handleDeleteTransaction = (id: number, shopId: number, type: string, quantity: string) => {
        setPendingDelete({ id, shopId, type, quantity });
    };

    const confirmDeleteTransaction = async () => {
        if (!pendingDelete) return;

        await deleteStockTransaction(pendingDelete.id);

        // Reverse the stock effect safely
        const qty = parseInt(pendingDelete.quantity || '0');
        if (!isNaN(qty) && pendingDelete.shopId) {
            // Sale and Transfer Out SUBTRACT - so add back on delete
            if (pendingDelete.type === 'Sale' || pendingDelete.type === 'Transfer Out') {
                handleUpdateStock(pendingDelete.shopId, qty); // Add back (was subtracted)
                // Add Stock, Transfer In, and Dump ADD - so subtract on delete
            } else if (pendingDelete.type === 'Add Stock' || pendingDelete.type === 'Transfer In' || pendingDelete.type === 'Dump') {
                handleUpdateStock(pendingDelete.shopId, -qty); // Remove (was added)
            }
        }

        setPendingDelete(null);
    };

    // 1. Add Stock (New Transaction Type)
    const handleAddStock = (data: any) => {
        const shop = stocksList.find(s => s.id === parseInt(data.shopId));
        if (!shop) return;

        const newTransaction: StockTransaction = {
            id: Date.now(),
            shopId: parseInt(data.shopId),
            type: 'Add Stock',
            quantity: data.quantity,
            unit: shop.unit,
            date: data.date ? formatDate(data.date) : formatDate(new Date()),
            amount: '0',
            price: '0',
            purchasePrice: '0',
            customer: '-',
            product: data.product || 'Stock Refill',
            note: data.notes
        };

        handleAddTransaction(newTransaction);
        setIsAddStockModalOpen(false);
    };

    // 2. Dump Stock (adds stock to selected product)
    const handleDumpStock = (data: any) => {
        const shop = stocksList.find(s => s.id === parseInt(data.shopId));
        if (!shop) return;

        const newTransaction: StockTransaction = {
            id: Date.now(),
            shopId: parseInt(data.shopId),
            type: 'Dump',
            quantity: data.quantity,
            unit: shop.unit,
            date: data.date ? formatDate(data.date) : formatDate(new Date()),
            amount: '0',
            price: '0',
            purchasePrice: '0',
            customer: '-',
            product: data.product || 'Stock Addition',
            note: data.notes
        };

        handleAddTransaction(newTransaction);
        setIsDumpModalOpen(false);
    };

    // 3. Transfer Stock
    const handleTransferStock = (data: any) => {
        const fromShop = stocksList.find(s => s.id === parseInt(data.fromShopId));
        const toShop = stocksList.find(s => s.id === parseInt(data.toShopId));

        if (!fromShop || !toShop) return;

        const dateStr = formatDate(new Date());

        // Create Outgoing Transaction
        const txOut: StockTransaction = {
            id: Date.now(),
            shopId: fromShop.id,
            type: 'Transfer Out',
            quantity: data.quantity,
            unit: fromShop.unit,
            date: dateStr,
            amount: '0',
            price: '0',
            purchasePrice: '0',
            customer: '-',
            product: `Transfer to ${toShop.shop}`,
            note: `Transferred to ${toShop.shop}`
        };

        // Create Incoming Transaction
        const txIn: StockTransaction = {
            id: Date.now() + 1,
            shopId: toShop.id,
            type: 'Transfer In',
            quantity: data.quantity,
            unit: toShop.unit,
            date: dateStr,
            amount: '0',
            price: '0',
            purchasePrice: '0',
            customer: '-',
            product: `Transfer from ${fromShop.shop}`,
            note: `Received from ${fromShop.shop}`
        };

        handleAddTransaction(txOut);
        handleAddTransaction(txIn);
        setIsTransferModalOpen(false);
    };

    // 4. Add New Shop
    const handleAddShop = async (data: any) => {
        const totalQty = parseInt(data.quantity || '0');
        const newShop: StockItem = {
            id: Date.now(),
            shop: data.shopName,
            quantity: data.quantity,
            unit: 'bags',
            threshold: `${data.threshold} bags`,
            status: totalQty > parseInt(data.threshold) ? 'Normal' : 'Low Stock'
        };
        await addStock(newShop);

        const productLines = (data.products || []).filter((p: any) => p.product && p.quantity !== '');
        const hasProductLines = productLines.length > 0;

        if (totalQty > 0 || hasProductLines) {
            const txList: StockTransaction[] = hasProductLines
                ? productLines.map((p: any, idx: number) => ({
                    id: Date.now() + 1 + idx,
                    shopId: newShop.id,
                    type: 'Add Stock' as const,
                    quantity: p.quantity,
                    unit: 'bags',
                    date: data.date ? formatDate(data.date) : formatDate(new Date()),
                    amount: '0',
                    price: '0',
                    purchasePrice: '0',
                    customer: '-',
                    product: p.product || 'Initial Stock',
                    note: 'Shop Creation'
                }))
                : [{
                    id: Date.now() + 1,
                    shopId: newShop.id,
                    type: 'Add Stock' as const,
                    quantity: data.quantity,
                    unit: 'bags',
                    date: data.date ? formatDate(data.date) : formatDate(new Date()),
                    amount: '0',
                    price: '0',
                    purchasePrice: '0',
                    customer: '-',
                    product: 'Initial Stock',
                    note: 'Shop Creation'
                }];

            // Add each transaction to Firebase
            for (const tx of txList) {
                await addStockTransaction(tx);
            }
        }

        setIsAddShopModalOpen(false);
    };

    const formatDate = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    if (selectedShop) {
        const currentShopData = stocksList.find(s => s.id === selectedShop.id) || selectedShop;
        const shopTransactions = allTransactions.filter(t => t.shopId === currentShopData.id);

        return (
            <>
                <ShopDetails
                    shop={currentShopData}
                    transactions={shopTransactions}
                    onBack={() => setSelectedShop(null)}
                    onAddTransaction={handleAddTransaction}
                    onEditTransaction={handleEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    productOptions={productOptions}
                />
                <DeleteConfirmModal
                    open={!!pendingDelete}
                    title="Delete transaction?"
                    description="This will remove the transaction and revert its stock impact."
                    onCancel={() => setPendingDelete(null)}
                    onConfirm={confirmDeleteTransaction}
                />
            </>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Stock Overview</h1>

                {/* Desktop Buttons */}
                <div className="hidden md:flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setIsDumpModalOpen(true)}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'}`}
                    >
                        <Trash2 size={14} />
                        <span className="whitespace-nowrap">Dump</span>
                    </button>
                    <button
                        onClick={() => setIsAddShopModalOpen(true)}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'}`}
                    >
                        <Store size={14} />
                        <span className="whitespace-nowrap">Add Shop</span>
                    </button>
                    <button
                        onClick={() => setIsTransferModalOpen(true)}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'}`}
                    >
                        <ArrowRightLeft size={14} />
                        <span className="whitespace-nowrap">Transfer</span>
                    </button>
                    <button
                        onClick={() => setIsAddStockModalOpen(true)}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 shadow-sm active:scale-95 ${themeConfig.twBg}`}
                    >
                        <Plus size={16} />
                        <span className="whitespace-nowrap">Add Stock</span>
                    </button>
                </div>

                {/* Mobile Segmented Control */}
                <div className={`md:hidden flex items-center w-full rounded-lg border shadow-sm overflow-hidden ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <button
                        onClick={() => setIsDumpModalOpen(true)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-medium border-r transition-colors ${isDarkMode ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                    >
                        <Trash2 size={13} />
                        <span>Dump</span>
                    </button>
                    <button
                        onClick={() => setIsAddShopModalOpen(true)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-medium border-r transition-colors ${isDarkMode ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                    >
                        <Store size={13} />
                        <span>Shop</span>
                    </button>
                    <button
                        onClick={() => setIsTransferModalOpen(true)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-medium border-r transition-colors ${isDarkMode ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                    >
                        <ArrowRightLeft size={13} />
                        <span>Transfer</span>
                    </button>
                    <button
                        onClick={() => setIsAddStockModalOpen(true)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-medium transition-colors ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800' : 'text-zinc-700 hover:bg-zinc-50'}`}
                    >
                        <Plus size={13} />
                        <span>Add</span>
                    </button>
                </div>
            </div>

            {/* Stock Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stocksList.map((stock) => (
                    <div
                        key={stock.id}
                        onClick={() => setSelectedShop(stock)}
                        className={`
                            group cursor-pointer p-5 rounded-xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden min-h-[140px]
                            ${isDarkMode
                                ? 'bg-[#09090b] border-zinc-800 hover:border-zinc-700'
                                : 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md'}
                        `}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-100 border border-zinc-200'}`}>
                                    <Store size={18} className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'} />
                                </div>
                                <div>
                                    <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{stock.shop}</h3>
                                    {/* ID removed as requested */}
                                </div>
                            </div>
                            <div className={`p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}>
                                <ArrowRightLeft size={14} />
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="flex items-baseline gap-1">
                                <span className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                    {stock.quantity}
                                </span>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                    {stock.unit}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-dashed flex items-center justify-between dark:border-zinc-800 border-zinc-100">
                            <div className={`text-[10px] font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                Threshold: {stock.threshold}
                            </div>
                            <span className={`
                                inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border
                                ${stock.status === 'Normal'
                                    ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                                    : (isDarkMode ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-red-50 text-red-700 border-red-200')}
                            `}>
                                {stock.status === 'Normal' ? <Check size={10} className="mr-1" /> : <AlertTriangle size={10} className="mr-1" />}
                                {stock.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            {isAddStockModalOpen && (
                <AddStockModal onClose={() => setIsAddStockModalOpen(false)} onAdd={handleAddStock} shops={stocksList} productOptions={productOptions} />
            )}
            {isDumpModalOpen && (
                <AddDumpModal onClose={() => setIsDumpModalOpen(false)} onDump={handleDumpStock} shops={stocksList} productOptions={productOptions} />
            )}
            {isTransferModalOpen && (
                <TransferStockModal onClose={() => setIsTransferModalOpen(false)} onTransfer={handleTransferStock} shops={stocksList} />
            )}
            {isAddShopModalOpen && (
                <AddShopModal onClose={() => setIsAddShopModalOpen(false)} onSave={handleAddShop} productOptions={productOptions} />
            )}

            <DeleteConfirmModal
                open={!!pendingDelete}
                title="Delete transaction?"
                description="This will remove the transaction and revert its stock impact."
                onCancel={() => setPendingDelete(null)}
                onConfirm={confirmDeleteTransaction}
            />
        </div>
    );
}

// ----------------------------------------------------------------------
// SHOP DETAILS SUB-COMPONENT
// ----------------------------------------------------------------------

function ShopDetails({
    shop,
    transactions,
    onBack,
    onAddTransaction,
    onEditTransaction,
    onDeleteTransaction,
    productOptions
}: {
    shop: any,
    transactions: any[],
    onBack: () => void,
    onAddTransaction: (t: any) => void,
    onEditTransaction: (t: any) => void,
    onDeleteTransaction: (id: number, shopId: number, type: string, quantity: string) => void,
    productOptions?: string[]
}) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];

    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isDumpModalOpen, setIsDumpModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);

    const [activeSection, setActiveSection] = useState('Recent Sales');
    const [activeTab, setActiveTab] = useState('All Time');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);

    const productQuantities = useMemo(() => {
        const totals: Record<string, number> = {};
        transactions.forEach(t => {
            if (!t.product) return;
            const qty = parseFloat(t.quantity || '0');
            if (isNaN(qty) || qty === 0) return;
            let delta = 0;
            // Add Stock, Transfer In, and Dump ADD to product quantity
            if (t.type === 'Add Stock' || t.type === 'Transfer In' || t.type === 'Dump') delta = qty;
            // Sale and Transfer Out SUBTRACT from product quantity
            else if (t.type === 'Sale' || t.type === 'Transfer Out') delta = -qty;
            if (delta === 0) return;
            totals[t.product] = (totals[t.product] || 0) + delta;
        });
        return Object.entries(totals)
            .map(([product, quantity]) => ({ product, quantity }))
            .filter(item => item.quantity !== 0)
            .sort((a, b) => b.quantity - a.quantity);
    }, [transactions]);

    const toggleNote = (id: number) => {
        setExpandedNoteId(prev => prev === id ? null : id);
    };

    const handleRecordSale = (data: any) => {
        const dateStr = data.date ? formatDate(data.date) : formatDate(new Date());

        if (editingTransaction) {
            const updatedTx = {
                ...editingTransaction,
                product: data.productType,
                quantity: data.quantity,
                date: dateStr,
                note: data.notes
            };
            onEditTransaction(updatedTx);
        } else {
            const newTransaction: StockTransaction = {
                id: Date.now(),
                shopId: shop.id,
                type: 'Sale',
                quantity: data.quantity,
                unit: shop.unit,
                date: dateStr,
                amount: '0',
                price: '0',
                purchasePrice: '0',
                customer: '-',
                product: data.productType,
                note: data.notes
            };
            onAddTransaction(newTransaction);
        }

        setIsSaleModalOpen(false);
        setEditingTransaction(null);
    };

    const handleRecordDump = (data: any) => {
        const dateStr = data.date ? formatDate(data.date) : formatDate(new Date());

        if (editingTransaction) {
            const updatedTx = {
                ...editingTransaction,
                product: data.product,
                quantity: data.quantity,
                date: dateStr,
                note: data.notes
            };
            onEditTransaction(updatedTx);
        } else {
            const newTransaction: StockTransaction = {
                id: Date.now(),
                shopId: shop.id,
                type: 'Dump',
                quantity: data.quantity,
                unit: shop.unit,
                date: dateStr,
                amount: '0',
                price: '0',
                purchasePrice: '0',
                customer: '-',
                product: data.product || 'Stock Addition',
                note: data.notes
            };
            onAddTransaction(newTransaction);
        }
        setIsDumpModalOpen(false);
        setEditingTransaction(null);
    };

    const handleEdit = (item: any) => {
        setEditingTransaction(item);
        if (item.type === 'Dump') {
            setIsDumpModalOpen(true);
        } else {
            setIsSaleModalOpen(true);
        }
    };

    const formatDate = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const filteredTransactions = useMemo(() => {
        let data = transactions.filter(t => {
            if (activeSection === 'Recent Sales') {
                return t.type === 'Sale' || t.type === 'Add Stock' || t.type === 'Transfer In' || t.type === 'Transfer Out';
            } else {
                return t.type === 'Dump';
            }
        });

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            data = data.filter(item =>
                (item.product && item.product.toLowerCase().includes(query)) ||
                (item.note && item.note.toLowerCase().includes(query)) ||
                (item.type && item.type.toLowerCase().includes(query))
            );
        }

        if (activeTab !== 'All Time') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const parseDate = (dateStr: string) => {
                const [d, m, y] = dateStr.split('-').map(Number);
                return new Date(y, m - 1, d);
            };

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
    }, [activeSection, transactions, searchQuery, activeTab]);

    return (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20 md:pb-0">
            {/* Navigation Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border
                            ${isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800' : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200'}
                        `}
                    >
                        <ArrowLeft size={14} />
                        Back
                    </button>
                    <div>
                        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{shop.shop}</h1>
                        <div className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Current Stock: {shop.quantity} {shop.unit}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => { setEditingTransaction(null); setIsDumpModalOpen(true); }}
                        className={`
                            flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'}
                        `}
                    >
                        <Trash2 size={14} />
                        <span className="whitespace-nowrap">Dump</span>
                    </button>
                    <button
                        onClick={() => { setEditingTransaction(null); setIsSaleModalOpen(true); }}
                        className={`
                            flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all shadow-lg active:scale-95 hover:opacity-90
                            ${themeConfig.twBg}
                        `}
                    >
                        <Plus size={14} />
                        <span className="whitespace-nowrap">Record Sale</span>
                    </button>
                </div>
            </div>

            {/* Product snapshot for this shop */}
            <div className={`rounded-xl border p-4 ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Products in this Shop</div>
                        <div className={`text-[11px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Live quantities by product</div>
                    </div>
                </div>
                <div className="mt-3 space-y-2">
                    {productQuantities.length > 0 ? (
                        productQuantities.map((item) => (
                            <div key={item.product} className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${isDarkMode ? 'bg-zinc-900/60 text-zinc-200' : 'bg-zinc-50 text-zinc-800'}`}>
                                <span className="font-medium truncate pr-2">{item.product}</span>
                                <span className={`text-xs font-semibold ${item.quantity < 0 ? 'text-red-500' : (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')}`}>
                                    {item.quantity} {shop.unit}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>No product quantities yet.</div>
                    )}
                </div>
            </div>

            {/* Tabs and Filters */}
            <div className={`
                rounded-xl border overflow-hidden transition-colors mb-4
                ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}
            `}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <div className="flex items-center gap-6 text-sm flex-wrap pb-2 sm:pb-0">
                        {['Recent Sales', 'Recent Dumps'].map((tab) => (
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
                    {/* Single Line Filters */}
                    <div className={`flex items-center p-1 rounded-lg border w-full sm:w-auto overflow-x-auto scrollbar-hide whitespace-nowrap ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                        {['All Time', 'Today', 'Last 7 Days', 'This Month', 'Last 3 Months'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveTab(filter)}
                                className={`
                                    px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all
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
                                placeholder="Search..."
                                className={`
                                    w-full pl-9 pr-4 py-2 rounded-lg text-xs border outline-none transition-all
                                    ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'}
                                `}
                            />
                        </div>
                        <button onClick={() => { setSearchQuery(''); setActiveTab('All Time'); }} className={`text-xs font-medium transition-colors whitespace-nowrap ${isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}>Clear All</button>
                    </div>
                </div>
            </div>

            {/* List Section */}
            {filteredTransactions.length > 0 ? (
                <VirtualizedList<StockTransaction>
                    items={filteredTransactions}
                    estimatedItemHeight={expandedNoteId ? 180 : 90}
                    containerHeight="calc(100vh - 380px)"
                    columns={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
                    gap={12}
                    overscan={5}
                    renderItem={(item: StockTransaction) => {
                        const isExpanded = expandedNoteId === item.id;
                        const isPositive = item.type === 'Add Stock' || item.type === 'Transfer In' || item.type === 'Dump';
                        const isNegative = item.type === 'Sale' || item.type === 'Transfer Out';

                        return (
                            <div
                                className={`
                                    flex flex-col p-0 rounded-xl border transition-all duration-200 group
                                    ${isDarkMode ? 'bg-[#09090b] border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300'}
                                `}
                                style={{ borderLeftWidth: '4px', borderLeftColor: isPositive ? '#10b981' : (isNegative ? themeConfig.primary : '#ef4444') }}
                            >
                                <div className="flex flex-row items-center justify-between p-3 md:p-4 w-full">
                                    <div className="flex gap-3 items-center flex-1 min-w-0">
                                        <div className={`shrink-0 px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wide ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
                                            {item.type}
                                        </div>
                                        <div className="min-w-0">
                                            <div className={`text-sm font-medium truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>
                                                {item.customer && item.customer !== '-' ? (
                                                    <>
                                                        <span className="hidden sm:inline">{item.type === 'Sale' ? 'Sale to ' : 'From '}</span>
                                                        <span className={isDarkMode ? 'text-white' : 'text-black font-semibold'}>{item.customer}</span>
                                                    </>
                                                ) : (
                                                    <span className={isDarkMode ? 'text-white' : 'text-zinc-900 font-semibold'}>{item.product}</span>
                                                )}
                                            </div>
                                            <div className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                                {item.customer && item.customer !== '-' ? item.product : (item.note || item.type)}
                                            </div>
                                            <div className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                {item.date}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-center gap-1 ml-2">
                                        <div className="text-right shrink-0">
                                            <div className={`text-sm font-bold ${isPositive ? 'text-emerald-500' : (isDarkMode ? 'text-white' : 'text-zinc-900')}`}>
                                                {isPositive ? '+' : '-'} {item.quantity} {item.unit}
                                            </div>
                                            {item.amount && item.amount !== '0' && (
                                                <div className={`text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                    ₹{item.amount}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => toggleNote(item.id)}
                                                className={`p-1 rounded transition-colors ${isExpanded ? (isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800') : (isDarkMode ? 'text-zinc-500 hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-100')}`}
                                                title="Notes"
                                            >
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
                                                onClick={(e) => { e.stopPropagation(); onDeleteTransaction(item.id, item.shopId || shop.id, item.type, item.quantity); }}
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

            {isSaleModalOpen && (
                <AddShopSaleModal
                    onClose={() => { setIsSaleModalOpen(false); setEditingTransaction(null); }}
                    onSave={handleRecordSale}
                    unit={shop.unit}
                    initialData={editingTransaction}
                    productOptions={productOptions}
                />
            )}

            {isDumpModalOpen && (
                <AddDumpModal
                    onClose={() => { setIsDumpModalOpen(false); setEditingTransaction(null); }}
                    onDump={handleRecordDump}
                    shops={[]} // Not used when fixedShopId is provided
                    fixedShopId={shop.id.toString()}
                    initialData={editingTransaction}
                />
            )}
        </div>
    );
}

// ----------------------------------------------------------------------
// MODALS
// ----------------------------------------------------------------------

function AddShopSaleModal({ onClose, onSave, unit, initialData, productOptions }: { onClose: () => void, onSave: (data: any) => void, unit: string, initialData?: any, productOptions: string[] }) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];

    // Form States
    const [productType, setProductType] = useState('');
    const [quantity, setQuantity] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [notes, setNotes] = useState('');

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (initialData) {
            setProductType(initialData.product);
            setQuantity(initialData.quantity);
            setNotes(initialData.note);
            if (initialData.date) {
                const [d, m, y] = initialData.date.split('-').map(Number);
                setDate(new Date(y, m - 1, d));
            }
        }
    }, [initialData]);

    const handleSubmit = () => {
        if (!quantity || !productType) return;
        onSave({ productType, quantity, date, notes });
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
                    <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{initialData ? 'Edit Shop Sale' : 'Record Shop Sale'}</h2>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] scrollbar-hide">

                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Product Type</label>
                        <CustomDropdown
                            options={productOptions}
                            value={productType}
                            onChange={setProductType}
                            placeholder="Select product type"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Quantity ({unit})</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="0"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`}
                        />
                    </div>

                    <div className="space-y-1.5 relative" ref={calendarRef}>
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Date</label>
                        <button
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between transition-all outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'} ${isCalendarOpen ? 'ring-2 ring-zinc-500/20 border-transparent' : ''}`}
                        >
                            <span className={!date ? (isDarkMode ? 'text-zinc-500' : 'text-zinc-400') : ''}>{formatDate(date)}</span>
                            <Calendar size={14} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />
                        </button>
                        {isCalendarOpen && (
                            <div className="absolute bottom-full mb-2 left-0 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <CustomCalendar value={date} onChange={(d) => { setDate(d); setIsCalendarOpen(false); }} onClose={() => setIsCalendarOpen(false)} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Note (Optional)</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Broken bags"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`}
                        />
                    </div>
                </div>
                <div className="p-4 border-t dark:border-zinc-800 flex justify-end gap-3">
                    <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>Cancel</button>
                    <button onClick={handleSubmit} className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 ${themeConfig.twBg}`}>
                        {initialData ? 'Update Sale' : 'Confirm Sale'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddDumpModal({ onClose, onDump, shops, fixedShopId, initialData, productOptions }: { onClose: () => void, onDump: (data: any) => void, shops: any[], fixedShopId?: string, initialData?: any, productOptions?: string[] }) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];

    const [shopId, setShopId] = useState(fixedShopId || '');
    const [product, setProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (initialData) {
            if (!fixedShopId) setShopId(initialData.shopId);
            setProduct(initialData.product || '');
            setQuantity(initialData.quantity);
            setNotes(initialData.note);
            if (initialData.date) {
                const [d, m, y] = initialData.date.split('-').map(Number);
                setDate(new Date(y, m - 1, d));
            }
        }
    }, [initialData, fixedShopId]);

    const handleSubmit = () => {
        if (!shopId || !quantity || !product) return;
        onDump({ shopId, product, quantity, notes, date });
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "dd-mm-yyyy";
        return date.toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-xl border shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
                    <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{initialData ? 'Edit Dump' : 'Add Stock (Dump)'}</h2>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    {!fixedShopId && (
                        <div className="space-y-1.5">
                            <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Location (Shop)</label>
                            <CustomDropdown
                                options={shops.map(s => s.shop)}
                                value={shops.find(s => s.id === parseInt(shopId))?.shop || ''}
                                onChange={(val: string) => {
                                    const s = shops.find(shop => shop.shop === val);
                                    if (s) setShopId(s.id.toString());
                                }}
                                placeholder="Select Shop"
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Product</label>
                        <CustomDropdown
                            options={productOptions || []}
                            value={product}
                            onChange={(val: string) => setProduct(val)}
                            placeholder="Select Product"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Quantity</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="0"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`}
                        />
                    </div>

                    <div className="space-y-1.5 relative" ref={calendarRef}>
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Date</label>
                        <button
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between transition-all outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'} ${isCalendarOpen ? 'ring-2 ring-zinc-500/20 border-transparent' : ''}`}
                        >
                            <span className={!date ? (isDarkMode ? 'text-zinc-500' : 'text-zinc-400') : ''}>{formatDate(date)}</span>
                            <Calendar size={14} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />
                        </button>
                        {isCalendarOpen && (
                            <div className="absolute bottom-full mb-2 left-0 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <CustomCalendar value={date} onChange={(d) => { setDate(d); setIsCalendarOpen(false); }} onClose={() => setIsCalendarOpen(false)} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Notes</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notes (e.g. Received from supplier)"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`}
                        />
                    </div>
                </div>
                <div className="p-4 border-t dark:border-zinc-800 flex justify-end gap-3">
                    <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>Cancel</button>
                    <button onClick={handleSubmit} className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 ${isDarkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
                        {initialData ? 'Update Dump' : 'Confirm Dump'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddStockModal({ onClose, onAdd, shops, productOptions }: { onClose: () => void, onAdd: (data: any) => void, shops: any[], productOptions?: string[] }) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];

    const [shopId, setShopId] = useState('');
    const [product, setProduct] = useState('');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = () => {
        if (!shopId || !product || !quantity) return;
        onAdd({ shopId, product, quantity, notes, date });
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "dd-mm-yyyy";
        return date.toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-xl border shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
                    <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Add Stock</h2>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Location</label>
                        <CustomDropdown
                            options={shops.map(s => s.shop)}
                            value={shops.find(s => s.id === parseInt(shopId))?.shop || ''}
                            onChange={(val: string) => {
                                const s = shops.find(shop => shop.shop === val);
                                if (s) setShopId(s.id.toString());
                            }}
                            placeholder="Select Location"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Product</label>
                        <CustomDropdown
                            options={productOptions || []}
                            value={product}
                            onChange={setProduct}
                            placeholder="Select Product"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Quantity (bags)</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`}
                        />
                    </div>

                    <div className="space-y-1.5 relative" ref={calendarRef}>
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Date</label>
                        <button
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between transition-all outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'} ${isCalendarOpen ? 'ring-2 ring-zinc-500/20 border-transparent' : ''}`}
                        >
                            <span className={!date ? (isDarkMode ? 'text-zinc-500' : 'text-zinc-400') : ''}>{formatDate(date)}</span>
                            <Calendar size={14} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />
                        </button>
                        {isCalendarOpen && (
                            <div className="absolute bottom-full mb-2 left-0 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <CustomCalendar value={date} onChange={(d) => { setDate(d); setIsCalendarOpen(false); }} onClose={() => setIsCalendarOpen(false)} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Notes</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Restock from vendor"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`}
                        />
                    </div>
                </div>
                <div className="p-4 border-t dark:border-zinc-800 flex justify-end gap-3">
                    <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>Cancel</button>
                    <button onClick={handleSubmit} className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 ${themeConfig.twBg}`}>
                        Save Stock
                    </button>
                </div>
            </div>
        </div>
    );
}

function TransferStockModal({ onClose, onTransfer, shops }: { onClose: () => void, onTransfer: (data: any) => void, shops: any[] }) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];

    const [fromShopId, setFromShopId] = useState('');
    const [toShopId, setToShopId] = useState('');
    const [quantity, setQuantity] = useState('');

    const handleSubmit = () => {
        if (!fromShopId || !toShopId || !quantity) return;
        if (fromShopId === toShopId) {
            alert("Cannot transfer to the same location");
            return;
        }
        onTransfer({ fromShopId, toShopId, quantity });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-xl border shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
                    <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Transfer Stock</h2>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>From Location</label>
                        <CustomDropdown
                            options={shops.map(s => s.shop)}
                            value={shops.find(s => s.id === parseInt(fromShopId))?.shop || ''}
                            onChange={(val: string) => {
                                const s = shops.find(shop => shop.shop === val);
                                if (s) setFromShopId(s.id.toString());
                            }}
                            placeholder="Select source location"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>To Location</label>
                        <CustomDropdown
                            options={shops.map(s => s.shop)}
                            value={shops.find(s => s.id === parseInt(toShopId))?.shop || ''}
                            onChange={(val: string) => {
                                const s = shops.find(shop => shop.shop === val);
                                if (s) setToShopId(s.id.toString());
                            }}
                            placeholder="Select destination location"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Quantity to Transfer</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`}
                        />
                    </div>
                </div>
                <div className="p-4 border-t dark:border-zinc-800">
                    <button onClick={handleSubmit} className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 ${themeConfig.twBg}`}>
                        Transfer Stock
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddShopModal({ onClose, onSave, productOptions }: { onClose: () => void, onSave: (data: any) => void, productOptions?: string[] }) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];
    const [shopName, setShopName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [threshold, setThreshold] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [productLines, setProductLines] = useState<{ id: number; product: string; quantity: string; }[]>([{ id: Date.now(), product: '', quantity: '' }]);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = () => {
        if (!shopName) return;
        const cleanedProducts = productLines.filter(p => p.product && p.quantity !== '');
        const totalFromProducts = cleanedProducts.reduce((sum, p) => sum + parseFloat(p.quantity || '0'), 0);
        const finalQuantity = quantity || (totalFromProducts ? totalFromProducts.toString() : '0');
        onSave({ shopName, quantity: finalQuantity, threshold: threshold || '0', date, products: cleanedProducts });
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "dd-mm-yyyy";
        return date.toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-xl border shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
                    <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Add New Shop</h2>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Shop Name</label>
                        <input
                            type="text"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            placeholder="e.g., Shop 3"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Products</label>
                            <button
                                type="button"
                                onClick={() => setProductLines(prev => [...prev, { id: Date.now(), product: '', quantity: '' }])}
                                className={`flex items-center gap-1 text-[11px] font-semibold ${isDarkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
                            >
                                <Plus size={12} /> Add More Product
                            </button>
                        </div>
                        <div className="space-y-2">
                            {productLines.map((line, idx) => (
                                <div key={line.id} className="grid grid-cols-3 gap-2 items-end">
                                    <div className="col-span-2">
                                        <CustomDropdown
                                            options={productOptions || []}
                                            value={line.product}
                                            onChange={(val: string) => setProductLines(prev => prev.map(p => p.id === line.id ? { ...p, product: val } : p))}
                                            placeholder={`Select Product ${idx + 1}`}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            value={line.quantity}
                                            onChange={e => setProductLines(prev => prev.map(p => p.id === line.id ? { ...p, quantity: e.target.value } : p))}
                                            placeholder="Qty"
                                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Initial Quantity (bags)</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="e.g., 100"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Threshold (bags)</label>
                        <input
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            placeholder="e.g., 100"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`}
                        />
                    </div>
                    <div className="space-y-1.5 relative" ref={calendarRef}>
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Date</label>
                        <button
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between transition-all outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'} ${isCalendarOpen ? 'ring-2 ring-zinc-500/20 border-transparent' : ''}`}
                        >
                            <span className={!date ? (isDarkMode ? 'text-zinc-500' : 'text-zinc-400') : ''}>{formatDate(date)}</span>
                            <Calendar size={14} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />
                        </button>
                        {isCalendarOpen && (
                            <div className="absolute bottom-full mb-2 left-0 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <CustomCalendar value={date} onChange={(d) => { setDate(d); setIsCalendarOpen(false); }} onClose={() => setIsCalendarOpen(false)} />
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 border-t dark:border-zinc-800">
                    <button onClick={handleSubmit} className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 ${themeConfig.twBg}`}>
                        Save Shop
                    </button>
                </div>
            </div>
        </div>
    );
}
