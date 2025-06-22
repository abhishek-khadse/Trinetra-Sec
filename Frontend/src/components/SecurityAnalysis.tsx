import { useState } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../context/auth-context';

interface AnalysisResult {
  status: string;
  threat_level?: string;
  confidence?: number;
  recommendations?: string[];
}

export const SecurityAnalysis = () => {
  const { user } = useAuth();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNetworkAnalysis = async (data: any) => {
    if (!user) {
      setError('Please login to perform analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.analyzeNetwork(data);
      setAnalysisResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div>
        <h2>Please login to perform security analysis</h2>
      </div>
    );
  }

  return (
    <div>
      <h2>Security Analysis</h2>
      <div>
        <button
          onClick={() =>
            handleNetworkAnalysis({
              packet_size: 1000,
              protocol: "TCP",
              connection_rate: 50
            })
          }
        >
          Analyze Network Traffic
        </button>
        
        {loading && <p>Analyzing...</p>}
        
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        {analysisResult && (
          <div>
            <h3>Analysis Result</h3>
            <p>Status: {analysisResult.status}</p>
            {analysisResult.threat_level && (
              <p>Threat Level: {analysisResult.threat_level}</p>
            )}
            {analysisResult.confidence && (
              <p>Confidence: {(analysisResult.confidence * 100).toFixed(2)}%</p>
            )}
            {analysisResult.recommendations && (
              <div>
                <h4>Recommendations:</h4>
                <ul>
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
