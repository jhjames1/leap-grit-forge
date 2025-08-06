import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Download, ExternalLink, HelpCircle, Star, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompletionScreenProps {
  score: number;
  onReturnToPortal: () => void;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ score, onReturnToPortal }) => {
  const [showCertificate, setShowCertificate] = useState(false);
  const passed = score >= 6;
  const percentage = Math.round((score / 8) * 100);

  const downloadCertificate = () => {
    // Create a simple certificate
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 800, 600);

    // Border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 760, 560);

    // Title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Certificate of Completion', 400, 120);

    // Subtitle
    ctx.font = '24px Arial';
    ctx.fillText('LEAP Admin Training Portal', 400, 160);

    // Body text
    ctx.font = '20px Arial';
    ctx.fillText('This certifies that', 400, 220);
    
    ctx.font = 'bold 36px Arial';
    ctx.fillText('[Admin Name]', 400, 270);
    
    ctx.font = '20px Arial';
    ctx.fillText('has successfully completed the LEAP Admin Training', 400, 320);
    ctx.fillText(`with a score of ${score}/8 (${percentage}%)`, 400, 350);

    // Date
    ctx.font = '18px Arial';
    ctx.fillText(`Completed on ${new Date().toLocaleDateString()}`, 400, 420);

    // Badge
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('LEAP ADMIN READY', 400, 480);

    // Download
    const link = document.createElement('a');
    link.download = 'leap-admin-certificate.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const Certificate = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={() => setShowCertificate(false)}
    >
      <Card className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <CardContent className="p-8 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="border-4 border-primary/20 rounded-lg p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Trophy className="h-12 w-12 text-white" />
            </motion.div>
            
            <h1 className="text-3xl font-bold mb-2">Certificate of Completion</h1>
            <p className="text-lg text-muted-foreground mb-6">LEAP Admin Training Portal</p>
            
            <div className="my-8">
              <p className="text-lg mb-2">This certifies that</p>
              <p className="text-2xl font-bold text-primary mb-2">[Admin Name]</p>
              <p className="text-lg mb-4">has successfully completed the LEAP Admin Training</p>
              <p className="text-lg font-semibold">Score: {score}/8 ({percentage}%)</p>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">Completed on {new Date().toLocaleDateString()}</p>
              <div className="inline-block mt-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full font-semibold">
                LEAP ADMIN READY
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 justify-center mt-6">
            <Button onClick={downloadCertificate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={() => setShowCertificate(false)}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="p-8 shadow-xl">
            <CardContent className="p-0">
              {passed ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
                    className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Trophy className="h-14 w-14 text-white" />
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl font-bold mb-4"
                  >
                    Congratulations! 🎉
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-xl text-muted-foreground mb-6"
                  >
                    You're officially <span className="font-semibold text-primary">LEAP Admin Ready!</span>
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8"
                  >
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        Final Score: {score}/8 ({percentage}%)
                      </span>
                    </div>
                    <p className="text-green-600 dark:text-green-400 text-sm">
                      You've mastered the essential skills for LEAP admin management. 
                      You're ready to support recovery journeys and make a real difference!
                    </p>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <HelpCircle className="h-14 w-14 text-white" />
                  </motion.div>
                  
                  <h1 className="text-3xl font-bold mb-4">Almost There!</h1>
                  <p className="text-xl text-muted-foreground mb-6">
                    You need 6/8 to pass. Your score: {score}/8 ({percentage}%)
                  </p>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Review the training modules and retake the quiz when you're ready. 
                      You've got this! 💪
                    </p>
                  </div>
                </>
              )}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="flex flex-wrap gap-4 justify-center"
              >
                {passed && (
                  <Button 
                    onClick={() => setShowCertificate(true)}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    View Certificate
                  </Button>
                )}
                
                <Button variant="outline" onClick={() => window.open('/admin', '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Launch Admin Portal
                </Button>
                
                <Button variant="outline" onClick={downloadCertificate}>
                  <Download className="h-4 w-4 mr-2" />
                  Quick Reference
                </Button>
                
                <Button variant="outline" onClick={() => window.open('https://docs.leap.app/admin', '_blank')}>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Support Docs
                </Button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="mt-8 pt-6 border-t"
              >
                <Button onClick={onReturnToPortal} variant="ghost">
                  ← Return to Training Portal
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {showCertificate && <Certificate />}
    </div>
  );
};

export default CompletionScreen;