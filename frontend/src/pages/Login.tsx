import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
    navigate('/dashboard');
    }
    }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authAPI.login(email, password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user',JSON.stringify({
          full_name: data.full_name,
          email: data.email,
          role: data.role,
          }));
      console.log('Login successful!', data);
      // TODO: Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#1e3a5f] via-[#2c5f8d] to-[#4a90e2] relative overflow-hidden">

      {/* Background pattern */}
      <div className="absolute w-full h-full opacity-10 bg-repeat"
           style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)'}}></div>

      <div className="container flex w-full max-w-7xl m-auto relative z-10">

        {/* Left Panel - Branding */}
        <div className="flex-1 flex flex-col justify-center p-16 text-white">
          <div className="flex items-center gap-4 mb-10">
            <div className="text-5xl font-bold">PlantLink</div>
          </div>

          <h1 className="text-3xl font-light mb-8 leading-relaxed">
            Streamline Your Plant-Contractor Communication
          </h1>

          <ul className="list-none mt-5 space-y-4">
            <li className="flex items-center gap-3 text-base opacity-90">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-400/30 rounded-full font-bold">✓</span>
              Real-time issue tracking and resolution
            </li>
            <li className="flex items-center gap-3 text-base opacity-90">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-400/30 rounded-full font-bold">✓</span>
              Interactive plant maps and documentation
            </li>
            <li className="flex items-center gap-3 text-base opacity-90">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-400/30 rounded-full font-bold">✓</span>
              Health dashboards and alerts
            </li>
            <li className="flex items-center gap-3 text-base opacity-90">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-400/30 rounded-full font-bold">✓</span>
              Seamless contractor collaboration
            </li>
          </ul>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-none w-[480px] flex items-center justify-center p-10">
          <div className="bg-white rounded-3xl p-12 w-full max-w-md shadow-2xl">

            <div className="text-center mb-9">
              <h2 className="text-3xl text-gray-900 mb-2 font-bold">Welcome Back</h2>
              <p className="text-gray-600 text-sm">Sign in to manage your plant operations</p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block mb-2 text-gray-700 font-medium text-sm">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your.email@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-gray-700 font-medium text-sm">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-between items-center mb-7 text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                  <input type="checkbox" className="w-4 h-4 cursor-pointer" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-blue-500 font-medium hover:text-blue-700 transition">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#2c5f8d] to-[#4a90e2] text-white rounded-xl text-base font-semibold hover:-translate-y-0.5 hover:shadow-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center my-7 text-gray-400 text-xs">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="px-4">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="text-center text-gray-600 text-sm">
              Don't have an account?{' '}
              <a href="#" className="text-blue-500 font-semibold hover:text-blue-700 transition">
                Request Demo
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;