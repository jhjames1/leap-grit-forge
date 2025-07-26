import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScreenshotGallery } from '@/components/ui/screenshot-gallery';
import { Camera, Upload, RefreshCw, Trash2, Plus } from 'lucide-react';
import { ScreenshotCaptureService, AppScreenshot } from '@/services/screenshotService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ScreenshotManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScreenshotManager: React.FC<ScreenshotManagerProps> = ({
  isOpen,
  onClose
}) => {
  const [screenshots, setScreenshots] = useState<AppScreenshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [showCaptureForm, setShowCaptureForm] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [captureForm, setCaptureForm] = useState({
    title: '',
    description: '',
    category: '',
    section: '',
    tags: ''
  });

  const categories = [
    'User Interface',
    'Specialist Portal', 
    'Communication',
    'Tools',
    'Analytics',
    'Settings',
    'Training',
    'Mobile Experience',
    'Documentation'
  ];

  const sections = [
    'user-journey',
    'specialist-portal',
    'demo',
    'specialist-manual',
    'overview',
    'authentication'
  ];

  useEffect(() => {
    if (isOpen) {
      loadScreenshots();
    }
  }, [isOpen]);

  const loadScreenshots = async () => {
    try {
      setLoading(true);
      const data = await ScreenshotCaptureService.getScreenshots();
      setScreenshots(data);
    } catch (error) {
      console.error('Failed to load screenshots:', error);
      toast({
        title: "Error",
        description: "Failed to load screenshots",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureCurrentPage = async () => {
    if (!captureForm.title || !captureForm.category || !captureForm.section) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, category, and section",
        variant: "destructive"
      });
      return;
    }

    try {
      setCapturing(true);
      const tags = captureForm.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      await ScreenshotCaptureService.captureCurrentPage(
        captureForm.title,
        captureForm.description,
        captureForm.category,
        captureForm.section,
        tags
      );

      toast({
        title: "Screenshot Captured",
        description: "Page screenshot has been saved successfully"
      });

      setShowCaptureForm(false);
      setCaptureForm({ title: '', description: '', category: '', section: '', tags: '' });
      loadScreenshots();
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture screenshot. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCapturing(false);
    }
  };

  const handleBulkCapture = async () => {
    if (!confirm('This will capture screenshots of multiple routes. Continue?')) return;

    try {
      setCapturing(true);
      await ScreenshotCaptureService.bulkCaptureRoutes();
      
      toast({
        title: "Bulk Capture Complete",
        description: "Screenshots have been captured for all main routes"
      });
      
      loadScreenshots();
    } catch (error) {
      console.error('Failed to bulk capture:', error);
      toast({
        title: "Bulk Capture Failed",
        description: "Some screenshots may not have been captured",
        variant: "destructive"
      });
    } finally {
      setCapturing(false);
    }
  };

  const handleDeleteScreenshot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this screenshot?')) return;

    try {
      await ScreenshotCaptureService.deleteScreenshot(id);
      toast({
        title: "Screenshot Deleted",
        description: "Screenshot has been removed"
      });
      loadScreenshots();
    } catch (error) {
      console.error('Failed to delete screenshot:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete screenshot",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Screenshot Manager
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowCaptureForm(true)}
              disabled={capturing}
            >
              <Plus className="w-4 h-4 mr-2" />
              Capture Current Page
            </Button>
            
            <Button
              onClick={handleBulkCapture}
              disabled={capturing}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Bulk Capture Routes
            </Button>

            <Button
              onClick={loadScreenshots}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Capture Form */}
          {showCaptureForm && (
            <Card>
              <CardHeader>
                <CardTitle>Capture Current Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Screenshot title"
                    value={captureForm.title}
                    onChange={(e) => setCaptureForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Select
                    value={captureForm.category}
                    onValueChange={(value) => setCaptureForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={captureForm.section}
                    onValueChange={(value) => setCaptureForm(prev => ({ ...prev, section: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map(section => (
                        <SelectItem key={section} value={section}>{section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Tags (comma separated)"
                    value={captureForm.tags}
                    onChange={(e) => setCaptureForm(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>

                <Textarea
                  placeholder="Description (optional)"
                  value={captureForm.description}
                  onChange={(e) => setCaptureForm(prev => ({ ...prev, description: e.target.value }))}
                />

                <div className="flex gap-2">
                  <Button
                    onClick={handleCaptureCurrentPage}
                    disabled={capturing}
                  >
                    {capturing ? 'Capturing...' : 'Capture Screenshot'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCaptureForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Screenshots Display */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Captured Screenshots ({screenshots.length})
              </h3>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading screenshots...</p>
              </div>
            ) : screenshots.length === 0 ? (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No screenshots captured yet</p>
                <p className="text-sm text-muted-foreground">Capture your first screenshot to get started</p>
              </div>
            ) : (
              <ScreenshotGallery 
                screenshots={screenshots}
                columns={3}
                maxHeight="400px"
                showCategories={true}
                showDeviceIcons={true}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};