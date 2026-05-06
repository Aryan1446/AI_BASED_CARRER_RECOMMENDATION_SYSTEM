import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Brain, ChartLine, FileText, Shield, Users } from '@phosphor-icons/react';
import { Button } from '../components/ui/button';

const Landing = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced machine learning algorithms analyze your skills, interests, and abilities to provide accurate career recommendations.'
    },
    {
      icon: ChartLine,
      title: 'Skill Gap Analysis',
      description: 'Identify areas for improvement with detailed skill gap analysis and personalized suggestions for career growth.'
    },
    {
      icon: FileText,
      title: 'PDF Reports',
      description: 'Download comprehensive career reports with recommendations, confidence scores, and actionable insights.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and protected. We prioritize your privacy and security at every step.'
    },
    {
      icon: Users,
      title: 'Expert Insights',
      description: 'GPT-5.2 powered explanations provide human-like career guidance tailored to your unique profile.'
    },
    {
      icon: Rocket,
      title: 'Continuous Learning',
      description: 'Our model improves continuously with new data, ensuring the most relevant career recommendations.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#05050A]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F97316]/10 via-transparent to-[#007AFF]/10 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#F97316]/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
              <span className="text-[#F97316] text-sm font-medium">AI-Powered Career Intelligence</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Discover Your
              <span className="block gradient-text">Perfect Career Path</span>
            </h1>
            
            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              CareerAI uses advanced machine learning and GPT-5.2 to analyze your unique profile 
              and recommend careers that match your skills, interests, and potential.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button 
                  data-testid="get-started-btn"
                  className="btn-primary text-lg px-8 py-4 h-auto"
                >
                  Get Started Free
                  <Rocket className="ml-2 w-5 h-5" weight="duotone" />
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  data-testid="login-btn"
                  variant="outline" 
                  className="btn-secondary text-lg px-8 py-4 h-auto"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-20"
          >
            {[
              { value: '14+', label: 'Career Paths' },
              { value: '95%', label: 'Accuracy Rate' },
              { value: 'GPT-5.2', label: 'AI Powered' }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-[#F97316] mono">{stat.value}</div>
                <div className="text-white/50 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Intelligent Career Guidance
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Our platform combines machine learning with expert AI insights to guide your career decisions.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-8 card-hover"
              >
                <div className="w-12 h-12 rounded-lg bg-[#F97316]/10 flex items-center justify-center mb-5">
                  <feature.icon className="w-6 h-6 text-[#F97316]" weight="duotone" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/50 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-[#111116]/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Three simple steps to discover your ideal career path.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Complete Assessment', desc: 'Answer questions about your skills, interests, and abilities.' },
              { step: '02', title: 'AI Analysis', desc: 'Our ML model analyzes your profile against career requirements.' },
              { step: '03', title: 'Get Recommendations', desc: 'Receive personalized career recommendations with actionable insights.' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="relative"
              >
                <div className="text-7xl font-bold text-[#F97316]/10 absolute -top-4 -left-2 mono">
                  {item.step}
                </div>
                <div className="relative pt-12 pl-4">
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-white/50">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#F97316]/10 to-[#007AFF]/10 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Find Your Career?
              </h2>
              <p className="text-white/50 mb-8 max-w-lg mx-auto">
                Join thousands of users who have discovered their perfect career path with CareerAI.
              </p>
              <Link to="/register">
                <Button 
                  data-testid="cta-get-started-btn"
                  className="btn-primary text-lg px-10 py-4 h-auto"
                >
                  Start Free Assessment
                  <Rocket className="ml-2 w-5 h-5" weight="duotone" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-[#F97316]" weight="duotone" />
            <span className="text-xl font-bold text-white">CareerAI</span>
          </div>
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} CareerAI. Intelligent Career Recommendations.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
