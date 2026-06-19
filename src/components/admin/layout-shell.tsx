'use client';

import { useState } from 'react';
import { AdminSidebar } from './sidebar';
import { AdminHeader } from './header';

interface AdminUser {
  displayName: string;
  username: string;
  role: string;
  avatar: string;
}

export function AdminLayoutShell({ children, adminUser }: { children: React.ReactNode; adminUser: AdminUser }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AdminSidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} adminUser={adminUser} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
