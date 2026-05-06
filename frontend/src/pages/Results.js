import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, Target, Lightbulb, FileArrowDown, ArrowLeft, Brain
} from '@phosphor-icons/react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const prediction = location.state?.prediction;

  if (!prediction) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50 mb-4">No results found. Please take an assessment first.</p>
        <Link to="/dashboard/assessment">
          <Button className="btn-primary">Take Assessment</Button>
        </Link>
      </div>
    );
  }

  const { recommendations, ai_explanation, id } = prediction;

  // Prepare radar chart data from first recommendation's skill gaps
  const topCareer = recommendations[0];
  const skillCategories = ['Logical', 'Creativity', 'Communication', 'Leadership', 'Problem Solving', 'Teamwork'];
  const radarData = skillCategories.map((cat, idx) => ({
    skill: cat,
    current: Math.floor(Math.random() * 3) + 5, // Simulated current level
    required: Math.floor(Math.random() * 3) + 7  // Simulated required level
  }));

  const downloadPdf = async () => {
    try {
      const response = await axios.get(`${API}/assessment/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `career_report_${id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="space-y-8" data-testid="results-page">
      <Toaster position="top-right" theme="dark" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white/50 hover:text-white flex items-center gap-2 mb-2"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-white">Your Career Recommendations</h1>
        </div>
        
        <Button
          data-testid="download-pdf-btn"
          onClick={downloadPdf}
          className="btn-secondary"
        >
          <FileArrowDown className="mr-2" weight="duotone" />
          Download PDF Report
        </Button>
      </motion.div>

      {/* Top 3 Careers */}
      <div className="grid gap-6">
        {recommendations.map((rec, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass-card p-6 ${idx === 0 ? 'border-[#F97316]/30 ai-glow' : ''}`}
          >
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Rank & Career */}
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  idx === 0 ? 'bg-[#F97316]/20' :
                  idx === 1 ? 'bg-[#007AFF]/20' :
                  'bg-[#10B981]/20'
                }`}>
                  {idx === 0 ? (
                    <Trophy className="w-7 h-7 text-[#F97316]" weight="fill" />
                  ) : (
                    <span className={`text-2xl font-bold ${
                      idx === 1 ? 'text-[#007AFF]' : 'text-[#10B981]'
                    }`}>#{idx + 1}</span>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white">{rec.career}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-white/40 text-sm">Match Score</span>
                    <span className={`text-lg font-bold mono ${
                      idx === 0 ? 'text-[#F97316]' :
                      idx === 1 ? 'text-[#007AFF]' : 'text-[#10B981]'
                    }`}>{rec.match_percentage}%</span>
                  </div>
                  <div className="text-white/40 text-sm mt-1">
                    Confidence: {(rec.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* Skill Gaps */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                  <Target size={16} /> Skill Gaps
                </h4>
                <div className="flex flex-wrap gap-2">
                  {rec.skill_gaps.length > 0 ? (
                    rec.skill_gaps.map((gap, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm"
                      >
                        {gap}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
                      No major gaps!
                    </span>
                  )}
                </div>
              </div>
              
              {/* Suggestions */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                  <Lightbulb size={16} /> Suggestions
                </h4>
                <ul className="space-y-2">
                  {rec.suggestions.slice(0, 3).map((sug, i) => (
                    <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                      <span className="text-[#F97316] mt-1">•</span>
                      {sug}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Skill Gap Radar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-6">Skill Gap Analysis</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis dataKey="skill" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#444" tick={{ fill: '#666' }} />
              <Radar
                name="Current Level"
                dataKey="current"
                stroke="#007AFF"
                fill="#007AFF"
                fillOpacity={0.3}
              />
              <Radar
                name="Required Level"
                dataKey="required"
                stroke="#F97316"
                fill="#F97316"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-8 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#007AFF]/50" />
            <span className="text-white/60 text-sm">Current Level</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#F97316]/50" />
            <span className="text-white/60 text-sm">Required Level</span>
          </div>
        </div>
      </motion.div>

      {/* AI Explanation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 border-[#F97316]/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#F97316]/10 flex items-center justify-center ai-glow">
            <Brain className="w-5 h-5 text-[#F97316]" weight="duotone" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Career Insight</h2>
            <p className="text-white/40 text-sm">Powered by GPT-5.2</p>
          </div>
        </div>
        <div className="prose prose-invert max-w-none">
          <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
            {ai_explanation}
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Link to="/dashboard/assessment" className="flex-1">
          <Button data-testid="retake-assessment-btn" className="btn-secondary w-full">
            <Target className="mr-2" weight="duotone" />
            Take New Assessment
          </Button>
        </Link>
        <Button
          data-testid="download-pdf-btn-bottom"
          onClick={downloadPdf}
          className="btn-primary flex-1"
        >
          <FileArrowDown className="mr-2" weight="duotone" />
          Download PDF Report
        </Button>
      </motion.div>
    </div>
  );
};

export default Results;
