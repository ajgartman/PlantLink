import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Step 2 fields
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!email || !password || !fullName) {
        setError('Please fill in all required fields.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!companyName) {
        setError('Company name is required.');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await authAPI.register({
        email,
        password,
        full_name: fullName,
        company_name: companyName,
        company_type: 'plant',
        company_email: companyEmail || undefined,
        company_phone: companyPhone || undefined,
        company_address: companyAddress || undefined,
      });

      // Auto-login after registration
      const loginData = await authAPI.login(email, password);
      localStorage.setItem('token', loginData.access_token);
      localStorage.setItem('user', JSON.stringify({
        full_name: loginData.full_name,
        email: loginData.email,
        role: loginData.role,
      }));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base transition-all focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100';

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#1e3a5f] via-[#2c5f8d] to-[#4a90e2] relative overflow-hidden">
      <div className="absolute w-full h-full opacity-10 bg-repeat"
           style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)'}}></div>

      <div className="container flex w-full max-w-7xl m-auto relative z-10">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col justify-center p-16 text-white">
          <div className="text-5xl font-bold mb-10">PlantSync</div>
          <h1 className="text-3xl font-light mb-8 leading-relaxed">
            Get started in 3 simple steps
          </h1>
          <div className="space-y-6">
            {[
              { num: 1, title: 'Create your account', desc: 'Set up your login credentials' },
              { num: 2, title: 'Add your plant details', desc: 'Tell us about your facility' },
              { num: 3, title: 'Confirm & go', desc: 'Review and start using PlantSync' },
            ].map((s) => (
              <div key={s.num} className={`flex items-center gap-4 transition-opacity ${step >= s.num ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  step > s.num ? 'bg-emerald-500 border-emerald-500' :
                  step === s.num ? 'bg-cyan-500 border-cyan-500' : 'border-white/40'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-sm opacity-70">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-none w-[480px] flex items-center justify-center p-10">
          <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl text-gray-900 mb-1 font-bold">
                {step === 1 ? 'Account Details' : step === 2 ? 'Plant Details' : 'Confirm'}
              </h2>
              <p className="text-gray-500 text-sm">Step {step} of 3</p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-gray-700 font-medium text-sm">Full Name *</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Smith" className={inputClass} />
                </div>
                <div>
                  <label className="block mb-1.5 text-gray-700 font-medium text-sm">Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@company.com" className={inputClass} />
                </div>
                <div>
                  <label className="block mb-1.5 text-gray-700 font-medium text-sm">Password *</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters" className={inputClass} />
                </div>
                <div>
                  <label className="block mb-1.5 text-gray-700 font-medium text-sm">Confirm Password *</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password" className={inputClass} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-gray-700 font-medium text-sm">Company Name *</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Industries" className={inputClass} />
                </div>
                <div>
                  <label className="block mb-1.5 text-gray-700 font-medium text-sm">Company Email</label>
                  <input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="info@company.com" className={inputClass} />
                </div>
                <div>
                  <label className="block mb-1.5 text-gray-700 font-medium text-sm">Phone</label>
                  <input type="tel" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="+44 123 456 7890" className={inputClass} />
                </div>
                <div>
                  <label className="block mb-1.5 text-gray-700 font-medium text-sm">Address</label>
                  <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="123 Industrial Park, City" className={inputClass} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Account</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Name</span>
                    <span className="text-slate-800 font-medium">{fullName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Email</span>
                    <span className="text-slate-800 font-medium">{email}</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Plant</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Company</span>
                    <span className="text-slate-800 font-medium">{companyName}</span>
                  </div>
                  {companyEmail && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Email</span>
                      <span className="text-slate-800 font-medium">{companyEmail}</span>
                    </div>
                  )}
                  {companyPhone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Phone</span>
                      <span className="text-slate-800 font-medium">{companyPhone}</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-400 text-center mt-2">
                  You will be the admin of this plant account.
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button onClick={handleBack}
                  className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
                  Back
                </button>
              )}
              {step < 3 ? (
                <button onClick={handleNext}
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#2c5f8d] to-[#4a90e2] text-white rounded-xl text-sm font-semibold hover:-translate-y-0.5 hover:shadow-xl transition-all shadow-lg shadow-blue-500/30">
                  Continue
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:-translate-y-0.5 hover:shadow-xl transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              )}
            </div>

            <div className="text-center text-gray-600 text-sm mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 font-semibold hover:text-blue-700 transition">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
