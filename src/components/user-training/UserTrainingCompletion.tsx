import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Trophy, Download, ExternalLink, Award, Star, CheckCircle } from 'lucide-react';

interface UserTrainingCompletionProps {
  score: number;
  onReturnToPortal: () => void;
}

const UserTrainingCompletion = ({ score, onReturnToPortal }: UserTrainingCompletionProps) => {
  const totalQuestions = 20;
  const passingScore = 15;
  const isPassed = score >= passingScore;
  const percentage = Math.round((score / totalQuestions) * 100);

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
                    <Button size="lg" className="bg-green-600 hover:bg-green-700">
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
                        <p>• Retake the quiz when you feel ready (passing score: {passingScore}/20)</p>
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