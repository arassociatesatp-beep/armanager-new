
import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { ThemeContext, DataContext } from '../App';
import { THEMES } from '../types';
import { Plus, ChevronDown, X, Check, Trophy } from 'lucide-react';

// Mock Data matching the image, reduced to 3 to make room for the custom leaderboard card
const stats = [
    { value: '8', label: 'Total Products', sub: 'Available product types', color: 'text-violet-500' },
    { value: '7', label: 'Cement Products', sub: 'Cement and concrete products', color: 'text-emerald-500' },
    { value: '1', label: 'Other Products', sub: 'Paint and steel products', color: 'text-pink-500' },
    { value: 'JSW OPC', label: 'Most Sold Product', sub: 'Cement', color: 'text-blue-500' },
];

const initialProducts = [
    { name: 'JSW CHD', category: 'Cement' },
    { name: 'JSW OPC', category: 'Cement' },
    { name: 'jsw ppc', category: 'Cement' },
    { name: 'JSW WATERGAURD', category: 'Cement' },
    { name: 'RMC', category: 'Concrete' },
    { name: 'SHREE OPC', category: 'Cement' },
    { name: 'SHREE PPC', category: 'Cement' },
    { name: 'SHREE ROOF ON', category: 'Cement' },
];

// Leaderboard Data - Monochrome Colors
const topProductsFallback = [
    { name: 'JSW OPC', sales: 1240, percent: 85, color: 'bg-zinc-900 dark:bg-zinc-100' },
    { name: 'Shree PPC', sales: 850, percent: 60, color: 'bg-zinc-600 dark:bg-zinc-400' },
    { name: 'RMC Concrete', sales: 540, percent: 35, color: 'bg-zinc-400 dark:bg-zinc-600' },
];

