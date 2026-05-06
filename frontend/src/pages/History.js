import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClockCounterClockwise, FileArrowDown, Eye, Calendar, Briefcase
} from '@phosphor-icons/react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const History = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
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
      toast.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (predictionId) => {
    try {
      const response = await axios.get(`${API}/assessment/${predictionId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `career_report_${predictionId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded!');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const viewResults = (prediction) => {
    navigate('/dashboard/results', { state: { prediction } });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="history-page">
      <Toaster position="top-right" theme="dark" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ClockCounterClockwise className="text-[#F97316]" weight="duotone" />
          Assessment History
        </h1>
        <p className="text-white/50 mt-2">Review your past career assessments and recommendations</p>
      </motion.div>

      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center"
        >
          <ClockCounterClockwise className="w-16 h-16 text-white/20 mx-auto mb-4" weight="duotone" />
          <h3 className="text-xl font-semibold text-white mb-2">No Assessments Yet</h3>
          <p className="text-white/50 mb-6">You haven't completed any career assessments.</p>
          <Link to="/dashboard/assessment">
            <Button data-testid="start-first-assessment-btn" className="btn-primary">
              Start Your First Assessment
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {history.map((prediction, idx) => (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Date & Top Career */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#F97316]/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6 text-[#F97316]" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">
                      {prediction.recommendations[0]?.career || 'Career Assessment'}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(prediction.timestamp)}
                      </span>
                      <span className="text-[#F97316] font-medium mono">
                        {prediction.recommendations[0]?.match_percentage}% match
                      </span>
                    </div>
                  </div>
                </div>

                {/* All 3 Recommendations */}
                <div className="flex flex-wrap gap-2 lg:justify-center flex-1">
                  {prediction.recommendations.map((rec, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 rounded-full text-sm ${
                        i === 0 ? 'bg-[#F97316]/10 text-[#F97316]' :
                        i === 1 ? 'bg-[#007AFF]/10 text-[#007AFF]' :
                        'bg-[#10B981]/10 text-[#10B981]'
                      }`}
                    >
                      #{i + 1} {rec.career}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    data-testid={`view-result-${prediction.id}`}
                    variant="outline"
                    size="sm"
                    onClick={() => viewResults(prediction)}
                    className="btn-secondary text-sm px-4 py-2 h-auto"
                  >
                    <Eye className="mr-1" size={16} />
                    View
                  </Button>
                  <Button
                    data-testid={`download-pdf-${prediction.id}`}
                    variant="outline"
                    size="sm"
                    onClick={() => downloadPdf(prediction.id)}
                    className="btn-secondary text-sm px-4 py-2 h-auto"
                  >
                    <FileArrowDown className="mr-1" size={16} />
                    PDF
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
