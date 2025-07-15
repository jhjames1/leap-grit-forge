import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAIJourney } from '@/hooks/useAIJourney';
import { CheckCircle2, Plus, Trash2, Users, Heart, Shield } from 'lucide-react';

interface Week1DataCollectionProps {
  day: number;
  onComplete: (data: any) => void;
  onSkip: () => void;
}

const Week1DataCollection = ({ day, onComplete, onSkip }: Week1DataCollectionProps) => {
  const { toast } = useToast();
  const { saveWeek1Data } = useAIJourney();
  
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const success = await saveWeek1Data(day, data);
      if (success) {
        onComplete(data);
        toast({
          title: "Data Saved",
          description: "Your responses have been saved to your recovery profile.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save your responses. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving Week 1 data:', error);
      toast({
        title: "Error",
        description: "Failed to save your responses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDay2Form = () => {
    const [triggers, setTriggers] = useState<Array<{ name: string; intensity: number; notes: string }>>([
      { name: '', intensity: 5, notes: '' }
    ]);

    const addTrigger = () => {
      setTriggers([...triggers, { name: '', intensity: 5, notes: '' }]);
    };

    const removeTrigger = (index: number) => {
      setTriggers(triggers.filter((_, i) => i !== index));
    };

    const updateTrigger = (index: number, field: string, value: any) => {
      const updated = triggers.map((trigger, i) => 
        i === index ? { ...trigger, [field]: value } : trigger
      );
      setTriggers(updated);
    };

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Identify Your Triggers</h3>
          <p className="text-muted-foreground">
            Help us understand what situations, emotions, or thoughts might challenge your recovery.
          </p>
        </div>

        {triggers.map((trigger, index) => (
          <Card key={index} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <Label className="text-sm font-medium">Trigger {index + 1}</Label>
              {triggers.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTrigger(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor={`trigger-name-${index}`}>What triggers you?</Label>
                <Input
                  id={`trigger-name-${index}`}
                  placeholder="e.g., stress, boredom, social situations..."
                  value={trigger.name}
                  onChange={(e) => updateTrigger(index, 'name', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor={`trigger-intensity-${index}`}>
                  Intensity (1-10): {trigger.intensity}
                </Label>
                <input
                  id={`trigger-intensity-${index}`}
                  type="range"
                  min="1"
                  max="10"
                  value={trigger.intensity}
                  onChange={(e) => updateTrigger(index, 'intensity', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor={`trigger-notes-${index}`}>Additional Notes</Label>
                <Textarea
                  id={`trigger-notes-${index}`}
                  placeholder="Describe when this usually happens or how it affects you..."
                  value={trigger.notes}
                  onChange={(e) => updateTrigger(index, 'notes', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addTrigger}
          className="w-full"
          disabled={triggers.length >= 5}
        >
          <Plus size={16} className="mr-2" />
          Add Another Trigger
        </Button>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={() => handleSubmit({ triggers })}
            disabled={isSubmitting || triggers.some(t => !t.name.trim())}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Save Triggers'}
          </Button>
          <Button variant="outline" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    );
  };

  const renderDay3Form = () => {
    const [supportTriangle, setSupportTriangle] = useState({
      emotional: { name: '', relationship: '', notes: '' },
      practical: { name: '', relationship: '', notes: '' },
      recovery: { name: '', relationship: '', notes: '' }
    });

    const updateSupport = (type: string, field: string, value: string) => {
      setSupportTriangle(prev => ({
        ...prev,
        [type]: { ...prev[type as keyof typeof prev], [field]: value }
      }));
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Your Support Triangle</h3>
          <p className="text-muted-foreground">
            Identify three key people in your recovery support network.
          </p>
        </div>

        <Card className="p-4">
          <div className="flex items-center mb-3">
            <Heart className="text-red-500 mr-2" size={20} />
            <Label className="text-sm font-medium">Emotional Support</Label>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={supportTriangle.emotional.name}
              onChange={(e) => updateSupport('emotional', 'name', e.target.value)}
            />
            <Input
              placeholder="Relationship (e.g., spouse, friend, family)"
              value={supportTriangle.emotional.relationship}
              onChange={(e) => updateSupport('emotional', 'relationship', e.target.value)}
            />
            <Textarea
              placeholder="How do they support you emotionally?"
              value={supportTriangle.emotional.notes}
              onChange={(e) => updateSupport('emotional', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center mb-3">
            <Users className="text-blue-500 mr-2" size={20} />
            <Label className="text-sm font-medium">Practical Support</Label>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={supportTriangle.practical.name}
              onChange={(e) => updateSupport('practical', 'name', e.target.value)}
            />
            <Input
              placeholder="Relationship"
              value={supportTriangle.practical.relationship}
              onChange={(e) => updateSupport('practical', 'relationship', e.target.value)}
            />
            <Textarea
              placeholder="How do they help you practically?"
              value={supportTriangle.practical.notes}
              onChange={(e) => updateSupport('practical', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center mb-3">
            <Shield className="text-green-500 mr-2" size={20} />
            <Label className="text-sm font-medium">Recovery Support</Label>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={supportTriangle.recovery.name}
              onChange={(e) => updateSupport('recovery', 'name', e.target.value)}
            />
            <Input
              placeholder="Relationship"
              value={supportTriangle.recovery.relationship}
              onChange={(e) => updateSupport('recovery', 'relationship', e.target.value)}
            />
            <Textarea
              placeholder="How do they support your recovery specifically?"
              value={supportTriangle.recovery.notes}
              onChange={(e) => updateSupport('recovery', 'notes', e.target.value)}
              rows={2}
            />
          </div>
        </Card>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={() => handleSubmit({ support_triangle: supportTriangle })}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Save Support Triangle'}
          </Button>
          <Button variant="outline" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    );
  };

  const renderDay4Form = () => {
    const [coreWhy, setCoreWhy] = useState('');

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Your Core Why</h3>
          <p className="text-muted-foreground">
            What drives your recovery? This will be your anchor during difficult moments.
          </p>
        </div>

        <Card className="p-4">
          <Label htmlFor="core-why" className="text-sm font-medium mb-3 block">
            Why is recovery important to you?
          </Label>
          <Textarea
            id="core-why"
            placeholder="Write about your deeper motivation for recovery. What do you want to achieve? Who do you want to be? What matters most to you?"
            value={coreWhy}
            onChange={(e) => setCoreWhy(e.target.value)}
            rows={6}
            className="min-h-[120px]"
          />
        </Card>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={() => handleSubmit({ core_why: coreWhy })}
            disabled={isSubmitting || !coreWhy.trim()}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Save Core Why'}
          </Button>
          <Button variant="outline" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    );
  };

  const renderDay5Form = () => {
    const [identityWords, setIdentityWords] = useState<string[]>(['']);

    const addWord = () => {
      setIdentityWords([...identityWords, '']);
    };

    const removeWord = (index: number) => {
      setIdentityWords(identityWords.filter((_, i) => i !== index));
    };

    const updateWord = (index: number, value: string) => {
      const updated = identityWords.map((word, i) => 
        i === index ? value : word
      );
      setIdentityWords(updated);
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Your Identity Words</h3>
          <p className="text-muted-foreground">
            Choose words that describe who you are in recovery. These will remind you of your strength.
          </p>
        </div>

        <div className="space-y-3">
          {identityWords.map((word, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Identity word ${index + 1} (e.g., strong, resilient, determined)`}
                value={word}
                onChange={(e) => updateWord(index, e.target.value)}
                className="flex-1"
              />
              {identityWords.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWord(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={addWord}
          className="w-full"
          disabled={identityWords.length >= 10}
        >
          <Plus size={16} className="mr-2" />
          Add Another Word
        </Button>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={() => handleSubmit({ identity_words: identityWords.filter(word => word.trim()) })}
            disabled={isSubmitting || identityWords.every(word => !word.trim())}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Save Identity Words'}
          </Button>
          <Button variant="outline" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    );
  };

  const renderDay6Form = () => {
    const [safeSpace, setSafeSpace] = useState('');

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Your Safe Space</h3>
          <p className="text-muted-foreground">
            Describe a place (physical or mental) where you feel most at peace and supported.
          </p>
        </div>

        <Card className="p-4">
          <Label htmlFor="safe-space" className="text-sm font-medium mb-3 block">
            Describe your safe space
          </Label>
          <Textarea
            id="safe-space"
            placeholder="This could be a physical location, a mental image, or a feeling. Describe what makes this space safe and comforting for you."
            value={safeSpace}
            onChange={(e) => setSafeSpace(e.target.value)}
            rows={6}
            className="min-h-[120px]"
          />
        </Card>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={() => handleSubmit({ safe_space: safeSpace })}
            disabled={isSubmitting || !safeSpace.trim()}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Save Safe Space'}
          </Button>
          <Button variant="outline" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    );
  };

  const renderDay7Form = () => {
    const [reflection, setReflection] = useState('');

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Week 1 Reflection</h3>
          <p className="text-muted-foreground">
            Reflect on your first week. This will help us create your personalized recovery plan.
          </p>
        </div>

        <Card className="p-4">
          <Label htmlFor="reflection" className="text-sm font-medium mb-3 block">
            How has your first week of recovery been?
          </Label>
          <Textarea
            id="reflection"
            placeholder="Share your thoughts about this week - what you've learned, how you're feeling, any challenges or victories, and what you're looking forward to."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={8}
            className="min-h-[160px]"
          />
        </Card>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={() => handleSubmit({ reflection })}
            disabled={isSubmitting || !reflection.trim()}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Complete Week 1'}
          </Button>
          <Button variant="outline" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </div>
    );
  };

  const renderForm = () => {
    switch (day) {
      case 2:
        return renderDay2Form();
      case 3:
        return renderDay3Form();
      case 4:
        return renderDay4Form();
      case 5:
        return renderDay5Form();
      case 6:
        return renderDay6Form();
      case 7:
        return renderDay7Form();
      default:
        return (
          <div className="text-center">
            <p className="text-muted-foreground">No data collection for this day.</p>
            <Button onClick={onSkip} className="mt-4">
              Continue
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="bg-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Day {day} - Foundation Building</h2>
              <p className="text-sm text-muted-foreground">
                Building your personal recovery foundation
              </p>
            </div>
            <CheckCircle2 className="text-green-500" size={24} />
          </div>

          {renderForm()}
        </div>
      </Card>
    </div>
  );
};

export default Week1DataCollection;