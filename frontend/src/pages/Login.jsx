import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import useStore from '../store/useStore';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Login = () => {
  const setUser = useStore((s) => s.setUser);
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        // Register
        await axios.post(`${API}/api/auth/register`, {
          name: form.name,
          email: form.email,
          password: form.password,
        });
        toast.success('Account created! Please log in.');
        setIsRegister(false);
        setForm({ name: '', email: form.email, password: '' });
      } else {
        // Login
        const res = await axios.post(
          `${API}/api/auth/login`,
          new URLSearchParams({ username: form.email, password: form.password }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const token = res.data.access_token;
        localStorage.setItem('ph_token', token);

        // Fetch user profile
        const me = await axios.get(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(me.data);
        toast.success(`Welcome back, ${me.data.name}! 🦅`);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong';
      toast.error(typeof msg === 'string' ? msg : msg[0]?.msg || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="text-6xl mb-4"
          >
            🦅
          </motion.div>
          <h1 className="text-3xl font-black text-gradient-blue">PriceHawk</h1>
          <p className="text-ios-gray-1 text-sm mt-1">Track prices. Save money.</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-secondary)] rounded-apple-lg shadow-apple-lg p-6">
          {/* Toggle */}
          <div className="flex bg-[var(--bg-tertiary)] rounded-xl p-1 mb-6">
            {['Sign In', 'Register'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setIsRegister(i === 1)}
                className={`flex-1 py-2 text-sm font-semibold rounded-[10px] transition-all ${
                  isRegister === (i === 1)
                    ? 'bg-white dark:bg-[#2c2c2e] text-[var(--text-primary)] shadow-apple'
                    : 'text-ios-gray-1'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name field (register only) */}
            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-gray-1" />
                  <input
                    name="name"
                    type="text"
                    placeholder="Full name"
                    value={form.name}
                    onChange={handleChange}
                    required={isRegister}
                    className="input-apple pl-11 text-base"
                  />
                </div>
              </motion.div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-gray-1" />
              <input
                name="email"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="input-apple pl-11 text-base"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-gray-1" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="input-apple pl-11 pr-12 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ios-gray-1 hover:text-[var(--text-primary)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-xs text-ios-gray-1 mt-6">
          By continuing, you agree to our Terms of Service.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
