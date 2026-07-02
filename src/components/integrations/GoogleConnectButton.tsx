import React from 'react';
import { useToast } from '@/hooks/use-toast';

const GoogleConnectButton: React.FC = () => {
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      const response = await fetch('/integrations/google/oauth/connect');
      if (!response.ok) throw new Error('Failed to fetch auth URL');
      const data = await response.json();

      // Redirect to Google
      window.location.href = data.authUrl;
    } catch (error) {
      console.error(error);
      alert("Failed to connect to Google");
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/integrations/google/disconnect', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to disconnect');

      // Refresh integration status
      alert("Google Disconnected");
    } catch (err) {
      console.error(err);
      alert("Failed to disconnect");
    }
  };

  const createEvent = async () => {
    try {
      const eventData = {
        summary: "Live Class - React Basics",
        description: "Weekly live session",
        startDateTime: "2026-06-05T10:00:00",
        endDateTime: "2026-06-05T11:00:00",
        timeZone: "Asia/Kolkata"
      };

      const response = await fetch('/integrations/google/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) throw new Error('Failed to create event');
      toast({
        title: 'Event Created',
        description: 'Successfully created Google Calendar event',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Event Creation Failed',
        description: 'Failed to create event',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleConnect}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
      >
        Connect Google Calendar
      </button>

      <div className="flex gap-4">
        <button
          onClick={handleDisconnect}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex-1 transition"
        >
          Disconnect
        </button>
        <button
          onClick={createEvent}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex-1 transition"
        >
          Test Event
        </button>
      </div>
    </div>
  );
};

export default GoogleConnectButton;


