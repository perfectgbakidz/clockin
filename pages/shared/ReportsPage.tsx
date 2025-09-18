
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { apiRequest } from '../../contexts/AuthContext';

interface AbsenteeismData {
    name: string;
    Present: number;
    Absent: number;
}

interface WorkingHoursData {
    name: string;
    avgHours: number;
}

const ReportsPage: React.FC = () => {
    const [absenteeismData, setAbsenteeismData] = useState<AbsenteeismData[]>([]);
    const [workingHoursData, setWorkingHoursData] = useState<WorkingHoursData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const [absenteeism, workingHours] = await Promise.all([
                    apiRequest<AbsenteeismData[]>('/reports/absenteeism-trends'),
                    apiRequest<WorkingHoursData[]>('/reports/working-hours')
                ]);
                setAbsenteeismData(absenteeism);
                setWorkingHoursData(workingHours);
            } catch (error) {
                console.error("Failed to fetch report data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, []);

    const handleDownload = (reportType: 'monthly' | 'weekly') => {
        const reportTypeStr = reportType.charAt(0).toUpperCase() + reportType.slice(1);
        let csvContent = `data:text/csv;charset=utf-8,${reportTypeStr} Report (Simulated)\nDate,Employee,Status,Hours\n`;
        
        // Add some mock data for the CSV file
        csvContent += "2023-10-27,Bob Employee,Present,8.17\n";
        csvContent += "2023-10-27,David Developer,Present,7.98\n";
        csvContent += "2023-10-26,Alice Admin,Absent,0\n";
        
        const encodedUri = encodeURI(csvContent);
        const a = document.createElement('a');
        a.href = encodedUri;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Reports</h1>
            
            {loading ? <p>Loading reports...</p> : (
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
            )}
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Generate & Download</h2>
                <div className="flex flex-wrap gap-4">
                    <button onClick={() => handleDownload('monthly')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Download Monthly Report (CSV)</button>
                    <button onClick={() => handleDownload('weekly')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Download Weekly Report (CSV)</button>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
