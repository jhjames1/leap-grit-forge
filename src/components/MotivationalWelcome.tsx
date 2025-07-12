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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-red-500" />
            Today's Inspiration
          </DialogTitle>
        </DialogHeader>

        <Card className="border-none shadow-none">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getContentIcon(todaysContent.content_type)}
                <h3 className="text-xl font-semibold">{todaysContent.title}</h3>
              </div>
              <Badge className={getCategoryColor(todaysContent.category)}>
                {formatCategoryName(todaysContent.category)}
              </Badge>
            </div>

            <div className="relative">
              <div className="text-lg leading-relaxed text-muted-foreground italic">
                "{todaysContent.content}"
              </div>
              <div className="absolute -top-2 -left-2">
                <Quote className="h-6 w-6 text-primary/20" />
              </div>
            </div>

            {todaysContent.author && (
              <div className="text-right text-sm text-muted-foreground">
                — {todaysContent.author}
              </div>
            )}

            {todaysContent.media_url && (
              <div className="mt-4">
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
                  <audio controls className="w-full">
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

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleToggleFavorite}
                className={`flex items-center gap-2 ${
                  isFavorite ? 'text-red-500 border-red-200' : ''
                }`}
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Favorited' : 'Add to Favorites'}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex items-center gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  Skip for Today
                </Button>
                <Button onClick={handleClose}>
                  Start My Day
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default MotivationalWelcome;