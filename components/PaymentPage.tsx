
import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { ThemeContext, DataContext } from '../App';
import { THEMES } from '../types';
import {
    Plus, ArrowRightLeft, Wallet, Building2, CreditCard,
    Calendar, X, Search, ArrowLeft,
    TrendingUp, ArrowUpRight, ArrowDownLeft,
    ChevronRight, WalletCards, ChevronLeft, ChevronDown, Check
} from 'lucide-react';
import { VirtualizedList } from './VirtualizedList';
import { CustomCalendar } from './shared';

export default function PaymentPage() {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];

    // Consume shared data from App.tsx
    const { accounts, addAccount, addGlobalTransaction, globalTransactions } = useContext(DataContext);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);

    // Modals
    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
    const [isRemoveFundsOpen, setIsRemoveFundsOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    // Handlers
    const handleAddAccount = (data: any) => {
        const date = data.date || new Date();
        const dateString = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;

        const newAccount = {
            id: Date.now(),
            name: data.name,
            type: 'General',
            balance: data.balance || '0',
            accountNumber: '-',
            openingBalance: data.balance || '0',
            openingDate: dateString
        };
        addAccount(newAccount);
        setIsAddAccountOpen(false);
    };

    const handleAddFunds = (data: any) => {
        addGlobalTransaction({
            id: Date.now(),
            accountId: parseInt(data.accountId),
            type: 'Credit',
            amount: data.amount,
            date: data.date ? formatDate(data.date) : formatDate(new Date()),
            description: data.description,
            category: 'Deposit'
        });
        setIsAddFundsOpen(false);
    };

    const handleRemoveFunds = (data: any) => {
        addGlobalTransaction({
            id: Date.now(),
            accountId: parseInt(data.accountId),
            type: 'Debit',
            amount: data.amount,
            date: data.date ? formatDate(data.date) : formatDate(new Date()),
            description: data.description,
            category: 'Withdrawal'
        });
        setIsRemoveFundsOpen(false);
    };

    const handleTransfer = (data: any) => {
        const fromName = getAccountName(data.fromAccountId);
        const toName = getAccountName(data.toAccountId);
        const dateStr = data.date ? formatDate(data.date) : formatDate(new Date());

        addGlobalTransaction({
            id: Date.now(),
            accountId: parseInt(data.fromAccountId),
            type: 'Debit',
            amount: data.amount,
            date: dateStr,
            description: `Transfer to ${toName}`,
            category: 'Transfer'
        });

        addGlobalTransaction({
            id: Date.now() + 1,
            accountId: parseInt(data.toAccountId),
            type: 'Credit',
            amount: data.amount,
            date: dateStr,
            description: `Transfer from ${fromName}`,
            category: 'Transfer'
        });

        setIsTransferOpen(false);
    };

    const getAccountName = (id: number) => accounts.find(a => a.id === parseInt(id.toString()))?.name || 'Unknown Account';
    const formatDate = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const totalBalance = useMemo(() => {
        return accounts.reduce((sum, acc) => sum + parseFloat(acc.balance.replace(/,/g, '')), 0).toLocaleString();
    }, [accounts]);

    const thisMonthFlow = useMemo(() => {
        return globalTransactions.reduce((acc, tx) => {
            const amt = parseFloat(tx.amount.replace(/,/g, ''));
            return tx.type === 'Credit' ? acc + amt : acc - amt;
        }, 0).toLocaleString();
    }, [globalTransactions]);

    if (selectedAccount) {
        // Refresh account data from context to get latest balance
        const currentAccountData = accounts.find(a => a.id === selectedAccount.id) || selectedAccount;
        return (
            <AccountDetails
                account={currentAccountData}
                transactions={globalTransactions.filter(t => t.accountId === currentAccountData.id)}
                onBack={() => setSelectedAccount(null)}
            />
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Payments & Accounts</h1>

                {/* Desktop Buttons */}
                <div className="hidden md:flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setIsTransferOpen(true)}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'}`}
                    >
                        <ArrowRightLeft size={14} />
                        <span className="whitespace-nowrap">Transfer</span>
                    </button>
                    <button
                        onClick={() => setIsAddFundsOpen(true)}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'}`}
                    >
                        <ArrowUpRight size={14} />
                        <span className="whitespace-nowrap">Add Funds</span>
                    </button>
                    <button
                        onClick={() => setIsRemoveFundsOpen(true)}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'}`}
                    >
                        <ArrowDownLeft size={14} />
                        <span className="whitespace-nowrap">Remove Funds</span>
                    </button>
                    <button
                        onClick={() => setIsAddAccountOpen(true)}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 shadow-sm active:scale-95 ${themeConfig.twBg}`}
                    >
                        <Plus size={14} />
                        <span className="whitespace-nowrap">Add Account</span>
                    </button>
                </div>

                {/* Mobile Segmented Control */}
                <div className={`md:hidden flex items-center w-full rounded-lg border shadow-sm overflow-hidden ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <button
                        onClick={() => setIsTransferOpen(true)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium border-r transition-colors whitespace-nowrap ${isDarkMode ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                    >
                        <ArrowRightLeft size={13} />
                        <span>Transfer</span>
                    </button>
                    <button
                        onClick={() => setIsAddFundsOpen(true)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium border-r transition-colors whitespace-nowrap ${isDarkMode ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                    >
                        <ArrowUpRight size={13} />
                        <span>Add</span>
                    </button>
                    <button
                        onClick={() => setIsRemoveFundsOpen(true)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium border-r transition-colors whitespace-nowrap ${isDarkMode ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                    >
                        <ArrowDownLeft size={13} />
                        <span>Remove</span>
                    </button>
                    <button
                        onClick={() => setIsAddAccountOpen(true)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors whitespace-nowrap text-white ${themeConfig.twBg} hover:opacity-90`}
                    >
                        <Plus size={13} />
                        <span>Add Acct</span>
                    </button>
                </div>
            </div>

            {/* Compact Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStatCard
                    label="Active Accounts"
                    value={accounts.length.toString()}
                    icon={<Wallet size={16} />}
                />
                <MiniStatCard
                    label="Total Balance"
                    value={`₹${totalBalance}`}
                    icon={<CreditCard size={16} />}
                />
                <MiniStatCard
                    label="This Month"
                    value={`₹${thisMonthFlow}`}
                    icon={<TrendingUp size={16} />}
                />
            </div>

            {/* Accounts Table - Reduced columns */}
            <div className={`rounded-md border overflow-hidden ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className={`[&_tr]:border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                            <tr className={`border-b transition-colors ${isDarkMode ? 'border-zinc-800 hover:bg-zinc-900/50' : 'border-zinc-200 hover:bg-zinc-50/50'}`}>
                                <th className={`h-10 px-4 text-left align-middle font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Account Name</th>
                                <th className={`h-10 px-4 text-right align-middle font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Balance</th>
                                <th className="w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody className={`[&_tr:last-child]:border-0`}>
                            {accounts.map(account => (
                                <tr
                                    key={account.id}
                                    onClick={() => setSelectedAccount(account)}
                                    className={`border-b transition-colors cursor-pointer group ${isDarkMode ? 'border-zinc-800 hover:bg-zinc-900/50' : 'border-zinc-200 hover:bg-zinc-50/50'}`}
                                >
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
                                                {account.type === 'Bank' ? <Building2 size={16} /> : (account.type === 'Wallet' ? <CreditCard size={16} /> : <Wallet size={16} />)}
                                            </div>
                                            <span className={`font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{account.name}</span>
                                        </div>
                                    </td>
                                    <td className={`p-4 align-middle text-right font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>₹{account.balance}</td>
                                    <td className="p-4 align-middle text-right">
                                        <ChevronRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {isAddAccountOpen && <AddAccountModal onClose={() => setIsAddAccountOpen(false)} onSave={handleAddAccount} />}
            {isAddFundsOpen && <AddFundsModal onClose={() => setIsAddFundsOpen(false)} onSave={handleAddFunds} accounts={accounts} />}
            {isRemoveFundsOpen && <RemoveFundsModal onClose={() => setIsRemoveFundsOpen(false)} onSave={handleRemoveFunds} accounts={accounts} />}
            {isTransferOpen && <TransferModal onClose={() => setIsTransferOpen(false)} onSave={handleTransfer} accounts={accounts} />}
        </div>
    );
}

// --- Sub Components ---

function MiniStatCard({ label, value, icon }: any) {
    const { isDarkMode } = useContext(ThemeContext);
    return (
        <div className={`p-3 rounded-lg border flex items-center justify-between transition-all ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div>
                <div className={`text-[10px] font-medium mb-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{label}</div>
                <div className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{value}</div>
            </div>
            <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
                {icon}
            </div>
        </div>
    )
}

function AccountDetails({ account, transactions, onBack }: any) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTransactions = transactions.filter((t: any) =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.amount.includes(searchQuery)
    );

    return (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20 md:pb-0">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800' : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200'}`}>
                    <ArrowLeft size={14} /> Back
                </button>
                <div>
                    <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{account.name}</h1>
                    <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{account.type} Account</p>
                </div>
            </div>

            <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className={`text-sm mb-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Current Balance</div>
                        <div className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>₹{account.balance}</div>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search transactions..."
                            className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs border outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'}`}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Transaction History</h3>

                {/* Opening Balance shown first */}
                <div
                    className={`flex items-center justify-between p-3 rounded-xl border border-dashed transition-all ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50/50 border-zinc-300'}`}
                >
                    <div className="flex gap-3 items-center">
                        <div className={`p-1.5 rounded-full ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'}`}>
                            <WalletCards size={14} />
                        </div>
                        <div>
                            <div className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Opening Balance</div>
                            <div className={`text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{account.openingDate}</div>
                        </div>
                    </div>
                    <div className={`text-xs font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        ₹{account.openingBalance}
                    </div>
                </div>

                {filteredTransactions.length > 0 ? (
                    <VirtualizedList<any>
                        items={filteredTransactions}
                        estimatedItemHeight={80}
                        containerHeight="calc(100vh - 380px)"
                        columns={1}
                        gap={12}
                        overscan={5}
                        renderItem={(tx: any) => (
                            <div
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-[#09090b] border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 shadow-sm hover:border-zinc-300'}`}
                                style={{ borderLeftWidth: '4px', borderLeftColor: tx.type === 'Credit' ? '#10b981' : '#ef4444' }}
                            >
                                <div className="flex gap-3 items-center">
                                    <div className={`p-2 rounded-full ${tx.type === 'Credit' ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600') : (isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-600')}`}>
                                        {tx.type === 'Credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{tx.description}</div>
                                        <div className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{tx.date} • {tx.category}</div>
                                    </div>
                                </div>
                                <div className={`text-sm font-bold ${tx.type === 'Credit' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {tx.type === 'Credit' ? '+' : '-'}₹{tx.amount}
                                </div>
                            </div>
                        )}
                    />
                ) : (
                    <div className={`p-8 text-center rounded-xl border ${isDarkMode ? 'bg-[#09090b] border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400'}`}>
                        No transactions found.
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Modals ---

function AddAccountModal({ onClose, onSave }: any) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    return (
        <ModalWrapper onClose={onClose} title="Add New Account">
            <div className="space-y-4">
                <InputGroup label="Account Name" value={name} onChange={setName} placeholder="e.g. HDFC Main" />
                <InputGroup label="Opening Balance" value={balance} onChange={setBalance} placeholder="0.00" type="number" />

                <div className="space-y-1.5 relative">
                    <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Date</label>
                    <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'}`}>
                        <span>{date ? date.toLocaleDateString() : 'Select Date'}</span>
                        <Calendar size={14} className="opacity-50" />
                    </button>
                    {isCalendarOpen && <div className="absolute bottom-full mb-2 left-0 z-50"><CustomCalendar value={date} onChange={(d) => { setDate(d); setIsCalendarOpen(false) }} onClose={() => setIsCalendarOpen(false)} /></div>}
                </div>

                <div className="pt-4 flex gap-3">
                    <button onClick={onClose} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>Cancel</button>
                    <button onClick={() => onSave({ name, balance, date })} className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white ${themeConfig.twBg} hover:opacity-90`}>Save Account</button>
                </div>
            </div>
        </ModalWrapper>
    );
}

function AddFundsModal({ onClose, onSave, accounts }: any) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];
    const [accountId, setAccountId] = useState((accounts[0]?.id ?? '').toString());
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    return (
        <ModalWrapper onClose={onClose} title="Add Funds">
            <div className="space-y-4">
                <AccountSelect
                    label="Select Account"
                    value={accountId}
                    onChange={setAccountId}
                    options={accounts.map((a: any) => ({ value: a.id.toString(), label: a.name }))}
                />
                <InputGroup label="Amount" value={amount} onChange={setAmount} placeholder="0.00" type="number" />
                <InputGroup label="Source / Description" value={description} onChange={setDescription} placeholder="e.g. Owner Investment" />

                <div className="space-y-1.5 relative">
                    <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Date</label>
                    <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'}`}>
                        <span>{date ? date.toLocaleDateString() : 'Select Date'}</span>
                        <Calendar size={14} className="opacity-50" />
                    </button>
                    {isCalendarOpen && <div className="absolute bottom-full mb-2 left-0 z-50"><CustomCalendar value={date} onChange={(d) => { setDate(d); setIsCalendarOpen(false) }} onClose={() => setIsCalendarOpen(false)} /></div>}
                </div>

                <div className="pt-4 flex gap-3">
                    <button onClick={onClose} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>Cancel</button>
                    <button onClick={() => onSave({ accountId, amount, description, date })} className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white ${themeConfig.twBg} hover:opacity-90`}>Add Funds</button>
                </div>
            </div>
        </ModalWrapper>
    );
}

function RemoveFundsModal({ onClose, onSave, accounts }: any) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];
    const [accountId, setAccountId] = useState((accounts[0]?.id ?? '').toString());
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    return (
        <ModalWrapper onClose={onClose} title="Remove Funds">
            <div className="space-y-4">
                <AccountSelect
                    label="From Account"
                    value={accountId}
                    onChange={setAccountId}
                    options={accounts.map((a: any) => ({ value: a.id.toString(), label: a.name }))}
                />
                <InputGroup label="Amount" value={amount} onChange={setAmount} placeholder="0.00" type="number" />
                <InputGroup label="Reason / Description" value={description} onChange={setDescription} placeholder="e.g. Personal Withdrawal" />
                <div className="space-y-1.5 relative">
                    <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Date</label>
                    <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'}`}>
                        <span>{date ? date.toLocaleDateString() : 'Select Date'}</span>
                        <Calendar size={14} className="opacity-50" />
                    </button>
                    {isCalendarOpen && <div className="absolute bottom-full mb-2 left-0 z-50"><CustomCalendar value={date} onChange={(d) => { setDate(d); setIsCalendarOpen(false) }} onClose={() => setIsCalendarOpen(false)} /></div>}
                </div>
                <div className="pt-4 flex gap-3">
                    <button onClick={onClose} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>Cancel</button>
                    <button onClick={() => onSave({ accountId, amount, description, date })} className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600`}>Remove Funds</button>
                </div>
            </div>
        </ModalWrapper>
    );
}

function TransferModal({ onClose, onSave, accounts }: any) {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];
    const [fromAccountId, setFromAccountId] = useState((accounts[0]?.id ?? '').toString());
    const [toAccountId, setToAccountId] = useState((accounts[1]?.id ?? accounts[0]?.id ?? '').toString());
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    return (
        <ModalWrapper onClose={onClose} title="Transfer Funds">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <AccountSelect
                        label="From"
                        value={fromAccountId}
                        onChange={setFromAccountId}
                        options={accounts.map((a: any) => ({ value: a.id.toString(), label: a.name }))}
                    />
                    <AccountSelect
                        label="To"
                        value={toAccountId}
                        onChange={setToAccountId}
                        options={accounts.map((a: any) => ({ value: a.id.toString(), label: a.name }))}
                    />
                </div>
                <InputGroup label="Amount" value={amount} onChange={setAmount} placeholder="0.00" type="number" />
                <div className="space-y-1.5 relative">
                    <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Date</label>
                    <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'}`}>
                        <span>{date ? date.toLocaleDateString() : 'Select Date'}</span>
                        <Calendar size={14} className="opacity-50" />
                    </button>
                    {isCalendarOpen && <div className="absolute bottom-full mb-2 left-0 z-50"><CustomCalendar value={date} onChange={(d) => { setDate(d); setIsCalendarOpen(false) }} onClose={() => setIsCalendarOpen(false)} /></div>}
                </div>
                <div className="pt-4 flex gap-3">
                    <button onClick={onClose} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>Cancel</button>
                    <button onClick={() => onSave({ fromAccountId, toAccountId, amount, date })} className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white ${themeConfig.twBg} hover:opacity-90`}>Transfer</button>
                </div>
            </div>
        </ModalWrapper>
    );
}

function AccountSelect({ label, value, onChange, options, placeholder = 'Select' }: any) {
    const { isDarkMode } = useContext(ThemeContext);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selected = options.find((o: any) => o.value === value);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-1.5 relative" ref={containerRef}>
            {label && <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{label}</label>}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`w-full px-3 py-2 rounded-lg border text-xs flex items-center justify-between text-left outline-none transition-colors ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 hover:border-zinc-700' : 'bg-white border-zinc-300 text-zinc-900 hover:border-zinc-400'}`}
            >
                <span className="truncate">{selected?.label || placeholder}</span>
                <ChevronDown size={14} className="opacity-60" />
            </button>
            {open && (
                <div className={`absolute z-20 mt-1 w-full rounded-lg border shadow-lg overflow-hidden ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    <div className="max-h-56 overflow-auto">
                        {options.map((opt: any) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-xs transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-50 text-zinc-800'}`}
                            >
                                <span className="truncate">{opt.label}</span>
                                {value === opt.value && <Check size={14} className="text-emerald-500" />}
                            </button>
                        ))}
                        {!options.length && (
                            <div className={`px-3 py-2 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>No options</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Utilities

function ModalWrapper({ children, onClose, title }: any) {
    const { isDarkMode } = useContext(ThemeContext);
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-xl border shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
                    <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{title}</h2>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5">
                    {children}
                </div>
            </div>
        </div>
    )
}

function InputGroup({ label, value, onChange, placeholder, type = "text" }: any) {
    const { isDarkMode } = useContext(ThemeContext);
    return (
        <div className="space-y-1.5">
            <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'} focus:border-transparent focus:ring-2 focus:ring-zinc-500/20`}
            />
        </div>
    )
}
