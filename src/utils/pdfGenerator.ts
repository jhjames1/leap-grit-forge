import { ScreenshotCaptureService, AppScreenshot } from '@/services/screenshotService';

export interface ManualSection {
  id: string;
  title: string;
  description?: string;
}

export interface ManualContent {
  id: string;
  title: string;
  content: string;
}

export class PDFGenerator {
  static async generateManualPDF(
    sections: ManualSection[],
    content: Record<string, ManualContent[]>,
    includeScreenshots: boolean = true
  ): Promise<void> {
    try {
      // Create a new window/iframe for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window');
      }

      let htmlContent = this.generatePDFHeader();
      
      // Generate table of contents
      htmlContent += this.generateTableOfContents(sections);
      
      // Generate content for each section
      for (const section of sections) {
        const sectionContent = content[section.id] || [];
        let screenshots: AppScreenshot[] = [];
        
        if (includeScreenshots) {
          try {
            screenshots = await ScreenshotCaptureService.getScreenshots(section.title);
          } catch (error) {
            console.warn(`Failed to load screenshots for section ${section.title}:`, error);
          }
        }
        
        htmlContent += this.generateSectionContent(section, sectionContent, screenshots);
      }
      
      htmlContent += this.generatePDFFooter();
      
      // Write content to print window
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for images to load before printing
      await this.waitForImagesToLoad(printWindow.document);
      
      // Trigger print dialog
      printWindow.focus();
      printWindow.print();
      
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw error;
    }
  }

  private static generatePDFHeader(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>LEAP Peer Support Specialist Training Manual</title>
        <style>
          @page {
            margin: 1in;
            size: letter;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
          }
          
          .header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e5e5e5;
          }
          
          .title {
            font-size: 2.5rem;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 0.5rem;
          }
          
          .subtitle {
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 1rem;
          }
          
          .badge {
            display: inline-block;
            background: #f3f4f6;
            color: #374151;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
          }
          
          .toc {
            page-break-after: always;
            margin-bottom: 2rem;
          }
          
          .toc h2 {
            font-size: 1.8rem;
            color: #2563eb;
            margin-bottom: 1rem;
          }
          
          .toc ul {
            list-style: none;
            padding: 0;
          }
          
          .toc li {
            padding: 0.5rem 0;
            border-bottom: 1px dotted #ccc;
          }
          
          .section {
            page-break-before: always;
            margin-bottom: 2rem;
          }
          
          .section:first-of-type {
            page-break-before: auto;
          }
          
          .section-title {
            font-size: 2rem;
            color: #2563eb;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e5e5e5;
          }
          
          .section-description {
            font-style: italic;
            color: #666;
            margin-bottom: 1.5rem;
          }
          
          .content-item {
            margin-bottom: 2rem;
          }
          
          .content-title {
            font-size: 1.4rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #374151;
          }
          
          .content-text {
            margin-bottom: 1rem;
          }
          
          .screenshots-section {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e5e5;
          }
          
          .screenshots-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #374151;
          }
          
          .screenshot {
            margin-bottom: 1.5rem;
            page-break-inside: avoid;
          }
          
          .screenshot img {
            max-width: 100%;
            height: auto;
            border: 1px solid #e5e5e5;
            border-radius: 4px;
          }
          
          .screenshot-caption {
            font-size: 0.9rem;
            color: #666;
            margin-top: 0.5rem;
            font-style: italic;
          }
          
          .screenshot-metadata {
            font-size: 0.8rem;
            color: #999;
            margin-top: 0.25rem;
          }
          
          .page-number {
            position: fixed;
            bottom: 0.5in;
            right: 0.5in;
            font-size: 0.9rem;
            color: #666;
          }
          
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">LEAP Peer Support Specialist Training Manual</h1>
          <p class="subtitle">Complete guide to using the LEAP Peer Support Specialist Portal</p>
          <span class="badge">Generated on ${new Date().toLocaleDateString()}</span>
        </div>
    `;
  }

  private static generateTableOfContents(sections: ManualSection[]): string {
    let toc = `
      <div class="toc">
        <h2>Table of Contents</h2>
        <ul>
    `;
    
    sections.forEach(section => {
      toc += `
        <li>
          <strong>${this.formatSectionTitle(section.title)}</strong>
          ${section.description ? `<br><span style="font-size: 0.9rem; color: #666;">${section.description}</span>` : ''}
        </li>
      `;
    });
    
    toc += `
        </ul>
      </div>
    `;
    
    return toc;
  }

  private static generateSectionContent(
    section: ManualSection,
    content: ManualContent[],
    screenshots: AppScreenshot[]
  ): string {
    let html = `
      <div class="section">
        <h2 class="section-title">${this.formatSectionTitle(section.title)}</h2>
        ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
    `;

    // Add text content
    if (content.length > 0) {
      content.forEach(item => {
        html += `
          <div class="content-item">
            <h3 class="content-title">${item.title}</h3>
            <div class="content-text">${item.content}</div>
          </div>
        `;
      });
    } else {
      html += `
        <div class="content-item">
          <p><em>Content for this section is being automatically updated and will be available soon.</em></p>
        </div>
      `;
    }

    // Add screenshots section
    if (screenshots.length > 0) {
      html += `
        <div class="screenshots-section">
          <h3 class="screenshots-title">Visual Guide - Screenshots</h3>
      `;
      
      screenshots.forEach(screenshot => {
        html += `
          <div class="screenshot">
            <img src="${screenshot.imageUrl}" alt="${screenshot.title}" loading="lazy" />
            <div class="screenshot-caption">${screenshot.title}</div>
            ${screenshot.description ? `<div class="screenshot-metadata">${screenshot.description}</div>` : ''}
            <div class="screenshot-metadata">
              Category: ${screenshot.category} | Device: ${screenshot.deviceType} | 
              Captured: ${new Date(screenshot.capturedAt).toLocaleDateString()}
            </div>
          </div>
        `;
      });
      
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  private static generatePDFFooter(): string {
    return `
        <script>
          // Add page numbers
          window.addEventListener('beforeprint', function() {
            const pages = document.querySelectorAll('.section');
            pages.forEach((page, index) => {
              const pageNumber = document.createElement('div');
              pageNumber.className = 'page-number';
              pageNumber.textContent = 'Page ' + (index + 1);
              page.appendChild(pageNumber);
            });
          });
        </script>
      </body>
      </html>
    `;
  }

  private static formatSectionTitle(title: string): string {
    return title
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private static async waitForImagesToLoad(document: Document): Promise<void> {
    const images = Array.from(document.querySelectorAll('img'));
    const promises = images.map(img => {
      return new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if image fails to load
          // Timeout after 10 seconds
          setTimeout(() => resolve(), 10000);
        }
      });
    });
    
    await Promise.all(promises);
    // Give a bit more time for rendering
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}