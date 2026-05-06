import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Code, Lightbulb, Users, Target, Briefcase,
  ArrowRight, ArrowLeft, Check, Rocket
} from '@phosphor-icons/react';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Assessment = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    technical_skills: [],
    soft_skills: [],
    interests: [],
    logical_ability: 5,
    creativity_level: 5,
    communication: 5,
    leadership: 5,
    problem_solving: 5,
    teamwork: 5,
    work_preference: 'hybrid',
    industry_interest: ''
  });

  const technicalSkillOptions = [
    { id: 'python', label: 'Python' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'java', label: 'Java' },
    { id: 'sql', label: 'SQL/Database' },
    { id: 'aws', label: 'AWS/Cloud' },
    { id: 'docker', label: 'Docker/DevOps' },
    { id: 'react', label: 'React/Frontend' },
    { id: 'node', label: 'Node.js/Backend' },
    { id: 'machine_learning', label: 'Machine Learning' },
    { id: 'data_analysis', label: 'Data Analysis' }
  ];

  const softSkillOptions = [
    { id: 'communication', label: 'Communication' },
    { id: 'leadership', label: 'Leadership' },
    { id: 'teamwork', label: 'Teamwork' },
    { id: 'problem_solving', label: 'Problem Solving' },
    { id: 'creativity', label: 'Creativity' },
    { id: 'time_management', label: 'Time Management' }
  ];

  const interestOptions = [
    { id: 'technology', label: 'Technology & Innovation' },
    { id: 'business', label: 'Business & Strategy' },
    { id: 'design', label: 'Design & Creativity' },
    { id: 'data', label: 'Data & Analytics' },
    { id: 'management', label: 'Project Management' },
    { id: 'security', label: 'Cybersecurity' },
    { id: 'ai', label: 'AI & Machine Learning' },
    { id: 'mobile', label: 'Mobile Development' }
  ];

  const steps = [
    {
      title: 'Technical Skills',
      description: 'Select the technical skills you possess',
      icon: Code
    },
    {
      title: 'Soft Skills',
      description: 'Select your interpersonal strengths',
      icon: Users
    },
    {
      title: 'Interests',
      description: 'What areas excite you the most?',
      icon: Lightbulb
    },
    {
      title: 'Abilities',
      description: 'Rate your core abilities',
      icon: Target
    },
    {
      title: 'Preferences',
      description: 'Your work style preferences',
      icon: Briefcase
    }
  ];

  const handleSkillToggle = (type, skillId) => {
    setFormData(prev => {
      const currentSkills = prev[type];
      const newSkills = currentSkills.includes(skillId)
        ? currentSkills.filter(s => s !== skillId)
        : [...currentSkills, skillId];
      return { ...prev, [type]: newSkills };
    });
  };

  const handleSliderChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value[0] }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/assessment/predict`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Assessment completed!');
      navigate('/dashboard/results', { state: { prediction: response.data } });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Assessment failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {technicalSkillOptions.map(skill => (
                <div
                  key={skill.id}
                  data-testid={`skill-${skill.id}`}
                  onClick={() => handleSkillToggle('technical_skills', skill.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    formData.technical_skills.includes(skill.id)
                      ? 'bg-[#F97316]/10 border-[#F97316] text-white'
                      : 'bg-[#111116] border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.technical_skills.includes(skill.id)}
                      className="border-white/30 data-[state=checked]:bg-[#F97316] data-[state=checked]:border-[#F97316]"
                    />
                    <span>{skill.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {softSkillOptions.map(skill => (
                <div
                  key={skill.id}
                  data-testid={`soft-skill-${skill.id}`}
                  onClick={() => handleSkillToggle('soft_skills', skill.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    formData.soft_skills.includes(skill.id)
                      ? 'bg-[#F97316]/10 border-[#F97316] text-white'
                      : 'bg-[#111116] border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.soft_skills.includes(skill.id)}
                      className="border-white/30 data-[state=checked]:bg-[#F97316] data-[state=checked]:border-[#F97316]"
                    />
                    <span>{skill.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {interestOptions.map(interest => (
                <div
                  key={interest.id}
                  data-testid={`interest-${interest.id}`}
                  onClick={() => handleSkillToggle('interests', interest.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    formData.interests.includes(interest.id)
                      ? 'bg-[#007AFF]/10 border-[#007AFF] text-white'
                      : 'bg-[#111116] border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.interests.includes(interest.id)}
                      className="border-white/30 data-[state=checked]:bg-[#007AFF] data-[state=checked]:border-[#007AFF]"
                    />
                    <span>{interest.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-8">
            {[
              { name: 'logical_ability', label: 'Logical Ability', desc: 'Analytical thinking and reasoning' },
              { name: 'creativity_level', label: 'Creativity', desc: 'Innovative thinking and ideation' },
              { name: 'communication', label: 'Communication', desc: 'Verbal and written expression' },
              { name: 'leadership', label: 'Leadership', desc: 'Guiding and motivating others' },
              { name: 'problem_solving', label: 'Problem Solving', desc: 'Finding solutions to challenges' },
              { name: 'teamwork', label: 'Teamwork', desc: 'Collaboration and cooperation' }
            ].map(ability => (
              <div key={ability.name} className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-white font-medium">{ability.label}</Label>
                    <p className="text-white/40 text-sm">{ability.desc}</p>
                  </div>
                  <span className="text-[#F97316] font-bold text-xl mono">
                    {formData[ability.name]}/10
                  </span>
                </div>
                <Slider
                  data-testid={`slider-${ability.name}`}
                  value={[formData[ability.name]]}
                  onValueChange={(value) => handleSliderChange(ability.name, value)}
                  min={1}
                  max={10}
                  step={1}
                  className="[&_[role=slider]]:bg-[#F97316] [&_[role=slider]]:border-[#F97316] [&_.bg-primary]:bg-[#F97316]"
                />
              </div>
            ))}
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <Label className="text-white font-medium">Work Environment Preference</Label>
              <RadioGroup
                value={formData.work_preference}
                onValueChange={(value) => setFormData(prev => ({ ...prev, work_preference: value }))}
                className="grid grid-cols-3 gap-4"
              >
                {[
                  { value: 'remote', label: 'Remote', desc: 'Work from anywhere' },
                  { value: 'hybrid', label: 'Hybrid', desc: 'Mix of office & remote' },
                  { value: 'office', label: 'Office', desc: 'On-site work' }
                ].map(option => (
                  <div key={option.value}>
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={option.value}
                      data-testid={`work-pref-${option.value}`}
                      className={`flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-all ${
                        formData.work_preference === option.value
                          ? 'bg-[#F97316]/10 border-[#F97316] text-white'
                          : 'bg-[#111116] border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs mt-1 text-white/40">{option.desc}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="glass-card p-6 mt-8">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Check className="text-[#10B981]" weight="bold" />
                Review Your Assessment
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/40">Technical Skills:</span>
                  <p className="text-white">{formData.technical_skills.length} selected</p>
                </div>
                <div>
                  <span className="text-white/40">Soft Skills:</span>
                  <p className="text-white">{formData.soft_skills.length} selected</p>
                </div>
                <div>
                  <span className="text-white/40">Interests:</span>
                  <p className="text-white">{formData.interests.length} selected</p>
                </div>
                <div>
                  <span className="text-white/40">Work Preference:</span>
                  <p className="text-white capitalize">{formData.work_preference}</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] py-8 px-6">
      <Toaster position="top-right" theme="dark" />
      
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Career Assessment</h1>
            <span className="text-white/40 mono">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#F97316]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 ${
                  idx <= currentStep ? 'text-white' : 'text-white/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  idx < currentStep
                    ? 'bg-[#10B981]'
                    : idx === currentStep
                    ? 'bg-[#F97316]'
                    : 'bg-white/10'
                }`}>
                  {idx < currentStep ? (
                    <Check weight="bold" size={16} />
                  ) : (
                    <step.icon weight="duotone" size={16} />
                  )}
                </div>
                <span className="hidden sm:block text-sm">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Step Content */}
        <div className="glass-card p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {steps[currentStep].title}
                </h2>
                <p className="text-white/50">{steps[currentStep].description}</p>
              </div>
              
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            data-testid="assessment-prev-btn"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="btn-secondary"
          >
            <ArrowLeft className="mr-2" weight="bold" />
            Previous
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button
              data-testid="assessment-next-btn"
              onClick={nextStep}
              className="btn-primary"
            >
              Next Step
              <ArrowRight className="ml-2" weight="bold" />
            </Button>
          ) : (
            <Button
              data-testid="assessment-submit-btn"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Rocket weight="bold" />
                  Get Recommendations
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Assessment;
