import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Failed to create account. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Create an account</h2>
        <p className="text-gray-400 mt-2">Join TrinetraSec cybersecurity platform</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-secondary-500/20 border border-secondary-500 rounded-md">
          <p className="text-secondary-500 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          fullWidth
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          fullWidth
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          fullWidth
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            className="h-4 w-4 rounded bg-dark-700 border-dark-600 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-800"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-400">
            I agree to the{' '}
            <a href="#" className="text-primary-500 hover:text-primary-400">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary-500 hover:text-primary-400">
              Privacy Policy
            </a>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={loading}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Already have an account?{' '}
          <Link to="/auth/signin" className="text-primary-500 hover:text-primary-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;