import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ClientDashboard } from './components/ClientDashboard';
import { GuideDashboard } from './components/GuideDashboard';
import { ConcurrencySimulator } from './components/ConcurrencySimulator';
import { AdminDashboard } from './components/AdminDashboard';
import { SpringBootReferenceViewer } from './components/SpringBootReferenceViewer';
import { GuideRegistrationModal } from './components/GuideRegistrationModal';
import { ClientRegistrationModal } from './components/ClientRegistrationModal';
import { NegotiationModal } from './components/NegotiationModal';
import { MessagingDrawer } from './components/MessagingDrawer';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { getStoreState, subscribeStore } from './services/store';
import { Booking, GuideProfile, ClientProfile } from './types';

export default function App() {
  const [storeState, setStoreState] = useState(getStoreState());
  const [currentView, setCurrentView] = useState<'landing' | 'client' | 'guide' | 'admin' | 'simulator' | 'reference'>('landing');

  // Active Simulated Users
  const [currentClient, setCurrentClient] = useState<ClientProfile>(storeState.clients[0]);
  const [currentGuide, setCurrentGuide] = useState<GuideProfile>(storeState.guides[0]);

  // Modal / Drawer States
  const [isGuideRegisterOpen, setIsGuideRegisterOpen] = useState(false);
  const [isClientRegisterOpen, setIsClientRegisterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [negotiatingBooking, setNegotiatingBooking] = useState<Booking | null>(null);
  const [messagingBooking, setMessagingBooking] = useState<Booking | null>(null);

  // Re-subscribe to store updates
  useEffect(() => {
    const unsubscribe = subscribeStore(() => {
      const fresh = getStoreState();
      setStoreState({ ...fresh });

      // Refresh currently selected client & guide if they changed
      const updatedClient = fresh.clients.find(c => c.id === currentClient.id) || fresh.clients[0];
      const updatedGuide = fresh.guides.find(g => g.id === currentGuide.id) || fresh.guides[0];
      setCurrentClient(updatedClient);
      setCurrentGuide(updatedGuide);

      // Refresh modal booking references
      if (negotiatingBooking) {
        const freshBk = fresh.bookings.find(b => b.id === negotiatingBooking.id);
        if (freshBk) setNegotiatingBooking(freshBk);
      }
      if (messagingBooking) {
        const freshBk = fresh.bookings.find(b => b.id === messagingBooking.id);
        if (freshBk) setMessagingBooking(freshBk);
      }
    });
    return unsubscribe;
  }, [currentClient.id, currentGuide.id, negotiatingBooking, messagingBooking]);

  const forceRefresh = () => {
    setStoreState({ ...getStoreState() });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-200">
      {/* 3-Zone Clean Header */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        clients={storeState.clients}
        guides={storeState.guides}
        currentClient={currentClient}
        setCurrentClient={setCurrentClient}
        currentGuide={currentGuide}
        setCurrentGuide={setCurrentGuide}
        openGuideRegisterModal={() => setIsGuideRegisterOpen(true)}
        openClientRegisterModal={() => setIsClientRegisterOpen(true)}
        notifications={storeState.notifications}
        openNotificationsModal={() => setIsNotificationsOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            guides={storeState.guides}
            onFindGuide={() => setCurrentView('client')}
            onBecomeGuide={() => setIsGuideRegisterOpen(true)}
            onOpenSimulator={() => setCurrentView('simulator')}
            onOpenDocs={() => setCurrentView('reference')}
          />
        )}

        {currentView === 'client' && (
          <ClientDashboard
            client={currentClient}
            clients={storeState.clients}
            requests={storeState.requests}
            bookings={storeState.bookings}
            guides={storeState.guides}
            offers={storeState.offers}
            reviews={storeState.reviews}
            notifications={storeState.notifications}
            onSelectClient={c => setCurrentClient(c)}
            onOpenClientRegisterModal={() => setIsClientRegisterOpen(true)}
            onOpenNegotiation={bk => setNegotiatingBooking(bk)}
            onOpenChat={bk => setMessagingBooking(bk)}
            onRefresh={forceRefresh}
          />
        )}

        {currentView === 'guide' && (
          <GuideDashboard
            guide={currentGuide}
            guides={storeState.guides}
            requests={storeState.requests}
            invitations={storeState.invitations}
            bookings={storeState.bookings}
            offers={storeState.offers}
            reviews={storeState.reviews}
            notifications={storeState.notifications}
            onSelectGuide={g => setCurrentGuide(g)}
            onOpenNegotiation={bk => setNegotiatingBooking(bk)}
            onOpenChat={bk => setMessagingBooking(bk)}
            onRefresh={forceRefresh}
          />
        )}

        {currentView === 'simulator' && (
          <ConcurrencySimulator
            requests={storeState.requests}
            guides={storeState.guides}
            auditLogs={storeState.auditLogs}
            onRefresh={forceRefresh}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            guides={storeState.guides}
            clients={storeState.clients}
            requests={storeState.requests}
            bookings={storeState.bookings}
            pricingRules={storeState.pricingRules}
            auditLogs={storeState.auditLogs}
            onRefresh={forceRefresh}
          />
        )}

        {currentView === 'reference' && (
          <SpringBootReferenceViewer />
        )}
      </main>

      {/* Guide Registration Modal (Allocates unique Guide ID e.g. GC-G-100006) */}
      <GuideRegistrationModal
        isOpen={isGuideRegisterOpen}
        onClose={() => setIsGuideRegisterOpen(false)}
        nextSequence={storeState.nextGuideSequence}
        onRegistered={() => {
          forceRefresh();
          setCurrentView('guide');
        }}
      />

      {/* Client Registration Modal (Allows tourists to join, set preferences, and language) */}
      <ClientRegistrationModal
        isOpen={isClientRegisterOpen}
        onClose={() => setIsClientRegisterOpen(false)}
        onRegistered={(newClient) => {
          forceRefresh();
          setCurrentClient(newClient);
          setCurrentView('client');
        }}
      />

      {/* Negotiation & Bargaining Drawer */}
      <NegotiationModal
        booking={negotiatingBooking}
        offers={storeState.offers}
        currentUserRole={currentView === 'guide' ? 'GUIDE' : 'CLIENT'}
        currentUserId={currentView === 'guide' ? currentGuide.id : currentClient.id}
        currentUserName={currentView === 'guide' ? currentGuide.fullName : currentClient.fullName}
        clientNationality={currentClient.nationality}
        isOpen={!!negotiatingBooking}
        onClose={() => setNegotiatingBooking(null)}
        onOfferUpdated={forceRefresh}
      />

      {/* Tour Messaging Drawer */}
      <MessagingDrawer
        booking={messagingBooking}
        messages={storeState.messages}
        currentUserRole={currentView === 'guide' ? 'GUIDE' : 'CLIENT'}
        currentUserId={currentView === 'guide' ? currentGuide.id : currentClient.id}
        currentUserName={currentView === 'guide' ? currentGuide.fullName : currentClient.fullName}
        isOpen={!!messagingBooking}
        onClose={() => setMessagingBooking(null)}
        onMessageSent={forceRefresh}
      />

      {/* Notification Center Modal (WhatsApp, Gmail & In-App Tour Updates) */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        userId={currentView === 'guide' ? currentGuide.id : currentClient.id}
        userName={currentView === 'guide' ? currentGuide.fullName : currentClient.fullName}
        notifications={storeState.notifications}
        onRefresh={forceRefresh}
      />
    </div>
  );
}
