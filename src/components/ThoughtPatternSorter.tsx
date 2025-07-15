import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Coins, 
  Trophy,
  RotateCcw,
  Home,
  Clock,
  Sparkles,
  Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserData } from '@/hooks/useUserData';
import { useToast } from '@/hooks/use-toast';

interface ThoughtItem {
  id: string;
  text: string;
  is_distortion: boolean;
  category: string;
  difficulty: number;
}

interface ThoughtPack {
  id: string;
  title: string;
  description: string;
  theme: string;
  unlock_requirement: number;
}

interface GameData {
  pack: ThoughtPack;
  items: ThoughtItem[];
  remainingPlays?: number;
  nextResetTime?: number;
}

interface ThoughtPatternSorterProps {
  onClose: () => void;
  onCancel: () => void;
}

const ThoughtPatternSorter: React.FC<ThoughtPatternSorterProps> = ({ onClose, onCancel }) => {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentItems, setCurrentItems] = useState<ThoughtItem[]>([]);
  const [sortedItems, setSortedItems] = useState<{ [key: string]: 'distortion' | 'realistic' | null }>({});
  const [feedback, setFeedback] = useState<{ [key: string]: 'correct' | 'incorrect' | null }>({});
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [nextResetTime, setNextResetTime] = useState<number | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  const { logActivity, userData, updateToolboxStats } = useUserData();
  const { toast } = useToast();

  // Fetch today's thought pack
  const fetchTodaysPack = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to play the game",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('thought-packs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('Supabase function response:', response);

      // Better error handling for daily limit
      if (response.error) {
        const errorMsg = response.error.message || '';
        console.error('Function error:', response.error);
        
        // Check for daily limit indicators
        if (errorMsg.includes('daily limit') || 
            errorMsg.includes('limit reached') ||
            errorMsg.includes('429')) {
          setDailyLimitReached(true);
          setNextResetTime(new Date().setHours(24, 0, 0, 0));
          setLoading(false);
          return;
        }
        
        // For other errors, show generic error
        throw new Error('Unable to load activity');
      }

      const gameDataResult = response.data as GameData;
      setGameData(gameDataResult);
      setCurrentItems(gameDataResult.items);
      
      // Initialize sorted items state
      const initialSorted: { [key: string]: 'distortion' | 'realistic' | null } = {};
      gameDataResult.items.forEach(item => {
        initialSorted[item.id] = null;
      });
      setSortedItems(initialSorted);
    } catch (error) {
      console.error('Error fetching thought pack:', error);
      toast({
        title: "Error",
        description: "Failed to load today's thought pack",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTodaysPack();
  }, [fetchTodaysPack]);

  // Countdown timer effect
  useEffect(() => {
    if (!dailyLimitReached || !nextResetTime) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = nextResetTime - now;

      if (distance < 0) {
        setTimeUntilReset('Ready to play again!');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [dailyLimitReached, nextResetTime]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, dropZone: 'distortion' | 'realistic') => {
    e.preventDefault();
    
    if (!draggedItem || !gameData) return;

    const item = gameData.items.find(i => i.id === draggedItem);
    if (!item) return;

    // Check if correct
    const isCorrect = (dropZone === 'distortion' && item.is_distortion) || 
                     (dropZone === 'realistic' && !item.is_distortion);

    // Update sorted items
    setSortedItems(prev => ({ ...prev, [draggedItem]: dropZone }));
    
    // Update feedback
    setFeedback(prev => ({ ...prev, [draggedItem]: isCorrect ? 'correct' : 'incorrect' }));

    // Play sound feedback (if available)
    if (isCorrect) {
      // Play success sound
      const audio = new Audio('/success-sound.mp3');
      audio.play().catch(() => {}); // Ignore errors if sound file doesn't exist
      
      // Add coins
      setCoinsEarned(prev => prev + 10);
      setScore(prev => prev + 1);
    } else {
      // Play error sound
      const audio = new Audio('/error-sound.mp3');
      audio.play().catch(() => {}); // Ignore errors if sound file doesn't exist
      
      // Shake animation (handled by CSS)
      const bubble = document.getElementById(`bubble-${draggedItem}`);
      if (bubble) {
        bubble.classList.add('animate-shake');
        setTimeout(() => bubble.classList.remove('animate-shake'), 600);
      }
    }

    setDraggedItem(null);

    // Check if game is complete
    const newSortedItems = { ...sortedItems, [draggedItem]: dropZone };
    const allItemsSorted = Object.values(newSortedItems).every(value => value !== null);
    
    if (allItemsSorted) {
      setTimeout(() => {
        handleGameComplete();
      }, 1000);
    }
  };

  // Handle game completion
  const handleGameComplete = async () => {
    if (!gameData || gameCompleted) return;

    setIsProcessing(true);
    setGameCompleted(true);

    try {
      // Save game session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase.functions.invoke('thought-packs', {
          method: 'POST',
          body: {
            pack_id: gameData.pack.id,
            score,
            total_items: gameData.items.length,
            correct_items: score,
            coins_earned: coinsEarned,
          },
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (error) {
          throw new Error(error.message);
        }
      }

      // Update user data
      logActivity('Completed Thought Pattern Sorter', `Sorted ${score}/${gameData.items.length} correctly, earned ${coinsEarned} Courage Coins`);
      
      if (userData) {
        updateToolboxStats({
          totalSessions: userData.toolboxStats.totalSessions + 1,
          courageCoins: (userData.toolboxStats.courageCoins || 0) + coinsEarned
        });
      }

      toast({
        title: "Game Complete!",
        description: `You earned ${coinsEarned} Courage Coins!`,
      });

    } catch (error) {
      console.error('Error saving game session:', error);
      toast({
        title: "Error",
        description: "Failed to save game progress",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset game and fetch new thoughts
  const resetGame = useCallback(() => {
    setLoading(true);
    setGameCompleted(false);
    setScore(0);
    setCoinsEarned(0);
    setDraggedItem(null);
    setIsProcessing(false);
    
    // Fetch new set of thoughts
    fetchTodaysPack().catch(err => {
      console.error('Error refetching thought pack:', err);
      setLoading(false);
    });
  }, [fetchTodaysPack]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
        <Card className="w-80 p-6">
          <div className="flex items-center justify-center space-x-2">
            <Brain className="h-6 w-6 animate-pulse text-primary" />
            <span>Loading thought pack...</span>
          </div>
        </Card>
      </div>
    );
  }

  // Daily limit reached screen
  if (dailyLimitReached) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-center">
            <div className="flex flex-col items-center space-y-2">
              <Heart className="h-12 w-12" />
              <CardTitle className="text-xl font-fjalla font-bold tracking-wide">
                You've completed your daily Thought Pattern Sorter sessions!
              </CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 text-center space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground font-source">
                  This daily limit helps make your practice more meaningful and prevents cognitive overload.
                </p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium font-source">
                  While you wait for tomorrow's fresh thoughts, why not explore our other helpful tools?
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 font-source">
                  <li>• Breathing exercises for relaxation</li>
                  <li>• Gratitude logging for positivity</li>
                  <li>• Urge tracking for awareness</li>
                  <li>• Recovery calendar for motivation</li>
                </ul>
              </div>
              
              {nextResetTime && (
                <div className="bg-primary/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium font-source">Next session available in:</span>
                  </div>
                  <div className="text-lg font-bold text-primary font-mono">
                    {timeUntilReset}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col space-y-2 pt-4">
              <Button 
                onClick={onClose} 
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-source font-bold"
              >
                <Home className="h-4 w-4 mr-2" />
                Explore Other Tools
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCancel}
                className="text-muted-foreground hover:text-foreground font-source"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
        <Card className="w-80 p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Activity</h3>
            <p className="text-muted-foreground mb-4">Please check your connection and try again</p>
            <Button onClick={onClose} className="w-full">
              Back to Toolbox
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-0 shadow-none">
        <CardHeader className="bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl font-fjalla font-bold tracking-wide">THOUGHT PATTERN SORTER</CardTitle>
                <p className="text-sm opacity-90 font-source">{gameData.pack.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {gameData.remainingPlays !== undefined && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-source">Plays left:</span>
                  <Badge variant="secondary" className="text-xs">{gameData.remainingPlays}</Badge>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Coins className="h-4 w-4" />
                <span className="font-bold font-source">{coinsEarned}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Trophy className="h-4 w-4" />
                <span className="font-bold font-source">{score}/{gameData.items.length}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pb-20 md:pb-6">
          {gameCompleted ? (
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <Trophy className="h-16 w-16 text-primary mx-auto" />
                <h2 className="text-2xl font-fjalla font-bold text-foreground tracking-wide">CONGRATULATIONS!</h2>
                <p className="text-lg font-source">
                  You sorted {score}/{gameData.items.length} correctly!
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <Coins className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold font-source">+{coinsEarned} Courage Coins earned</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 justify-center">
                <Button 
                  onClick={resetGame} 
                  variant="outline" 
                  className="flex items-center space-x-2 font-source"
                  disabled={gameData.remainingPlays === 0}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{gameData.remainingPlays === 0 ? 'No plays left today' : 'Play Again'}</span>
                </Button>
                <Button onClick={onClose} className="flex items-center space-x-2 bg-yellow-400 hover:bg-yellow-500 text-black font-source font-bold">
                  <Home className="h-4 w-4" />
                  <span>Back to Toolbox</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{Object.values(sortedItems).filter(v => v !== null).length}/{gameData.items.length}</span>
                </div>
                <Progress 
                  value={(Object.values(sortedItems).filter(v => v !== null).length / gameData.items.length) * 100} 
                  className="h-2"
                />
              </div>

              {/* Draggable bubbles */}
              <div className="space-y-4">
                <h3 className="text-lg font-fjalla font-bold text-foreground tracking-wide">DRAG EACH THOUGHT TO THE CORRECT CATEGORY:</h3>
                <div className="grid grid-cols-2 gap-4 min-h-[200px]">
                  {gameData.items.map(item => {
                    const isCompleted = sortedItems[item.id] !== null;
                    const feedbackType = feedback[item.id];
                    
                    return (
                      <div
                        key={item.id}
                        id={`bubble-${item.id}`}
                        draggable={!isCompleted}
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        className={`
                          p-4 rounded-lg border-2 cursor-move transition-all duration-200
                          ${isCompleted 
                            ? (feedbackType === 'correct' 
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                                : 'border-red-500 bg-red-50 dark:bg-red-900/20')
                            : 'border-border bg-card hover:border-primary/50'
                          }
                          ${draggedItem === item.id ? 'opacity-50 scale-95' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-source font-medium">{item.text}</p>
                          {isCompleted && (
                            <div className="flex items-center space-x-1">
                              {feedbackType === 'correct' ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <X className="h-4 w-4 text-red-600" />
                              )}
                               <span className="text-xs font-source font-bold">
                                 {feedbackType === 'correct' ? '+10' : '0'}
                               </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drop zones */}
              <div className="grid grid-cols-2 gap-6">
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'distortion')}
                  className="border-2 border-dashed border-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg p-6 text-center min-h-[120px] flex flex-col items-center justify-center space-y-2"
                >
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <h4 className="font-fjalla font-bold text-red-700 dark:text-red-300 tracking-wide">DISTORTIONS</h4>
                  <p className="text-sm text-red-600 dark:text-red-400 font-source">Unhelpful thinking patterns</p>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'realistic')}
                  className="border-2 border-dashed border-green-300 bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center min-h-[120px] flex flex-col items-center justify-center space-y-2"
                >
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <h4 className="font-fjalla font-bold text-green-700 dark:text-green-300 tracking-wide">REALISTIC</h4>
                  <p className="text-sm text-green-600 dark:text-green-400 font-source">Balanced, helpful thoughts</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ThoughtPatternSorter;