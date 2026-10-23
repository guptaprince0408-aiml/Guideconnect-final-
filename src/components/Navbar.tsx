import React from 'react';
import { Compass, ShieldCheck, Zap, Code2, Users, UserCheck, Bell, Plus, UserPlus } from 'lucide-react';
import { GuideProfile, ClientProfile, AppNotification } from '../types';

interface NavbarProps {
  currentView: 'landing' | 'client' | 'guide' | 'admin' | 'simulator' | 'reference';
  setCurrentView: (view: 'landing' | 'client' | 'guide' | 'admin' | 'simulator' | 'reference') => void;
  clients: ClientProfile[];
  guides: GuideProfile[];
  currentClient: ClientProfile;
  setCurrentClient: (client: ClientProfile) => void;
  currentGuide: GuideProfile;
  setCurrentGuide: (guide: GuideProfile) => void;
  openGuideRegisterModal: () => void;
  openClientRegisterModal: () => void;
  notifications: AppNotification[];
  openNotificationsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  clients,
  guides,
  currentClient,
  setCurrentClient,
  currentGuide,
  setCurrentGuide,
  openGuideRegisterModal,
  openClientRegisterModal,
  notifications = [],
  openNotificationsModal
}) => {
  const activeUserId = currentView === 'guide' ? currentGuide.id : currentClient.id;
  const userUnreadCount = notifications.filter(n => n.recipientId === activeUserId && !n.isRead).length;
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCurrentView('landing')}
              className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 hover:opacity-90 transition-opacity text-left"
            >
              <Compass className="w-6 h-6 text-emerald-600" />
              <span>GuideConnect</span>
            </button>
            <span className="hidden lg:inline text-xs font-mono text-slate-400 border-l border-slate-200 pl-3">
              v1.0 LTS
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setCurrentView('landing')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'landing' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentView('client')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentView === 'client' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Client Mode</span>
            </button>
            <button
              onClick={() => setCurrentView('guide')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentView === 'guide' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Guide Mode</span>
            </button>
            <button
              onClick={() => setCurrentView('simulator')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentView === 'simulator' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Race Simulator</span>
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentView === 'admin' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => setCurrentView('reference')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentView === 'reference' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              <Code2 className="w-4 h-4 text-slate-500" />
              <span>Java / Architecture</span>
            </button>
          </nav>

          {/* Zone 3: Active Profile Switcher & Primary Action */}
          {/* Zone 3: Active Profile Switcher, Notifications & Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell with Unread Badge */}
            <button
              onClick={openNotificationsModal}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
              title="Tour Notifications (WhatsApp, Gmail & In-App)"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {userUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {userUnreadCount}
                </span>
              )}
            </button>

            {currentView === 'guide' ? (
              <div className="flex items-center gap-2">
                <select
                  value={currentGuide.id}
                  onChange={e => {
                    const g = guides.find(item => item.id === e.target.value);
                    if (g) setCurrentGuide(g);
                  }}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[170px] truncate"
                >
                  {guides.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.guideId} · @{g.username}
                    </option>
                  ))}
                </select>
                <button
                  onClick={openGuideRegisterModal}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors whitespace-nowrap shrink-0 border border-emerald-200"
                >
                  + Join as Guide
                </button>
              </div>
            ) : currentView === 'client' ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 shadow-2xs">
                  {currentClient.nationality?.toLowerCase().includes('india') && (
                    <span className="text-xs pl-1" title="Indian Tourist Feature: Dual Currency & INR Live Slider Active">
                      🇮🇳
                    </span>
                  )}
                  <select
                    value={currentClient.id}
                    onChange={e => {
                      const c = clients.find(item => item.id === e.target.value);
                      if (c) setCurrentClient(c);
                    }}
                    className="text-xs bg-transparent border-none text-slate-800 font-semibold focus:outline-none max-w-[170px] truncate cursor-pointer pl-1.5"
                    title="Switch Active Tourist Profile"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nationality === 'India' ? '🇮🇳 ' : ''}{c.fullName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={openClientRegisterModal}
                    className="p-1 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors flex items-center justify-center cursor-pointer"
                    title="Register New Tourist (+)"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                </div>
                <button
                  onClick={openClientRegisterModal}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors whitespace-nowrap shrink-0 border border-emerald-200 flex items-center gap-1 cursor-pointer"
                  title="Register a new tourist profile"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Client</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('client')}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Find a Guide
                </button>
                <button
                  onClick={() => setCurrentView('guide')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 hidden sm:inline-block"
                >
                  Guide Portal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
