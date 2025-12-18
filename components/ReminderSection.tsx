
import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeContext, DataContext } from '../App';
import { Plus, Check, AlertCircle, X, Eye, EyeOff, Calendar, Trash2 } from 'lucide-react';
import { CustomCalendar } from './shared';
import { Reminder } from '../types';

interface ReminderItemProps {
    reminder: Reminder & { _docId?: string };
    onToggle: () => void;
    onDelete?: () => void;
    isOverdue?: boolean;
}

const ReminderItem: React.FC<ReminderItemProps> = ({ reminder, onToggle, onDelete, isOverdue }) => {
    const { isDarkMode } = useContext(ThemeContext);
    const isCompleted = reminder.isCompleted;

    return (
        <div className={`
            flex items-center justify-between p-3 rounded-lg border transition-all group
            ${isCompleted
                ? (isDarkMode ? 'bg-zinc-900/10 border-zinc-800 opacity-50' : 'bg-zinc-50 border-zinc-100 opacity-50')
                : (isOverdue
                    ? (isDarkMode ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-100')
                    : (isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200')
                )
            }
        `}>
            <div className="flex-1">
                <div className="flex items-baseline gap-2">
                    <span className={`text-sm font-medium ${isCompleted ? 'line-through' : ''} ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{reminder.customer}</span>
                    {!isCompleted && isOverdue && <span className="text-[10px] font-bold text-red-500">OVERDUE</span>}
                    {isCompleted && <span className="text-[10px] font-bold text-emerald-500">DONE</span>}
                </div>
                <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    <span className={isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}>₹{reminder.amount}</span>
                    <span className="mx-1.5 opacity-50">•</span>
                    Due: {new Date(reminder.dueDate).toLocaleDateString()}
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all
                    ${isCompleted
                        ? (isDarkMode ? 'bg-emerald-900/20 border-emerald-900/30 text-emerald-500' : 'bg-emerald-50 border-emerald-200 text-emerald-600')
                        : (isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900')
                    }
                `}
            >
                <Check size={12} />
                {isCompleted ? 'Undo' : 'Done'}
            </button>
            {isCompleted && onDelete && (
                <button
                    onClick={onDelete}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ml-2 ${isDarkMode ? 'bg-red-900/20 border-red-900/30 text-red-400 hover:bg-red-900/40' : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'}`}
                >
                    <Trash2 size={12} />
                    Delete
                </button>
            )}
        </div>
    )
}

export default function ReminderSection() {
    const { isDarkMode } = useContext(ThemeContext);
    const { reminders, addReminder, updateReminder, deleteReminder } = useContext(DataContext);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);

    const handleAddReminder = (data: { customer: string; amount: string; dueDate: string }) => {
        const today = new Date().toISOString().split('T')[0];
        const status = data.dueDate < today ? 'Overdue' : 'Upcoming';
        const newReminder: Reminder = {
            id: Date.now(),
            customer: data.customer,
            amount: data.amount,
            dueDate: data.dueDate,
            status: status as 'Overdue' | 'Upcoming',
            isCompleted: false
        };
        addReminder(newReminder);
        setIsAddModalOpen(false);
    };

    const handleMarkDone = (reminder: Reminder & { _docId?: string }) => {
        updateReminder({ ...reminder, isCompleted: !reminder.isCompleted });
    };

    const handleDelete = (reminder: Reminder & { _docId?: string }) => {
        if (window.confirm(`Delete reminder for ${reminder.customer}?`)) {
            deleteReminder(reminder.id);
        }
    };

    const handleMarkAllComplete = () => {
        if (window.confirm('Mark all visible reminders as complete?')) {
            visibleReminders.forEach(r => updateReminder({ ...r, isCompleted: true }));
        }
    };

    // Calculate status based on current date
    const today = new Date().toISOString().split('T')[0];
    const remindersWithStatus = reminders.map(r => ({
        ...r,
        status: r.dueDate < today && !r.isCompleted ? 'Overdue' : 'Upcoming' as 'Overdue' | 'Upcoming'
    }));

    const visibleReminders = showAll ? remindersWithStatus : remindersWithStatus.filter(r => !r.isCompleted);
    const overdueReminders = visibleReminders.filter(r => r.status === 'Overdue');
    const upcomingReminders = visibleReminders.filter(r => r.status === 'Upcoming');

    return (
        <div className={`p-6 rounded-xl border transition-all duration-300 ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
                        <AlertCircle size={18} />
                    </div>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Payment Reminders</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors whitespace-nowrap ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                    >
                        <Plus size={14} /> Add
                    </button>
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors whitespace-nowrap ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                    >
                        {showAll ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showAll ? 'Hide Completed' : 'View All'}
                    </button>
                </div>
            </div>

            {/* Overdue Section */}
            {overdueReminders.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Overdue ({overdueReminders.length})</h4>
                    </div>
                    <div className="space-y-2">
                        {overdueReminders.map(reminder => (
                            <ReminderItem key={reminder.id} reminder={reminder} onToggle={() => handleMarkDone(reminder)} onDelete={() => handleDelete(reminder)} isOverdue />
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Section */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-zinc-600' : 'bg-zinc-400'}`}></div>
                    <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Upcoming ({upcomingReminders.length})</h4>
                </div>
                <div className="space-y-2">
                    {upcomingReminders.length > 0 ? (
                        upcomingReminders.map(reminder => (
                            <ReminderItem key={reminder.id} reminder={reminder} onToggle={() => handleMarkDone(reminder)} onDelete={() => handleDelete(reminder)} />
                        ))
                    ) : (
                        <div className={`text-center py-4 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>No upcoming reminders</div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-6 pt-4 border-t border-dashed flex gap-3 border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={handleMarkAllComplete}
                    className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${isDarkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                >
                    Mark All Complete
                </button>
            </div>

            {isAddModalOpen && <AddReminderModal onClose={() => setIsAddModalOpen(false)} onAdd={handleAddReminder} />}
        </div>
    );
}

function AddReminderModal({ onClose, onAdd }: { onClose: () => void, onAdd: (data: any) => void }) {
    const { isDarkMode } = useContext(ThemeContext);
    const [customer, setCustomer] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close calendar
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsCalendarOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = () => {
        if (!customer || !amount || !dueDate) return;
        // Format date as YYYY-MM-DD for storage
        const formattedDate = dueDate.toISOString().split('T')[0];
        onAdd({ customer, amount, dueDate: formattedDate });
    };

    const formatDateForDisplay = (date: Date | null) => {
        if (!date) return "Select date";
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const inputClass = `w-full px-3 py-2 rounded-lg border text-xs outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:ring-1 focus:ring-zinc-700' : 'bg-white border-zinc-300 text-zinc-900 focus:ring-1 focus:ring-zinc-300'}`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-sm rounded-xl border shadow-2xl p-0 ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
                    <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Add Payment Reminder</h3>
                    <button onClick={onClose} className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}><X size={16} /></button>
                </div>
                <div className="p-5 space-y-3">
                    <div>
                        <label className={`text-[10px] font-medium uppercase tracking-wide mb-1 block ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Customer Name</label>
                        <input type="text" value={customer} onChange={e => setCustomer(e.target.value)} className={inputClass} placeholder="e.g. John Doe" />
                    </div>
                    <div>
                        <label className={`text-[10px] font-medium uppercase tracking-wide mb-1 block ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Amount (₹)</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className={inputClass} placeholder="0.00" />
                    </div>
                    <div className="relative" ref={calendarRef}>
                        <label className={`text-[10px] font-medium uppercase tracking-wide mb-1 block ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Due Date</label>
                        <button
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between transition-all outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'} ${isCalendarOpen ? 'ring-1 ring-zinc-500 border-transparent' : ''}`}
                        >
                            <span className={!dueDate ? (isDarkMode ? 'text-zinc-500' : 'text-zinc-400') : ''}>{formatDateForDisplay(dueDate)}</span>
                            <Calendar size={14} className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} />
                        </button>
                        {isCalendarOpen && (
                            <div className="absolute top-full mt-2 left-0 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <CustomCalendar value={dueDate} onChange={(d) => { setDueDate(d); setIsCalendarOpen(false); }} onClose={() => setIsCalendarOpen(false)} />
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 border-t dark:border-zinc-800 flex gap-3">
                    <button onClick={onClose} className={`flex-1 py-2 rounded-lg text-xs font-medium border ${isDarkMode ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}>Cancel</button>
                    <button onClick={handleSubmit} className={`flex-1 py-2 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200`}>Add Reminder</button>
                </div>
            </div>
        </div>
    );
}
