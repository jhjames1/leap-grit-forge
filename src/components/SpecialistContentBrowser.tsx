import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Send, Heart, Target, Lightbulb, Users, Star, Shield, Brain, Activity, Wind, BookOpen, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface ForemanContent {
  id: string;
  title: string;
  content: string;
  content_type: string;
  category: string;
  language: string;
  media_url?: string;
  author?: string;
  mood_targeting: string[];
  recovery_stage: string[];
  trigger_keywords: string[];
  priority: number;
  usage_count: number;
  effectiveness_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SpecialistContentBrowserProps {
  onContentShare: (content: ForemanContent) => Promise<void>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerElement?: React.ReactNode;
}

const categories = [
  { value: 'crisis_support', label: 'Crisis Support', icon: Shield, color: 'bg-red-100 text-red-800' },
  { value: 'daily_motivation', label: 'Daily Motivation', icon: Heart, color: 'bg-pink-100 text-pink-800' },
  { value: 'recovery_education', label: 'Recovery Education', icon: Brain, color: 'bg-blue-100 text-blue-800' },
  { value: 'success_stories', label: 'Success Stories', icon: Star, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'milestone_celebrations', label: 'Milestone Celebrations', icon: Activity, color: 'bg-green-100 text-green-800' },
  { value: 'self_care', label: 'Self Care', icon: Heart, color: 'bg-purple-100 text-purple-800' },
  { value: 'coping_strategies', label: 'Coping Strategies', icon: Target, color: 'bg-indigo-100 text-indigo-800' },
  { value: 'inspiration', label: 'Inspiration', icon: Lightbulb, color: 'bg-orange-100 text-orange-800' },
  { value: 'breathing_exercises', label: 'Breathing Exercises', icon: Wind, color: 'bg-cyan-100 text-cyan-800' }
];

const contentTypeIcons = {
  quote: BookOpen,
  story: Users,
  audio: Activity,
  video: Activity,
  image: Activity,
  article: BookOpen,
  resource: Lightbulb
};

const SpecialistContentBrowser: React.FC<SpecialistContentBrowserProps> = ({
  onContentShare,
  isOpen,
  onOpenChange,
  triggerElement
}) => {
  const [content, setContent] = useState<ForemanContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sharing, setSharing] = useState<string | null>(null);
  const { language } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('foreman_content')
        .select('*')
        .eq('is_active', true)
        .eq('language', language)
        .order('priority', { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = useMemo(() => {
    let filtered = content;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.content.toLowerCase().includes(term) ||
        item.trigger_keywords.some(keyword => keyword.toLowerCase().includes(term)) ||
        item.mood_targeting.some(mood => mood.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [content, selectedCategory, searchTerm]);

  const handleShareContent = async (contentItem: ForemanContent) => {
    try {
      setSharing(contentItem.id);
      await onContentShare(contentItem);
      
      // Track usage
      await supabase
        .from('foreman_content')
        .update({ 
          usage_count: contentItem.usage_count + 1 
        })
        .eq('id', contentItem.id);

      toast({
        title: "Content Shared",
        description: "Content has been sent to the user",
      });
    } catch (error) {
      console.error('Error sharing content:', error);
      toast({
        title: "Error",
        description: "Failed to share content",
        variant: "destructive"
      });
    } finally {
      setSharing(null);
    }
  };

  const getCategoryInfo = (categoryValue: string) => 
    categories.find(cat => cat.value === categoryValue) || categories[0];

  const getContentTypeIcon = (contentType: string) => {
    const IconComponent = contentTypeIcons[contentType as keyof typeof contentTypeIcons] || BookOpen;
    return IconComponent;
  };

  const ContentCard = ({ item }: { item: ForemanContent }) => {
    const categoryInfo = getCategoryInfo(item.category);
    const IconComponent = categoryInfo.icon;
    const TypeIconComponent = getContentTypeIcon(item.content_type);

    return (
      <Card className="border border-border hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium text-foreground truncate">
                {item.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={`text-xs ${categoryInfo.color}`}>
                  <IconComponent className="w-3 h-3 mr-1" />
                  {categoryInfo.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <TypeIconComponent className="w-3 h-3 mr-1" />
                  {item.content_type}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-xs text-muted-foreground line-clamp-3 mb-3">
            {item.content}
          </CardDescription>
          
          {item.trigger_keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.trigger_keywords.slice(0, 3).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {item.trigger_keywords.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.trigger_keywords.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Used {item.usage_count} times
            </div>
            <Button
              size="sm"
              onClick={() => handleShareContent(item)}
              disabled={sharing === item.id}
              className="h-7 px-2 text-xs"
            >
              {sharing === item.id ? (
                <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full mr-1" />
              ) : (
                <Send className="w-3 h-3 mr-1" />
              )}
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const content_jsx = (
    <div className="h-full flex flex-col">
      {/* Search and Filters */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="crisis_support" className="text-xs">Crisis</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-border">
        <ScrollArea className="w-full">
          <div className="flex p-2 space-x-2 overflow-x-auto">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="flex-shrink-0 text-xs"
            >
              All
            </Button>
            {categories.map(category => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className="flex-shrink-0 text-xs"
                >
                  <IconComponent className="w-3 h-3 mr-1" />
                  {category.label.split(' ')[0]}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Content List */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            Loading content...
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No content matches your search.' : 'No content available in this category.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContent.map(item => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  if (triggerElement) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          {triggerElement}
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-left">Content Library</SheetTitle>
            <SheetDescription className="text-left">
              Share helpful content with the user based on their needs
            </SheetDescription>
          </SheetHeader>
          {content_jsx}
        </SheetContent>
      </Sheet>
    );
  }

  return content_jsx;
};

export default SpecialistContentBrowser;