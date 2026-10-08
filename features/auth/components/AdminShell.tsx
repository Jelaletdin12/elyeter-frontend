'use client';

import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="text-foreground flex w-full">
          <AdminSidebar />

          <div className="bg-sidebar flex min-w-0 flex-1 flex-col">
            <AdminHeader />

            <main className="bg-background mb-1 flex-1 rounded-b-md p-4">{children}</main>

            <div className="text-muted-foreground/30 py-3 text-center text-[11px]">
              © {new Date().getFullYear()} Elyeter
            </div>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
