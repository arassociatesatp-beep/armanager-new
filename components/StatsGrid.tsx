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
    const { youWillGive, youWillGet } = useMemo(() => {
        let give = 0; // Total amount owed TO customers (negative balances / advances)
        let get = 0;  // Total amount owed BY customers (positive balances / outstanding)

        // Filter out Gandhi payments (internal adjustments)
        const visiblePayments = payments.filter(p => !p.isGandhi);

        customers.forEach(customer => {
            // Get all sales for this customer
            const customerSales = sales.filter(s =>
                s.customerId === customer.id || s.customer === customer.name
            );
            const totalSales = customerSales.reduce((acc, sale) =>
                acc + parseFloat(sale.amount.replace(/,/g, '') || '0'), 0
            );

            // Get all payments from this customer
            const customerPayments = visiblePayments.filter(p =>
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

        return { youWillGive: give, youWillGet: get };
    }, [customers, sales, payments]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
            <StatCard
                title="Total Revenue"
                value="₹1,25,000"
                change="+12.5%"
                trend="up"
                subtext="Trending up this month"
            />
            <StatCard
                title="New Customers"
                value="1,234"
                change="-20.0%"
                trend="down"
                subtext="Down 20% this period"
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