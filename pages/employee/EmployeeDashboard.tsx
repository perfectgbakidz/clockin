
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, CheckCircle, LogIn, LogOut, MapPin, XCircle, Info } from 'lucide-react';
import { apiRequest } from '../../contexts/AuthContext';
import { AttendanceRecord } from '../../types';

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
    if (response instanceof AuthenticatorAssertionResponse) {
        return {
            id,
            rawId: arrayBufferToBase64Url(rawId),
            type,
            response: {
                clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
                authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
                signature: arrayBufferToBase64Url(response.signature),
                userHandle: response.userHandle ? arrayBufferToBase64Url(response.userHandle) : null,
            },
        };
    }
    return null;
};


const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [verifyingAction, setVerifyingAction] = useState<'clockIn' | 'clockOut' | null>(null);
  const isVerifyingRef = useRef(false);
  
  // Fetch today's attendance record and location
  useEffect(() => {
    const fetchTodaysAttendance = async () => {
      if (!user) return;
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const records = await apiRequest<AttendanceRecord[]>(`/attendance/history`);
        const todayRecord = records.find(r => r.date === todayStr);

        if (todayRecord) {
            if (todayRecord.clockIn) setClockInTime(new Date(`${todayRecord.date}T${todayRecord.clockIn}`));
            if (todayRecord.clockOut) setClockOutTime(new Date(`${todayRecord.date}T${todayRecord.clockOut}`));
        }
      } catch (error) {
          console.error("Failed to fetch today's attendance", error);
          setStatus({ message: 'Could not fetch today\'s attendance status.', type: 'error' });
      }
    };
    
    fetchTodaysAttendance();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                console.error("Error getting location", error);
                setStatus({ message: 'Could not get location. Please enable location services in your browser.', type: 'error' });
                setLocation(null);
            }
        );
    } else {
        setStatus({ message: 'Geolocation is not supported by this browser.', type: 'error' });
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerification = (action: 'clockIn' | 'clockOut') => {
    if (!location) {
      setStatus({ message: 'Error: Location not available. Cannot clock in/out.', type: 'error' });
      return;
    }
     if (!user) {
      setStatus({ message: 'Error: User not found.', type: 'error' });
      return;
    }

    setVerifyingAction(action);
    isVerifyingRef.current = true;
    setStatus({ message: 'Waiting for biometric verification...', type: 'info' });

    const authPopup = window.open(`/#/auth-popup?userId=${user.id}`, 'auth-popup', 'width=400,height=400,popup=true');

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'webauthn-result') {
        return;
      }
      
      window.removeEventListener('message', handleMessage);
      
      if (event.data.success && event.data.credential) {
         try {
            const jsonCredential = prepareCredentialForJson(event.data.credential);
            const endpoint = action === 'clockIn' ? '/attendance/clock-in' : '/attendance/clock-out';
            
            const response = await apiRequest<{ message: string, clockInTime?: string, clockOutTime?: string }>(endpoint, {
                method: 'POST',
                body: { 
                    webAuthnResponse: jsonCredential,
                    location: location
                }
            });

            const now = new Date();
            if (action === 'clockIn') {
                setClockInTime(now);
                setClockOutTime(null);
            } else {
                setClockOutTime(now);
            }
            setStatus({ message: response.message, type: 'success' });

        } catch (apiError: any) {
            setStatus({ message: `Clock-in/out failed: ${apiError.message}`, type: 'error' });
        }
      } else {
        setStatus({ message: event.data.error || 'Verification failed. Please try again.', type: 'error' });
      }
      isVerifyingRef.current = false;
      setVerifyingAction(null);
      authPopup?.close();
    };

    window.addEventListener('message', handleMessage);

    const popupTimer = setInterval(() => {
      if (authPopup?.closed) {
        clearInterval(popupTimer);
        window.removeEventListener('message', handleMessage);
        if (isVerifyingRef.current) {
          isVerifyingRef.current = false;
          setVerifyingAction(null);
          setStatus({ message: 'Verification cancelled.', type: 'error' });
        }
      }
    }, 500);
  };

  const handleClockIn = () => handleVerification('clockIn');
  const handleClockOut = () => handleVerification('clockOut');

  const isClockedIn = !!(clockInTime && !clockOutTime);
  const hasClockedOut = !!(clockInTime && clockOutTime);
  const isVerifying = !!verifyingAction;

  const getStatusIcon = () => {
    if (!status) return null;
    switch (status.type) {
      case 'success': return <CheckCircle className="mr-3 flex-shrink-0" />;
      case 'error': return <XCircle className="mr-3 flex-shrink-0" />;
      case 'info': return <Info className="mr-3 flex-shrink-0" />;
      default: return null;
    }
  };
  
  const getStatusColors = () => {
    if (!status) return '';
    switch (status.type) {
      case 'success': return 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600 text-green-700 dark:text-green-200';
      case 'error': return 'bg-red-100 dark:bg-red-900 border-red-400 dark:border-red-600 text-red-700 dark:text-red-200';
      case 'info': return 'bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-200';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome, {user?.name}!</h1>
      
      {status && (
        <div className={`p-4 border rounded-lg flex items-center ${getStatusColors()}`}>
            {getStatusIcon()} {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Clock */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col items-center justify-center">
          <Clock className="w-16 h-16 text-indigo-500 mb-4" />
          <p className="text-5xl font-bold text-gray-800 dark:text-gray-100">{currentTime.toLocaleTimeString()}</p>
          <p className="text-lg text-gray-500 dark:text-gray-400">{currentTime.toLocaleDateString()}</p>
        </div>

        {/* Attendance Status */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Today's Status</h2>
          <div className="space-y-3">
            <p><strong>Last Clock-In:</strong> {clockInTime ? clockInTime.toLocaleTimeString() : 'Not clocked in today'}</p>
            <p><strong>Last Clock-Out:</strong> {clockOutTime ? clockOutTime.toLocaleTimeString() : 'Not clocked out yet'}</p>
          </div>
        </div>

        {/* GPS Location */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
           <h2 className="text-xl font-semibold mb-4 flex items-center"><MapPin className="mr-2"/> Your Location</h2>
           {location ? (
             <div>
                <p>Latitude: {location.lat.toFixed(4)}</p>
                <p>Longitude: {location.lng.toFixed(4)}</p>
                <div className="mt-2 h-24 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500">
                    <p>Location Acquired</p>
                </div>
             </div>
           ) : (
             <p>Fetching location... Please grant permission if prompted.</p>
           )}
        </div>
      </div>
      
      <div className="flex space-x-4 mt-6">
        <button
          onClick={handleClockIn}
          disabled={isClockedIn || hasClockedOut || isVerifying}
          className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-40"
        >
          {verifyingAction === 'clockIn' ? 'Verifying...' : <><LogIn className="mr-2" /> Clock In</>}
        </button>
        <button
          onClick={handleClockOut}
          disabled={!isClockedIn || isVerifying}
          className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-40"
        >
          {verifyingAction === 'clockOut' ? 'Verifying...' : <><LogOut className="mr-2" /> Clock Out</>}
        </button>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
