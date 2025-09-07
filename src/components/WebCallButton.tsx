import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, MicOff } from 'lucide-react';

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

  useEffect(() => {
    // Load Retell SDK dynamically
    const loadRetellSDK = async () => {
      try {
        const { RetellWebClient } = await import('retell-client-js-sdk');
        const client = new RetellWebClient();
        
        // Register event handlers
        client.on("call_started", () => {
          setCallStatus(prev => ({
            ...prev,
            isConnected: true,
            statusMessage: "Call connected! Speak into your microphone.",
            error: undefined
          }));
          setIsLoading(false);
        });

        client.on("call_ended", () => {
          setCallStatus({
            isConnected: false,
            isAgentSpeaking: false,
            statusMessage: "Call ended"
          });
          setIsLoading(false);
        });

        client.on("agent_start_talking", () => {
          setCallStatus(prev => ({
            ...prev,
            isAgentSpeaking: true,
            statusMessage: "Agent speaking..."
          }));
        });

        client.on("agent_stop_talking", () => {
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
          client.stopCall();
        });

        setRetellClient(client);
        setSdkLoaded(true);
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
  }, []);

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
      // Fetch access token from your server
      const response = await fetch('/api/create-web-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create call');
      }

      const { accessToken } = await response.json();

      // Start the call using the token
      await retellClient.startCall({ accessToken });
      
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
      retellClient.stopCall();
    }
  };

  const getStatusIcon = () => {
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
    if (isLoading) return 'Connecting...';
    if (callStatus.isConnected) return 'End Call';
    return 'Call Us Now';
  };

  const getButtonColor = () => {
    if (callStatus.error) return 'bg-red-600 hover:bg-red-700';
    if (callStatus.isConnected) return 'bg-red-600 hover:bg-red-700';
    return 'bg-teal-600 hover:bg-teal-700';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={callStatus.isConnected ? endCall : startCall}
        disabled={isLoading || !sdkLoaded}
        className={`${getButtonColor()} disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 hover:shadow-2xl flex items-center gap-3 min-w-[160px] justify-center`}
      >
        {getStatusIcon()}
        {getButtonText()}
      </button>

      {/* Status Display */}
      <div className="text-center">
        <p className={`text-sm ${callStatus.error ? 'text-red-400' : 'text-gray-300'}`}>
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
      {!callStatus.isConnected && !callStatus.error && (
        <div className="text-center max-w-sm">
          <p className="text-xs text-gray-400 leading-relaxed">
            Click to start a voice conversation with our premium chauffeur service team. 
            Make sure your microphone is enabled.
          </p>
        </div>
      )}
    </div>
  );
};

export default WebCallButton;