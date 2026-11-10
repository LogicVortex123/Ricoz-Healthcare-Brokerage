'use client';

import React from 'react';
import { Bell, CheckCircle2, ShieldAlert, FileText, Lock, X } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
}

export function NotificationsDrawer({ isOpen, onClose, onMarkAllRead }: NotificationsDrawerProps) {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'notif-1',
      title: 'New Tier 2 NDA Request',
      body: 'Dr. Priya V. Sharma executed NDA v2.4 for Practice DPT-BLR-01. Awaiting broker authorization.',
      time: '12 mins ago',
      unread: true,
      icon: Lock,
      type: 'nda',
    },
    {
      id: 'notif-2',
      title: 'Due Diligence SLA Alert',
      body: 'Commercial Lease Agreement review overdue for DPT-BLR-01. Hard gate blocked.',
      time: '1 hour ago',
      unread: true,
      icon: ShieldAlert,
      type: 'sla',
    },
    {
      id: 'notif-3',
      title: 'Document Verified',
      body: 'KPME Registration for SmileCare Clinic confirmed clean by Broker Anand.',
      time: 'Yesterday',
      unread: false,
      icon: FileText,
      type: 'doc',
    },
  ];

  return (
    <div className="drawer-overlay fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px] flex justify-end">
      <div className="w-full max-w-sm bg-white h-full shadow-elevation border-l border-border flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm text-ink">Notifications</h3>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-danger text-white">
                2 new
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-ink-muted hover:text-ink rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="divide-y divide-border overflow-y-auto">
            {notifications.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  className={`p-4 hover:bg-surface/60 transition-colors ${
                    n.unread ? 'bg-primary-50/30' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">{n.title}</span>
                        <span className="text-[10px] text-ink-muted">{n.time}</span>
                      </div>
                      <p className="text-ink-muted mt-1 leading-snug">{n.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface flex items-center justify-between">
          <button
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-primary hover:text-primary-hover"
          >
            Mark all as read
          </button>
          <span className="text-[10px] text-ink-muted">Strict zero confidential data in emails</span>
        </div>
      </div>
    </div>
  );
}

