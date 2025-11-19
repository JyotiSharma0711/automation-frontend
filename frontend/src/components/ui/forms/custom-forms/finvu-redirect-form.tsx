import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { SubmitEventParams } from '../../../../types/flow-types';

interface FinvuRedirectFormProps {
  submitEvent: (data: SubmitEventParams) => Promise<void>;
  referenceData?: Record<string, any>;
  sessionId: string;
  transactionId: string;
}

export default function FinvuRedirectForm({
  submitEvent,
  referenceData,
  sessionId,
  transactionId
}: FinvuRedirectFormProps) {
  const [status, setStatus] = useState<'idle' | 'waiting' | 'completed' | 'error'>('idle');
  const [finvuUrl, setFinvuUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pollCount, setPollCount] = useState<number>(0);
  
  // Use refs to prevent page refresh
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finvuWindowRef = useRef<Window | null>(null);
  const isPollingRef = useRef<boolean>(false);
  const hasCompletedRef = useRef<boolean>(false);

  // Cleanup function - prevents memory leaks and ensures no refresh
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingRef.current = false;
    localStorage.removeItem('finvu_flow_active');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Check completion function - uses axios, NO page refresh
  const checkCompletion = useCallback(async () => {
    console.log('🔍 [FINVU] Checking completion: sessionId:', sessionId, 'transactionId:', transactionId);
    if (hasCompletedRef.current) return;

    try {
      setPollCount(prev => prev + 1);

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/finvu/check-completion`,
        {
          params: {
            session_id: sessionId,
            transaction_id: transactionId,
          },
          timeout: 5000
        }
      );

      console.log('Poll result:', response.data, 'Count:', pollCount + 1);

      if (response.data.completed) {
        hasCompletedRef.current = true;
        
        // Stop polling immediately
        cleanup();

        // Update UI state (NO refresh)
        setStatus('completed');

        // Close Finvu tab if still open
        if (finvuWindowRef.current && !finvuWindowRef.current.closed) {
          try {
            finvuWindowRef.current.close();
          } catch (e) {
            console.log('Could not close Finvu window:', e);
          }
        }

        // Auto-submit to proceed with flow (NO refresh, just API call)
        setTimeout(async () => {
          try {
            await submitEvent({
              jsonPath: {
                '$.context.aa_consent_verified': 'true',
                '$.context.finvu_redirection': 'true',
              },
              formData: {
                finvu_consent: 'verified',
                timestamp: new Date().toISOString()
              }
            });
          } catch (error) {
            console.error('Error submitting event:', error);
            setErrorMessage('Verification complete but failed to proceed. Please try again.');
            setStatus('error');
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error checking completion:', error.message);
    }
  }, [sessionId, transactionId, submitEvent, cleanup, pollCount]);

  // Start polling function
  const startPolling = useCallback(() => {
    if (isPollingRef.current) {
      console.log('Already polling, skipping');
      return;
    }

    isPollingRef.current = true;
    setPollCount(0);

    console.log('Starting polling for transaction:', transactionId);

    // Poll immediately first time
    checkCompletion();

    // Then poll every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkCompletion();
    }, 2000);

  }, [transactionId, checkCompletion]);

  // Handle start verification - NO navigation/refresh
  const handleStartVerification = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // CRITICAL: Open window IMMEDIATELY to preserve user gesture (before async calls)
    // Otherwise popup blockers will prevent window.open after await
    // NOTE: Removed 'noopener' so we can write to the document
    const finvuWindow = window.open('about:blank', '_blank', 'width=800,height=600');
    
    if (!finvuWindow) {
      setStatus('error');
      setErrorMessage('Could not open Finvu window. Please allow popups for this site.');
      return;
    }

    finvuWindowRef.current = finvuWindow;

    // Show loading message in the popup while we fetch the URL
    try {
      finvuWindow.document.open();
      finvuWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Loading Finvu...</title>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0;
                background: #f3f4f6;
              }
              .loader { 
                text-align: center; 
              }
              .spinner {
                border: 4px solid #e5e7eb;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="loader">
              <div class="spinner"></div>
              <p>Opening Finvu Account Aggregator...</p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Please wait...</p>
            </div>
          </body>
        </html>
      `);
      finvuWindow.document.close();
    } catch (writeError) {
      console.warn('Could not write loading content to popup:', writeError);
      // Continue anyway - the navigation will still work
    }

    try {
      setStatus('waiting');
      setErrorMessage('');
      setPollCount(0);

      // Mark flow as active in localStorage (prevents accidental navigation)
      localStorage.setItem('finvu_flow_active', 'true');

      // Build the callback URL (where Finvu redirects after completion)
    //   const backendUrl = import.meta.env.VITE_BACKEND_URL;
      console.log('🔍 [FINVU] sessionId:', sessionId);
      console.log('🔍 [FINVU] transactionId:', transactionId);
      
      if (!transactionId) {
        throw new Error('Transaction ID is missing! Cannot create Finvu callback URL.');
      }
      


      console.log('Reference data:', referenceData);
      console.log('Reference data consent handler:', referenceData?.consent_handler);
      console.log('Backend URL:', `${import.meta.env.VITE_BACKEND_URL}/finvu/verify-consent`);

      // Call backend proxy endpoint (which calls Finvu AA Service internally)
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/finvu/verify-consent`,
        {
          transactionId,
          sessionId
        },
        {
          timeout: 15000 // 15 second timeout for backend call
        }
      );

      console.log('Finvu response:', response);
      console.log('Finvu response.data:', response.data);
      
      const url = response.data?.url;
      
      if (!url) {
        throw new Error('No URL received from backend. Response: ' + JSON.stringify(response.data));
      }
      
      console.log('Finvu response url:', url);
      setFinvuUrl(url);

      console.log('Navigating popup to Finvu URL:', url);

      // Navigate the already-opened window to the Finvu URL
      if (finvuWindow && !finvuWindow.closed) {
        finvuWindow.location.href = url;
      } else {
        throw new Error('Finvu window was closed before navigation');
      }

      // Start polling (background process, NO refresh)
      startPolling();

    } catch (error: any) {
      console.error('Error starting Finvu verification:', error);
      setStatus('error');
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to start verification');
      
      // Close the popup if we failed to get the URL
      if (finvuWindow && !finvuWindow.closed) {
        try {
          finvuWindow.close();
        } catch (e) {
          console.log('Could not close Finvu window:', e);
        }
      }
      
      cleanup();
    }
  }, [sessionId, transactionId, referenceData, startPolling, cleanup]);

  // Handle reopen - NO navigation
  const handleReopenFinvu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (finvuUrl) {
      const finvuWindow = window.open(finvuUrl, '_blank', 'noopener,noreferrer,width=800,height=600');
      finvuWindowRef.current = finvuWindow;
    }
  }, [finvuUrl]);

  // Handle retry - NO navigation
  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    cleanup();
    setStatus('idle');
    setErrorMessage('');
    setPollCount(0);
    hasCompletedRef.current = false;
  }, [cleanup]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Account Aggregator Verification</h2>

      {status === 'idle' && (
        <div>
          <p className="text-gray-600 mb-4">
            Click the button below to verify your account with Finvu Account Aggregator.
            A new tab will open where you can complete the verification process.
          </p>
          <button
            type="button"
            onClick={handleStartVerification}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Start Account Aggregator Verification
          </button>
        </div>
      )}

      {status === 'waiting' && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h3 className="text-lg font-medium mb-2">Waiting for Consent Approval</h3>
          <p className="text-gray-600 mb-4">
            Please complete the verification process in the Finvu tab that was opened.
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Checking automatically... (Poll #{pollCount})
          </p>
          <p className="text-xs text-gray-400 mb-4">
            This page will NOT refresh. Stay here while completing the verification.
          </p>
          <button
            type="button"
            onClick={handleReopenFinvu}
            className="text-blue-600 hover:text-blue-800 underline focus:outline-none"
          >
            Reopen Finvu Tab
          </button>
        </div>
      )}

      {status === 'completed' && (
        <div className="text-center text-green-600">
          <div className="text-5xl mb-4">✓</div>
          <h3 className="text-lg font-medium mb-2">Verification Completed!</h3>
          <p className="text-gray-600">Proceeding to next step...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">✕</div>
          <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

