import React, { useContext, useState } from 'react';
import { ThemeContext } from '../../App';
import { THEMES } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomCalendarProps {
    value: Date | null;
    onChange: (d: Date | null) => void;
    onClose: () => void;
}

export default function CustomCalendar({ value, onChange, onClose }: CustomCalendarProps) {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];
    const [viewDate, setViewDate] = useState(value || new Date());
    const [view, setView] = useState<'days' | 'months' | 'years'>('days');

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const daysShort = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const handlePrev = () => {
        if (view === 'days') setViewDate(new Date(year, month - 1, 1));
        if (view === 'months') setViewDate(new Date(year - 1, month, 1));
        if (view === 'years') setViewDate(new Date(year - 12, month, 1));
    };

    const handleNext = () => {
        if (view === 'days') setViewDate(new Date(year, month + 1, 1));
        if (view === 'months') setViewDate(new Date(year + 1, month, 1));
        if (view === 'years') setViewDate(new Date(year + 12, month, 1));
    };

    const handleDateClick = (day: number) => {
        onChange(new Date(year, month, day));
        onClose();
    };

    const isSelected = (day: number) => value && value.getDate() === day && value.getMonth() === month && value.getFullYear() === year;
    const isToday = (day: number) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    };

    const renderDays = () => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        for (let i = 1; i <= daysInMonth; i++) {
            const selected = isSelected(i);
            const today = isToday(i);
            days.push(
                <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); handleDateClick(i); }}
                    className={`
                        h-8 w-8 rounded-md text-xs font-medium flex items-center justify-center transition-all relative
                        ${selected
                            ? `${themeConfig.twBg} text-white shadow-md`
                            : (isDarkMode ? 'text-zinc-300 hover:bg-zinc-800' : 'text-zinc-700 hover:bg-zinc-100')}
                        ${today && !selected ? `border ${isDarkMode ? 'border-zinc-700' : 'border-zinc-300'}` : ''}
                    `}
                >
                    {i}
                </button>
            );
        }
        return (
            <>
                <div className="grid grid-cols-7 mb-2">
                    {daysShort.map(day => <div key={day} className={`text-center text-[10px] font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-y-1 place-items-center">
                    {days}
                </div>
            </>
        );
    };

    const renderMonths = () => (
        <div className="grid grid-cols-3 gap-2">
            {months.map((m, index) => (
                <button
                    key={m}
                    onClick={() => { setViewDate(new Date(year, index, 1)); setView('days'); }}
                    className={`p-2 rounded-md text-xs font-medium ${month === index ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-900') : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100')}`}
                >
                    {m}
                </button>
            ))}
        </div>
    );

    const renderYears = () => {
        const startYear = year - 6;
        const years = [];
        for (let i = 0; i < 12; i++) {
            const y = startYear + i;
            years.push(
                <button
                    key={y}
                    onClick={() => { setViewDate(new Date(y, month, 1)); setView('days'); }}
                    className={`p-2 rounded-md text-xs font-medium ${year === y ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-900') : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100')}`}
                >
                    {y}
                </button>
            );
        }
        return <div className="grid grid-cols-3 gap-2">{years}</div>;
    };

    return (
        <div className={`p-4 rounded-xl shadow-2xl border w-[280px] z-50 ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrev} className={`p-1.5 rounded hover:bg-zinc-800 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}><ChevronLeft size={14} /></button>
                <div className="flex gap-1 items-center">
                    <button onClick={() => setView('months')} className={`px-2 py-1 rounded text-sm font-semibold hover:bg-zinc-800 ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{months[month]}</button>
                    <button onClick={() => setView('years')} className={`px-2 py-1 rounded text-sm font-semibold hover:bg-zinc-800 ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{year}</button>
                </div>
                <button onClick={handleNext} className={`p-1.5 rounded hover:bg-zinc-800 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}><ChevronRight size={14} /></button>
            </div>

            <div className="min-h-[220px]">
                {view === 'days' && renderDays()}
                {view === 'months' && renderMonths()}
                {view === 'years' && renderYears()}
            </div>

            {/* Footer Actions */}
            <div className={`flex justify-between mt-3 pt-3 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <button
                    onClick={() => { onChange(null); onClose(); }}
                    className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                    Clear
                </button>
                <button
                    onClick={() => { onChange(new Date()); onClose(); }}
                    className={`text-xs font-medium ${themeConfig.twText}`}
                >
                    Today
                </button>
            </div>
        </div>
    );
}
