
import React, { useEffect, useState } from 'react';
import { Fingerprint, XCircle, CheckCircle } from 'lucide-react';

const AuthPopupPage: React.FC = () => {
  const [status, setStatus] = useState<{ message: string, type: 'info' | 'error' | 'success' }>({
    message: 'Simulating biometric scan...',
    type: 'info',
  });

  useEffect(() => {
    const performBiometricVerification = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const userId = urlParams.get('userId');

        if (!userId) {
          throw new Error('User ID not provided for verification.');
        }
        
        // Simulate a successful biometric scan after a short delay
        await new Promise(res => setTimeout(res, 1200));

        setStatus({ message: 'Verification Successful!', type: 'success' });
        
        const mockCredential = {
            id: `sim-cred-id-${userId}`,
            rawId: userId,
            type: 'public-key',
            response: { /* Mock data, not used by frontend but mimics real structure */ },
        };

        const result = { success: true, credential: mockCredential };
        window.opener?.postMessage({ type: 'webauthn-result', ...result }, window.location.origin);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error('Biometric verification failed:', error);
        setStatus({ message: errorMessage, type: 'error' });
        const result = { success: false, error: errorMessage };
        window.opener?.postMessage({ type: 'webauthn-result', ...result }, window.location.origin);
      } finally {
        setTimeout(() => window.close(), 1500); // Close after showing status
      }
    };

    performBiometricVerification();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center w-80">
        {status.type === 'info' && <Fingerprint className="w-16 h-16 text-indigo-500 mx-auto mb-4 animate-pulse" />}
        {status.type === 'error' && <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />}
        {status.type === 'success' && <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />}
        <h1 className="text-xl font-semibold mb-2">Biometric Verification</h1>
        <p className="text-gray-600 dark:text-gray-400">{status.message}</p>
        <p className="text-sm mt-4 text-gray-400 dark:text-gray-500">This window will close automatically.</p>
      </div>
    </div>
  );
};

export default AuthPopupPage;
