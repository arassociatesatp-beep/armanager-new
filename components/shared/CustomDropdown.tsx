import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeContext } from '../../App';
import { THEMES } from '../../types';
import { ChevronDown, Check, Search } from 'lucide-react';

interface CustomDropdownProps {
    options: any[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    searchable?: boolean;
    icon?: React.ReactNode;
}

export default function CustomDropdown({
    options,
    value,
    onChange,
    placeholder = "Select",
    className = "",
    searchable = false,
    icon
}: CustomDropdownProps) {
    const { theme, isDarkMode } = useContext(ThemeContext);
    const themeConfig = THEMES[theme];
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle object options {id, label} or string options
    const getLabel = (opt: any) => typeof opt === 'object' ? opt.label : opt;
    const getValue = (opt: any) => typeof opt === 'object' ? opt.id : opt;

    // Find the object in options that matches the current value (which is the ID)
    const selectedOption = options.find((o: any) => getValue(o).toString() === value?.toString());
    const displayValue = selectedOption ? getLabel(selectedOption) : value;

    const filteredOptions = options.filter((opt: any) =>
        getLabel(opt).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between transition-all outline-none ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'} ${isOpen ? `border-transparent ring-2 ring-zinc-500/20` : ''}`}
            >
                <span className={`flex items-center gap-2 ${!value ? (isDarkMode ? 'text-zinc-600' : 'text-zinc-400') : ''}`}>
                    {icon}
                    {displayValue || placeholder}
                </span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
            </button>
            {isOpen && (
                <div className={`absolute left-0 right-0 mt-2 rounded-lg border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1 z-50 ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
                    {/* Search Bar */}
                    {(options.length > 5 || searchable) && (
                        <div className={`p-2 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                            <div className="relative">
                                <Search size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search..."
                                    className={`w-full pl-7 pr-2 py-1.5 text-xs rounded-md border outline-none ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300'}`}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}
                    <div className="max-h-60 overflow-y-auto scrollbar-hide p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option: any) => (
                                <div
                                    key={getValue(option)}
                                    onClick={() => { onChange(getValue(option).toString()); setIsOpen(false); setSearchTerm(''); }}
                                    className={`px-3 py-2 text-xs cursor-pointer transition-colors rounded-md flex items-center justify-between ${value?.toString() === getValue(option).toString() ? `${themeConfig.twBg} text-white font-semibold` : (isDarkMode ? 'text-zinc-300 hover:bg-zinc-800' : 'text-zinc-700 hover:bg-zinc-100')}`}
                                >
                                    {getLabel(option)}
                                    {value?.toString() === getValue(option).toString() && <Check size={12} className="text-white" />}
                                </div>
                            ))
                        ) : (
                            <div className={`px-3 py-2 text-xs text-center ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
