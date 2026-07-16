import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeContext } from '../App';
import { THEMES, ThemeColor } from '../types';
import { ChevronDown, Check } from 'lucide-react';

export default function ThemeSelector() {
  const { theme, setTheme, isDarkMode } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentThemeConfig = THEMES[theme];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors text-sm
            ${isDarkMode 
                ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300' 
                : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'}
        `}
      >
        <span>Theme: <span className={`font-medium ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{currentThemeConfig.name}</span></span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`
            absolute right-0 top-full mt-2 w-48 rounded-lg border shadow-xl z-50 py-1 overflow-hidden
            ${isDarkMode 
                ? 'border-zinc-800 bg-[#09090b] shadow-black/50' 
                : 'border-zinc-200 bg-white shadow-zinc-200/50'}
        `}>
            <div className={`px-3 py-2 text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Select Theme
            </div>
          {Object.entries(THEMES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                setTheme(key as ThemeColor);
                setIsOpen(false);
              }}
              className={`
                w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors
                ${theme === key 
                    ? (isDarkMode ? 'text-white bg-zinc-900/50' : 'text-zinc-900 bg-zinc-50') 
                    : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-900' : 'text-zinc-600 hover:bg-zinc-50')}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${config.twBg}`}></div>
                <span>{config.name}</span>
              </div>
              {theme === key && <Check size={14} className={config.twText} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}