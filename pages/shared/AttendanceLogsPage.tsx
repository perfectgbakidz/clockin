
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { apiRequest } from '../../contexts/AuthContext';
import { AttendanceRecord } from '../../types';
import { Download, Search } from 'lucide-react';

// Debounce helper
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
        new Promise(resolve => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => resolve(func(...args)), waitFor);
        });
}

const AttendanceLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const fetchLogs = useCallback(async (search: string, date: string) => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (search) query.set('search', search);
            if (date) query.set('date', date);
            const data = await apiRequest<AttendanceRecord[]>(`/admin/attendance-logs?${query.toString()}`);
            setLogs(data);
        } catch (error) {
            console.error("Failed to fetch attendance logs", error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    const debouncedFetch = useMemo(() => debounce(fetchLogs, 300), [fetchLogs]);

    useEffect(() => {
        debouncedFetch(searchTerm, dateFilter);
    }, [searchTerm, dateFilter, debouncedFetch]);

    const handleExport = () => {
        let csvContent = "data:text/csv;charset=utf-8,Employee Name,Date,Clock In,Clock Out,Total Hours\n";
        logs.forEach(row => {
            csvContent += `${row.userName},${row.date},${row.clockIn || ''},${row.clockOut || ''},${row.totalHours || '0'}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "attendance_logs.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Attendance Logs</h1>
                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                    <button onClick={handleExport} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        <Download size={16} className="mr-2" /> Export
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Employee Name</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Clock In</th>
                            <th scope="col" className="px-6 py-3">Clock Out</th>
                            <th scope="col" className="px-6 py-3">Total Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-4">Loading logs...</td></tr>
                        ) : logs.length > 0 ? (
                           logs.map((record) => (
                                <tr key={record.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{record.userName}</td>
                                    <td className="px-6 py-4">{record.date}</td>
                                    <td className="px-6 py-4">{record.clockIn || '--:--'}</td>
                                    <td className="px-6 py-4">{record.clockOut || '--:--'}</td>
                                    <td className="px-6 py-4">{record.totalHours !== null ? `${record.totalHours.toFixed(2)} hrs` : 'N/A'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-4">No logs found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceLogsPage;
