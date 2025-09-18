import React, { useEffect, useState } from 'react';
import { Fingerprint, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../contexts/AuthContext';

const AuthPopupPage: React.FC = () => {
  const [status, setStatus] = useState<{ message: string, type: 'info' | 'error' }>({
    message: 'Please follow the prompt from your browser or operating system to continue.',
    type: 'info',
  });

  useEffect(() => {
    const performBiometricVerification = async () => {
      // Check for browser support
      if (!navigator.credentials || !navigator.credentials.get) {
        const result = { success: false, error: 'Biometric verification is not supported on this browser.' };
        window.opener?.postMessage({ type: 'webauthn-result', ...result }, window.location.origin);
        setTimeout(() => window.close(), 3000);
        return;
      }
      
      let credential;
      try {
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const userId = urlParams.get('userId');

        if (!userId) {
          throw new Error('User ID not provided for verification.');
        }

        // 1. Get options from server
        const response = await fetch(`${API_BASE_URL}/webauthn/login/begin?userId=${userId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get verification challenge from server.');
        }
        const assertionOptions = await response.json();

        // Decode challenge and allowCredentials IDs from base64url to ArrayBuffer
        assertionOptions.publicKey.challenge = Uint8Array.from(atob(assertionOptions.publicKey.challenge), c => c.charCodeAt(0));
        assertionOptions.publicKey.allowCredentials.forEach((cred: any) => {
           cred.id = Uint8Array.from(atob(cred.id), c => c.charCodeAt(0));
        });
        
        // 2. Get assertion from browser
        credential = await navigator.credentials.get(assertionOptions);

        if (credential instanceof PublicKeyCredential) {
          // 3. Send credential back to main window
          const result = { success: true, credential };
          window.opener?.postMessage({ type: 'webauthn-result', ...result }, window.location.origin);
        } else {
            throw new Error('Verification failed: Invalid credential received.');
        }

      } catch (error) {
        let errorMessage = 'An unknown error occurred during verification.';
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
            errorMessage = 'Biometric verification cancelled.';
          } else if (error.name === 'SecurityError') {
             errorMessage = 'Biometric verification is not allowed on this domain (requires HTTPS).';
          } else {
            errorMessage = error.message;
          }
        }
        console.error('Biometric verification failed:', error);
        setStatus({ message: errorMessage, type: 'error' });
        const result = { success: false, error: errorMessage };
        window.opener?.postMessage({ type: 'webauthn-result', ...result }, window.location.origin);
      } finally {
        // Delay closing to let user see status and allow postMessage to be sent.
        setTimeout(() => window.close(), credential ? 500 : 3000);
      }
    };

    // Delay execution slightly to ensure the popup UI renders first.
    setTimeout(performBiometricVerification, 100);
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center w-80">
        {status.type === 'info' && <Fingerprint className="w-16 h-16 text-indigo-500 mx-auto mb-4 animate-pulse" />}
        {status.type === 'error' && <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />}
        <h1 className="text-xl font-semibold mb-2">Biometric Verification</h1>
        <p className="text-gray-600 dark:text-gray-400">{status.message}</p>
        <p className="text-sm mt-4 text-gray-400 dark:text-gray-500">This window will close automatically.</p>
      </div>
    </div>
  );
};

export default AuthPopupPage;
