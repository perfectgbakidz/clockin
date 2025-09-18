
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../contexts/AuthContext';
import { KeyRound, CheckCircle, XCircle, Trash2 } from 'lucide-react';

// Helper to convert ArrayBuffer to Base64URL string
const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

// Helper to prepare WebAuthn credential for JSON serialization
const prepareCredentialForJson = (credential: PublicKeyCredential) => {
    const { id, rawId, type, response } = credential;
    if (response instanceof AuthenticatorAttestationResponse) {
        return {
            id,
            rawId: arrayBufferToBase64Url(rawId),
            type,
            response: {
                clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
                attestationObject: arrayBufferToBase64Url(response.attestationObject),
            },
        };
    }
    return null;
};

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  const [registrationStatus, setRegistrationStatus] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDeviceRegistered, setIsDeviceRegistered] = useState(false);

  useEffect(() => {
    const checkRegistrationStatus = async () => {
        try {
            // This endpoint should check if any credentials exist for the current user
            const { isRegistered } = await apiRequest<{ isRegistered: boolean }>('/webauthn/registration-status');
            setIsDeviceRegistered(isRegistered);
        } catch (error) {
            console.error('Failed to fetch registration status', error);
        }
    };
    if (user) {
        checkRegistrationStatus();
    }
  }, [user]);


  const handlePasswordChange = async (e: React.FormEvent) => {
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
    try {
        await apiRequest('/auth/change-password', {
            method: 'POST',
            body: { oldPassword, newPassword }
        });
        setMessage({ text: 'Password changed successfully!', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        setMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
  };
  
  const handleRegisterDevice = async () => {
    if (!user) return;
    setIsRegistering(true);
    setRegistrationStatus({ text: 'Please follow the prompt from your browser to register your device...', type: 'info' });

    try {
        if (!navigator.credentials || !navigator.credentials.create) {
            throw new Error('WebAuthn is not supported on this browser.');
        }

        // 1. Get options from server
        const creationOptions = await apiRequest<CredentialCreationOptions>('/webauthn/register/begin', { method: 'GET' });

        // Decode challenge and user.id from base64url to ArrayBuffer
        creationOptions.publicKey.challenge = Uint8Array.from(atob(String(creationOptions.publicKey.challenge).replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        creationOptions.publicKey.user.id = Uint8Array.from(atob(String(creationOptions.publicKey.user.id).replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

        // 2. Create credential
        const credential = await navigator.credentials.create(creationOptions);

        if (credential instanceof PublicKeyCredential) {
            // 3. Send credential to server to finish registration
            const jsonCredential = prepareCredentialForJson(credential);
            const result = await apiRequest<{ verified: boolean }>('/webauthn/register/finish', {
                method: 'POST',
                body: jsonCredential
            });

            if(result.verified) {
                setIsDeviceRegistered(true);
                setRegistrationStatus({ text: 'Device registered successfully!', type: 'success' });
            } else {
                 throw new Error('Server verification failed.');
            }
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
                Register your device's fingerprint or face recognition to securely clock in and out. This is a one-time setup per device. You can register multiple devices.
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
            
            {isDeviceRegistered && (
                 <div className="flex items-center p-3 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 mb-4">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">You have at least one biometric device registered.</span>
                 </div>
            )}
            <button 
                onClick={handleRegisterDevice}
                disabled={isRegistering}
                className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
            >
                <KeyRound size={18} className="mr-2" />
                {isRegistering ? 'Registering...' : 'Register a New Device'}
            </button>
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
