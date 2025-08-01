import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RealScreenshotGallery } from '@/components/RealScreenshotGallery';
import { AlertCircle, BookOpen, Download, FileText, Search, Camera, Loader2 } from 'lucide-react';
import { useManualContent } from '@/hooks/useManualContent';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

const DynamicSpecialistManual = () => {
  const { sections, content, loading, error } = useManualContent();
  const [activeSection, setActiveSection] = useState('overview');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      toast({
        title: "Generating PDF",
        description: "Creating comprehensive manual with screenshots...",
      });

      await PDFGenerator.generateManualPDF(sections, content, true);
      
      toast({
        title: "PDF Ready",
        description: "Your manual PDF is ready for download",
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading manual content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Error Loading Manual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeSectionData = sections.find(s => s.title === activeSection);
  const sectionContent = activeSectionData ? content[activeSectionData.id] || [] : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Peer Support Specialist Training Manual
          </h1>
          <p className="text-xl text-muted-foreground">
            Complete guide to using the LEAP Peer Support Specialist Portal
          </p>
          <div className="flex gap-4 mt-4">
            <Button variant="outline" size="sm">
              <Search className="w-4 h-4 mr-2" />
              Search Manual
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Print Version
            </Button>
          </div>
          <Badge variant="secondary" className="mt-2">
            Dynamic Content - Auto-updated
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="p-4 space-y-2">
                    {sections.map((section) => (
                      <Button
                        key={section.id}
                        variant={activeSection === section.title ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveSection(section.title)}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        {section.title.charAt(0).toUpperCase() + section.title.slice(1).replace('-', ' ')}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {activeSectionData?.title.charAt(0).toUpperCase() + activeSectionData?.title.slice(1).replace('-', ' ')}
                </CardTitle>
                {activeSectionData?.description && (
                  <CardDescription>{activeSectionData.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="content" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="screenshots" className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Screenshots
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="mt-4">
                    <ScrollArea className="h-[600px] pr-4">
                      {sectionContent.length > 0 ? (
                        <div className="space-y-6">
                          {sectionContent.map((item) => (
                            <div key={item.id} className="prose max-w-none">
                              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                              <div 
                                className="text-muted-foreground"
                                dangerouslySetInnerHTML={{ __html: item.content }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Content Coming Soon</h3>
                          <p className="text-muted-foreground">
                            This section is being automatically updated. Content will appear here once available.
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="screenshots" className="mt-4">
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground mb-4">
                          Visual guides and screenshots to help you navigate the specialist portal effectively.
                        </div>
                        <RealScreenshotGallery 
                          section={activeSection === 'overview' ? undefined : activeSection}
                          columns={2}
                          maxHeight="550px"
                          showCategories={true}
                          showDeviceIcons={true}
                        />
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicSpecialistManual;