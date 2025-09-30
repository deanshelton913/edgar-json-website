'use client';

import { useSidebar } from '../contexts/SidebarContext';

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { isSidebarCollapsed } = useSidebar();

  return (
    <main 
      className={`pt-4 md:pt-6 transition-all duration-300 ${
        isSidebarCollapsed ? 'md:ml-16' : 'md:ml-48 lg:ml-64'
      }`}
    >
      {children}
    </main>
  );
}
