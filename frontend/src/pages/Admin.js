import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain, Users, ChartLine, Database, Gear, Upload, Play,
  SignOut, House, FileArrowUp, Check, Warning, ArrowClockwise
} from '@phosphor-icons/react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import axios from 'axios';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Admin = () => {
  const navigate = useNavigate();
  const { user, token, logout, isAdmin } = useAuth();
  const fileInputRef = useRef(null);
  
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [modelVersions, setModelVersions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    if (user && user.role === 'admin') {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      const [statsRes, usersRes, predsRes, analyticsRes, modelRes, versionsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/predictions`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/admin/model/info`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        axios.get(`${API}/admin/model/versions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setPredictions(predsRes.data.predictions);
      setAnalytics(analyticsRes.data);
      if (modelRes) setModelInfo(modelRes.data);
      setModelVersions(versionsRes.data);
    } catch (error) {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API}/admin/dataset/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.status === 'success') {
        toast.success('Dataset uploaded successfully!');
        fetchAllData();
      } else if (response.data.status === 'validation_required') {
        toast.warning('Dataset validation required. Check column mappings.');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleTrainModel = async () => {
    setTraining(true);
    try {
      const response = await axios.post(`${API}/admin/model/train`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Model trained successfully! Version: ${response.data.version}`);
      fetchAllData();
    } catch (error) {
      toast.error('Training failed');
    } finally {
      setTraining(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050A]" data-testid="admin-panel">
      <Toaster position="top-right" theme="dark" />
      
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-[#F97316]" weight="duotone" />
            <span className="text-xl font-bold text-white">CareerAI</span>
            <span className="px-2 py-1 rounded bg-[#F97316]/20 text-[#F97316] text-xs font-medium">
              Admin
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              data-testid="admin-home-btn"
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-white/60 hover:text-white"
            >
              <House className="mr-2" weight="duotone" />
              Dashboard
            </Button>
            <Button
              data-testid="admin-logout-btn"
              variant="ghost"
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300"
            >
              <SignOut className="mr-2" weight="duotone" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: '#007AFF' },
            { label: 'Total Predictions', value: stats?.total_predictions || 0, icon: ChartLine, color: '#F97316' },
            { label: 'Model Version', value: stats?.model_version || 'N/A', icon: Brain, color: '#10B981' },
            { label: 'Model Accuracy', value: stats?.model_accuracy ? `${(stats.model_accuracy * 100).toFixed(1)}%` : 'N/A', icon: Check, color: '#F59E0B' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1 mono">{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} weight="duotone" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-[#111116] border border-white/10">
            <TabsTrigger value="analytics" data-testid="tab-analytics" className="data-[state=active]:bg-[#F97316] data-[state=active]:text-white">
              <ChartLine className="mr-2" weight="duotone" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users" className="data-[state=active]:bg-[#F97316] data-[state=active]:text-white">
              <Users className="mr-2" weight="duotone" /> Users
            </TabsTrigger>
            <TabsTrigger value="predictions" data-testid="tab-predictions" className="data-[state=active]:bg-[#F97316] data-[state=active]:text-white">
              <Database className="mr-2" weight="duotone" /> Predictions
            </TabsTrigger>
            <TabsTrigger value="model" data-testid="tab-model" className="data-[state=active]:bg-[#F97316] data-[state=active]:text-white">
              <Gear className="mr-2" weight="duotone" /> Model
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Predictions Over Time */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Predictions Over Time</h3>
                <div className="h-64 min-w-0">
                  {analytics?.predictions_by_day?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.predictions_by_day}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} />
                        <YAxis stroke="#666" tick={{ fill: '#666' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111116', border: '1px solid #333' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="count" stroke="#F97316" strokeWidth={2} dot={{ fill: '#F97316' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-white/40">
                      No prediction data yet
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Top Careers */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Top Recommended Careers</h3>
                <div className="h-64 min-w-0">
                  {analytics?.top_careers?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.top_careers.map(([career, count]) => ({ career: career.slice(0, 15), count }))} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis type="number" stroke="#666" tick={{ fill: '#666' }} />
                        <YAxis dataKey="career" type="category" stroke="#666" tick={{ fill: '#666', fontSize: 11 }} width={100} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111116', border: '1px solid #333' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="count" fill="#007AFF" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-white/40">
                      No career data yet
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Username</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Full Name</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Profession</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 text-white font-medium">{user.username}</td>
                        <td className="px-6 py-4 text-white/70">{user.full_name}</td>
                        <td className="px-6 py-4 text-white/70">{user.email}</td>
                        <td className="px-6 py-4 text-white/70">{user.profession}</td>
                        <td className="px-6 py-4 text-white/50 text-sm">{formatDate(user.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && (
                <div className="p-12 text-center text-white/40">No users found</div>
              )}
            </motion.div>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/60">User ID</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Top Career</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Match %</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {predictions.map((pred) => (
                      <tr key={pred.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 text-white/70 mono text-sm">{pred.user_id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 text-white font-medium">{pred.recommendations[0]?.career}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded bg-[#F97316]/20 text-[#F97316] text-sm mono">
                            {pred.recommendations[0]?.match_percentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/50 text-sm">{formatDate(pred.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {predictions.length === 0 && (
                <div className="p-12 text-center text-white/40">No predictions found</div>
              )}
            </motion.div>
          </TabsContent>

          {/* Model Tab */}
          <TabsContent value="model" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Model Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Brain weight="duotone" className="text-[#F97316]" />
                  Current Model
                </h3>
                
                {modelInfo ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-white/5">
                        <p className="text-white/40 text-sm">Version</p>
                        <p className="text-xl font-bold text-white mono">{modelInfo.version}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5">
                        <p className="text-white/40 text-sm">Accuracy</p>
                        <p className="text-xl font-bold text-[#10B981] mono">{(modelInfo.accuracy * 100).toFixed(1)}%</p>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5">
                        <p className="text-white/40 text-sm">Precision</p>
                        <p className="text-xl font-bold text-[#007AFF] mono">{(modelInfo.precision * 100).toFixed(1)}%</p>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5">
                        <p className="text-white/40 text-sm">F1 Score</p>
                        <p className="text-xl font-bold text-[#F59E0B] mono">{(modelInfo.f1_score * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    <p className="text-white/40 text-sm">
                      Samples: {modelInfo.sample_count} | Trained: {formatDate(modelInfo.trained_at)}
                    </p>
                  </div>
                ) : (
                  <div className="p-8 text-center text-white/40">
                    <Warning className="w-12 h-12 mx-auto mb-4 text-[#F59E0B]" weight="duotone" />
                    <p>No model trained yet</p>
                  </div>
                )}
              </motion.div>

              {/* Training Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Gear weight="duotone" className="text-[#F97316]" />
                  Model Training
                </h3>
                
                <div className="space-y-4">
                  {/* Upload Dataset */}
                  <div className="p-4 rounded-lg border border-dashed border-white/20 hover:border-[#F97316]/50 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      data-testid="upload-dataset-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full flex flex-col items-center gap-2 py-4 text-white/60 hover:text-white"
                    >
                      {uploading ? (
                        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8" weight="duotone" />
                      )}
                      <span>{uploading ? 'Uploading...' : 'Upload Custom Dataset'}</span>
                      <span className="text-xs text-white/40">CSV or Excel files</span>
                    </button>
                  </div>

                  {/* Train Button */}
                  <Button
                    data-testid="train-model-btn"
                    onClick={handleTrainModel}
                    disabled={training}
                    className="btn-primary w-full"
                  >
                    {training ? (
                      <span className="flex items-center gap-2">
                        <ArrowClockwise className="w-5 h-5 animate-spin" />
                        Training Model...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Play weight="fill" />
                        Train Model with Sample Data
                      </span>
                    )}
                  </Button>

                  <p className="text-white/40 text-xs text-center">
                    Training will use sample data or uploaded dataset
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Model Versions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Model Version History</h3>
              <div className="space-y-3">
                {modelVersions?.training_logs?.slice(0, 5).map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded text-sm mono ${
                        log.version === modelVersions.current_version
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {log.version}
                      </span>
                      <span className="text-white/60">{log.action}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white mono">{(log.metrics?.accuracy * 100).toFixed(1)}%</span>
                      <span className="text-white/40 text-sm">{formatDate(log.timestamp)}</span>
                    </div>
                  </div>
                ))}
                {(!modelVersions?.training_logs || modelVersions.training_logs.length === 0) && (
                  <div className="p-8 text-center text-white/40">No training history</div>
                )}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
