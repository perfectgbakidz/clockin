import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../contexts/AuthContext';
import { AttendanceRecord } from '../../types';
import { Download, Search } from 'lucide-react';

const AttendanceHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) { // Guard against missing user or user.id
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<AttendanceRecord[]>(`/attendance/history?user_id=${user.id}`);
        setHistory(data);
      } catch (err: any) {
        console.error("Failed to fetch attendance history", err);
        const errorMessage = (err.message || '').toLowerCase().includes('user_id')
          ? 'User ID missing. Please log in again.'
          : 'Failed to fetch attendance history.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const userHistory = useMemo(() => {
    return history
      .filter(record => record.date.includes(searchTerm))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history, searchTerm]);
  
  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,Date,Clock In,Clock Out,Total Hours\n";
    userHistory.forEach(row => {
        csvContent += `${row.date},${row.clockIn || ''},${row.clockOut || ''},${row.totalHours || '0'}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Attendance History</h1>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by date (YYYY-MM-DD)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Download size={16} className="mr-2" /> Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {error && <p className="text-red-500 text-center py-2">{error}</p>}
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Date</th>
              <th scope="col" className="px-6 py-3">Clock In Time</th>
              <th scope="col" className="px-6 py-3">Clock Out Time</th>
              <th scope="col" className="px-6 py-3">Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                 <tr>
                    <td colSpan={4} className="text-center py-4">Loading history...</td>
                </tr>
            ) : userHistory.length > 0 ? (
              userHistory.map((record) => (
                <tr key={record.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{record.date}</td>
                  <td className="px-6 py-4">{record.clockIn || '--:--'}</td>
                  <td className="px-6 py-4">{record.clockOut || '--:--'}</td>
                  <td className="px-6 py-4">{record.totalHours !== null ? `${record.totalHours.toFixed(2)} hrs` : 'N/A'}</td>
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan={4} className="text-center py-4">{error ? 'Could not load data' : 'No records found.'}</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceHistoryPage;