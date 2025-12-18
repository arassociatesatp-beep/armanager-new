
import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '../App';
import { 
    LayoutDashboard, 
    Package, 
    ShoppingBag, 
    Users, 
    Layers, 
    Plus, 
    CreditCard, 
    BarChart,
    Settings,
    HelpCircle,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon
} from 'lucide-react';

interface SidebarProps {
    isCollapsed?: boolean;
    setIsCollapsed?: (v: boolean) => void;
    currentPath: string;
    onLogout?: () => void;
    onNavigate?: () => void; // For mobile menu close
}

export default function Sidebar({ isCollapsed = false, setIsCollapsed, currentPath, onLogout, onNavigate }: SidebarProps) {
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <div className="flex flex-col h-full py-6 transition-all duration-300 relative">
      {/* Collapse Toggle - Desktop Only */}
      <button 
        onClick={() => setIsCollapsed?.(!isCollapsed)}
        className={`
            absolute -right-3 top-8 z-50 hidden md:flex items-center justify-center w-6 h-6 rounded-full border shadow-sm transition-colors
            ${isDarkMode 
                ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white' 
                : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'}
        `}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div className={`flex items-center mb-8 gap-3 transition-all duration-300 ${isCollapsed ? 'px-0 justify-center' : 'px-6'}`}>
        <div className={`relative flex items-center justify-center shrink-0 w-8 h-8 rounded-full border-2 ${isDarkMode ? 'border-white text-white' : 'border-zinc-900 text-zinc-900'}`}>
            {/* Simple circle logo concept */}
        </div>
        {!isCollapsed && (
             <span className={`text-lg font-semibold tracking-wide whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Acme Inc.</span>
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-4 scrollbar-hide">
        
        {/* MAIN Section */}
        <div>
            {!isCollapsed && (
                <h3 className={`px-2 text-[10px] font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Main
                </h3>
            )}
            <nav className="space-y-1">
                <NavItem 
                    icon={<LayoutDashboard size={20} />} 
                    label="Dashboard" 
                    to="/dashboard"
                    active={currentPath === '/dashboard'} 
                    isCollapsed={isCollapsed}
                    onClick={onNavigate}
                />
                <NavItem 
                    icon={<Package size={20} />} 
                    label="Products" 
                    to="/products"
                    active={currentPath === '/products'} 
                    isCollapsed={isCollapsed}
                    onClick={onNavigate}
                />
                <NavItem 
                    icon={<ShoppingBag size={20} />} 
                    label="Sales" 
                    to="/sales"
                    active={currentPath === '/sales'}
                    isCollapsed={isCollapsed}
                    onClick={onNavigate}
                />
                <NavItem 
                    icon={<Users size={20} />} 
                    label="Customers" 
                    to="/customers"
                    active={currentPath === '/customers'}
                    isCollapsed={isCollapsed}
                    onClick={onNavigate}
                />
            </nav>
        </div>

        {/* INVENTORY Section */}
        <div>
            {!isCollapsed && (
                <h3 className={`px-2 text-[10px] font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Inventory
                </h3>
            )}
            <nav className="space-y-1">
                <NavItem 
                    icon={<Layers size={20} />} 
                    label="Stocks" 
                    to="/stocks"
                    active={currentPath === '/stocks'}
                    isCollapsed={isCollapsed}
                    onClick={onNavigate}
                />
                <NavItem 
                    icon={<Plus size={20} />} 
                    label="Purchase" 
                    to="/purchase"
                    active={currentPath === '/purchase'}
                    isCollapsed={isCollapsed}
                    onClick={onNavigate}
                />
            </nav>
        </div>

        {/* FINANCE Section */}
        <div>
            {!isCollapsed && (
                <h3 className={`px-2 text-[10px] font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Finance
                </h3>
            )}
            <nav className="space-y-1">
                <NavItem 
                    icon={<CreditCard size={20} />} 
                    label="Payments" 
                    to="/payments"
                    active={currentPath === '/payments'}
                    isCollapsed={isCollapsed}
                    onClick={onNavigate}
                />
                <NavItem 
                    icon={<BarChart size={20} />} 
                    label="Reports" 
                    to="/reports"
                    active={currentPath === '/reports'}
                    isCollapsed={isCollapsed}
                    onClick={onNavigate}
                />
            </nav>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className={`mt-auto border-t pt-4 space-y-1 px-4 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
         <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            to="/settings"
            active={currentPath === '/settings'}
            isCollapsed={isCollapsed}
            onClick={onNavigate}
        />
         <NavItem icon={<LogOut size={20} />} label="Logout" isCollapsed={isCollapsed} onClick={onLogout} />

         {/* Theme Toggle */}
         <button 
            onClick={toggleDarkMode}
            className={`
                w-full flex items-center gap-3 px-2 py-2 rounded-md transition-colors group mt-2
                ${isDarkMode ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'}
                ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
         >
            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
            {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>}
         </button>
      </div>
    </div>
  );
}

interface NavItemProps { 
    icon: React.ReactNode; 
    label: string; 
    to?: string;
    active?: boolean; 
    isCollapsed: boolean;
    onClick?: () => void;
}

function NavItem({ icon, label, to, active, isCollapsed, onClick }: NavItemProps) {
    const { isDarkMode } = useContext(ThemeContext);
    
    const activeClass = isDarkMode 
        ? 'text-white bg-zinc-900 font-medium' 
        : 'text-zinc-900 bg-zinc-100 font-medium';
        
    const inactiveClass = isDarkMode
        ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 font-normal'
        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50 font-normal';

    const className = `
        w-full flex items-center px-2 py-2 text-sm rounded-md transition-all duration-200 group
        ${active ? activeClass : inactiveClass}
        ${isCollapsed ? 'justify-center' : ''}
    `;

    const content = (
        <>
            <span className={`shrink-0 ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'} ${!active && !isDarkMode ? 'text-zinc-500 group-hover:text-zinc-900' : ''}`}>
                {icon}
            </span>
            
            {!isCollapsed && (
                <span className="ml-3 whitespace-nowrap overflow-hidden text-ellipsis">
                    {label}
                </span>
            )}
        </>
    );

    // If it's a link, use Link component
    if (to) {
        return (
            <Link 
                to={to}
                className={className}
                title={isCollapsed ? label : undefined}
                onClick={onClick}
            >
                {content}
            </Link>
        );
    }

    // Otherwise, use button for actions like logout
    return (
        <button 
            onClick={onClick}
            className={className}
            title={isCollapsed ? label : undefined}
        >
            {content}
        </button>
    );
}
