'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, getUserApiParams } from '@/lib/user-context';

export default function TestPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Kullanıcı bağlamını al
  const userContext = getCurrentUser()

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Test: Fetching KPIs...');
        const apiParams = getUserApiParams(userContext)
        const response = await fetch(`/api/kpis?${apiParams}`);
        console.log('Test: Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Test: Data received:', result);
        setData(result);
        setLoading(false);
      } catch (err) {
        console.error('Test: Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      <div className="mb-4 p-4 bg-blue-100 rounded">
        <h2 className="font-semibold mb-2">Current User Context:</h2>
        <p><strong>Role:</strong> {userContext.userRole}</p>
        <p><strong>Factory ID:</strong> {userContext.factoryId || 'None'}</p>
        <p><strong>Can View All Factories:</strong> {userContext.permissions.canViewAllFactories ? 'Yes' : 'No'}</p>
      </div>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">KPIs Data ({Array.isArray(data) ? data.length : 0} items):</h2>
        <pre className="text-sm overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
} 