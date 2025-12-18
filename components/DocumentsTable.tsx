import React, { useContext } from 'react';
import { ThemeContext } from '../App';
import { MoreVertical, Check, CircleDashed, SlidersHorizontal, Plus } from 'lucide-react';

const documents = [
  { id: 1, header: 'Cover page', type: 'Cover page', status: 'In Process', target: 18, limit: 5, reviewer: 'Eddie Lake' },
  { id: 2, header: 'Table of contents', type: 'Table of contents', status: 'Done', target: 29, limit: 24, reviewer: 'Eddie Lake' },
  { id: 3, header: 'Executive summary', type: 'Summary', status: 'Done', target: 12, limit: 10, reviewer: 'John Doe' },
  { id: 4, header: 'Financial overview', type: 'Financial', status: 'In Process', target: 56, limit: 50, reviewer: 'Sarah Smith' },
];

export default function DocumentsTable() {
    const { isDarkMode } = useContext(ThemeContext);

    return (
        <div className="space-y-6 mb-10">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className={`flex items-center p-1 rounded-lg border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                    <TabButton label="Outline" active />
                    <TabButton label="Past Performance" count={3} />
                    <TabButton label="Key Personnel" count={2} />
                    <TabButton label="Focus Documents" />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                     <button className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-colors shadow-sm
                        ${isDarkMode 
                            ? 'text-zinc-300 bg-[#09090b] border-zinc-800 hover:bg-zinc-900 hover:text-white' 
                            : 'text-zinc-600 bg-white border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'}
                     `}>
                        <SlidersHorizontal size={14} />
                        Customize Columns
                     </button>
                     <button className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-colors shadow-sm
                        ${isDarkMode
                            ? 'text-white bg-[#09090b] border-zinc-800 hover:bg-zinc-900'
                            : 'text-zinc-900 bg-white border-zinc-200 hover:bg-zinc-50'}
                     `}>
                        <Plus size={14} />
                        Add Section
                     </button>
                </div>
            </div>

            {/* Table */}
            <div className={`rounded-xl border overflow-hidden transition-colors ${isDarkMode ? 'border-zinc-800 bg-[#09090b]' : 'border-zinc-200 bg-white shadow-sm'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className={`border-b ${isDarkMode ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
                                <th className="w-12 py-4 px-6">
                                    <div className={`w-4 h-4 rounded border ${isDarkMode ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-300 bg-white'}`}></div>
                                </th>
                                <th className={`py-4 px-4 font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-900'}`}>Header</th>
                                <th className={`py-4 px-4 font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-900'}`}>Section Type</th>
                                <th className={`py-4 px-4 font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-900'}`}>Status</th>
                                <th className={`py-4 px-4 font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-900'}`}>Target</th>
                                <th className={`py-4 px-4 font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-900'}`}>Limit</th>
                                <th className={`py-4 px-4 font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-900'}`}>Reviewer</th>
                                <th className="w-12 py-4 px-4"></th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800/50' : 'divide-zinc-100'}`}>
                            {documents.map((doc) => (
                                <tr key={doc.id} className={`group transition-colors ${isDarkMode ? 'hover:bg-zinc-900/30' : 'hover:bg-zinc-50'}`}>
                                    <td className="py-4 px-6">
                                         <div className={`w-4 h-4 rounded border cursor-pointer ${isDarkMode ? 'border-zinc-700 bg-zinc-900/50 group-hover:border-zinc-500' : 'border-zinc-300 bg-white group-hover:border-zinc-400'}`}></div>
                                    </td>
                                    <td className={`py-4 px-4 font-semibold ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{doc.header}</td>
                                    <td className="py-4 px-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${isDarkMode ? 'bg-zinc-800/50 text-zinc-400 border-zinc-800' : 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                                            {doc.type}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        {doc.status === 'Done' ? (
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors
                                                ${isDarkMode 
                                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}
                                            `}>
                                                <div className={`p-0.5 rounded-full ${isDarkMode ? 'bg-emerald-500 text-black' : 'bg-emerald-600 text-white'}`}>
                                                    <Check size={8} strokeWidth={4} />
                                                </div>
                                                Done
                                            </span>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-dashed
                                                ${isDarkMode 
                                                    ? 'bg-transparent text-zinc-400 border-zinc-700' 
                                                    : 'bg-white text-zinc-500 border-zinc-300'}
                                            `}>
                                                <CircleDashed size={14} strokeWidth={2.5} className="opacity-70" />
                                                In Process
                                            </span>
                                        )}
                                    </td>
                                    <td className={`py-4 px-4 font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{doc.target}</td>
                                    <td className={`py-4 px-4 font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{doc.limit}</td>
                                    <td className={`py-4 px-4 font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{doc.reviewer}</td>
                                    <td className="py-4 px-4 text-right">
                                        <button className={`p-1 transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}>
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function TabButton({ label, count, active }: { label: string; count?: number; active?: boolean }) {
    const { isDarkMode } = useContext(ThemeContext);
    return (
        <button 
            className={`
                px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2
                ${active 
                    ? (isDarkMode ? 'bg-[#09090b] text-white ring-1 ring-inset ring-zinc-700 shadow-sm' : 'bg-white text-zinc-900 shadow-sm')
                    : (isDarkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50')}
            `}
        >
            {label}
            {count && (
                <span className={`
                    px-1.5 rounded-full text-[10px] 
                    ${active 
                        ? (isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-900')
                        : (isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-200 text-zinc-600')}
                `}>
                    {count}
                </span>
            )}
        </button>
    )
}