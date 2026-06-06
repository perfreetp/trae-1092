import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useParkingStore } from '@/store/useParkingStore';

export const Layout: React.FC = () => {
  const initData = useParkingStore((state) => state.initData);

  useEffect(() => {
    initData();
  }, [initData]);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
