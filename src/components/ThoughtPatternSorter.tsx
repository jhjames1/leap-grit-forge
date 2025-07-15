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
  Home
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

      const { data, error } = await supabase.functions.invoke('thought-packs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const gameData = data as GameData;
      setGameData(gameData);
      setCurrentItems(gameData.items);
      
      // Initialize sorted items state
      const initialSorted: { [key: string]: 'distortion' | 'realistic' | null } = {};
      gameData.items.forEach(item => {
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

  // Reset game
  const resetGame = () => {
    if (!gameData) return;

    const initialSorted: { [key: string]: 'distortion' | 'realistic' | null } = {};
    gameData.items.forEach(item => {
      initialSorted[item.id] = null;
    });
    
    setSortedItems(initialSorted);
    setFeedback({});
    setGameCompleted(false);
    setScore(0);
    setCoinsEarned(0);
    setDraggedItem(null);
    setIsProcessing(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-80 p-6">
          <div className="flex items-center justify-center space-x-2">
            <Brain className="h-6 w-6 animate-pulse text-primary" />
            <span>Loading thought pack...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-80 p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Game</h3>
            <p className="text-muted-foreground mb-4">Unable to load today's thought pack</p>
            <Button onClick={onClose} className="w-full">
              Back to Toolbox
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl">Thought Pattern Sorter</CardTitle>
                <p className="text-sm opacity-90">{gameData.pack.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Coins className="h-4 w-4" />
                <span className="font-bold">{coinsEarned}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Trophy className="h-4 w-4" />
                <span className="font-bold">{score}/{gameData.items.length}</span>
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

        <CardContent className="p-6">
          {gameCompleted ? (
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <Trophy className="h-16 w-16 text-primary mx-auto" />
                <h2 className="text-2xl font-bold">Congratulations!</h2>
                <p className="text-lg">
                  You sorted {score}/{gameData.items.length} correctly!
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <Coins className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">+{coinsEarned} Courage Coins earned</span>
                </div>
              </div>
              
              <div className="flex space-x-4 justify-center">
                <Button onClick={resetGame} variant="outline" className="flex items-center space-x-2">
                  <RotateCcw className="h-4 w-4" />
                  <span>Play Again</span>
                </Button>
                <Button onClick={onClose} className="flex items-center space-x-2">
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
                <h3 className="text-lg font-semibold">Drag each thought to the correct category:</h3>
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
                          <p className="text-sm font-medium">{item.text}</p>
                          {isCompleted && (
                            <div className="flex items-center space-x-1">
                              {feedbackType === 'correct' ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <X className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-xs">
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
                  <h4 className="font-semibold text-red-700 dark:text-red-300">Distortions</h4>
                  <p className="text-sm text-red-600 dark:text-red-400">Unhelpful thinking patterns</p>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'realistic')}
                  className="border-2 border-dashed border-green-300 bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center min-h-[120px] flex flex-col items-center justify-center space-y-2"
                >
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <h4 className="font-semibold text-green-700 dark:text-green-300">Realistic</h4>
                  <p className="text-sm text-green-600 dark:text-green-400">Balanced, helpful thoughts</p>
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