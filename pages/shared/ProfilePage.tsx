
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if(newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if(newPassword.length < 6) {
        setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
        return;
    }
    // Mock API call
    setTimeout(() => {
        setMessage({ text: 'Password changed successfully!', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
    }, 1000);
  };

  if (!user) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
        
        {/* Profile Details */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Your Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong className="text-gray-500 dark:text-gray-400">Name:</strong> {user.name}</div>
                <div><strong className="text-gray-500 dark:text-gray-400">Email:</strong> {user.email}</div>
                <div><strong className="text-gray-500 dark:text-gray-400">Role:</strong> <span className="capitalize">{user.role}</span></div>
                <div><strong className="text-gray-500 dark:text-gray-400">Department:</strong> {user.department}</div>
            </div>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Old Password</label>
                    <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                {message && (
                    <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message.text}
                    </p>
                )}
                <div>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Update Password</button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default ProfilePage;
