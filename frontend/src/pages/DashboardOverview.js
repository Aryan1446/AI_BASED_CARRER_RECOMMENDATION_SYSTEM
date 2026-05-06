import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Target, ClockCounterClockwise, TrendUp, Briefcase, ArrowRight
} from '@phosphor-icons/react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardOverview = () => {
  const { user, token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/assessment/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const latestPrediction = history[0];
  const topCareer = latestPrediction?.recommendations?.[0];

  return (
    <div className="space-y-8" data-testid="dashboard-overview">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome back, {user?.full_name?.split(' ')[0] || user?.username}!
        </h1>
        <p className="text-white/50">
          {history.length > 0
            ? `You have completed ${history.length} career assessment${history.length > 1 ? 's' : ''}.`
            : 'Ready to discover your ideal career path?'}
        </p>
        
        {history.length === 0 && (
          <Link to="/dashboard/assessment">
            <Button data-testid="start-assessment-btn" className="btn-primary mt-6">
              <Target className="mr-2" weight="duotone" />
              Start Your First Assessment
            </Button>
          </Link>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#F97316]/10 flex items-center justify-center">
              <ClockCounterClockwise className="w-6 h-6 text-[#F97316]" weight="duotone" />
            </div>
            <div>
              <p className="text-white/40 text-sm">Total Assessments</p>
              <p className="text-2xl font-bold text-white mono">{history.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-[#007AFF]" weight="duotone" />
            </div>
            <div>
              <p className="text-white/40 text-sm">Top Career Match</p>
              <p className="text-lg font-semibold text-white">
                {topCareer?.career || 'Not yet assessed'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
              <TrendUp className="w-6 h-6 text-[#10B981]" weight="duotone" />
            </div>
            <div>
              <p className="text-white/40 text-sm">Match Score</p>
              <p className="text-2xl font-bold text-white mono">
                {topCareer ? `${topCareer.match_percentage}%` : '--'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Results */}
      {latestPrediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Latest Results</h2>
            <Link to="/dashboard/history" className="text-[#F97316] hover:text-[#FB923C] text-sm flex items-center gap-1">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="space-y-4">
            {latestPrediction.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    idx === 0 ? 'bg-[#F97316]/20 text-[#F97316]' :
                    idx === 1 ? 'bg-[#007AFF]/20 text-[#007AFF]' :
                    'bg-[#10B981]/20 text-[#10B981]'
                  }`}>
                    <span className="font-bold">#{idx + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{rec.career}</p>
                    <p className="text-white/40 text-sm">
                      {rec.skill_gaps?.length || 0} skill gaps identified
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white mono">{rec.match_percentage}%</p>
                  <p className="text-white/40 text-xs">Match Score</p>
                </div>
              </div>
            ))}
          </div>

          {/* AI Insight Preview */}
          <div className="mt-6 p-4 rounded-lg bg-[#F97316]/5 border border-[#F97316]/20">
            <p className="text-sm text-white/60 line-clamp-3">
              {latestPrediction.ai_explanation}
            </p>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Link to="/dashboard/assessment" className="glass-card p-6 hover:border-[#F97316]/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#F97316]/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#F97316]" weight="duotone" />
            </div>
            <div>
              <p className="font-semibold text-white">Take New Assessment</p>
              <p className="text-white/40 text-sm">Update your career recommendations</p>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/history" className="glass-card p-6 hover:border-[#007AFF]/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
              <ClockCounterClockwise className="w-6 h-6 text-[#007AFF]" weight="duotone" />
            </div>
            <div>
              <p className="font-semibold text-white">View History</p>
              <p className="text-white/40 text-sm">Review past assessments</p>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;
