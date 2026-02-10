import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { CheckCircle2, ChevronDown, FileText, Flame, Target, Wrench } from 'lucide-react';
import journeyData from '@/data/journeyData.json';

interface JourneyHistoryTimelineProps {
  userData: {
    journeyProgress?: {
      completedDays: number[];
      completionDates?: Record<number, string>;
    };
    journeyResponses?: Record<string, string>;
  } | null;
}

const JourneyHistoryTimeline = ({ userData }: JourneyHistoryTimelineProps) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const completedDays = userData?.journeyProgress?.completedDays || [];
  const completionDates = userData?.journeyProgress?.completionDates || {};
  const journeyResponses = userData?.journeyResponses || {};

  // Build sorted list of completed days (reverse chronological)
  const sortedCompletedDays = useMemo(() => {
    return [...completedDays].sort((a, b) => {
      const dateA = completionDates[a] ? new Date(completionDates[a] as string).getTime() : 0;
      const dateB = completionDates[b] ? new Date(completionDates[b] as string).getTime() : 0;
      return dateB - dateA;
    });
  }, [completedDays, completionDates]);

  const coreJourney = journeyData.coreJourneys[0];

  const getDayMeta = (day: number) => {
    return coreJourney?.days?.find((d: any) => d.day === day) || null;
  };

  const getResponsesForDay = (day: number): Array<{ title: string; content: string }> => {
    const responses: Array<{ title: string; content: string }> = [];
    Object.keys(journeyResponses).forEach(key => {
      if (key.startsWith(`day_${day}_`)) {
        const activityType = key.replace(`day_${day}_`, '');
        const content = journeyResponses[key];
        if (content && content.length > 0) {
          const title = activityType
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          responses.push({ title, content });
        }
      }
    });
    return responses;
  };

  const getToolsForDay = (day: number): string[] => {
    const tools: string[] = [];
    Object.keys(journeyResponses).forEach(key => {
      if (key.startsWith(`day_${day}_`)) {
        const activityType = key.replace(`day_${day}_`, '');
        if (['trigger_identification', 'urge_tracking', 'breathing_exercise', 'gratitude_log', 'peer_support'].includes(activityType)) {
          const label = activityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          tools.push(label);
        }
      }
    });
    return tools;
  };

  const toggleItem = (day: number) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  // Calculate streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    const sorted = [...completedDays].sort((a, b) => b - a);
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0 || sorted[i] === sorted[i - 1] - 1) {
        streak++;
      } else break;
    }
    return streak;
  }, [completedDays]);

  const completionRate = Math.round((completedDays.length / 90) * 100);

  if (completedDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="font-semibold text-foreground mb-1">No History Yet</h3>
        <p className="text-sm text-muted-foreground">Complete your first journey day to start building your history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 border-0 shadow-sm bg-card text-center">
          <div className="text-2xl font-bold text-foreground">{completedDays.length}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Days Done</div>
        </Card>
        <Card className="p-3 border-0 shadow-sm bg-card text-center">
          <div className="text-2xl font-bold text-foreground">{currentStreak}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Streak</div>
        </Card>
        <Card className="p-3 border-0 shadow-sm bg-card text-center">
          <div className="text-2xl font-bold text-foreground">{completionRate}%</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Complete</div>
        </Card>
      </div>

      {/* Timeline */}
      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="space-y-2 pr-2">
          {sortedCompletedDays.map(day => {
            const meta = getDayMeta(day);
            const responses = getResponsesForDay(day);
            const tools = getToolsForDay(day);
            const completionDate = completionDates[day];
            const isOpen = openItems.has(day);

            return (
              <Collapsible key={day} open={isOpen} onOpenChange={() => toggleItem(day)}>
                <Card className="border shadow-sm overflow-hidden">
                  <CollapsibleTrigger className="w-full text-left p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500 p-1.5 rounded-lg flex-shrink-0">
                        <CheckCircle2 className="text-white h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-sm text-primary">Day {day}</span>
                          {meta && (
                            <span className="text-xs text-muted-foreground truncate">
                              • {meta.tool}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {meta?.title || `Day ${day}`}
                        </h4>
                        {completionDate && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(completionDate as string).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-3 border-t pt-3">
                      {/* Activity */}
                      {meta && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Flame className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Activity</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{meta.activity}</p>
                        </div>
                      )}

                      {/* Reflections */}
                      {responses.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Reflections</span>
                          </div>
                          <div className="space-y-2">
                            {responses.map((r, i) => (
                              <div key={i} className="bg-blue-50 p-2.5 rounded border border-blue-100">
                                <p className="text-xs font-medium text-blue-800 mb-0.5">{r.title}</p>
                                <p className="text-sm text-blue-700 italic">"{r.content}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tools */}
                      {tools.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Wrench className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-xs font-semibold text-purple-800 uppercase tracking-wide">Tools Used</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {tools.map((tool, i) => (
                              <Badge key={i} variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-0">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {responses.length === 0 && tools.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No detailed data recorded for this day.</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default JourneyHistoryTimeline;
