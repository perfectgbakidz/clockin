import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { apiRequest, useAuth, API_BASE_URL } from '../../contexts/AuthContext';

// Fix: Define interfaces for the report data shapes.
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
    // Fix: Use the new interfaces to type the component's state.
    const [absenteeismData, setAbsenteeismData] = useState<AbsenteeismData[]>([]);
    const [workingHoursData, setWorkingHoursData] = useState<WorkingHoursData[]>([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                // Fix: Provide generic types to apiRequest to ensure typed responses.
                const [absenteeism, workingHours] = await Promise.all([
                    apiRequest<AbsenteeismData[]>('/reports/absenteeism-trends'),
                    apiRequest<WorkingHoursData[]>('/reports/working-hours')
                ]);
                setAbsenteeismData(absenteeism);
                setWorkingHoursData(workingHours);
            } catch (error) {
                console.error("Failed to fetch report data", error);
                // Optionally set an error state to display in the UI
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, []);

    const handleDownload = async (reportType: 'monthly' | 'weekly') => {
        if (!token) {
            alert('Authentication error. Please log in again.');
            return;
        }
        try {
            // apiRequest is for JSON, so use fetch directly for blobs
            const response = await fetch(`${API_BASE_URL}/reports/download?type=${reportType}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Download failed with status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download report', error);
            alert('Failed to download report. See console for details.');
        }
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
