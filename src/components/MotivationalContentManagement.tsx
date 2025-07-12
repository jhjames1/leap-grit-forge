import { useState, useEffect, FormEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Quote, 
  Play, 
  Image, 
  Heart,
  Calendar,
  User,
  Trophy,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MotivationalContent {
  id: string;
  title: string;
  content: string;
  content_type: 'quote' | 'video' | 'audio' | 'image';
  category: 'daily_inspiration' | 'success_stories' | 'professional_tips' | 'self_care';
  media_url?: string;
  author?: string;
  is_active: boolean;
  created_at: string;
}

const MotivationalContentManagement = () => {
  const [contents, setContents] = useState<MotivationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<MotivationalContent | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    content_type: 'quote' as 'quote' | 'video' | 'audio' | 'image',
    category: 'daily_inspiration' as 'daily_inspiration' | 'success_stories' | 'professional_tips' | 'self_care',
    media_url: '',
    author: '',
    is_active: true
  });

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('specialist_motivational_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure proper typing
      const typedData = (data || []).map(item => ({
        ...item,
        content_type: item.content_type as 'quote' | 'video' | 'audio' | 'image',
        category: item.category as 'daily_inspiration' | 'success_stories' | 'professional_tips' | 'self_care'
      }));
      
      setContents(typedData);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      content_type: 'quote',
      category: 'daily_inspiration',
      media_url: '',
      author: '',
      is_active: true
    });
    setEditingContent(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingContent) {
        // Update existing content
        const { error } = await supabase
          .from('specialist_motivational_content')
          .update({
            title: formData.title,
            content: formData.content,
            content_type: formData.content_type,
            category: formData.category,
            media_url: formData.media_url || null,
            author: formData.author || null,
            is_active: formData.is_active
          })
          .eq('id', editingContent.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Content updated successfully"
        });
      } else {
        // Add new content
        const { error } = await supabase
          .from('specialist_motivational_content')
          .insert({
            title: formData.title,
            content: formData.content,
            content_type: formData.content_type,
            category: formData.category,
            media_url: formData.media_url || null,
            author: formData.author || null,
            is_active: formData.is_active
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Content added successfully"
        });
      }

      fetchContents();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error",
        description: "Failed to save content",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (content: MotivationalContent) => {
    setFormData({
      title: content.title,
      content: content.content,
      content_type: content.content_type,
      category: content.category,
      media_url: content.media_url || '',
      author: content.author || '',
      is_active: content.is_active
    });
    setEditingContent(content);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const { error } = await supabase
        .from('specialist_motivational_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Content deleted successfully"
      });
      
      fetchContents();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('specialist_motivational_content')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      fetchContents();
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'quote': return <Quote className="h-4 w-4" />;
      case 'video': return <Play className="h-4 w-4" />;
      case 'audio': return <Play className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      default: return <Quote className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'daily_inspiration': return <Sparkles className="h-4 w-4" />;
      case 'success_stories': return <Trophy className="h-4 w-4" />;
      case 'professional_tips': return <User className="h-4 w-4" />;
      case 'self_care': return <Heart className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'daily_inspiration': return 'Daily Inspiration';
      case 'success_stories': return 'Success Stories';
      case 'professional_tips': return 'Professional Tips';
      case 'self_care': return 'Self Care';
      default: return category;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-fjalla tracking-wide">
            MOTIVATIONAL CONTENT
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage daily inspiration content for peer specialists
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-source font-bold tracking-wide">
              <Plus className="h-4 w-4 mr-2" />
              ADD CONTENT
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingContent ? 'Edit Content' : 'Add New Content'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="author">Author (Optional)</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="content_type">Content Type</Label>
                  <Select 
                    value={formData.content_type} 
                    onValueChange={(value: 'quote' | 'video' | 'audio' | 'image') => 
                      setFormData({ ...formData, content_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quote">Quote</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: 'daily_inspiration' | 'success_stories' | 'professional_tips' | 'self_care') => 
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily_inspiration">Daily Inspiration</SelectItem>
                      <SelectItem value="success_stories">Success Stories</SelectItem>
                      <SelectItem value="professional_tips">Professional Tips</SelectItem>
                      <SelectItem value="self_care">Self Care</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              {(formData.content_type === 'video' || formData.content_type === 'audio' || formData.content_type === 'image') && (
                <div>
                  <Label htmlFor="media_url">Media URL</Label>
                  <Input
                    id="media_url"
                    type="url"
                    value={formData.media_url}
                    onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  {editingContent ? 'Update' : 'Add'} Content
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content Grid */}
      <div className="grid gap-4">
        {contents.map((content) => (
          <Card key={content.id} className="bg-card p-4 border-0 shadow-none">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getContentIcon(content.content_type)}
                    <h3 className="font-fjalla font-bold text-card-foreground text-base">
                      {content.title}
                    </h3>
                  </div>
                  <Badge className={getCategoryColor(content.category)}>
                    <div className="flex items-center gap-1">
                      {getCategoryIcon(content.category)}
                      {getCategoryLabel(content.category)}
                    </div>
                  </Badge>
                  {!content.is_active && (
                    <Badge variant="secondary" className="text-muted-foreground">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {content.content}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {content.author && (
                    <span>By {content.author}</span>
                  )}
                  <span>
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {new Date(content.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleActive(content.id, content.is_active)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {content.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(content)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(content.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {contents.length === 0 && (
        <Card className="bg-card p-8 text-center border-0 shadow-none">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            No Content Yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Start adding motivational content for your peer specialists
          </p>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Content
          </Button>
        </Card>
      )}
    </div>
  );
};

export default MotivationalContentManagement;