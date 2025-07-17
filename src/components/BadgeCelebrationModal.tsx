import { useState } from 'react';
import { Badge } from '@/hooks/useBadgeNotifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface BadgeCelebrationModalProps {
  badges: Badge[];
  isOpen: boolean;
  onClose: () => void;
}

export const BadgeCelebrationModal = ({ badges, isOpen, onClose }: BadgeCelebrationModalProps) => {
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);

  if (badges.length === 0) return null;

  const currentBadge = badges[currentBadgeIndex];
  const isLastBadge = currentBadgeIndex === badges.length - 1;

  const handleNext = () => {
    if (isLastBadge) {
      onClose();
    } else {
      setCurrentBadgeIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentBadgeIndex > 0) {
      setCurrentBadgeIndex(prev => prev - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-yellow-800 mb-4">
            🎉 Achievement Unlocked! 🎉
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6">
          {/* Confetti-like decoration */}
          <div className="absolute top-4 left-4 text-yellow-400 animate-bounce">✨</div>
          <div className="absolute top-6 right-6 text-orange-400 animate-pulse">🎊</div>
          <div className="absolute bottom-4 left-6 text-yellow-500 animate-bounce delay-100">⭐</div>
          <div className="absolute bottom-6 right-4 text-orange-500 animate-pulse delay-200">🌟</div>
          
          {/* Badge Display */}
          <Card className="bg-white/80 backdrop-blur-sm border-yellow-300 p-6 w-full text-center shadow-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
              <span className="text-4xl">{currentBadge.icon}</span>
            </div>
            
            <h3 className="font-bold text-xl text-gray-800 mb-2">
              {currentBadge.name}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {currentBadge.description}
            </p>
            
            <div className="bg-yellow-100 rounded-lg p-3 border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium">
                Keep up the amazing work! Your dedication to recovery is truly inspiring.
              </p>
            </div>
          </Card>
          
          {/* Badge Counter */}
          {badges.length > 1 && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Badge {currentBadgeIndex + 1} of {badges.length}</span>
              <div className="flex space-x-1">
                {badges.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentBadgeIndex ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center w-full">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentBadgeIndex === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </Button>
            
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium px-6 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
            >
              {isLastBadge ? 'Continue' : 'Next'}
              {!isLastBadge && <ChevronRight size={16} className="ml-2" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};