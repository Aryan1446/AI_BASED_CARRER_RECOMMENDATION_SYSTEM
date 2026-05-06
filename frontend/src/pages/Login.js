import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Eye, EyeSlash, SignIn } from '@phosphor-icons/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userData = await login(formData.username, formData.password);
      toast.success('Login successful!');
      
      // Use setTimeout to ensure state updates before navigation
      setTimeout(() => {
        if (userData.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 100);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] flex">
      <Toaster position="top-right" theme="dark" />
      
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-12">
            <Brain className="w-10 h-10 text-[#F97316]" weight="duotone" />
            <span className="text-2xl font-bold text-white">CareerAI</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/50 mb-8">Sign in to continue your career journey</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input
                id="username"
                name="username"
                data-testid="login-username-input"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                className="input-dark h-12"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  data-testid="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-dark h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              data-testid="login-submit-btn"
              className="btn-primary w-full h-12"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <SignIn weight="bold" size={20} />
                  Sign In
                </span>
              )}
            </Button>
          </form>
          
          <p className="text-center text-white/50 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#F97316] hover:text-[#FB923C] font-medium">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
      
      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-[#111116] to-[#05050A] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1762279389042-9439bfb6c155?w=800')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-transparent to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative text-center px-12"
        >
          <div className="w-24 h-24 rounded-full bg-[#F97316]/10 flex items-center justify-center mx-auto mb-8 ai-glow">
            <Brain className="w-12 h-12 text-[#F97316]" weight="duotone" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            AI-Powered Career Insights
          </h2>
          <p className="text-white/50 max-w-md">
            Continue your journey with intelligent career recommendations 
            powered by advanced machine learning.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
