
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// Mock data for charts
const absenteeismData = [
    { name: 'Mon', Absent: 4, Present: 20 },
    { name: 'Tue', Absent: 3, Present: 21 },
    { name: 'Wed', Absent: 5, Present: 19 },
    { name: 'Thu', Absent: 2, Present: 22 },
    { name: 'Fri', Absent: 1, Present: 23 },
];

const workingHoursData = [
    { name: 'Week 1', avgHours: 7.8 },
    { name: 'Week 2', avgHours: 8.1 },
    { name: 'Week 3', avgHours: 7.5 },
    { name: 'Week 4', avgHours: 8.2 },
];

const ReportsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Reports</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Weekly Absenteeism Trends</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={absenteeismData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Present" fill="#4ade80" />
                            <Bar dataKey="Absent" fill="#f87171" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Average Working Hours</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={workingHoursData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="avgHours" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Generate & Download</h2>
                <div className="flex flex-wrap gap-4">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Download Monthly Report (CSV)</button>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Download Weekly Report (CSV)</button>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
