
import React, { useState, useMemo } from 'react';
import { MOCK_ATTENDANCE } from '../../data/mockData';
import { Download, Search } from 'lucide-react';

const AttendanceLogsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const filteredLogs = useMemo(() => {
        return MOCK_ATTENDANCE
            .filter(record => 
                record.userName.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (!dateFilter || record.date === dateFilter)
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [searchTerm, dateFilter]);

    const handleExport = () => {
        let csvContent = "data:text/csv;charset=utf-8,Employee Name,Date,Clock In,Clock Out,Total Hours\n";
        filteredLogs.forEach(row => {
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
                        {filteredLogs.map((record) => (
                            <tr key={record.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{record.userName}</td>
                                <td className="px-6 py-4">{record.date}</td>
                                <td className="px-6 py-4">{record.clockIn || '--:--'}</td>
                                <td className="px-6 py-4">{record.clockOut || '--:--'}</td>
                                <td className="px-6 py-4">{record.totalHours !== null ? `${record.totalHours.toFixed(2)} hrs` : 'N/A'}</td>
                            </tr>
                        ))}
                         {filteredLogs.length === 0 && (
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
