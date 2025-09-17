
import React from 'react';
import { Users, UserCheck, UserX, AlertTriangle } from 'lucide-react';

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, color: string }> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center">
    <div className={`p-3 rounded-full mr-4 ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
    // Mock data
    const stats = {
        totalEmployees: 5,
        presentToday: 2,
        absentToday: 3,
        lateArrivals: 1,
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Admin Dashboard</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Users} title="Total Employees" value={stats.totalEmployees} color="bg-blue-500" />
                <StatCard icon={UserCheck} title="Present Today" value={stats.presentToday} color="bg-green-500" />
                <StatCard icon={UserX} title="Absent Today" value={stats.absentToday} color="bg-red-500" />
                <StatCard icon={AlertTriangle} title="Late Arrivals" value={stats.lateArrivals} color="bg-yellow-500" />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add New Employee</button>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Generate Report</button>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">View All Logs</button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
