import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, House, Target, ClockCounterClockwise, SignOut,
  User, CaretDown, List
} from '@phosphor-icons/react';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: House },
    { path: '/dashboard/assessment', label: 'New Assessment', icon: Target },
    { path: '/dashboard/history', label: 'History', icon: ClockCounterClockwise },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#05050A]">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-white/60 hover:text-white"
            >
              <List size={24} />
            </button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-[#F97316]" weight="duotone" />
              <span className="text-xl font-bold text-white">CareerAI</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/dashboard/assessment">
              <Button data-testid="new-assessment-btn" className="btn-primary hidden sm:flex">
                <Target className="mr-2" weight="duotone" />
                New Assessment
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  data-testid="user-menu-btn"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#F97316]/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#F97316]" weight="duotone" />
                  </div>
                  <span className="text-white hidden sm:block">{user?.full_name || user?.username}</span>
                  <CaretDown className="text-white/40" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#111116] border-white/10 text-white">
                <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                  <User className="mr-2" /> Profile
                </DropdownMenuItem>
                {isAdmin() && (
                  <DropdownMenuItem 
                    className="hover:bg-white/10 cursor-pointer"
                    onClick={() => navigate('/admin')}
                  >
                    <Brain className="mr-2" /> Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  data-testid="logout-btn"
                  className="hover:bg-white/10 cursor-pointer text-red-400"
                  onClick={handleLogout}
                >
                  <SignOut className="mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-[#111116] border-r border-white/10
          transform transition-transform duration-300 lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#F97316]/10 text-[#F97316] border-l-2 border-[#F97316]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon weight={isActive ? 'fill' : 'duotone'} size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
