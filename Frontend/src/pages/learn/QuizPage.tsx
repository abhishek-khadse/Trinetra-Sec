import { useState } from 'react';
import { Brain, CheckCircle, XCircle, Clock, Trophy, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface Question {
  id: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  timeSpent: number;
  correctAnswers: number[];
  userAnswers: number[];
}

const mockQuestions: Question[] = [
  {
    id: '1',
    category: 'Web Security',
    difficulty: 'beginner',
    question: 'What does XSS stand for in web security?',
    options: [
      'Cross-Site Scripting',
      'Extended Security System',
      'XML Security Standard',
      'Cross-System Security'
    ],
    correctAnswer: 0,
    explanation: 'XSS stands for Cross-Site Scripting, a vulnerability that allows attackers to inject malicious scripts into web pages viewed by other users.'
  },
  {
    id: '2',
    category: 'Network Security',
    difficulty: 'intermediate',
    question: 'Which port is commonly used for HTTPS traffic?',
    options: ['80', '443', '8080', '22'],
    correctAnswer: 1,
    explanation: 'Port 443 is the standard port for HTTPS (HTTP Secure) traffic, which uses SSL/TLS encryption.'
  },
  {
    id: '3',
    category: 'Malware Analysis',
    difficulty: 'advanced',
    question: 'What is the primary purpose of a sandbox in malware analysis?',
    options: [
      'To store malware samples',
      'To execute malware in an isolated environment',
      'To encrypt malware signatures',
      'To compress malware files'
    ],
    correctAnswer: 1,
    explanation: 'A sandbox provides an isolated environment where malware can be executed safely for analysis without affecting the host system.'
  }
];

const QuizPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setStartTime(Date.now());
    setCurrentQuestion(0);
    setUserAnswers([]);
    setShowResult(false);
    setQuizResult(null);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...userAnswers, selectedAnswer];
      setUserAnswers(newAnswers);
      
      if (currentQuestion < mockQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        // Quiz completed
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        const correctAnswers = mockQuestions.map((_, index) => mockQuestions[index].correctAnswer);
        const score = Math.round((newAnswers.filter((answer, index) => answer === correctAnswers[index]).length / mockQuestions.length) * 100);
        
        setQuizResult({
          score,
          totalQuestions: mockQuestions.length,
          timeSpent,
          correctAnswers,
          userAnswers: newAnswers,
        });
        setShowResult(true);
      }
    }
  };

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quizStarted) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Security Quiz</h1>
          <p className="text-gray-400">
            Test your cybersecurity knowledge with interactive quizzes.
          </p>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="bg-primary-500/20 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Brain className="h-12 w-12 text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Cybersecurity Knowledge Quiz</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Challenge yourself with questions covering web security, network security, malware analysis, and more.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-dark-800 p-4 rounded-lg">
                <h3 className="text-white font-medium">Questions</h3>
                <p className="text-2xl font-bold text-primary-500">{mockQuestions.length}</p>
              </div>
              <div className="bg-dark-800 p-4 rounded-lg">
                <h3 className="text-white font-medium">Categories</h3>
                <p className="text-2xl font-bold text-primary-500">3</p>
              </div>
              <div className="bg-dark-800 p-4 rounded-lg">
                <h3 className="text-white font-medium">Est. Time</h3>
                <p className="text-2xl font-bold text-primary-500">5 min</p>
              </div>
            </div>
            <Button onClick={handleStartQuiz} size="lg">
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResult && quizResult) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Quiz Results</h1>
          <p className="text-gray-400">
            Here's how you performed on the cybersecurity quiz.
          </p>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <div className={`p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center ${
              quizResult.score >= 80 ? 'bg-success/20' : 
              quizResult.score >= 60 ? 'bg-warning/20' : 'bg-error/20'
            }`}>
              <Trophy className={`h-12 w-12 ${
                quizResult.score >= 80 ? 'text-success' : 
                quizResult.score >= 60 ? 'text-warning' : 'text-error'
              }`} />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">{quizResult.score}%</h2>
            <p className="text-gray-400 mb-6">
              You got {quizResult.userAnswers.filter((answer, index) => answer === quizResult.correctAnswers[index]).length} out of {quizResult.totalQuestions} questions correct
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-dark-800 p-4 rounded-lg">
                <h3 className="text-white font-medium">Score</h3>
                <p className="text-2xl font-bold text-primary-500">{quizResult.score}%</p>
              </div>
              <div className="bg-dark-800 p-4 rounded-lg">
                <h3 className="text-white font-medium">Time</h3>
                <p className="text-2xl font-bold text-primary-500">{formatTime(quizResult.timeSpent)}</p>
              </div>
              <div className="bg-dark-800 p-4 rounded-lg">
                <h3 className="text-white font-medium">Accuracy</h3>
                <p className="text-2xl font-bold text-primary-500">
                  {Math.round((quizResult.userAnswers.filter((answer, index) => answer === quizResult.correctAnswers[index]).length / quizResult.totalQuestions) * 100)}%
                </p>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button onClick={handleStartQuiz} leftIcon={<RefreshCw className="h-4 w-4" />}>
                Retake Quiz
              </Button>
              <Button variant="outline">
                View Explanations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = mockQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / mockQuestions.length) * 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Security Quiz</h1>
        <div className="flex items-center justify-between">
          <p className="text-gray-400">
            Question {currentQuestion + 1} of {mockQuestions.length}
          </p>
          <div className="flex items-center text-gray-400">
            <Clock className="h-4 w-4 mr-2" />
            <span>{formatTime(Math.round((Date.now() - startTime) / 1000))}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-dark-700 rounded-full h-2">
        <div 
          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
              </span>
              <span className="text-gray-400 text-sm">{question.category}</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-6">{question.question}</h2>
          </div>

          <div className="space-y-3 mb-8">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedAnswer === index
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 bg-dark-800 hover:border-primary-500/50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedAnswer === index
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-400'
                  }`}>
                    {selectedAnswer === index && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-white">{option}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleNextQuestion}
              disabled={selectedAnswer === null}
            >
              {currentQuestion === mockQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizPage;