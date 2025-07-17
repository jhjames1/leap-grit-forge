import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, ChevronLeft, ChevronRight, Wind, Bot, Heart, TrendingUp, Users, Download, Play } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';

interface TriggerIdentifierProps {
  onClose: () => void;
  onCancel: () => void;
  onNavigate?: (page: string) => void;
}

interface TriggerData {
  id: string;
  text: string;
  category: string;
  intensity: number;
  copingStrategy: string;
}

const TriggerIdentifier: React.FC<TriggerIdentifierProps> = ({ onClose, onCancel, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [triggers, setTriggers] = useState<TriggerData[]>([]);
  const [currentTriggerInputs, setCurrentTriggerInputs] = useState<{ [key: string]: string }>({});
  const { logActivity } = useUserData();

  const categories = [
    { id: 'environment', label: 'Environment', description: 'places, smells, sounds', color: 'bg-blue-500' },
    { id: 'emotional', label: 'Emotional', description: 'stress, anger, sadness', color: 'bg-red-500' },
    { id: 'social', label: 'Social', description: 'people, events, media', color: 'bg-green-500' },
    { id: 'physical', label: 'Physical', description: 'fatigue, pain, hunger', color: 'bg-orange-500' },
    { id: 'cognitive', label: 'Cognitive', description: 'rumination, "should" statements', color: 'bg-purple-500' }
  ];

  const commonTriggers = {
    environment: ['Bar', 'Late nights', 'Loud music', 'Parties', 'Certain neighborhoods'],
    emotional: ['Stress', 'Anger', 'Sadness', 'Loneliness', 'Anxiety'],
    social: ['Work events', 'Social media', 'Peer pressure', 'Arguments', 'Celebrations'],
    physical: ['Fatigue', 'Pain', 'Hunger', 'Illness', 'Lack of sleep'],
    cognitive: ['Negative thoughts', 'Rumination', 'Should statements', 'Perfectionism', 'Self-doubt']
  };

  const copingStrategies = [
    { id: 'breathing', label: 'Breathing', icon: Wind, description: 'SteadySteel exercises' },
    { id: 'journaling', label: 'Journaling', icon: TrendingUp, description: 'Urge tracking' },
    { id: 'foreman', label: 'Affirmation', icon: Bot, description: 'Foreman guidance' },
    { id: 'peer', label: 'Peer Chat', icon: Users, description: 'Connect with specialists' },
    { id: 'gratitude', label: 'Gratitude', icon: Heart, description: 'Gratitude log' }
  ];

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId]);
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
      // Remove triggers from this category
      setTriggers(prev => prev.filter(t => t.category !== categoryId));
    }
  };

  const handleAddCustomCategory = () => {
    if (customCategory.trim()) {
      setSelectedCategories(prev => [...prev, customCategory.trim()]);
      setCustomCategory('');
    }
  };

  const handleAddTrigger = (category: string, triggerText: string) => {
    if (triggerText.trim() && triggers.length < 10) {
      const newTrigger: TriggerData = {
        id: Date.now().toString(),
        text: triggerText.trim(),
        category,
        intensity: 3,
        copingStrategy: 'breathing'
      };
      setTriggers(prev => [...prev, newTrigger]);
      setCurrentTriggerInputs(prev => ({ ...prev, [category]: '' }));
    }
  };

  const handleCommonTriggerClick = (category: string, triggerText: string) => {
    handleAddTrigger(category, triggerText);
  };

  const handleIntensityChange = (triggerId: string, value: number[]) => {
    setTriggers(prev => prev.map(t => 
      t.id === triggerId ? { ...t, intensity: value[0] } : t
    ));
  };

  const handleStrategyChange = (triggerId: string, strategy: string) => {
    setTriggers(prev => prev.map(t => 
      t.id === triggerId ? { ...t, copingStrategy: strategy } : t
    ));
  };

  const getIntensityLabel = (value: number) => {
    const labels = {
      1: 'Mild nuisance',
      2: 'Noticeable',
      3: 'Moderate',
      4: 'Strong urge',
      5: 'Overwhelming'
    };
    return `${value} – ${labels[value as keyof typeof labels]}`;
  };

  const handleSave = () => {
    logActivity('Completed Trigger Identifier', `Mapped ${triggers.length} triggers to coping strategies`);
    // Here you would typically save to backend/user profile
    console.log('Saving trigger data:', triggers);
    onClose();
  };

  const handleExportPDF = () => {
    // Create a new window with the trigger map for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printContent = generatePrintContent();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const generatePrintContent = () => {
    const currentDate = new Date().toLocaleDateString();
    const triggersByCategory = selectedCategories.map(categoryId => {
      const category = categories.find(c => c.id === categoryId) || { id: categoryId, label: categoryId, color: 'bg-gray-500' };
      return {
        category,
        triggers: triggers.filter(t => t.category === categoryId)
      };
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trigger Map - ${currentDate}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            
            .print-header {
              border-bottom: 2px solid #000;
              margin-bottom: 30px;
              padding-bottom: 20px;
            }
            
            .print-header h1 {
              font-size: 28px;
              margin-bottom: 10px;
            }
            
            .print-header .date {
              font-size: 14px;
              color: #666;
            }
            
            .category-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            
            .category-title {
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 15px;
              color: #000;
            }
            
            .trigger-card {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            
            .trigger-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            }
            
            .trigger-name {
              font-size: 16px;
              font-weight: 500;
            }
            
            .intensity-badge {
              border: 1px solid #000;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            
            .strategy-section {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid #eee;
            }
            
            .strategy-label {
              font-size: 14px;
              font-weight: 500;
              color: #666;
            }
            
            .strategy-name {
              font-size: 16px;
              font-weight: 500;
              color: #000;
            }
            
            .summary {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #000;
            }
            
            .summary-stats {
              display: flex;
              gap: 30px;
              margin-bottom: 20px;
            }
            
            .stat-item {
              text-align: center;
            }
            
            .stat-number {
              font-size: 24px;
              font-weight: 600;
              color: #000;
            }
            
            .stat-label {
              font-size: 14px;
              color: #666;
            }
            
            @media print {
              body {
                padding: 0;
              }
              
              .print-header {
                margin-bottom: 20px;
              }
              
              .category-section {
                page-break-inside: avoid;
              }
              
              .trigger-card {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Personal Trigger Map</h1>
            <div class="date">Generated on ${currentDate}</div>
          </div>
          
          ${triggersByCategory.map(({ category, triggers: categoryTriggers }) => `
            <div class="category-section">
              <h2 class="category-title">${category.label} Triggers</h2>
              ${categoryTriggers.map(trigger => {
                const strategy = copingStrategies.find(s => s.id === trigger.copingStrategy);
                return `
                  <div class="trigger-card">
                    <div class="trigger-header">
                      <div class="trigger-name">${trigger.text}</div>
                      <div class="intensity-badge">${getIntensityLabel(trigger.intensity)}</div>
                    </div>
                    <div class="strategy-section">
                      <div class="strategy-label">Coping Strategy:</div>
                      <div class="strategy-name">${strategy?.label || 'Unknown'}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
          
          <div class="summary">
            <h2>Summary</h2>
            <div class="summary-stats">
              <div class="stat-item">
                <div class="stat-number">${triggers.length}</div>
                <div class="stat-label">Total Triggers</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${selectedCategories.length}</div>
                <div class="stat-label">Categories</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${Math.round(triggers.reduce((sum, t) => sum + t.intensity, 0) / triggers.length) || 0}</div>
                <div class="stat-label">Avg Intensity</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleStartUrgeTracker = () => {
    onNavigate?.('urge-tracker');
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="font-fjalla font-bold text-2xl text-foreground mb-2 tracking-wide">
          WHAT KIND OF TRIGGERS DO YOU FACE?
        </h2>
        <p className="text-muted-foreground font-source">Select all that apply, or add your own.</p>
      </div>

      <div className="space-y-4">
        {categories.map(category => (
          <Card key={category.id} className="bg-card border-0 shadow-none hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor={category.id} className="font-fjalla font-bold text-base text-card-foreground cursor-pointer tracking-wide">
                    {category.label.toUpperCase()}
                  </Label>
                  <p className="text-sm text-muted-foreground font-source">{category.description}</p>
                </div>
                <div className="bg-primary p-2 rounded-sm">
                  <span className="text-primary-foreground font-source text-xs font-bold tracking-wide">
                    {category.label.toUpperCase()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-0 shadow-none border-dashed border-2 border-muted">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Input
              placeholder="Add custom category..."
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomCategory()}
            />
            <Button onClick={handleAddCustomCategory} disabled={!customCategory.trim()} className="bg-yellow-400 hover:bg-yellow-500 text-black">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="font-fjalla font-bold text-2xl text-foreground mb-2 tracking-wide">
          WHAT SPECIFICALLY SETS OFF EACH ONE?
        </h2>
        <p className="text-muted-foreground font-source">Add up to 10 total triggers</p>
      </div>

      {selectedCategories.map(categoryId => {
        const category = categories.find(c => c.id === categoryId) || { id: categoryId, label: categoryId, color: 'bg-gray-500' };
        const categoryTriggers = triggers.filter(t => t.category === categoryId);
        
        return (
          <Card key={categoryId} className="bg-card border-0 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="bg-primary p-2 rounded-sm">
                  <span className="text-primary-foreground font-source text-xs font-bold tracking-wide">
                    {category.label.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground font-source">
                  ({categoryTriggers.length} triggers)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Common triggers */}
              {commonTriggers[categoryId as keyof typeof commonTriggers] && (
                <div>
                  <Label className="text-sm font-fjalla font-bold text-card-foreground tracking-wide">COMMON EXAMPLES:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {commonTriggers[categoryId as keyof typeof commonTriggers].map(trigger => (
                      <Button
                        key={trigger}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCommonTriggerClick(categoryId, trigger)}
                        disabled={triggers.some(t => t.text === trigger) || triggers.length >= 10}
                        className="font-source"
                      >
                        {trigger}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom trigger input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Add specific trigger..."
                  value={currentTriggerInputs[categoryId] || ''}
                  onChange={(e) => setCurrentTriggerInputs(prev => ({ ...prev, [categoryId]: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTrigger(categoryId, currentTriggerInputs[categoryId] || '')}
                  disabled={triggers.length >= 10}
                />
                <Button 
                  onClick={() => handleAddTrigger(categoryId, currentTriggerInputs[categoryId] || '')}
                  disabled={!currentTriggerInputs[categoryId]?.trim() || triggers.length >= 10}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Added triggers */}
              {categoryTriggers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categoryTriggers.map(trigger => (
                    <Badge key={trigger.id} variant="secondary" className="flex items-center space-x-1">
                      <span>{trigger.text}</span>
                      <button
                        onClick={() => setTriggers(prev => prev.filter(t => t.id !== trigger.id))}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="text-center text-sm text-muted-foreground">
        {triggers.length}/10 triggers added
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="font-fjalla font-bold text-2xl text-foreground mb-2 tracking-wide">
          HOW STRONG IS EACH TRIGGER?
        </h2>
        <p className="text-muted-foreground">Rate the intensity of each trigger</p>
      </div>

      <div className="space-y-4">
        {triggers.map(trigger => {
          const category = categories.find(c => c.id === trigger.category) || { id: trigger.category, label: trigger.category, color: 'bg-gray-500' };
          
          return (
            <Card key={trigger.id} className="border-2">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge className={`${category.color} text-white`}>
                      {category.label}
                    </Badge>
                    <span className="font-medium">{trigger.text}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Intensity:</Label>
                      <Badge variant="outline">{getIntensityLabel(trigger.intensity)}</Badge>
                    </div>
                    <Slider
                      value={[trigger.intensity]}
                      onValueChange={(value) => handleIntensityChange(trigger.id, value)}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 - Mild</span>
                      <span>5 - Overwhelming</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Pick your go-to tool for each trigger</h2>
        <p className="text-muted-foreground">Choose the best coping strategy for each trigger</p>
      </div>

      <div className="space-y-4">
        {triggers.map(trigger => {
          const category = categories.find(c => c.id === trigger.category) || { id: trigger.category, label: trigger.category, color: 'bg-gray-500' };
          
          return (
            <Card key={trigger.id} className="border-2">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge className={`${category.color} text-white`}>
                      {category.label}
                    </Badge>
                    <span className="font-medium">{trigger.text}</span>
                    <Badge variant="outline">{getIntensityLabel(trigger.intensity)}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Coping Strategy:</Label>
                    <Select value={trigger.copingStrategy} onValueChange={(value) => handleStrategyChange(trigger.id, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a coping strategy" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border shadow-lg">
                        {copingStrategies.map(strategy => {
                          const Icon = strategy.icon;
                          return (
                            <SelectItem key={strategy.id} value={strategy.id} className="focus:bg-accent focus:text-accent-foreground">
                              <div className="flex items-center space-x-2">
                                <Icon className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">{strategy.label}</div>
                                  <div className="text-xs text-muted-foreground">{strategy.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Your Trigger Map</h2>
        <p className="text-muted-foreground">Review and save your personalized trigger management plan</p>
      </div>

      <div className="space-y-4">
        {triggers.map(trigger => {
          const category = categories.find(c => c.id === trigger.category) || { id: trigger.category, label: trigger.category, color: 'bg-gray-500' };
          const strategy = copingStrategies.find(s => s.id === trigger.copingStrategy);
          const Icon = strategy?.icon || Wind;
          
          return (
            <Card key={trigger.id} className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={`${category.color} text-white`}>
                      {category.label}
                    </Badge>
                    <span className="font-medium">{trigger.text}</span>
                    <Badge variant="outline">{getIntensityLabel(trigger.intensity)}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">{strategy?.label}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Button onClick={handleSave} className="w-full">
          Save & Exit
        </Button>
        <Button onClick={handleExportPDF} variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
        <Button onClick={handleStartUrgeTracker} variant="outline" className="w-full">
          <Play className="w-4 h-4 mr-2" />
          Start Urge Tracker
        </Button>
      </div>
    </div>
  );

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return selectedCategories.length > 0;
      case 2:
        return triggers.length > 0;
      case 3:
      case 4:
        return true;
      default:
        return false;
    }
  };

  const stepTitles = [
    'Categories',
    'Triggers',
    'Intensity',
    'Strategies',
    'Summary'
  ];

  return (
    <div className="fixed inset-0 bg-background z-[100] overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Trigger Identifier</h1>
                <p className="text-muted-foreground">Step {currentStep} of 5: {stepTitles[currentStep - 1]}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {stepTitles.map((title, index) => (
                <div key={index} className={`text-sm ${index + 1 <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                  {title}
                </div>
              ))}
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </div>

          {/* Navigation */}
          {currentStep < 5 && (
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
                disabled={!canGoNext()}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TriggerIdentifier;