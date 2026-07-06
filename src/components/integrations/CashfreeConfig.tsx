import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { integrationApi } from '@/services/integrationApi';

const CashfreeConfig: React.FC = () => {
  const { toast } = useToast();
  const [appId, setAppId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [mode, setMode] = useState('TEST');

  const handleSave = async () => {
    try {
      await integrationApi.saveCashfreeConfig({ 
        appId, 
        secretKey, 
        mode,
        successRedirectUrl: `${window.location.origin}/payment/success`,
        failureRedirectUrl: `${window.location.origin}/payment/failure`
      });
      toast({ title: 'Cashfree config saved', variant: 'default' });
    } catch (e) {
      toast({ title: 'Failed to save', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Cashfree Payments</h3>
      <div className="grid gap-2 mb-2">
        <input
          type="text"
          placeholder="App ID"
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
          className="border p-1 rounded"
        />
        <input
          type="password"
          placeholder="Secret Key"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          className="border p-1 rounded"
        />
        <div className="flex items-center space-x-2">
          <label className="text-sm">Mode:</label>
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="TEST">TEST</option>
            <option value="PROD">PROD</option>
          </select>
        </div>
      </div>
      <button
        onClick={handleSave}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Save Configuration
      </button>
    </div>
  );
};

export default CashfreeConfig;




