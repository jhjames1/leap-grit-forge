import React, { useState, useEffect } from 'react';
import { ScreenshotGallery, Screenshot } from '@/components/ui/screenshot-gallery';
import { ScreenshotCaptureService, AppScreenshot } from '@/services/screenshotService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RealScreenshotGalleryProps {
  section?: string;
  category?: string;
  columns?: number;
  maxHeight?: string;
  showCategories?: boolean;
  showDeviceIcons?: boolean;
}

export const RealScreenshotGallery: React.FC<RealScreenshotGalleryProps> = ({
  section,
  category,
  columns = 3,
  maxHeight = "400px",
  showCategories = true,
  showDeviceIcons = true
}) => {
  const [screenshots, setScreenshots] = useState<AppScreenshot[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadScreenshots();
  }, [section, category]);

  const loadScreenshots = async () => {
    try {
      setLoading(true);
      let data = await ScreenshotCaptureService.getScreenshots(section);
      
      // Filter by category if specified
      if (category) {
        data = data.filter(s => s.category === category);
      }
      
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading screenshots...</p>
      </div>
    );
  }

  if (screenshots.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Screenshots Available</h3>
          <p className="text-muted-foreground mb-4">
            Screenshots of the actual application interface will appear here once captured.
          </p>
          <Button onClick={loadScreenshots} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Check for Updates
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScreenshotGallery
      screenshots={screenshots}
      columns={columns}
      maxHeight={maxHeight}
      showCategories={showCategories}
      showDeviceIcons={showDeviceIcons}
    />
  );
};