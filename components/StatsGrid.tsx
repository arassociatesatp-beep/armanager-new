import React, { useContext, useMemo } from 'react';
import { ThemeContext, DataContext } from '../App';
import { THEMES } from '../types';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    subtext: string;
    icon?: React.ReactNode;
}

// Simple Give/Get card matching the user's reference image style
interface GiveGetCardProps {
    title: string;
    value: number;
    type: 'give' | 'get';
}

export default function StatsGrid() {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];
    const { customers, sales, payments } = useContext(DataContext);

    // Calculate customer balances: opening + sales - payments
    // Calculate dynamic metrics
    const { youWillGive, youWillGet, totalRevenue, newCustomers, revenueChange, customerChange } = useMemo(() => {
        let give = 0; // Total amount owed TO customers (negative balances / advances)
        let get = 0;  // Total amount owed BY customers (positive balances / outstanding)

        customers.forEach(customer => {
            // Get all sales for this customer
            const customerSales = sales.filter(s =>
                s.customerId === customer.id || s.customer === customer.name
            );
            const totalSales = customerSales.reduce((acc, sale) =>
                acc + parseFloat(sale.amount.replace(/,/g, '') || '0'), 0
            );

            // Get all payments from this customer
            const customerPayments = payments.filter(p =>
                p.customerId === customer.id || p.customer === customer.name
            );
            const totalPayments = customerPayments.reduce((acc, payment) =>
                acc + parseFloat(payment.amount.replace(/,/g, '') || '0'), 0
            );

            // Calculate balance: opening + sales - payments
            const opening = parseFloat(customer.openingBalance || '0');
            const balance = opening + totalSales - totalPayments;

            if (balance > 0) {
                // Positive balance = customer owes us = You Will Get
                get += balance;
            } else if (balance < 0) {
                // Negative balance = we owe customer (advance paid) = You Will Give
                give += Math.abs(balance);
            }
        });

        // Calculate Total Revenue from all sales
        const revenue = sales.reduce((acc, sale) =>
            acc + parseFloat(sale.amount.replace(/,/g, '') || '0'), 0
        );

        // Get current date info
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Parse date string (dd-mm-yyyy)
        const parseDate = (dateStr: string) => {
            const [d, m, y] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        // Calculate this month's revenue
        const thisMonthRevenue = sales.filter(s => {
            const saleDate = parseDate(s.date);
            return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
        }).reduce((acc, sale) => acc + parseFloat(sale.amount.replace(/,/g, '') || '0'), 0);

        // Calculate last month's revenue
        const lastMonthRevenue = sales.filter(s => {
            const saleDate = parseDate(s.date);
            return saleDate.getMonth() === lastMonth && saleDate.getFullYear() === lastMonthYear;
        }).reduce((acc, sale) => acc + parseFloat(sale.amount.replace(/,/g, '') || '0'), 0);

        // Calculate revenue percentage change
        const revChange = lastMonthRevenue > 0
            ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : thisMonthRevenue > 0 ? 100 : 0;

        // Calculate new customers this month
        const newCust = customers.filter(c => {
            if (!c.registerDate) return false;
            const regDate = parseDate(c.registerDate);
            return regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear;
        }).length;

        // Calculate new customers last month
        const lastMonthCust = customers.filter(c => {
            if (!c.registerDate) return false;
            const regDate = parseDate(c.registerDate);
            return regDate.getMonth() === lastMonth && regDate.getFullYear() === lastMonthYear;
        }).length;

        // Calculate customer percentage change
        const custChange = lastMonthCust > 0
            ? ((newCust - lastMonthCust) / lastMonthCust) * 100
            : newCust > 0 ? 100 : 0;

        return {
            youWillGive: give,
            youWillGet: get,
            totalRevenue: revenue,
            newCustomers: newCust,
            revenueChange: revChange,
            customerChange: custChange
        };
    }, [customers, sales, payments]);

    // Format currency for display
    const formatCurrency = (num: number) => `₹${Math.round(num).toLocaleString('en-IN')}`;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
            <StatCard
                title="Total Revenue"
                value={formatCurrency(totalRevenue)}
                change={`${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`}
                trend={revenueChange >= 0 ? "up" : "down"}
                subtext={revenueChange >= 0 ? "Trending up this month" : "Down from last month"}
            />
            <StatCard
                title="New Customers"
                value={newCustomers.toString()}
                change={`${customerChange >= 0 ? '+' : ''}${customerChange.toFixed(1)}%`}
                trend={customerChange >= 0 ? "up" : "down"}
                subtext={customerChange >= 0 ? "Up from last month" : "Down from last month"}
            />
            {/* You Will Give Card */}
            <GiveGetCard
                title="You will give"
                value={youWillGive}
                type="give"
            />
            {/* You Will Get Card */}
            <GiveGetCard
                title="You will get"
                value={youWillGet}
                type="get"
            />
        </div>
    );
}

function GiveGetCard({ title, value, type }: GiveGetCardProps) {
    const { isDarkMode } = useContext(ThemeContext);

    // Give = green (money we owe), Get = red (money owed to us / outstanding)
    const isGive = type === 'give';
    const colorClass = isGive ? 'text-emerald-500' : 'text-red-500';
    const Icon = isGive ? ArrowUpRight : ArrowDownRight;

    // Format value with Indian numbering system
    const formatIndianCurrency = (num: number) => {
        return num.toLocaleString('en-IN');
    };

    return (
        <div className={`
            p-6 rounded-xl border transition-all duration-300 flex flex-col justify-between
            ${isDarkMode
                ? 'bg-[#09090b] border-zinc-800 hover:border-zinc-700'
                : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm'}
        `}>
            <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {title}
                </span>
                <div className={`p-1.5 rounded-full ${isGive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    <Icon size={14} className={colorClass} strokeWidth={2.5} />
                </div>
            </div>

            <div>
                <h3 className={`text-2xl md:text-3xl font-bold tracking-tight ${colorClass}`}>
                    ₹{formatIndianCurrency(value)}
                </h3>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {isGive ? 'Advances to customers' : 'Outstanding from customers'}
                </p>
            </div>
        </div>
    );
}

function StatCard({ title, value, change, trend, subtext }: StatCardProps) {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];

    const isPositive = trend === 'up';

    return (
        <div className={`
            p-6 rounded-xl border transition-all duration-300 flex flex-col gap-4
            ${isDarkMode
                ? 'bg-[#09090b] border-zinc-800 hover:border-zinc-700'
                : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm'}
        `}>
            <div className="flex justify-between items-start">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{title}</span>
                <span className={`
                    text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1
                    ${isPositive
                        ? (isDarkMode ? 'text-emerald-400 bg-emerald-400/10' : 'text-emerald-700 bg-emerald-50 border border-emerald-100')
                        : (isDarkMode ? 'text-red-400 bg-red-400/10' : 'text-zinc-700 bg-zinc-100 border border-zinc-200')}
                `}>
                    {isPositive ? <TrendingUp size={12} strokeWidth={2} /> : <TrendingDown size={12} strokeWidth={2} />}
                    {change}
                </span>
            </div>

            <div>
                <h3 className={`text-3xl font-semibold tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{value}</h3>

                <div className="flex items-center gap-2">
                    <span className={`text-xs font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {subtext}
                    </span>
                    {isPositive
                        ? <TrendingUp size={14} className={isDarkMode ? themeConfig.twText : 'text-zinc-900'} />
                        : <TrendingDown size={14} className="text-red-500" />
                    }
                </div>
            </div>
        </div>
    )
}