import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, BookOpen, Heart, Lightbulb, Wrench } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SavedWisdomManager, SavedWisdomEntry } from '@/utils/savedWisdom';
import { useUserData } from '@/hooks/useUserData';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

interface SavedWisdomProps {
  onBack: () => void;
}

export const SavedWisdom: React.FC<SavedWisdomProps> = ({ onBack }) => {
  const { currentUser } = useUserData();
  const { t } = useLanguage();
  const [savedWisdom, setSavedWisdom] = useState<SavedWisdomEntry[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    if (currentUser) {
      loadSavedWisdom();
    }
  }, [currentUser]);

  const loadSavedWisdom = () => {
    if (!currentUser) return;
    const wisdom = SavedWisdomManager.getSavedWisdom(currentUser);
    setSavedWisdom(wisdom);
  };

  const handleRemoveWisdom = (id: string) => {
    if (SavedWisdomManager.removeWisdom(id)) {
      loadSavedWisdom();
    }
  };

  const getCategoryIcon = (category?: SavedWisdomEntry['category']) => {
    switch (category) {
      case 'affirmation': return <Heart className="h-4 w-4" />;
      case 'story': return <BookOpen className="h-4 w-4" />;
      case 'tool-suggestion': return <Wrench className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category?: SavedWisdomEntry['category']) => {
    switch (category) {
      case 'affirmation': return 'bg-pink-500';
      case 'story': return 'bg-blue-500';
      case 'tool-suggestion': return 'bg-green-500';
      default: return 'bg-purple-500';
    }
  };

  const filteredWisdom = activeCategory === 'all' 
    ? savedWisdom 
    : savedWisdom.filter(entry => entry.category === activeCategory);

  const categories = ['all', 'affirmation', 'guidance', 'story', 'tool-suggestion'] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b z-10">
        <div className="flex items-center p-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-fjalla font-bold text-xl text-foreground">
              {t('toolbox.savedWisdom.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('toolbox.savedWisdom.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            {categories.map((category) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="text-xs"
              >
                {t(`toolbox.savedWisdom.categories.${category}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="space-y-4">
            {filteredWisdom.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('toolbox.savedWisdom.empty')}</p>
                </div>
              </Card>
            ) : (
              filteredWisdom.map((entry) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-full ${getCategoryColor(entry.category)} text-white`}>
                        {getCategoryIcon(entry.category)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {t(`toolbox.savedWisdom.categories.${entry.category || 'guidance'}`)}
                      </Badge>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('toolbox.savedWisdom.confirmRemove')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleRemoveWisdom(entry.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {t('toolbox.savedWisdom.remove')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  
                  <p className="text-foreground mb-3 leading-relaxed">
                    "{entry.text}"
                  </p>
                  
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.timestamp), 'MMM d, yyyy • h:mm a')}
                  </p>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};