import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Heart, Target, Lightbulb, Users, Star, Shield, Brain, Activity, Wind, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ForemanContent {
  id: string;
  title: string;
  content: string;
  content_type: string;
  category: string;
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

const contentTypes = [
  { value: 'quote', label: 'Quote' },
  { value: 'story', label: 'Success Story' },
  { value: 'audio', label: 'Audio Clip' },
  { value: 'video', label: 'Video' },
  { value: 'image', label: 'Image' },
  { value: 'article', label: 'Article' },
  { value: 'resource', label: 'External Resource' }
];

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

const moodOptions = ['hopeful', 'anxious', 'determined', 'struggling', 'proud', 'lonely', 'confident', 'overwhelmed', 'grateful', 'frustrated', 'peaceful', 'crisis', 'desperate'];
const recoveryStageOptions = ['early', 'maintenance', 'relapse_prevention'];

const ForemanContentManagement = () => {
  const [content, setContent] = useState<ForemanContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ForemanContent | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    content_type: 'quote',
    category: 'daily_motivation',
    media_url: '',
    author: '',
    mood_targeting: [] as string[],
    recovery_stage: [] as string[],
    trigger_keywords: [] as string[],
    priority: 5,
    is_active: true
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('foreman_content')
        .select('*')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const triggerKeywordsArray = Array.isArray(formData.trigger_keywords) 
        ? formData.trigger_keywords
        : String(formData.trigger_keywords).split(',').map(k => k.trim()).filter(k => k);

      const submitData = {
        ...formData,
        trigger_keywords: triggerKeywordsArray
      };

      if (editingContent) {
        const { error } = await supabase
          .from('foreman_content')
          .update(submitData)
          .eq('id', editingContent.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Content updated successfully" });
      } else {
        const { error } = await supabase
          .from('foreman_content')
          .insert([submitData]);
        
        if (error) throw error;
        toast({ title: "Success", description: "Content created successfully" });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchContent();
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error",
        description: "Failed to save content",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item: ForemanContent) => {
    setEditingContent(item);
    setFormData({
      title: item.title,
      content: item.content,
      content_type: item.content_type,
      category: item.category,
      media_url: item.media_url || '',
      author: item.author || '',
      mood_targeting: item.mood_targeting,
      recovery_stage: item.recovery_stage,
      trigger_keywords: item.trigger_keywords,
      priority: item.priority,
      is_active: item.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('foreman_content')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Success", description: "Content deleted successfully" });
      fetchContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive"
      });
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be under 50MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `audio-content/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audio-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-content')
        .getPublicUrl(filePath);

      setFormData({ ...formData, media_url: publicUrl });
      
      toast({
        title: "Success",
        description: "Audio file uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({
        title: "Error",
        description: "Failed to upload audio file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setEditingContent(null);
    setFormData({
      title: '',
      content: '',
      content_type: 'quote',
      category: 'daily_motivation',
      media_url: '',
      author: '',
      mood_targeting: [],
      recovery_stage: [],
      trigger_keywords: [],
      priority: 5,
      is_active: true
    });
  };

  const filteredContent = selectedCategory === 'all' 
    ? content 
    : content.filter(item => item.category === selectedCategory);

  const getCategoryInfo = (categoryValue: string) => 
    categories.find(cat => cat.value === categoryValue) || categories[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Foreman Content Management</h2>
          <p className="text-muted-foreground">Manage user-facing content that the Foreman AI will share during conversations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContent ? 'Edit Content' : 'Add New Content'}
              </DialogTitle>
              <DialogDescription>
                Create content that the Foreman will share with users based on their conversation and emotional state.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority (1-10)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="content_type">Content Type</Label>
                  <Select 
                    value={formData.content_type} 
                    onValueChange={(value) => setFormData({...formData, content_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="media_url">Media URL (optional)</Label>
                  <Input
                    id="media_url"
                    value={formData.media_url}
                    onChange={(e) => setFormData({...formData, media_url: e.target.value})}
                    placeholder="https://..."
                  />
                  {formData.content_type === 'video' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 YouTube videos will be embedded inline. Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="author">Author (optional)</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                  />
                </div>
              </div>

              {/* Audio File Upload for Breathing Exercises */}
              {formData.content_type === 'audio' && formData.category === 'breathing_exercises' && (
                <div>
                  <Label htmlFor="audio_file">Upload Audio File</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-4">
                    <Input
                      id="audio_file"
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload audio files (MP3, WAV, OGG, M4A) up to 50MB for breathing exercises.
                      Use titles like "Background Sound - Ocean Waves" or "Voice Guidance - Deep Breathing".
                    </p>
                    {uploading && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span className="text-sm">Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="trigger_keywords">Trigger Keywords (comma-separated)</Label>
                <Input
                  id="trigger_keywords"
                  value={Array.isArray(formData.trigger_keywords) ? formData.trigger_keywords.join(', ') : formData.trigger_keywords}
                  onChange={(e) => setFormData({...formData, trigger_keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)})}
                  placeholder="motivation, help, crisis, anniversary..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingContent ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category.value} value={category.value} className="text-xs">
              {category.label.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading content...</div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No content found for this category
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredContent.map((item) => {
                const categoryInfo = getCategoryInfo(item.category);
                const Icon = categoryInfo.icon;
                
                return (
                  <Card key={item.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-5 h-5 text-primary" />
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <Badge className={categoryInfo.color}>
                            {categoryInfo.label}
                          </Badge>
                          <Badge variant="outline">
                            Priority: {item.priority}
                          </Badge>
                          {!item.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {item.content}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <div>
                          <span className="font-medium">Type:</span> {item.content_type}
                        </div>
                        {item.author && (
                          <div>
                            <span className="font-medium">Author:</span> {item.author}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Used:</span> {item.usage_count} times
                        </div>
                        <div>
                          <span className="font-medium">Score:</span> {item.effectiveness_score}/10
                        </div>
                      </div>
                      {item.trigger_keywords.length > 0 && (
                        <div className="mt-2">
                          <span className="font-medium text-xs">Keywords:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.trigger_keywords.map((keyword, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ForemanContentManagement;