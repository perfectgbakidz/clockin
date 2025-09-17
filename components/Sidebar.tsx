
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import { LayoutDashboard, Users, BarChart2, User, Clock, FileText, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const commonLinks = [
  { to: '/profile', icon: User, text: 'Profile' },
];

const navLinks = {
  [Role.EMPLOYEE]: [
    { to: '/employee/dashboard', icon: LayoutDashboard, text: 'Dashboard' },
    { to: '/employee/history', icon: Clock, text: 'My Attendance' },
    ...commonLinks,
  ],
  [Role.ADMIN]: [
    { to: '/admin/dashboard', icon: LayoutDashboard, text: 'Dashboard' },
    { to: '/admin/employees', icon: Users, text: 'Employees' },
    { to: '/attendance-logs', icon: FileText, text: 'Attendance Logs' },
    { to: '/reports', icon: BarChart2, text: 'Reports' },
    ...commonLinks,
  ],
  [Role.HR]: [
    { to: '/attendance-logs', icon: FileText, text: 'Attendance Logs' },
    { to: '/reports', icon: BarChart2, text: 'Reports' },
    ...commonLinks,
  ],
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  const links = user ? navLinks[user.role] : [];
  
  const NavItem: React.FC<{ to: string, icon: React.ElementType, text: string }> = ({ to, icon: Icon, text }) => {
    const isActive = location.pathname === to;
    return (
        <NavLink
        to={to}
        onClick={() => setIsOpen(false)}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
            isActive
            ? 'bg-indigo-600 text-white'
            : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
        }`}
        >
        <Icon className="w-5 h-5 mr-3" />
        <span>{text}</span>
        </NavLink>
    );
  };


  return (
    <>
      <div className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={() => setIsOpen(false)}></div>
      <aside className={`fixed md:relative inset-y-0 left-0 z-30 flex-shrink-0 w-64 px-4 py-4 bg-white dark:bg-gray-800 border-r dark:border-gray-700 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between mb-6">
            <a href="#" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">ClockIn</a>
            <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-gray-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
             <X size={24} />
            </button>
        </div>
        <nav className="flex flex-col space-y-2">
          {links.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
