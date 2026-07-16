import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeContext } from '../App';
import Sidebar from '../components/Sidebar';
import ThemeSelector from '../components/ThemeSelector';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ onLogout }: { onLogout: () => void }) {
    const { isDarkMode } = React.useContext(ThemeContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();

    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        if (e.currentTarget.scrollTop > 10) {
            setIsScrolled(true);
        } else {
            setIsScrolled(false);
        }
    };

    const bgClass = isDarkMode ? 'bg-black' : 'bg-[#f9fafb]';
    const textClass = isDarkMode ? 'text-zinc-100' : 'text-zinc-900';

    return (
        <div className={`flex h-screen w-full overflow-hidden font-sans antialiased selection:bg-zinc-800 transition-colors duration-300 ${bgClass} ${textClass}`}>
            
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 transform border-r transition-all duration-300 ease-in-out
                ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}
                md:relative md:translate-x-0
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                ${isSidebarCollapsed ? 'w-[80px]' : 'w-64'}
            `}>
                <Sidebar 
                    isCollapsed={isSidebarCollapsed} 
                    setIsCollapsed={setIsSidebarCollapsed}
                    currentPath={location.pathname}
                    onLogout={onLogout}
                    onNavigate={() => setIsMobileMenuOpen(false)}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                
                {/* Global Top Header */}
                <header className={`
                    flex items-center justify-between transition-all duration-200 ease-in-out z-30 sticky top-0
                    ${isScrolled 
                        ? `py-3 border-b ${isDarkMode ? 'border-zinc-800 bg-[#09090b]/90' : 'border-zinc-200 bg-white/90'} backdrop-blur-md` 
                        : `py-4 border-transparent bg-transparent`}
                    md:py-4 md:border-b ${isDarkMode ? 'md:border-zinc-800 md:bg-[#09090b]' : 'md:border-zinc-200 md:bg-white'}
                `}>
                    <div className="flex items-center px-4">
                        {/* Mobile Menu Trigger */}
                        <button onClick={() => setIsMobileMenuOpen(true)} className={`md:hidden p-2 -ml-2 mr-2 ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'}`}>
                            <Menu size={24} />
                        </button>
                        <span className="md:hidden font-semibold">Acme Inc.</span>
                    </div>

                    {/* Right side items - Theme Selector */}
                    <div className="flex items-center px-4">
                        <ThemeSelector />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide" onScroll={handleScroll}>
                    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
