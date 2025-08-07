import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Trophy, Download, ExternalLink, Award, Star, CheckCircle } from 'lucide-react';

interface UserTrainingCompletionProps {
  score: number;
  onReturnToPortal: () => void;
}

const UserTrainingCompletion = ({ score, onReturnToPortal }: UserTrainingCompletionProps) => {
  const totalQuestions = 25;
  const passingScore = 19; // 76% pass rate for more thorough assessment
  const isPassed = score >= passingScore;
  const percentage = Math.round((score / totalQuestions) * 100);
  const [participantName, setParticipantName] = useState('');

  const downloadCertificate = () => {
    if (!participantName.trim()) {
      alert('Please enter your name before downloading the certificate.');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Load and draw the Thriving United logo
    const logo = new Image();
    logo.onload = () => {
      // Draw logo in top left
      ctx.drawImage(logo, 40, 40, 80, 80);
      
      // Continue with text after logo loads
      drawCertificateText();
    };
    logo.onerror = () => {
      // If logo fails to load, just draw the text
      drawCertificateText();
    };
    logo.src = '/lovable-uploads/9aaed05c-7f5d-40c6-9e4c-e2ea107ce354.png';

    const drawCertificateText = () => {
      // Title
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Certificate of Completion', canvas.width / 2, 120);

      // Subtitle
      ctx.fillStyle = '#374151';
      ctx.font = '24px Arial';
      ctx.fillText('LEAP Platform User Experience Training', canvas.width / 2, 160);

      // Thriving United text
      ctx.fillStyle = '#059669';
      ctx.font = '18px Arial';
      ctx.fillText('Thriving United', canvas.width / 2, 190);

      // Name section
      ctx.fillStyle = '#1f2937';
      ctx.font = '20px Arial';
      ctx.fillText('This certifies that', canvas.width / 2, 240);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 28px Arial';
      ctx.fillText(participantName.trim(), canvas.width / 2, 280);

      // Achievement text
      ctx.fillStyle = '#374151';
      ctx.font = '18px Arial';
      ctx.fillText('has successfully completed the LEAP Platform', canvas.width / 2, 330);
      ctx.fillText('User Experience Training Program', canvas.width / 2, 360);

      // Score
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Score: ${score}/${totalQuestions} (${percentage}%)`, canvas.width / 2, 410);

      // Date
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px Arial';
      const date = new Date().toLocaleDateString();
      ctx.fillText(`Date: ${date}`, canvas.width / 2, 450);

      // Certificate ID
      const certId = Math.random().toString(36).substr(2, 9).toUpperCase();
      ctx.fillText(`Certificate ID: ${certId}`, canvas.width / 2, 480);

      // Signature line
      ctx.fillStyle = '#374151';
      ctx.font = '14px Arial';
      ctx.fillText('LEAP Platform Training Program', canvas.width / 2, 540);
      ctx.fillText('Thriving United', canvas.width / 2, 560);

      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `leap-user-training-certificate-${participantName.replace(/\s+/g, '-').toLowerCase()}-${date.replace(/\//g, '-')}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      });
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Header Section */}
            <div className={`p-8 text-center ${
              isPassed 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
            }`}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                {isPassed ? (
                  <Trophy className="h-20 w-20 mx-auto mb-4" />
                ) : (
                  <Award className="h-20 w-20 mx-auto mb-4" />
                )}
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-4xl font-bold mb-4"
              >
                {isPassed ? 'Congratulations!' : 'Training Complete!'}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-xl opacity-90"
              >
                {isPassed 
                  ? 'You are now LEAP Platform Certified!' 
                  : 'You can retake the quiz when ready'}
              </motion.p>
            </div>

            {/* Results Section */}
            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Card className="text-center p-6">
                    <div className="text-3xl font-bold text-primary mb-2">{score}/{totalQuestions}</div>
                    <div className="text-muted-foreground">Questions Correct</div>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Card className="text-center p-6">
                    <div className="text-3xl font-bold text-primary mb-2">{percentage}%</div>
                    <div className="text-muted-foreground">Score Percentage</div>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <Card className="text-center p-6">
                    <Badge 
                      variant={isPassed ? "default" : "secondary"} 
                      className={`text-lg px-4 py-2 ${
                        isPassed ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                      }`}
                    >
                      {isPassed ? 'PASSED' : 'NEEDS RETAKE'}
                    </Badge>
                    <div className="text-muted-foreground mt-2">
                      {isPassed ? 'Well done!' : `Need ${passingScore}+ to pass`}
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Name Input Section */}
              {isPassed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.05 }}
                  className="mb-8"
                >
                  <Card className="p-6">
                    <div className="max-w-md mx-auto">
                      <Label htmlFor="participant-name" className="text-lg font-semibold mb-3 block text-center">
                        Enter Your Name for Certificate
                      </Label>
                      <Input
                        id="participant-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                        className="text-center text-lg py-3"
                      />
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        Your name will appear on the downloadable certificate
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Certificate Section */}
              {isPassed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="mb-8"
                >
                  <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <CardContent className="p-8 text-center">
                      <div className="flex justify-center mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-6 w-6 text-yellow-500 fill-current"
                          />
                        ))}
                      </div>
                      
                      <h3 className="text-2xl font-bold text-primary mb-4">
                        LEAP Platform Certified
                      </h3>
                      
                      <div className="space-y-2 text-muted-foreground mb-6">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Completed User Experience Training</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Passed Knowledge Assessment</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Ready to Support Users</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        You now understand the complete user journey and are equipped to provide effective support.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="flex flex-wrap gap-4 justify-center"
              >
                {isPassed && (
                  <>
                    <Button 
                      size="lg" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={downloadCertificate}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Certificate
                    </Button>
                    <Button size="lg" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Launch LEAP App
                    </Button>
                  </>
                )}
                
                <Button size="lg" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  User Experience Guide
                </Button>
                
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={onReturnToPortal}
                >
                  Return to Training Portal
                </Button>
              </motion.div>

              {/* Next Steps */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                className="mt-8 text-center"
              >
                <Card className="p-6 bg-muted/30">
                  <h4 className="font-semibold mb-3">What's Next?</h4>
                  <div className="text-sm text-muted-foreground space-y-2">
                    {isPassed ? (
                      <>
                        <p>✓ You're ready to support users on their recovery journey</p>
                        <p>✓ Access the admin portal to start managing users and content</p>
                        <p>✓ Review the user experience guide for ongoing reference</p>
                      </>
                    ) : (
                      <>
                        <p>• Review the training modules to strengthen your understanding</p>
                        <p>• Retake the quiz when you feel ready (passing score: {passingScore}/25)</p>
                        <p>• Focus on understanding the user journey and support principles</p>
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserTrainingCompletion;