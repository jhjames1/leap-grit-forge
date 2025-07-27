import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, X, Trophy, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAudio } from '@/hooks/useAudio';
import { useUserData } from '@/hooks/useUserData';
import { cn } from '@/lib/utils';

interface CraveRunnerProps {
  onClose: () => void;
  onCancel: () => void;
}

interface GameObject {
  id: string;
  x: number;
  y: number;
  type: 'harmful' | 'helpful';
  item: string;
  collected?: boolean;
}

interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  distance: number;
  speed: number;
  playerY: number;
  playerLane: number; // 0, 1, 2 for three lanes
  gameObjects: GameObject[];
  lives: number;
  showEncouragement: string;
  theme: 'urban' | 'nature' | 'mountain';
  gameStarted: boolean;
  gameCompleted: boolean;
  timeRemaining: number;
}

const GAME_DURATION = 90; // 90 seconds
const LANES = [20, 50, 80]; // Y positions for three lanes
const LANE_COUNT = 3;

const HARMFUL_ITEMS = [
  { item: 'alcohol', icon: '🍺', label: 'Alcohol' },
  { item: 'numbness', icon: '😴', label: 'Numbness' },
  { item: 'shame', icon: '💔', label: 'Shame' },
  { item: 'temptation', icon: '🌫️', label: 'Temptation' },
  { item: 'isolation', icon: '🔒', label: 'Isolation' },
  { item: 'anger', icon: '💥', label: 'Anger' }
];

const HELPFUL_ITEMS = [
  { item: 'breath', icon: '🌬️', label: 'Deep Breath' },
  { item: 'peer', icon: '👥', label: 'Call a Peer' },
  { item: 'truth', icon: '💎', label: 'Truth' },
  { item: 'pause', icon: '⏸️', label: 'Pause' },
  { item: 'gratitude', icon: '🙏', label: 'Gratitude' },
  { item: 'hope', icon: '⭐', label: 'Hope' }
];

const ENCOURAGEMENTS = [
  "You dodged that urge!",
  "Still standing strong!",
  "Great awareness!",
  "You're building strength!",
  "Keep moving forward!",
  "Momentum building!",
  "You've got this!",
  "Staying focused!"
];

const THEMES = {
  urban: { bg: 'from-slate-800 to-slate-900', name: 'Urban Night' },
  nature: { bg: 'from-green-600 to-blue-600', name: 'Desert Clarity' },
  mountain: { bg: 'from-blue-800 to-purple-900', name: 'Mountain Rise' }
};

export const CraveRunner: React.FC<CraveRunnerProps> = ({ onClose, onCancel }) => {
  const { t } = useLanguage();
  const { logActivity, userData } = useUserData();
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastObjectSpawn = useRef<number>(0);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    score: 0,
    distance: 0,
    speed: 2,
    playerY: LANES[1], // Start in middle lane
    playerLane: 1,
    gameObjects: [],
    lives: 3,
    showEncouragement: '',
    theme: 'urban',
    gameStarted: false,
    gameCompleted: false,
    timeRemaining: GAME_DURATION
  });

  // Background music and sound effects
  const backgroundMusic = useAudio('/lovable-uploads/crave-runner-bg.mp3');
  const collectSound = useAudio('/lovable-uploads/collect-sound.mp3');
  const hitSound = useAudio('/lovable-uploads/hit-sound.mp3');

  const getRandomItem = (type: 'harmful' | 'helpful') => {
    const items = type === 'harmful' ? HARMFUL_ITEMS : HELPFUL_ITEMS;
    return items[Math.floor(Math.random() * items.length)];
  };

  const spawnGameObject = useCallback(() => {
    const now = Date.now();
    if (now - lastObjectSpawn.current < 1000 / gameState.speed) return;

    const isHarmful = Math.random() < 0.6; // 60% harmful, 40% helpful
    const type = isHarmful ? 'harmful' : 'helpful';
    const item = getRandomItem(type);
    const lane = Math.floor(Math.random() * LANE_COUNT);

    const newObject: GameObject = {
      id: `${Date.now()}-${Math.random()}`,
      x: 400, // Start from right side
      y: LANES[lane],
      type,
      item: item.item,
    };

    setGameState(prev => ({
      ...prev,
      gameObjects: [...prev.gameObjects, newObject]
    }));

    lastObjectSpawn.current = now;
  }, [gameState.speed]);

  const movePlayer = (direction: 'up' | 'down') => {
    setGameState(prev => {
      let newLane = prev.playerLane;
      if (direction === 'up' && newLane > 0) newLane--;
      if (direction === 'down' && newLane < LANE_COUNT - 1) newLane++;
      
      return {
        ...prev,
        playerLane: newLane,
        playerY: LANES[newLane]
      };
    });
  };

  const checkCollisions = useCallback(() => {
    setGameState(prev => {
      const updatedObjects = [...prev.gameObjects];
      let newScore = prev.score;
      let newLives = prev.lives;
      let encouragement = '';
      let newTheme = prev.theme;

      updatedObjects.forEach(obj => {
        // Check collision with player (simple distance check)
        if (Math.abs(obj.x - 80) < 30 && Math.abs(obj.y - prev.playerY) < 20 && !obj.collected) {
          obj.collected = true;
          
          if (obj.type === 'helpful') {
            newScore += 10;
            encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
            collectSound.play();
            
            // Theme progression based on score
            if (newScore >= 100 && prev.theme === 'urban') newTheme = 'nature';
            if (newScore >= 200 && prev.theme === 'nature') newTheme = 'mountain';
          } else {
            newLives = Math.max(0, newLives - 1);
            hitSound.play();
            encouragement = 'Take a breath and refocus';
          }
        }
      });

      return {
        ...prev,
        gameObjects: updatedObjects.filter(obj => obj.x > -50), // Remove off-screen objects
        score: newScore,
        lives: newLives,
        showEncouragement: encouragement,
        theme: newTheme
      };
    });
  }, [collectSound, hitSound]);

  const gameLoop = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    setGameState(prev => {
      // Move objects left
      const updatedObjects = prev.gameObjects.map(obj => ({
        ...obj,
        x: obj.x - prev.speed
      }));

      // Increase speed and distance
      const newDistance = prev.distance + prev.speed;
      const newSpeed = Math.min(8, 2 + newDistance / 1000); // Max speed of 8

      return {
        ...prev,
        gameObjects: updatedObjects,
        distance: newDistance,
        speed: newSpeed
      };
    });

    spawnGameObject();
    checkCollisions();
  }, [gameState.isPlaying, gameState.isPaused, spawnGameObject, checkCollisions]);

  // Game timer
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      const timer = setInterval(() => {
        setGameState(prev => {
          if (prev.timeRemaining <= 1) {
            return { ...prev, timeRemaining: 0, isPlaying: false, gameCompleted: true };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState.isPlaying, gameState.isPaused]);

  // Game loop
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      gameLoopRef.current = setInterval(gameLoop, 50); // 20 FPS
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [gameLoop, gameState.isPlaying, gameState.isPaused]);

  // Clear encouragement message
  useEffect(() => {
    if (gameState.showEncouragement) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, showEncouragement: '' }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.showEncouragement]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.isPlaying && !gameState.isPaused) {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          movePlayer('up');
        }
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          e.preventDefault();
          movePlayer('down');
        }
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (gameState.isPlaying) {
          setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.isPlaying, gameState.isPaused]);

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      gameStarted: true,
      gameCompleted: false,
      timeRemaining: GAME_DURATION
    }));
    backgroundMusic.play();
  };

  const pauseGame = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const resetGame = () => {
    setGameState({
      isPlaying: false,
      isPaused: false,
      score: 0,
      distance: 0,
      speed: 2,
      playerY: LANES[1],
      playerLane: 1,
      gameObjects: [],
      lives: 3,
      showEncouragement: '',
      theme: 'urban',
      gameStarted: false,
      gameCompleted: false,
      timeRemaining: GAME_DURATION
    });
    backgroundMusic.stop();
  };

  const handleGameComplete = () => {
    const momentumPoints = Math.floor(gameState.score / 10);
    logActivity('Completed Crave Runner', `Score: ${gameState.score}, Distance: ${Math.floor(gameState.distance)}, Momentum Points: ${momentumPoints}`);
    onClose();
  };

  const renderGame = () => {
    const theme = THEMES[gameState.theme];
    
    return (
      <div className={cn(
        "relative w-full h-64 rounded-lg overflow-hidden bg-gradient-to-r",
        theme.bg
      )}>
        {/* Background elements */}
        <div className="absolute inset-0 opacity-20">
          {gameState.theme === 'urban' && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-800 to-transparent" />
          )}
          {gameState.theme === 'nature' && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-green-800 to-transparent" />
          )}
          {gameState.theme === 'mountain' && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-900 to-transparent" />
          )}
        </div>

        {/* Player */}
        <div
          className="absolute w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg transition-all duration-200 ease-out z-10"
          style={{
            left: '80px',
            top: `${gameState.playerY}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          🏃
        </div>

        {/* Game objects */}
        {gameState.gameObjects.map(obj => {
          const itemData = [...HARMFUL_ITEMS, ...HELPFUL_ITEMS].find(i => i.item === obj.item);
          return (
            <div
              key={obj.id}
              className={cn(
                "absolute w-6 h-6 flex items-center justify-center text-sm rounded transition-all duration-100",
                obj.type === 'harmful' ? 'bg-red-500/80' : 'bg-green-500/80',
                obj.collected && 'opacity-0'
              )}
              style={{
                left: `${obj.x}px`,
                top: `${obj.y}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {itemData?.icon}
            </div>
          );
        })}

        {/* Encouragement message */}
        {gameState.showEncouragement && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full text-sm font-bold text-green-700 animate-fade-in">
            {gameState.showEncouragement}
          </div>
        )}

        {/* Game over overlay */}
        {(gameState.lives <= 0 || gameState.gameCompleted) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Card className="p-6 text-center max-w-sm">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-xl font-bold mb-2">
                {gameState.lives <= 0 ? 'Practice Complete!' : 'Great Session!'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Score: {gameState.score} | Distance: {Math.floor(gameState.distance)}m
              </p>
              <p className="text-sm mb-4">
                You earned {Math.floor(gameState.score / 10)} momentum points!
              </p>
              <div className="flex gap-2">
                <Button onClick={resetGame} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
                <Button onClick={handleGameComplete} size="sm">
                  Complete
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Crave Runner</h2>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {!gameState.gameStarted ? (
          <div className="text-center space-y-4">
            <div className="text-4xl mb-4">🏃‍♂️</div>
            <h3 className="text-lg font-semibold">Practice Urge Surfing</h3>
            <p className="text-muted-foreground text-sm">
              Dodge harmful urges (red items) and collect helpful tools (green items). 
              Use arrow keys or W/S to move between lanes.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">💔</div>
                <span>Avoid</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">🌬️</div>
                <span>Collect</span>
              </div>
            </div>
            <Button onClick={startGame} className="w-full" size="lg">
              <Play className="w-4 h-4 mr-2" />
              Start 90-Second Challenge
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Game stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <Badge variant="outline">Score: {gameState.score}</Badge>
                <Badge variant="outline">Time: {gameState.timeRemaining}s</Badge>
                <div className="flex items-center gap-1">
                  {Array.from({ length: gameState.lives }).map((_, i) => (
                    <Heart key={i} className="w-4 h-4 text-red-500 fill-current" />
                  ))}
                </div>
              </div>
              <Badge>{THEMES[gameState.theme].name}</Badge>
            </div>

            {/* Game area */}
            {renderGame()}

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button 
                onClick={pauseGame} 
                variant="outline" 
                size="sm"
                disabled={!gameState.isPlaying}
              >
                {gameState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              <Button onClick={resetGame} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Instructions */}
            <p className="text-xs text-center text-muted-foreground">
              Use ↑↓ or W/S keys to move • Space to pause
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};