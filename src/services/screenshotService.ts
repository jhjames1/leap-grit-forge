import { supabase } from '@/integrations/supabase/client';

export interface AppScreenshot {
  id: string;
  title: string;
  description?: string;
  route: string;
  imageUrl: string;
  category: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  section: string;
  tags: string[];
  capturedAt: string;
  isActive: boolean;
}

export class ScreenshotCaptureService {
  private static async uploadScreenshot(blob: Blob, filename: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('app-screenshots')
      .upload(`screenshots/${filename}`, blob, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('app-screenshots')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  static async captureCurrentPage(
    title: string,
    description: string,
    category: string,
    section: string,
    tags: string[] = []
  ): Promise<AppScreenshot> {
    try {
      // Use html2canvas to capture the current page
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(document.body, {
        height: window.innerHeight,
        width: window.innerWidth,
        useCORS: true,
        allowTaint: true,
        scale: 0.8, // Reduce file size
        logging: false
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png', 0.8);
      });

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const route = window.location.pathname;
      const filename = `${route.replace(/\//g, '_')}_${timestamp}.png`;

      // Upload to Supabase Storage
      const imageUrl = await this.uploadScreenshot(blob, filename);

      // Save metadata to database
      const screenshot: Omit<AppScreenshot, 'id'> = {
        title,
        description,
        route,
        imageUrl,
        category,
        deviceType: window.innerWidth < 768 ? 'mobile' : 
                   window.innerWidth < 1024 ? 'tablet' : 'desktop',
        section,
        tags,
        capturedAt: new Date().toISOString(),
        isActive: true
      };

      const { data, error } = await supabase
        .from('app_screenshots')
        .insert([{
          title,
          description,
          route,
          image_url: imageUrl,
          category,
          device_type: screenshot.deviceType,
          section,
          tags,
          captured_at: screenshot.capturedAt,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        route: data.route,
        imageUrl: data.image_url,
        category: data.category,
        deviceType: data.device_type,
        section: data.section,
        tags: data.tags || [],
        capturedAt: data.captured_at,
        isActive: data.is_active
      } as AppScreenshot;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      throw error;
    }
  }

  static async captureRoute(route: string, options: {
    title: string;
    description?: string;
    category: string;
    section: string;
    tags?: string[];
    deviceType?: 'desktop' | 'mobile' | 'tablet';
  }): Promise<void> {
    // Navigate to route and capture
    const currentRoute = window.location.pathname;
    
    if (currentRoute !== route) {
      window.history.pushState({}, '', route);
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await this.captureCurrentPage(
      options.title,
      options.description || '',
      options.category,
      options.section,
      options.tags || []
    );
  }

  static async getScreenshots(section?: string): Promise<AppScreenshot[]> {
    let query = supabase
      .from('app_screenshots')
      .select('*')
      .eq('is_active', true)
      .order('captured_at', { ascending: false });

    if (section) {
      query = query.eq('section', section);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Transform database format to interface format
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      route: item.route,
      imageUrl: item.image_url,
      category: item.category,
      deviceType: item.device_type as 'desktop' | 'mobile' | 'tablet',
      section: item.section,
      tags: item.tags || [],
      capturedAt: item.captured_at,
      isActive: item.is_active
    }));
  }

  static async deleteScreenshot(id: string): Promise<void> {
    const { error } = await supabase
      .from('app_screenshots')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  static async bulkCaptureRoutes(): Promise<void> {
    const routes = [
      {
        route: '/',
        title: 'User Dashboard',
        description: 'Main user dashboard with recovery progress and tools',
        category: 'User Interface',
        section: 'user-journey',
        tags: ['dashboard', 'user', 'overview']
      },
      {
        route: '/specialist',
        title: 'Specialist Portal',
        description: 'Specialist dashboard with active sessions and metrics',
        category: 'Specialist Portal',
        section: 'specialist-portal',
        tags: ['specialist', 'dashboard', 'portal']
      },
      {
        route: '/demo',
        title: 'Interactive Demo',
        description: 'Demo page showcasing platform capabilities',
        category: 'Demo',
        section: 'demo',
        tags: ['demo', 'showcase', 'features']
      },
      {
        route: '/specialist-manual',
        title: 'Specialist Manual',
        description: 'Training manual for peer support specialists',
        category: 'Documentation',
        section: 'specialist-manual',
        tags: ['manual', 'training', 'documentation']
      }
    ];

    for (const routeConfig of routes) {
      try {
        await this.captureRoute(routeConfig.route, routeConfig);
        // Wait between captures
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Failed to capture ${routeConfig.route}:`, error);
      }
    }
  }
}