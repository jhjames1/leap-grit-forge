import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Quote, 
  Play, 
  Image, 
  Calendar, 
  Star,
  X,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FavoriteContent {
  id: string;
  content_id: string;
  viewed_at: string;
  is_favorite: boolean;
  content: {
    id: string;
    title: string;
    content: string;
    content_type: 'quote' | 'video' | 'audio' | 'image';
    category: 'daily_inspiration' | 'success_stories' | 'professional_tips' | 'self_care';
    media_url?: string;
    author?: string;
    created_at: string;
  };
}

interface SpecialistFavoritesProps {
  specialistId: string;
  isOpen: boolean;
  onClose: () => void;
}

const SpecialistFavorites: React.FC<SpecialistFavoritesProps> = ({
  specialistId,
  isOpen,
  onClose
}) => {
  const [favorites, setFavorites] = useState<FavoriteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && specialistId) {
      fetchFavorites();
    }
  }, [isOpen, specialistId]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('specialist_content_views')
        .select(`
          id,
          content_id,
          viewed_at,
          is_favorite,
          content:specialist_motivational_content(
            id,
            title,
            content,
            content_type,
            category,
            media_url,
            author,
            created_at
          )
        `)
        .eq('specialist_id', specialistId)
        .eq('is_favorite', true)
        .order('viewed_at', { ascending: false });

      if (error) throw error;
      
      // Filter out any entries where content is null (content might have been deleted)
      const validFavorites = (data || []).filter(item => item.content) as FavoriteContent[];
      setFavorites(validFavorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "Error",
        description: "Failed to load favorites",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('specialist_content_views')
        .update({ is_favorite: false })
        .eq('specialist_id', specialistId)
        .eq('content_id', contentId);

      if (error) throw error;
      
      setFavorites(prev => prev.filter(fav => fav.content_id !== contentId));
      
      toast({
        title: "Success",
        description: "Removed from favorites"
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: "Error",
        description: "Failed to remove favorite",
        variant: "destructive"
      });
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'quote': return <Quote className="h-5 w-5" />;
      case 'video': return <Play className="h-5 w-5" />;
      case 'audio': return <Play className="h-5 w-5" />;
      case 'image': return <Image className="h-5 w-5" />;
      default: return <Quote className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'daily_inspiration': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'success_stories': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'professional_tips': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'self_care': return 'bg-pink-500/10 text-pink-700 border-pink-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const formatCategoryName = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background">
        {/* Header matching HOME page style */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-6">
            {/* Left column: Title */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-1 tracking-wide">
                <span className="font-oswald font-extralight tracking-tight">YOUR</span>
                <span className="font-fjalla font-extrabold italic ml-2">FAVORITES</span>
              </h1>
              <div className="mt-4"></div>
              <p className="text-muted-foreground text-sm">
                Your collection of saved motivational content
              </p>
            </div>
            
            {/* Right column: Heart icon */}
            <div className="flex flex-col items-end">
              <div className="flex items-end space-x-2 mt-8">
                <div className="bg-primary p-3 rounded-lg">
                  <Heart className="text-primary-foreground fill-current" size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading your favorites...</div>
          </div>
        ) : favorites.length === 0 ? (
          <Card className="bg-card p-8 text-center border-0 shadow-none">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              No Favorites Yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start favoriting content from your daily inspiration to see them here
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="bg-card border-0 shadow-none transition-colors duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      {getContentIcon(favorite.content.content_type)}
                      <h3 className="font-fjalla font-bold text-card-foreground text-base uppercase tracking-wide">
                        {favorite.content.title}
                      </h3>
                      <Badge className={getCategoryColor(favorite.content.category)}>
                        {formatCategoryName(favorite.content.category)}
                      </Badge>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFavorite(favorite.content_id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-card-foreground text-sm leading-tight mb-4">
                    <p className="italic">"{favorite.content.content}"</p>
                  </div>

                  {favorite.content.author && (
                    <div className="text-right text-xs text-muted-foreground mb-4">
                      — {favorite.content.author}
                    </div>
                  )}

                  {favorite.content.media_url && (
                    <div className="mt-4 mb-4">
                      {favorite.content.content_type === 'video' && (
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <iframe
                            src={favorite.content.media_url}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                      {favorite.content.content_type === 'audio' && (
                        <audio controls className="w-full rounded-lg">
                          <source src={favorite.content.media_url} />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                      {favorite.content.content_type === 'image' && (
                        <img
                          src={favorite.content.media_url}
                          alt={favorite.content.title}
                          className="w-full rounded-lg"
                        />
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Favorited on {new Date(favorite.viewed_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-xs font-medium">Favorite</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-center pt-4 border-t border-border">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpecialistFavorites;