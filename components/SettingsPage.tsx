
import React, { useContext, useState, useEffect } from 'react';
import { ThemeContext, DataContext } from '../App';
import { THEMES } from '../types';
import { Settings, Save, Scale, Maximize2, Minimize2, Lock, AlertTriangle } from 'lucide-react';
import { hashPassword, verifyPassword } from '../src/utils/hash';

export default function SettingsPage() {
    const { isDarkMode, theme } = useContext(ThemeContext);
    const { settings, updateSettings } = useContext(DataContext);
    const themeConfig = THEMES[theme];

    const [bagsPerTon, setBagsPerTon] = useState(settings.bagsPerTon.toString());
    const [isSaved, setIsSaved] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);

    // Security state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSaved, setPasswordSaved] = useState(false);

    useEffect(() => {
        setBagsPerTon(settings.bagsPerTon.toString());
    }, [settings]);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Fullscreen toggle failed', err);
        }
    };

    const handleSave = () => {
        const val = parseInt(bagsPerTon);
        if (!isNaN(val) && val > 0) {
            updateSettings({ bagsPerTon: val });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
    };

    const handlePasswordUpdate = async () => {
        setPasswordError('');

        // If there's an existing password, verify current password against it
        if (settings.reportsPassword) {
            const isValid = await verifyPassword(currentPassword, settings.reportsPassword);
            if (!isValid) {
                setPasswordError('Current password is incorrect');
                return;
            }
        }

        if (!newPassword || newPassword.length < 4) {
            setPasswordError('New password must be at least 4 characters');
            return;
        }

        // Hash the new password before storing (migration-safe)
        const hashedPassword = await hashPassword(newPassword);
        updateSettings({ reportsPassword: hashedPassword });
        setCurrentPassword('');
        setNewPassword('');
        setPasswordSaved(true);
        setTimeout(() => setPasswordSaved(false), 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
                    <Settings size={24} />
                </div>
                <div>
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Settings</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Manage your application preferences</p>
                </div>
            </div>

            <div className={`rounded-xl border p-4 flex items-center justify-between transition-all ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <div>
                    <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Fullscreen Mode</h2>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>Toggle immersive view to hide browser UI.</p>
                </div>
                <button
                    onClick={toggleFullscreen}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-zinc-500' : 'bg-white border-zinc-300 text-zinc-900 hover:border-zinc-500'
                        }`}
                >
                    {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                </button>
            </div>

            {/* Security Section */}
            <div className={`rounded-xl border p-6 transition-all ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-4">
                    <Lock size={18} className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} />
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Security</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Reports Page Password</h3>
                        <p className={`text-xs mt-1 mb-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                            Set a password to lock the Reports page. Only admin with current password can update this.
                        </p>
                    </div>

                    {settings.reportsPassword && (
                        <div className="flex flex-col gap-1">
                            <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                Current Master Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password to verify"
                                className={`w-full max-w-md px-3 py-2 rounded-lg border text-sm outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400'}`}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            {settings.reportsPassword ? 'New Password' : 'Set Password'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className={`w-full max-w-md px-3 py-2 rounded-lg border text-sm outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400'}`}
                        />
                    </div>

                    {passwordError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle size={12} /> {passwordError}
                        </p>
                    )}

                    <div className="pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                        <button
                            onClick={handlePasswordUpdate}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-sm hover:opacity-90 active:scale-95 ${passwordSaved ? 'bg-emerald-500' : 'bg-orange-500'}`}
                        >
                            <Save size={16} />
                            {passwordSaved ? 'Password Updated!' : 'Update Password'}
                        </button>
                        <p className={`text-xs mt-2 flex items-center gap-1 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                            <AlertTriangle size={12} /> Admin verification required to update reports password
                        </p>
                    </div>
                </div>
            </div>

            <div className={`rounded-xl border p-6 transition-all ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-6">
                    <Scale size={18} className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} />
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Unit Conversions</h2>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className={`text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                            Bags per Ton
                        </label>
                        <p className={`text-xs mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                            Define how many bags constitute one ton for calculations in Purchase and Stock modules.
                        </p>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                value={bagsPerTon}
                                onChange={(e) => setBagsPerTon(e.target.value)}
                                className={`w-32 px-3 py-2 rounded-lg border text-sm outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-700 text-zinc-100 focus:border-zinc-500' : 'bg-white border-zinc-300 text-zinc-900 focus:border-zinc-400'}`}
                            />
                            <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>bags = 1 Ton</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                        <button
                            onClick={handleSave}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-sm hover:opacity-90 active:scale-95 ${themeConfig.twBg}`}
                        >
                            <Save size={16} />
                            {isSaved ? 'Saved!' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
