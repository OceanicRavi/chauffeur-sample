import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    RetellWebClient: any;
  }
}

interface CallStatus {
  isConnected: boolean;
  isAgentSpeaking: boolean;
  statusMessage: string;
  error?: string;
}

const WebCallButton: React.FC = () => {
  const [callStatus, setCallStatus] = useState<CallStatus>({
    isConnected: false,
    isAgentSpeaking: false,
    statusMessage: 'Ready to call'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [retellClient, setRetellClient] = useState<any>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  // Check server health on component mount
  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        if (data.retellConfigured) {
          setServerStatus('ok');
        } else {
          setServerStatus('error');
          setCallStatus(prev => ({
            ...prev,
            error: 'Service configuration incomplete',
            statusMessage: 'Call service not configured'
          }));
        }
      } else {
        throw new Error('Server not responding');
      }
    } catch (error) {
      console.error('Server health check failed:', error);
      setServerStatus('error');
      setCallStatus(prev => ({
        ...prev,
        error: 'Service unavailable',
        statusMessage: 'Unable to connect to service'
      }));
    }
  };

  useEffect(() => {
    if (serverStatus !== 'ok') return;

    // Load Retell SDK dynamically
    const loadRetellSDK = async () => {
      try {
        const { RetellWebClient } = await import('retell-client-js-sdk');
        const client = new RetellWebClient();
        
        // Register event handlers
        client.on("call_started", () => {
          console.log('Call started');
          setCallStatus(prev => ({
            ...prev,
            isConnected: true,
            statusMessage: "Call connected! Speak into your microphone.",
            error: undefined
          }));
          setIsLoading(false);
        });

        client.on("call_ended", () => {
          console.log('Call ended');
          setCallStatus({
            isConnected: false,
            isAgentSpeaking: false,
            statusMessage: "Call ended"
          });
          setIsLoading(false);
        });

        client.on("agent_start_talking", () => {
          console.log('Agent started talking');
          setCallStatus(prev => ({
            ...prev,
            isAgentSpeaking: true,
            statusMessage: "Agent speaking..."
          }));
        });

        client.on("agent_stop_talking", () => {
          console.log('Agent stopped talking');
          setCallStatus(prev => ({
            ...prev,
            isAgentSpeaking: false,
            statusMessage: "You can speak"
          }));
        });

        client.on("error", (error: any) => {
          console.error('Retell error:', error);
          setCallStatus(prev => ({
            ...prev,
            error: error.message || 'Call error occurred',
            statusMessage: `Error: ${error.message || 'Unknown error'}`
          }));
          setIsLoading(false);
          try {
            client.stopCall();
          } catch (e) {
            console.error('Error stopping call:', e);
          }
        });

        client.on("update", (update: any) => {
          console.log('Call update:', update);
        });

        setRetellClient(client);
        setSdkLoaded(true);
        console.log('Retell SDK loaded successfully');
      } catch (error) {
        console.error('Failed to load Retell SDK:', error);
        setCallStatus(prev => ({
          ...prev,
          error: 'Failed to load calling system',
          statusMessage: 'Call system unavailable'
        }));
      }
    };

    loadRetellSDK();
  }, [serverStatus]);

  const startCall = async () => {
    if (!retellClient || !sdkLoaded) {
      setCallStatus(prev => ({
        ...prev,
        error: 'Call system not ready',
        statusMessage: 'Please wait for system to load'
      }));
      return;
    }

    setIsLoading(true);
    setCallStatus(prev => ({
      ...prev,
      statusMessage: "Connecting...",
      error: undefined
    }));

    try {
      console.log('Requesting call access token...');
      
      // Fetch access token from your server
      const response = await fetch('/api/create-web-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const { accessToken } = await response.json();
      console.log('Access token received, starting call...');

      // Start the call using the token
      await retellClient.startCall({ 
        accessToken,
        sampleRate: 24000,
        enableUpdate: true
      });
      
      console.log('Call start request sent');
      
    } catch (error: any) {
      console.error('Failed to start call:', error);
      setCallStatus(prev => ({
        ...prev,
        error: error.message || 'Failed to start call',
        statusMessage: error.message || 'Failed to connect'
      }));
      setIsLoading(false);
    }
  };

  const endCall = () => {
    if (retellClient) {
      console.log('Ending call...');
      try {
        retellClient.stopCall();
      } catch (error) {
        console.error('Error ending call:', error);
        setCallStatus({
          isConnected: false,
          isAgentSpeaking: false,
          statusMessage: "Call ended"
        });
      }
    }
  };

  const getStatusIcon = () => {
    if (serverStatus === 'error') return <AlertCircle className="w-5 h-5 text-red-400" />;
    if (isLoading) return <Phone className="w-5 h-5 animate-pulse" />;
    if (callStatus.isConnected) {
      if (callStatus.isAgentSpeaking) {
        return <Mic className="w-5 h-5 text-green-400" />;
      }
      return <MicOff className="w-5 h-5 text-blue-400" />;
    }
    return <PhoneCall className="w-5 h-5" />;
  };

  const getButtonText = () => {
    if (serverStatus === 'checking') return 'Loading...';
    if (serverStatus === 'error') return 'Service Unavailable';
    if (isLoading) return 'Connecting...';
    if (callStatus.isConnected) return 'End Call';
    return 'Call Us Now';
  };

  const getButtonColor = () => {
    if (serverStatus === 'error' || callStatus.error) return 'bg-red-600 hover:bg-red-700';
    if (callStatus.isConnected) return 'bg-red-600 hover:bg-red-700';
    return 'bg-teal-600 hover:bg-teal-700';
  };

  const isButtonDisabled = () => {
    return isLoading || !sdkLoaded || serverStatus !== 'ok';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={callStatus.isConnected ? endCall : startCall}
        disabled={isButtonDisabled()}
        className={`${getButtonColor()} disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 hover:shadow-2xl flex items-center gap-3 min-w-[160px] justify-center`}
      >
        {getStatusIcon()}
        {getButtonText()}
      </button>

      {/* Status Display */}
      <div className="text-center">
        <p className={`text-sm ${callStatus.error || serverStatus === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
          {callStatus.statusMessage}
        </p>
        
        {callStatus.isConnected && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${callStatus.isAgentSpeaking ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`}></div>
            <span className="text-xs text-gray-400">
              {callStatus.isAgentSpeaking ? 'Agent speaking' : 'Your turn to speak'}
            </span>
          </div>
        )}
      </div>

      {/* Instructions */}
      {!callStatus.isConnected && !callStatus.error && serverStatus === 'ok' && (
        <div className="text-center max-w-sm">
          <p className="text-xs text-gray-400 leading-relaxed">
            Click to start a voice conversation with our premium chauffeur service team. 
            Make sure your microphone is enabled.
          </p>
        </div>
      )}

      {/* Configuration help */}
      {serverStatus === 'error' && (
        <div className="text-center max-w-sm">
          <p className="text-xs text-red-400 leading-relaxed">
            Call service is not configured. Please contact support or try again later.
          </p>
        </div>
      )}
    </div>
  );
};

export default WebCallButton;