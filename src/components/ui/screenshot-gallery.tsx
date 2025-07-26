import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ZoomIn, X, ChevronLeft, ChevronRight, Monitor, Smartphone, Tablet } from 'lucide-react';

export interface Screenshot {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  section?: string;
  tags?: string[];
}

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
  columns?: number;
  showCategories?: boolean;
  showDeviceIcons?: boolean;
  maxHeight?: string;
}

export const ScreenshotGallery: React.FC<ScreenshotGalleryProps> = ({
  screenshots,
  columns = 3,
  showCategories = true,
  showDeviceIcons = true,
  maxHeight = "400px"
}) => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const categories = ['all', ...new Set(screenshots.map(s => s.category).filter(Boolean))];
  
  const filteredScreenshots = selectedCategory === 'all' 
    ? screenshots 
    : screenshots.filter(s => s.category === selectedCategory);

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-3 h-3" />;
      case 'tablet': return <Tablet className="w-3 h-3" />;
      default: return <Monitor className="w-3 h-3" />;
    }
  };

  const handleNext = () => {
    if (!selectedScreenshot) return;
    const currentIndex = filteredScreenshots.findIndex(s => s.id === selectedScreenshot.id);
    const nextIndex = (currentIndex + 1) % filteredScreenshots.length;
    setSelectedScreenshot(filteredScreenshots[nextIndex]);
  };

  const handlePrevious = () => {
    if (!selectedScreenshot) return;
    const currentIndex = filteredScreenshots.findIndex(s => s.id === selectedScreenshot.id);
    const prevIndex = currentIndex === 0 ? filteredScreenshots.length - 1 : currentIndex - 1;
    setSelectedScreenshot(filteredScreenshots[prevIndex]);
  };

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      {showCategories && categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All Screenshots' : category}
            </Button>
          ))}
        </div>
      )}

      {/* Screenshot Grid */}
      <div 
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-4`}
        style={{ maxHeight, overflowY: 'auto' }}
      >
        {filteredScreenshots.map((screenshot) => (
          <Card 
            key={screenshot.id}
            className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
            onClick={() => setSelectedScreenshot(screenshot)}
          >
            <div className="relative">
              <img
                src={screenshot.imageUrl}
                alt={screenshot.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>

              {/* Device Type Badge */}
              {showDeviceIcons && screenshot.deviceType && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 right-2 flex items-center gap-1"
                >
                  {getDeviceIcon(screenshot.deviceType)}
                  {screenshot.deviceType}
                </Badge>
              )}
            </div>
            
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-1 line-clamp-1">{screenshot.title}</h4>
              {screenshot.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{screenshot.description}</p>
              )}
              
              {/* Tags */}
              {screenshot.tags && screenshot.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {screenshot.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {screenshot.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{screenshot.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {showDeviceIcons && selectedScreenshot?.deviceType && getDeviceIcon(selectedScreenshot.deviceType)}
                {selectedScreenshot?.title}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {filteredScreenshots.length > 1 && (
                  <>
                    <Button variant="outline" size="sm" onClick={handlePrevious}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNext}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelectedScreenshot(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {selectedScreenshot && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedScreenshot.imageUrl}
                  alt={selectedScreenshot.title}
                  className="w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>
              
              {selectedScreenshot.description && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">{selectedScreenshot.description}</p>
                </div>
              )}
              
              {selectedScreenshot.tags && selectedScreenshot.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedScreenshot.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};