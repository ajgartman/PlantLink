import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invitesAPI, authAPI } from '../services/api';

interface InviteInfo {
  email: string;
  role: string;
  company_name: string;
  company_type: string;
  expires_at: string;
}

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No invite token provided');
      setLoading(false);
      return;
    }
    const validate = async () => {
      try {
        const data = await invitesAPI.validateToken(token);
        setInvite(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Invalid or expired invite link');
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (password.length < 6) {
      setSubmitError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      // Register via invite
      await invitesAPI.acceptInvite({
        token: token!,
        password,
        full_name: fullName,
      });

      // Auto-login after registration
      const loginData = await authAPI.login(invite!.email, password);
      localStorage.setItem('token', loginData.access_token);
      localStorage.setItem('user', JSON.stringify({
        full_name: loginData.full_name,
        email: loginData.email,
        role: loginData.role,
      }));
      navigate('/dashboard');
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] via-[#2c5f8d] to-[#4a90e2]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
          <div className="absolute inset-0 rounded-full border-t-2 border-white animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] via-[#2c5f8d] to-[#4a90e2]">
        <div className="bg-white rounded-3xl p-12 w-full max-w-md shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Invite</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-gradient-to-r from-[#2c5f8d] to-[#4a90e2] text-white rounded-xl text-sm font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#1e3a5f] via-[#2c5f8d] to-[#4a90e2] relative overflow-hidden">
      <div className="absolute w-full h-full opacity-10 bg-repeat"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)' }}>
      </div>

      <div className="container flex w-full max-w-7xl m-auto relative z-10">
        {/* Left panel */}
        <div className="flex-1 flex flex-col justify-center p-16 text-white">
          <div className="text-5xl font-bold mb-10">PlantSync</div>
          <h1 className="text-3xl font-light mb-6 leading-relaxed">
            You've Been Invited
          </h1>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-base opacity-90">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-400/30 rounded-full font-bold text-sm">🏢</span>
              Company: <strong>{invite?.company_name}</strong>
            </div>
            <div className="flex items-center gap-3 text-base opacity-90">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-400/30 rounded-full font-bold text-sm">👤</span>
              Role: <strong className="capitalize">{invite?.role}</strong>
            </div>
            <div className="flex items-center gap-3 text-base opacity-90">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-400/30 rounded-full font-bold text-sm">✉</span>
              Email: <strong>{invite?.email}</strong>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-none w-[480px] flex items-center justify-center p-10">
          <div className="bg-white rounded-3xl p-12 w-full max-w-md shadow-2xl">
            <div className="text-center mb-9">
              <h2 className="text-3xl text-gray-900 mb-2 font-bold">Create Your Account</h2>
              <p className="text-gray-600 text-sm">Complete your registration to join {invite?.company_name}</p>
            </div>

            <form onSubmit={handleSubmit}>
              {submitError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  {submitError}
                </div>
              )}

              <div className="mb-5">
                <label className="block mb-2 text-gray-700 font-medium text-sm">Email Address</label>
                <input
                  type="email"
                  value={invite?.email || ''}
                  disabled
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="mb-5">
                <label className="block mb-2 text-gray-700 font-medium text-sm">Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="mb-5">
                <label className="block mb-2 text-gray-700 font-medium text-sm">Password</label>
                <input
                  type="password"
                  placeholder="Create a password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="mb-7">
                <label className="block mb-2 text-gray-700 font-medium text-sm">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-[#2c5f8d] to-[#4a90e2] text-white rounded-xl text-base font-semibold hover:-translate-y-0.5 hover:shadow-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating Account...' : 'Join & Get Started'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