export default function ProductManagement() {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const { sales, products, addProduct } = useContext(DataContext);
    const themeConfig = THEMES[theme];
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Use products from context only (no fallback to hardcoded list)
    const productsList = products;

    // Filter State
    const [filterCategory, setFilterCategory] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const topSelling = useMemo(() => {
        if (!sales || sales.length === 0) return [];

        const totals: Record<string, number> = {};

        sales.forEach((s: any) => {
            const name = (s.product?.split(' • ')[0] || 'Unknown').trim();
            const qtyPart = s.product?.split(' • ')[1]?.trim()?.split(' ')[0];
            const qty = parseFloat(qtyPart || '0');
            const amountVal = parseFloat((s.amount || '0').toString().replace(/,/g, '')) || 0;
            const contribution = !isNaN(qty) && qty > 0 ? qty : amountVal || 1;
            totals[name] = (totals[name] || 0) + contribution;
        });

        const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const maxVal = entries[0]?.[1] || 1;

        return entries.map(([name, value]) => ({
            name,
            sales: Math.round(value),
            percent: Math.round((value / maxVal) * 100),
        }));
    }, [sales]);

    const handleAddProduct = (newProduct: { name: string; category: string }) => {
        // Add product to Firebase
        addProduct({
            id: Date.now(),
            name: newProduct.name,
            category: newProduct.category
        });
        setIsModalOpen(false);
    };

    // Derived Data
    const uniqueCategories = ['All', ...new Set(productsList.map(p => p.category))];
    const filteredProducts = filterCategory === 'All'
        ? productsList
        : productsList.filter(p => p.category === filterCategory);

    const productsForCard = topSelling.length ? topSelling : topProductsFallback;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 relative">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <h1 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Product Management</h1>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={`
                            flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm active:scale-95
                            ${themeConfig.twBg} text-white hover:opacity-90
                        `}
                    >
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Standard Stats Cards */}
                {stats.slice(0, 3).map((stat, index) => (
                    <div
                        key={index}
                        className={`
                            p-5 md:p-6 rounded-xl border transition-all duration-200 
                            ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}
                        `}
                    >
                        <div className={`text-3xl md:text-4xl font-bold mb-2 ${stat.color}`}>{stat.value}</div>
                        <div className={`font-semibold mb-1 text-base ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{stat.label}</div>
                        <div className={`text-xs md:text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{stat.sub}</div>
                    </div>
                ))}

                {/* Animated Leaderboard Card (Takes up the 4th slot) */}
                <div className={`
                    p-4 rounded-xl border transition-all duration-200 flex flex-col justify-center
                    ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}
                `}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`p-1.5 rounded-full ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
                            <Trophy size={14} />
                        </div>
                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Top Selling</span>
                    </div>

                    <div className="space-y-3">
                        {productsForCard.map((product, idx) => {
                            const barColor = topSelling.length
                                ? ['bg-emerald-500', 'bg-indigo-500', 'bg-amber-500'][idx] || 'bg-zinc-500'
                                : product.color;

                            return (
                                <div key={idx} className="space-y-1 animate-in slide-in-from-left-4 fade-in duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
                                    <div className="flex justify-between text-xs">
                                        <span className={`font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{product.name}</span>
                                        <span className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}>{product.sales} units</span>
                                    </div>
                                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                                        <div
                                            className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
                                            style={{ width: `${Math.min(product.percent, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {!productsForCard.length && (
                            <div className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>No sales data yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Product Types Section */}
            <div className={`p-4 md:p-6 rounded-xl border ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <div className="flex flex-row items-start justify-between gap-4 mb-6">
                    <div>
                        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Product Types</h2>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Manage available product categories</p>
                    </div>

                    {/* Functional Dropdown Filter - Small & Right Aligned */}
                    <div className="relative" ref={filterRef}>
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors
                                ${isDarkMode
                                    ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:border-zinc-500'
                                    : 'bg-white border-zinc-300 text-zinc-900 hover:border-zinc-400'}
                            `}
                        >
                            <span>{filterCategory}</span>
                            <ChevronDown size={14} className="opacity-60" />
                        </button>

                        {isFilterOpen && (
                            <div className={`
                                absolute right-0 top-full mt-1 w-32 rounded-lg border shadow-lg overflow-hidden z-10 p-1
                                ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}
                            `}>
                                {uniqueCategories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            setFilterCategory(cat);
                                            setIsFilterOpen(false);
                                        }}
                                        className={`
                                            w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between
                                            ${filterCategory === cat
                                                ? (isDarkMode ? 'bg-zinc-800 text-white font-medium' : 'bg-zinc-100 text-zinc-900 font-medium')
                                                : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')}
                                        `}
                                    >
                                        {cat}
                                        {filterCategory === cat && <Check size={12} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid - 2 Columns on Mobile, 4 on Large Screens */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {filteredProducts.map((product, index) => (
                        <div key={index} className={`p-4 rounded-lg border transition-colors group ${isDarkMode ? 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700' : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300'}`}>
                            <h3 className={`font-bold text-sm mb-3 uppercase tracking-wide truncate ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{product.name}</h3>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] md:text-xs font-medium ${product.category === 'Concrete'
                                ? (isDarkMode ? 'bg-fuchsia-500/10 text-fuchsia-400' : 'bg-fuchsia-100 text-fuchsia-700')
                                : (isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-700')
                                }`}>
                                {product.category}
                            </span>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className={`col-span-full py-8 text-center text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            No products found in this category.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && <AddProductModal onClose={() => setIsModalOpen(false)} onSave={handleAddProduct} />}
        </div>
    );
}

function AddProductModal({ onClose, onSave }: { onClose: () => void; onSave: (p: { name: string; category: string }) => void }) {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];

    const [productName, setProductName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [customCategoryName, setCustomCategoryName] = useState('');

    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSave = () => {
        if (!productName.trim()) return;
        if (!selectedCategory) return;

        const finalCategory = selectedCategory === 'Custom' ? customCategoryName : selectedCategory;
        if (!finalCategory.trim()) return;

        onSave({ name: productName, category: finalCategory });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className={`
                relative w-full max-w-md rounded-xl border shadow-2xl transform transition-all scale-100 flex flex-col items-center justify-center p-4
                ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}
            `}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 shrink-0 w-full">
                    <div>
                        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Add Product</h2>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            Enter product details below. Click save when you're done.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Fields */}
                <div className="p-6 pt-2 space-y-4 w-full">

                    {/* Product Name */}
                    <div className="space-y-2">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Product Name</label>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="e.g., Paint, Steel, Cement Type A"
                            className={`
                                w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all
                                ${isDarkMode
                                    ? 'bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600'
                                    : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400'}
                                focus:border-transparent focus:ring-2 focus:ring-zinc-500/50
                            `}
                        />
                    </div>

                    {/* Category Custom Dropdown */}
                    <div className="space-y-2 relative z-20" ref={dropdownRef}>
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Category</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                className={`
                                    w-full px-3 py-2.5 rounded-lg border text-sm text-left flex items-center justify-between transition-all outline-none
                                    ${isDarkMode
                                        ? 'bg-zinc-900/50 border-zinc-800'
                                        : 'bg-white border-zinc-200'}
                                    ${selectedCategory
                                        ? (isDarkMode ? 'text-zinc-100' : 'text-zinc-900')
                                        : (isDarkMode ? 'text-zinc-600' : 'text-zinc-400')}
                                    ${isCategoryDropdownOpen ? `border-transparent ring-2 ring-zinc-500/50` : ''}
                                `}
                            >
                                <span>{selectedCategory || "Select Category"}</span>
                                <ChevronDown size={16} className={`transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                            </button>

                            {isCategoryDropdownOpen && (
                                <div className={`
                                    absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1
                                    ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}
                                `}>
                                    {['Cement', 'Concrete', 'Custom'].map((option) => (
                                        <div
                                            key={option}
                                            onClick={() => {
                                                setSelectedCategory(option);
                                                setIsCategoryDropdownOpen(false);
                                            }}
                                            className={`
                                                px-3 py-2 text-sm cursor-pointer transition-colors rounded-md flex items-center justify-between
                                                ${selectedCategory === option
                                                    ? (isDarkMode ? 'bg-zinc-800 font-semibold text-white' : 'bg-zinc-100 font-semibold text-zinc-900')
                                                    : (isDarkMode ? 'text-zinc-300 hover:bg-zinc-800' : 'text-zinc-700 hover:bg-zinc-100')}
                                            `}
                                        >
                                            {option}
                                            {selectedCategory === option && <Check size={14} className={isDarkMode ? 'text-white' : 'text-zinc-900'} />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Custom Category Name */}
                    {selectedCategory === 'Custom' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                            <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Custom Category Name</label>
                            <input
                                type="text"
                                value={customCategoryName}
                                onChange={(e) => setCustomCategoryName(e.target.value)}
                                placeholder="Enter new category name"
                                className={`
                                    w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all
                                    ${isDarkMode
                                        ? 'bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600'
                                        : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400'}
                                    focus:border-transparent focus:ring-2 focus:ring-zinc-500/50
                                `}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`p-6 flex justify-end gap-3 border-t shrink-0 w-full ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <button
                        onClick={onClose}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-colors
                            ${isDarkMode
                                ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                                : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'}
                        `}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm
                            ${themeConfig.twBg} text-white hover:opacity-90
                        `}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
