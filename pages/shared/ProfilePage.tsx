import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { KeyRound, CheckCircle, XCircle, Trash2 } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  const [registrationStatus, setRegistrationStatus] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDeviceRegistered, setIsDeviceRegistered] = useState(false);

  // Check registration status on component mount
  useEffect(() => {
    if (user) {
      const registrationKey = `biometric_registered_${user.id}`;
      if (localStorage.getItem(registrationKey) === 'true') {
        setIsDeviceRegistered(true);
      }
    }
  }, [user]);


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
  
  const handleRegisterDevice = async () => {
    if (!user) return;
    setIsRegistering(true);
    setRegistrationStatus({ text: 'Please follow the prompt from your browser to register your device...', type: 'info' });

    try {
        if (!navigator.credentials || !navigator.credentials.create) {
            throw new Error('WebAuthn is not supported on this browser.');
        }

        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        const userId = new TextEncoder().encode(user.id);

        const credential = await navigator.credentials.create({
            publicKey: {
                challenge,
                rp: {
                    name: 'Pardee Foods',
                    id: window.location.hostname,
                },
                user: {
                    id: userId,
                    name: user.email,
                    displayName: user.name,
                },
                pubKeyCredParams: [{ type: 'public-key', alg: -7 }], // ES256
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'required',
                },
                timeout: 60000,
            },
        });

        if (credential instanceof PublicKeyCredential) {
            // In a real app, send credential to server. Here, we'll use localStorage.
            const registrationKey = `biometric_registered_${user.id}`;
            const credentialIdKey = `biometric_credential_id_${user.id}`;
            
            // The `credential.id` is a Base64URL encoded string, perfect for storage.
            localStorage.setItem(credentialIdKey, credential.id);
            localStorage.setItem(registrationKey, 'true');

            setIsDeviceRegistered(true);
            setRegistrationStatus({ text: 'Device registered successfully!', type: 'success' });
        } else {
             throw new Error('Failed to create a valid public key credential.');
        }
    } catch (error) {
        let errorMessage = 'An unknown error occurred.';
        if (error instanceof Error) {
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Registration was cancelled.';
            } else {
                errorMessage = error.message;
            }
        }
        console.error('Registration failed:', error);
        setRegistrationStatus({ text: `Registration failed: ${errorMessage}`, type: 'error' });
    } finally {
        setIsRegistering(false);
    }
  };
  
  const handleRemoveRegistration = () => {
      if (user && window.confirm('Are you sure you want to remove biometric registration for this device?')) {
          const registrationKey = `biometric_registered_${user.id}`;
          const credentialIdKey = `biometric_credential_id_${user.id}`;
          localStorage.removeItem(registrationKey);
          localStorage.removeItem(credentialIdKey);
          setIsDeviceRegistered(false);
          setRegistrationStatus({ text: 'Biometric registration removed.', type: 'info' });
      }
  };


  if (!user) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Your Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong className="text-gray-500 dark:text-gray-400">Name:</strong> {user.name}</div>
                <div><strong className="text-gray-500 dark:text-gray-400">Email:</strong> {user.email}</div>
                <div><strong className="text-gray-500 dark:text-gray-400">Role:</strong> <span className="capitalize">{user.role}</span></div>
                <div><strong className="text-gray-500 dark:text-gray-400">Department:</strong> {user.department}</div>
            </div>
        </div>

        {/* Biometric Registration */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Biometric Registration</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Register your device's fingerprint or face recognition to securely clock in and out. This is a one-time setup per device.
            </p>
             {registrationStatus && (
                <div className={`mb-4 flex items-center p-3 rounded-md text-sm ${
                    registrationStatus.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                    registrationStatus.type === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                    'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                }`}>
                    {registrationStatus.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
                    {registrationStatus.type === 'error' && <XCircle className="w-5 h-5 mr-2" />}
                    {registrationStatus.text}
                </div>
            )}
            
            {isDeviceRegistered ? (
                <div className="flex items-center space-x-4">
                    <div className="flex items-center p-3 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                       <CheckCircle className="w-5 h-5 mr-2" />
                       <span className="font-medium">This device is registered.</span>
                    </div>
                    <button 
                        onClick={handleRemoveRegistration}
                        className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        <Trash2 size={18} className="mr-2" />
                        Remove Registration
                    </button>
                </div>
            ) : (
                <button 
                    onClick={handleRegisterDevice}
                    disabled={isRegistering}
                    className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                    <KeyRound size={18} className="mr-2" />
                    {isRegistering ? 'Registering...' : 'Register This Device'}
                </button>
            )}
        </div>

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