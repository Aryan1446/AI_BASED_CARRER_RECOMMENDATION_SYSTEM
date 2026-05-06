import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Eye, EyeSlash, UserPlus } from '@phosphor-icons/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    age: '',
    profession: 'Student',
    phone: '',
    email: '',
    password: ''
  });

  const professions = [
    'Student',
    'Fresh Graduate',
    'Working Professional',
    'Career Changer',
    'Entrepreneur',
    'Other'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value) => {
    setFormData({ ...formData, profession: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!formData.username || !formData.full_name || !formData.age || 
        !formData.profession || !formData.phone || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      await register({
        ...formData,
        age: parseInt(formData.age)
      });
      toast.success('Registration successful!');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] flex">
      <Toaster position="top-right" theme="dark" />
      
      {/* Left Panel - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-[#111116] to-[#05050A] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/4384147/pexels-photo-4384147.jpeg?w=800')] bg-cover bg-center opacity-10" />
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
            Start Your Career Journey
          </h2>
          <p className="text-white/50 max-w-md">
            Create an account to unlock personalized career recommendations 
            powered by advanced AI technology.
          </p>
        </motion.div>
      </div>
      
      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <Brain className="w-10 h-10 text-[#F97316]" weight="duotone" />
            <span className="text-2xl font-bold text-white">CareerAI</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-white/50 mb-8">Fill in your details to get started</p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  name="username"
                  data-testid="register-username-input"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-dark h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-white">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  data-testid="register-fullname-input"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input-dark h-11"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-white">Age</Label>
                <Input
                  id="age"
                  name="age"
                  data-testid="register-age-input"
                  type="number"
                  placeholder="25"
                  min="16"
                  max="100"
                  value={formData.age}
                  onChange={handleChange}
                  className="input-dark h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profession" className="text-white">Profession</Label>
                <Select onValueChange={handleSelectChange} value={formData.profession}>
                  <SelectTrigger 
                    data-testid="register-profession-select"
                    className="input-dark h-11"
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111116] border-white/10">
                    {professions.map((prof) => (
                      <SelectItem 
                        key={prof} 
                        value={prof}
                        className="text-white hover:bg-white/10"
                      >
                        {prof}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                name="email"
                data-testid="register-email-input"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                className="input-dark h-11"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                data-testid="register-phone-input"
                type="tel"
                placeholder="+1 234 567 8900"
                value={formData.phone}
                onChange={handleChange}
                className="input-dark h-11"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  data-testid="register-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-dark h-11 pr-12"
                  minLength={6}
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
              data-testid="register-submit-btn"
              className="btn-primary w-full h-12"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus weight="bold" size={20} />
                  Create Account
                </span>
              )}
            </Button>
          </form>
          
          <p className="text-center text-white/50 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-[#F97316] hover:text-[#FB923C] font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
