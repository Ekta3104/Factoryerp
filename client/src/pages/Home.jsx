import { useEffect, useState } from 'react';
import api from '../services/api';

const Home = () => {
  const [health, setHealth] = useState({ status: 'Loading...', timestamp: null });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await api.get('/health');
        setHealth({
          status: 'Backend API is Connected ✅',
          timestamp: response.data.timestamp,
        });
      } catch (error) {
        console.error('Health check failed:', error);
        setHealth({
          status: 'Backend API is Offline ❌',
          timestamp: null,
        });
      }
    };
    checkHealth();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center max-w-2xl mx-auto mt-10">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
        Welcome to FactoryERP
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        The project foundation has been successfully configured.
      </p>
      
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 inline-block text-left shadow-inner">
        <h3 className="font-semibold text-gray-700 mb-3 uppercase tracking-wider text-sm">System Status</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">React Frontend:</span> Running ✅
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">Express Backend:</span>{' '}
            <span className={health.status.includes('Connected') ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {health.status}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
