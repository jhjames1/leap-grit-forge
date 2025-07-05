import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { 
  TrendingUp, 
  AlertTriangle, 
  Heart, 
  Zap, 
  Clock,
  Brain,
  Wind,
  Bot,
  MessageSquare,
  BookOpen,
  Save
} from 'lucide-react';

interface UrgeTrackerProps {
  onClose: () => void;
  onCancel?: () => void;
  onNavigate?: (page: string) => void;
}

interface UrgeLog {
  id: string;
  timestamp: Date;
  urgeType: string;
  intensity: number;
  trigger: string;
  actedOn?: boolean;
  reflection?: string;
  whatHelped?: string;
}

const UrgeTracker = ({ onClose, onCancel, onNavigate }: UrgeTrackerProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedUrge, setSelectedUrge] = useState('');
  const [intensity, setIntensity] = useState([5]);
  const [selectedTrigger, setSelectedTrigger] = useState('');
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState('');
  const [whatHelped, setWhatHelped] = useState('');
  const [urgeLog, setUrgeLog] = useState<UrgeLog | null>(null);

  const urgeTypes = [
    { id: 'drink', label: 'Drink', icon: '🍺' },
    { id: 'use', label: 'Use', icon: '💊' },
    { id: 'rage', label: 'Rage', icon: '💢' },
    { id: 'isolate', label: 'Isolate', icon: '🚪' },
    { id: 'porn', label: 'View Porn', icon: '📱' },
    { id: 'overeat', label: 'Overeat', icon: '🍔' },
    { id: 'other', label: 'Other', icon: '❓' }
  ];

  const triggers = [
    { id: 'stress', label: 'Stress', icon: Zap },
    { id: 'shame', label: 'Shame', icon: Heart },
    { id: 'loneliness', label: 'Loneliness', icon: Heart },
    { id: 'anger', label: 'Anger', icon: AlertTriangle },
    { id: 'exhaustion', label: 'Exhaustion', icon: Clock },
    { id: 'boredom', label: 'Boredom', icon: Clock },
    { id: 'unknown', label: 'Unknown', icon: Brain }
  ];

  const getIntensityColor = (level: number) => {
    if (level <= 2) return 'text-green-400';
    if (level <= 4) return 'text-yellow-400';
    if (level <= 6) return 'text-orange-400';
    return 'text-red-400';
  };

  const getIntensityLabel = (level: number) => {
    if (level <= 2) return 'Mild';
    if (level <= 4) return 'Moderate';
    if (level <= 6) return 'Strong';
    return 'Red Zone';
  };

  const handleUrgeSelect = (urgeId: string) => {
    setSelectedUrge(urgeId);
    setCurrentStep(2);
  };

  const handleIntensitySet = () => {
    setCurrentStep(3);
  };

  const handleTriggerSelect = (triggerId: string) => {
    setSelectedTrigger(triggerId);
    setCurrentStep(4);
  };

  const handleRedirect = (action: string) => {
    // Save the urge log first
    const newUrgeLog: UrgeLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      urgeType: selectedUrge,
      intensity: intensity[0],
      trigger: selectedTrigger
    };
    
    setUrgeLog(newUrgeLog);
    
    // Save to localStorage
    const existingLogs = JSON.parse(localStorage.getItem('urgeLogs') || '[]');
    existingLogs.push(newUrgeLog);
    localStorage.setItem('urgeLogs', JSON.stringify(existingLogs));

    // Schedule reflection reminder
    setTimeout(() => {
      setShowReflection(true);
    }, 15 * 60 * 1000); // 15 minutes

    switch (action) {
      case 'breathing':
        onNavigate?.('breathing');
        break;
      case 'foreman':
        onNavigate?.('foreman');
        break;
      case 'peer':
        // Trigger SMS or peer chat
        window.location.href = 'sms:+14327018678?body=I need support right now.';
        break;
      case 'affirmation':
        // Show saved affirmations
        break;
      default:
        onClose();
    }
  };

  const handleReflectionSubmit = () => {
    if (urgeLog) {
      const updatedLog = {
        ...urgeLog,
        reflection,
        whatHelped
      };
      
      // Update localStorage
      const existingLogs = JSON.parse(localStorage.getItem('urgeLogs') || '[]');
      const logIndex = existingLogs.findIndex((log: UrgeLog) => log.id === urgeLog.id);
      if (logIndex !== -1) {
        existingLogs[logIndex] = updatedLog;
        localStorage.setItem('urgeLogs', JSON.stringify(existingLogs));
      }
    }
    
    setShowReflection(false);
    onClose();
  };

  const handleCancel = () => {
    onCancel?.() || onClose();
  };

  if (showReflection) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="bg-midnight border-steel-dark p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-construction/20 rounded-full flex items-center justify-center mb-4">
              <Brain className="text-construction" size={32} />
            </div>
            <h3 className="font-oswald font-bold text-white text-xl mb-2">Check-In Time</h3>
            <p className="text-steel-light text-sm">Still riding that wave? Let's check in.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-white font-oswald font-semibold mb-3">
                Did you act on the urge?
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="border-steel text-steel-light hover:bg-green-500/20 hover:border-green-500">
                  No
                </Button>
                <Button variant="outline" className="border-steel text-steel-light hover:bg-yellow-500/20 hover:border-yellow-500">
                  Slipped but Stopped
                </Button>
                <Button variant="outline" className="border-steel text-steel-light hover:bg-red-500/20 hover:border-red-500">
                  Yes
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-white font-oswald font-semibold mb-3">
                What helped—or didn't?
              </label>
              <Textarea
                value={whatHelped}
                onChange={(e) => setWhatHelped(e.target.value)}
                placeholder="Quick thoughts on what worked or what made it harder..."
                className="bg-steel-dark border-steel text-white placeholder:text-steel-light"
              />
            </div>

            <div>
              <label className="block text-white font-oswald font-semibold mb-3">
                Optional reflection
              </label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Anything else on your mind?"
                className="bg-steel-dark border-steel text-white placeholder:text-steel-light"
              />
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleReflectionSubmit}
                className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold"
              >
                <Save className="mr-2" size={16} />
                Save Reflection
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReflection(false)}
                className="w-full border-steel text-steel-light hover:bg-steel/10"
              >
                Skip for Now
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-midnight border-steel-dark p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-construction/20 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="text-construction" size={32} />
          </div>
          <h2 className="font-oswald font-bold text-white text-2xl mb-2">Redline Recovery</h2>
          <p className="text-steel-light text-sm">Let's track what you're feeling and find the right support.</p>
        </div>

        {/* Step 1: Urge Type */}
        {currentStep === 1 && (
          <div>
            <h3 className="font-oswald font-semibold text-white mb-4">What are you feeling an urge to do?</h3>
            <div className="grid grid-cols-2 gap-3">
              {urgeTypes.map((urge) => (
                <Button
                  key={urge.id}
                  onClick={() => handleUrgeSelect(urge.id)}
                  variant="outline"
                  className="border-steel text-steel-light hover:bg-construction/20 hover:border-construction h-16 flex flex-col items-center space-y-1"
                >
                  <span className="text-lg">{urge.icon}</span>
                  <span className="text-xs font-oswald">{urge.label}</span>
                </Button>
              ))}
            </div>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="w-full mt-6 border-steel text-steel-light hover:bg-steel/10"
            >
              Close for Now
            </Button>
          </div>
        )}

        {/* Step 2: Intensity */}
        {currentStep === 2 && (
          <div>
            <h3 className="font-oswald font-semibold text-white mb-4">How strong is it right now?</h3>
            <div className="mb-6">
              <div className="text-center mb-4">
                <span className={`text-4xl font-anton ${getIntensityColor(intensity[0])}`}>
                  {intensity[0]}
                </span>
                <p className={`font-oswald font-semibold ${getIntensityColor(intensity[0])}`}>
                  {getIntensityLabel(intensity[0])}
                </p>
              </div>
              <Slider
                value={intensity}
                onValueChange={setIntensity}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-steel-light mt-2">
                <span>Mild</span>
                <span>Moderate</span>
                <span>Strong</span>
                <span>Red Zone</span>
              </div>
            </div>
            <Button 
              onClick={handleIntensitySet}
              className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 3: Trigger */}
        {currentStep === 3 && (
          <div>
            <h3 className="font-oswald font-semibold text-white mb-4">What's behind it?</h3>
            <div className="grid grid-cols-2 gap-3">
              {triggers.map((trigger) => {
                const Icon = trigger.icon;
                return (
                  <Button
                    key={trigger.id}
                    onClick={() => handleTriggerSelect(trigger.id)}
                    variant="outline"
                    className="border-steel text-steel-light hover:bg-construction/20 hover:border-construction h-16 flex flex-col items-center space-y-1"
                  >
                    <Icon size={20} className="text-construction" />
                    <span className="text-xs font-oswald">{trigger.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Redirection */}
        {currentStep === 4 && (
          <div>
            <h3 className="font-oswald font-semibold text-white mb-4">Let's redirect this energy.</h3>
            <div className="space-y-3">
              <Button 
                onClick={() => handleRedirect('breathing')}
                className="w-full bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold py-3 flex items-center justify-start"
              >
                <Wind className="mr-3" size={20} />
                Use the Breathing Tool now
              </Button>
              
              <Button 
                onClick={() => handleRedirect('foreman')}
                variant="outline"
                className="w-full border-construction text-construction hover:bg-construction/10 py-3 flex items-center justify-start"
              >
                <Bot className="mr-3" size={20} />
                Hear from The Foreman
              </Button>
              
              <Button 
                onClick={() => handleRedirect('peer')}
                variant="outline"
                className="w-full border-construction text-construction hover:bg-construction/10 py-3 flex items-center justify-start"
              >
                <MessageSquare className="mr-3" size={20} />
                Check in with your Peer
              </Button>
              
              <Button 
                onClick={() => handleRedirect('affirmation')}
                variant="outline"
                className="w-full border-construction text-construction hover:bg-construction/10 py-3 flex items-center justify-start"
              >
                <BookOpen className="mr-3" size={20} />
                Read a saved affirmation
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="w-full mt-6 border-steel text-steel-light hover:bg-steel/10"
            >
              Close for Now
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UrgeTracker;
