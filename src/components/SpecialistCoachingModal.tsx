import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertTriangle, TrendingUp, Target, BookOpen, Users } from "lucide-react";
import { getAdvancedCoachingTips, getPerformanceAssessment, getCoachingPriority } from "@/utils/advancedCoaching";

interface SpecialistPerformance {
  id: string;
  name: string;
  email: string;
  status: string;
  active_sessions: number;
  completed_sessions: number;
  total_sessions: number;
  avg_rating: number;
  avg_response_time_seconds: number;
  workload_score: number;
  performance_score: number;
  last_active: string;
}

interface SpecialistCoachingModalProps {
  specialist: SpecialistPerformance | null;
  open: boolean;
  onClose: () => void;
}

export const SpecialistCoachingModal: React.FC<SpecialistCoachingModalProps> = ({
  specialist,
  open,
  onClose,
}) => {
  if (!specialist) return null;

  const assessment = getPerformanceAssessment(specialist);
  const coachingTips = getAdvancedCoachingTips(specialist);
  const priority = getCoachingPriority(specialist);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const completionRate = specialist.total_sessions > 0 
    ? Math.round((specialist.completed_sessions / specialist.total_sessions) * 100) 
    : 0;

  const getMetricColor = (value: number, goal: number, isReversed: boolean = false) => {
    if (isReversed) {
      // For metrics where lower is better (like response time)
      if (value <= goal) return 'text-success bg-success/10';
      if (value <= goal * 1.11) return 'text-warning bg-warning/10'; // ~5% above goal
      return 'text-destructive bg-destructive/10';
    } else {
      // For metrics where higher is better
      if (value >= goal) return 'text-success bg-success/10';
      if (value >= goal * 0.95) return 'text-warning bg-warning/10'; // 5% below goal
      return 'text-destructive bg-destructive/10';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-success bg-success/10';
    if (rating >= 3.0) return 'text-warning bg-warning/10';
    return 'text-destructive bg-destructive/10';
  };

  const getWorkloadColor = (workload: number) => {
    if (workload <= 70) return 'text-success bg-success/10';
    if (workload <= 85) return 'text-warning bg-warning/10';
    return 'text-destructive bg-destructive/10';
  };

  const getProgressColor = (value: number, goal: number, isReversed: boolean = false) => {
    if (isReversed) {
      if (value <= goal) return 'bg-success';
      if (value <= goal * 1.11) return 'bg-warning';
      return 'bg-destructive';
    } else {
      if (value >= goal) return 'bg-success';
      if (value >= goal * 0.95) return 'bg-warning';
      return 'bg-destructive';
    }
  };

  const getRatingProgressColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-success';
    if (rating >= 3.0) return 'bg-warning';
    return 'bg-destructive';
  };

  const getWorkloadProgressColor = (workload: number) => {
    if (workload <= 70) return 'bg-success';
    if (workload <= 85) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Coaching Insights for {specialist.name}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <div className="space-y-1">
                      <Progress 
                        value={completionRate} 
                        className={`h-2 ${getMetricColor(completionRate, 75)}`}
                        style={{
                          // @ts-ignore
                          '--progress-background': getProgressColor(completionRate, 75) === 'bg-success' ? 'hsl(var(--success))' : 
                            getProgressColor(completionRate, 75) === 'bg-warning' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'
                        }}
                      />
                      <p className={`text-sm font-medium ${getMetricColor(completionRate, 75).split(' ')[0]}`}>{completionRate}%</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">User Rating</p>
                    <div className="space-y-1">
                      <Progress 
                        value={(specialist.avg_rating / 5) * 100} 
                        className={`h-2 ${getRatingColor(specialist.avg_rating)}`}
                        style={{
                          // @ts-ignore
                          '--progress-background': getRatingProgressColor(specialist.avg_rating) === 'bg-success' ? 'hsl(var(--success))' : 
                            getRatingProgressColor(specialist.avg_rating) === 'bg-warning' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'
                        }}
                      />
                      <p className={`text-sm font-medium ${getRatingColor(specialist.avg_rating).split(' ')[0]}`}>{specialist.avg_rating.toFixed(1)}★</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Response Time</p>
                    <p className={`text-sm font-medium ${getMetricColor(specialist.avg_response_time_seconds, 45, true).split(' ')[0]}`}>{specialist.avg_response_time_seconds}s</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Workload</p>
                    <div className="space-y-1">
                      <Progress 
                        value={specialist.workload_score} 
                        className={`h-2 ${getWorkloadColor(specialist.workload_score)}`}
                        style={{
                          // @ts-ignore
                          '--progress-background': getWorkloadProgressColor(specialist.workload_score) === 'bg-success' ? 'hsl(var(--success))' : 
                            getWorkloadProgressColor(specialist.workload_score) === 'bg-warning' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'
                        }}
                      />
                      <p className={`text-sm font-medium ${getWorkloadColor(specialist.workload_score).split(' ')[0]}`}>{specialist.workload_score}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coaching Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getPriorityIcon(priority)}
                  Coaching Priority: <span className={getPriorityColor(priority)}>{priority.toUpperCase()}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {assessment.summary}
                </p>
              </CardContent>
            </Card>

            {/* Personalized Coaching Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Personalized Coaching Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coachingTips.map((category, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{category.category}</Badge>
                        <Badge variant={category.priority === 'high' ? 'destructive' : category.priority === 'medium' ? 'secondary' : 'default'}>
                          {category.priority} priority
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {category.tips.map((tip, tipIndex) => (
                          <div key={tipIndex} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{tip.title}</p>
                              <p className="text-sm text-muted-foreground">{tip.description}</p>
                              {tip.actionSteps && (
                                <ul className="text-xs text-muted-foreground space-y-1 ml-2">
                                  {tip.actionSteps.map((step, stepIndex) => (
                                    <li key={stepIndex} className="flex items-start gap-1">
                                      <span className="text-primary">•</span>
                                      {step}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {index < coachingTips.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Improvement Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {assessment.goals.map((goal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{goal.metric}</p>
                        <p className="text-xs text-muted-foreground">{goal.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Current: {goal.current}</p>
                        <p className="text-xs text-primary">Target: {goal.target}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};