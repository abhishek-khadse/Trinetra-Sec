import { useState } from 'react';
import { Play, Pause, Square, Target, Shield, AlertTriangle, Clock, Download } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';

interface AttackScenario {
  id: string;
  name: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  description: string;
  objectives: string[];
  techniques: string[];
}

interface SimulationResult {
  id: string;
  scenario: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  score: number;
  detectedAttacks: number;
  missedAttacks: number;
  falsePositives: number;
}

const mockScenarios: AttackScenario[] = [
  {
    id: '1',
    name: 'Phishing Email Campaign',
    category: 'Social Engineering',
    difficulty: 'beginner',
    duration: '30 minutes',
    description: 'Simulate a targeted phishing campaign against your organization.',
    objectives: ['Test email security controls', 'Evaluate user awareness', 'Assess incident response'],
    techniques: ['Spear Phishing', 'Credential Harvesting', 'Social Engineering'],
  },
  {
    id: '2',
    name: 'Advanced Persistent Threat',
    category: 'Advanced Attacks',
    difficulty: 'advanced',
    duration: '2 hours',
    description: 'Multi-stage APT simulation with lateral movement and data exfiltration.',
    objectives: ['Test network segmentation', 'Evaluate detection capabilities', 'Assess response time'],
    techniques: ['Initial Access', 'Lateral Movement', 'Data Exfiltration', 'Persistence'],
  },
  {
    id: '3',
    name: 'Ransomware Attack',
    category: 'Malware',
    difficulty: 'intermediate',
    duration: '1 hour',
    description: 'Simulate a ransomware attack to test backup and recovery procedures.',
    objectives: ['Test backup systems', 'Evaluate encryption detection', 'Assess recovery time'],
    techniques: ['File Encryption', 'Network Propagation', 'Backup Targeting'],
  },
];

const mockResults: SimulationResult[] = [
  {
    id: '1',
    scenario: 'Phishing Email Campaign',
    status: 'completed',
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() - 1800000).toISOString(),
    score: 85,
    detectedAttacks: 8,
    missedAttacks: 2,
    falsePositives: 1,
  },
  {
    id: '2',
    scenario: 'SQL Injection Test',
    status: 'completed',
    startTime: new Date(Date.now() - 7200000).toISOString(),
    endTime: new Date(Date.now() - 5400000).toISOString(),
    score: 92,
    detectedAttacks: 12,
    missedAttacks: 1,
    falsePositives: 0,
  },
];

const AttackSimLabPage = () => {
  const [scenarios] = useState<AttackScenario[]>(mockScenarios);
  const [results] = useState<SimulationResult[]>(mockResults);
  const [runningSimulation, setRunningSimulation] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario | null>(null);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-success bg-success/20';
      case 'intermediate':
        return 'text-warning bg-warning/20';
      case 'advanced':
        return 'text-error bg-error/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-info bg-info/20';
      case 'completed':
        return 'text-success bg-success/20';
      case 'failed':
        return 'text-error bg-error/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const handleStartSimulation = (scenarioId: string) => {
    setRunningSimulation(scenarioId);
    // Simulate running for 5 seconds then complete
    setTimeout(() => {
      setRunningSimulation(null);
    }, 5000);
  };

  const handleStopSimulation = () => {
    setRunningSimulation(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Attack Simulation Lab</h1>
        <p className="text-gray-400">
          Test your security defenses with realistic attack simulations and scenarios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scenarios List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Attack Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className={`bg-dark-800 border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedScenario?.id === scenario.id
                        ? 'border-primary-500'
                        : 'border-dark-600 hover:border-primary-500/50'
                    }`}
                    onClick={() => setSelectedScenario(scenario)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium mb-1">{scenario.name}</h3>
                        <p className="text-gray-400 text-sm">{scenario.category}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(scenario.difficulty)}`}>
                          {scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)}
                        </span>
                        <div className="flex items-center text-gray-400 text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          {scenario.duration}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-3">{scenario.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {scenario.techniques.slice(0, 3).map((technique, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-dark-700 text-gray-300 rounded text-xs"
                          >
                            {technique}
                          </span>
                        ))}
                        {scenario.techniques.length > 3 && (
                          <span className="px-2 py-1 bg-dark-700 text-gray-300 rounded text-xs">
                            +{scenario.techniques.length - 3} more
                          </span>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (runningSimulation === scenario.id) {
                            handleStopSimulation();
                          } else {
                            handleStartSimulation(scenario.id);
                          }
                        }}
                        isLoading={runningSimulation === scenario.id}
                        leftIcon={
                          runningSimulation === scenario.id ? (
                            <Square className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )
                        }
                      >
                        {runningSimulation === scenario.id ? 'Stop' : 'Start'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scenario Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Scenario Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedScenario ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-medium mb-2">{selectedScenario.name}</h3>
                    <p className="text-gray-400 text-sm">{selectedScenario.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-2">Objectives</h4>
                    <ul className="space-y-1">
                      {selectedScenario.objectives.map((objective, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-center">
                          <Target className="h-3 w-3 mr-2 text-primary-500" />
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-2">Attack Techniques</h4>
                    <div className="space-y-1">
                      {selectedScenario.techniques.map((technique, index) => (
                        <div key={index} className="text-gray-300 text-sm bg-dark-700 p-2 rounded">
                          {technique}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-dark-600">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Category</p>
                        <p className="text-white">{selectedScenario.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Duration</p>
                        <p className="text-white">{selectedScenario.duration}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Select a scenario to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Simulation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-4">Scenario</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Score</th>
                  <th className="pb-4">Detected</th>
                  <th className="pb-4">Missed</th>
                  <th className="pb-4">False Positives</th>
                  <th className="pb-4">Duration</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id} className="border-t border-dark-600">
                    <td className="py-4 text-white">{result.scenario}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                        {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`text-lg font-bold ${
                        result.score >= 90 ? 'text-success' :
                        result.score >= 70 ? 'text-warning' :
                        'text-error'
                      }`}>
                        {result.score}%
                      </span>
                    </td>
                    <td className="py-4 text-success">{result.detectedAttacks}</td>
                    <td className="py-4 text-error">{result.missedAttacks}</td>
                    <td className="py-4 text-warning">{result.falsePositives}</td>
                    <td className="py-4 text-gray-300">
                      {result.endTime ? 
                        Math.round((new Date(result.endTime).getTime() - new Date(result.startTime).getTime()) / 60000) + 'm' :
                        'Running...'
                      }
                    </td>
                    <td className="py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Download className="h-4 w-4" />}
                      >
                        Report
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttackSimLabPage;