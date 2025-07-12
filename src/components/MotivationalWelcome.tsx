import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Quote, Play, Image, SkipForward, Star } from 'lucide-react';
import { useMotivationalContent } from '@/hooks/useMotivationalContent';

interface MotivationalWelcomeProps {
  specialistId: string;
  isOpen: boolean;
  onClose: () => void;
}

const MotivationalWelcome: React.FC<MotivationalWelcomeProps> = ({
  specialistId,
  isOpen,
  onClose
}) => {
  const { todaysContent, loading, markAsViewed, toggleFavorite } = useMotivationalContent(specialistId);
  const [isFavorite, setIsFavorite] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'daily_inspiration':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'success_stories':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'professional_tips':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'self_care':
        return 'bg-pink-500/10 text-pink-700 border-pink-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'quote':
        return <Quote className="h-5 w-5" />;
      case 'video':
        return <Play className="h-5 w-5" />;
      case 'audio':
        return <Play className="h-5 w-5" />;
      case 'image':
        return <Image className="h-5 w-5" />;
      default:
        return <Quote className="h-5 w-5" />;
    }
  };

  const formatCategoryName = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleClose = () => {
    if (todaysContent) {
      markAsViewed(todaysContent.id, isFavorite);
    }
    onClose();
  };

  const handleToggleFavorite = () => {
    if (todaysContent) {
      setIsFavorite(!isFavorite);
      toggleFavorite(todaysContent.id);
    }
  };

  if (loading || !todaysContent) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-background">
        {/* Header matching HOME page style */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-6">
            {/* Left column: Title */}
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
                <span className="font-oswald font-extralight tracking-tight">TODAY'S</span><span className="font-fjalla font-extrabold italic">INSPIRATION</span>
              </h1>
              <div className="mt-4"></div>
              <p className="text-muted-foreground text-sm">{formatCategoryName(todaysContent.category)}</p>
            </div>
            
            {/* Right column: Content type icon */}
            <div className="flex flex-col items-end">
              <div className="flex items-end space-x-2 mt-8">
                <div className="bg-primary p-3 rounded-lg">
                  {getContentIcon(todaysContent.content_type)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Card matching HOME page style */}
        <Card className="bg-card p-4 rounded-lg border-0 shadow-none transition-colors duration-300 mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-primary p-3 rounded-sm">
              <Quote className="text-primary-foreground" size={20} />
            </div>
            <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide">
              {todaysContent.title.toUpperCase()}
            </h3>
          </div>
          
          <div className="text-card-foreground text-sm leading-tight mb-4">
            <p className="italic">"{todaysContent.content}"</p>
          </div>

          {todaysContent.author && (
            <div className="text-right text-xs text-muted-foreground mb-4">
              — {todaysContent.author}
            </div>
          )}

          {todaysContent.media_url && (
            <div className="mt-4 mb-4">
              {todaysContent.content_type === 'video' && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={todaysContent.media_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              {todaysContent.content_type === 'audio' && (
                <audio controls className="w-full rounded-lg">
                  <source src={todaysContent.media_url} />
                  Your browser does not support the audio element.
                </audio>
              )}
              {todaysContent.content_type === 'image' && (
                <img
                  src={todaysContent.media_url}
                  alt={todaysContent.title}
                  className="w-full rounded-lg"
                />
              )}
            </div>
          )}
        </Card>

        {/* Action Buttons matching HOME page button style */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleFavorite}
            className={`flex items-center gap-2 font-source font-bold tracking-wide transition-colors duration-300 ${
              isFavorite ? 'bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400' : 'hover:bg-accent'
            }`}
          >
            <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            {isFavorite ? 'FAVORITED' : 'ADD TO FAVORITES'}
          </Button>

          <Button
            variant="outline"
            onClick={handleClose}
            className="flex items-center gap-2 font-source font-bold tracking-wide transition-colors duration-300 hover:bg-accent"
          >
            <SkipForward className="h-4 w-4" />
            SKIP FOR TODAY
          </Button>
          
          <Button 
            onClick={handleClose}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-source font-bold tracking-wide transition-colors duration-300 flex items-center justify-center gap-2"
          >
            START MY DAY
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MotivationalWelcome;