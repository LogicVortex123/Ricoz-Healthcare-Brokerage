'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AppShell, Role, DbState } from '../components/AppShell';
import { BrokerDashboard } from '../components/BrokerDashboard';
import { SellerDashboard } from '../components/SellerDashboard';
import { BuyerDashboard } from '../components/BuyerDashboard';
import { AdminDashboard } from '../components/AdminDashboard';
import { NotificationsDrawer } from '../components/NotificationsDrawer';
import { DbInspector } from '../components/DbInspector';

export default function Home() {
  const [currentRole, setCurrentRole] = useState<Role>('broker');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dbInspectorOpen, setDbInspectorOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [dbState, setDbState] = useState<DbState>('checking');

  const checkDb = useCallback(async () => {
    try {
      const res = await fetch('/api/db-status', { cache: 'no-store' });
      const json = await res.json();
      setDbState(json.success ? 'connected' : 'error');
    } catch {
      setDbState('error');
    }
  }, []);

  useEffect(() => {
    checkDb();
    window.addEventListener('practices:changed', checkDb);
    return () => window.removeEventListener('practices:changed', checkDb);
  }, [checkDb]);

  return (
    <AppShell
      role={currentRole}
      onRoleChange={setCurrentRole}
      dbState={dbState}
      onOpenDb={() => setDbInspectorOpen(true)}
      onOpenNotifications={() => setNotificationsOpen(true)}
      unread={unreadNotifications}
    >
      {currentRole === 'broker' && <BrokerDashboard />}
      {currentRole === 'seller' && <SellerDashboard />}
      {currentRole === 'buyer' && <BuyerDashboard />}
      {currentRole === 'admin' && <AdminDashboard />}

      {notificationsOpen && (
        <NotificationsDrawer
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          onMarkAllRead={() => setUnreadNotifications(0)}
        />
      )}
      {dbInspectorOpen && <DbInspector onClose={() => setDbInspectorOpen(false)} />}
    </AppShell>
  );
}
