import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
      
      <div className="flex flex-1 pt-16">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <main className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8 min-w-0 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}