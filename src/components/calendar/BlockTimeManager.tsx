import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Coffee, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockTimeEntry {
  id?: string;
  start_time: string;
  end_time: string;
  reason: string;
  exception_type: 'unavailable' | 'busy';
  is_recurring: boolean;
}

interface BlockTimeManagerProps {
  specialistId: string;
}

const blockTimePresets = [
  { label: 'Lunch Break', icon: Coffee, reason: 'Lunch break', duration: 60 },
  { label: 'Team Meeting', icon: Users, reason: 'Team meeting', duration: 60 },
  { label: 'Personal Time', icon: Clock, reason: 'Personal time', duration: 30 },
];

const BlockTimeManager = ({ specialistId }: BlockTimeManagerProps) => {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<BlockTimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showNewBlockForm, setShowNewBlockForm] = useState(false);
  const [newBlock, setNewBlock] = useState<Partial<BlockTimeEntry>>({
    exception_type: 'unavailable',
    is_recurring: false,
    reason: ''
  });

  useEffect(() => {
    fetchBlocks();
  }, [specialistId, selectedDate]);

  const fetchBlocks = async () => {
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('specialist_availability_exceptions')
        .select('*')
        .eq('specialist_id', specialistId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time');

      if (error) throw error;

      const typedBlocks = (data || []).map(block => ({
        ...block,
        exception_type: block.exception_type as 'unavailable' | 'busy'
      }));

      setBlocks(typedBlocks);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      toast({
        title: "Error",
        description: "Failed to load blocked time slots",
        variant: "destructive"
      });
    }
  };

  const createBlock = async (blockData: Partial<BlockTimeEntry>) => {
    if (!blockData.start_time || !blockData.end_time || !blockData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('specialist_availability_exceptions')
        .insert({
          specialist_id: specialistId,
          start_time: blockData.start_time,
          end_time: blockData.end_time,
          reason: blockData.reason,
          exception_type: blockData.exception_type || 'unavailable',
          is_recurring: blockData.is_recurring || false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time block created successfully"
      });

      setNewBlock({
        exception_type: 'unavailable',
        is_recurring: false,
        reason: ''
      });
      setShowNewBlockForm(false);
      fetchBlocks();
    } catch (error) {
      console.error('Error creating block:', error);
      toast({
        title: "Error",
        description: "Failed to create time block",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('specialist_availability_exceptions')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time block deleted successfully"
      });
      fetchBlocks();
    } catch (error) {
      console.error('Error deleting block:', error);
      toast({
        title: "Error",
        description: "Failed to delete time block",
        variant: "destructive"
      });
    }
  };

  const createQuickBlock = (preset: typeof blockTimePresets[0]) => {
    const startTime = new Date(selectedDate);
    
    // Set appropriate default times based on the preset
    if (preset.reason === 'Lunch break') {
      startTime.setHours(12, 0, 0, 0); // Lunch at noon
    } else if (preset.reason === 'Team meeting') {
      startTime.setHours(14, 0, 0, 0); // Meeting at 2 PM
    } else {
      startTime.setHours(9, 0, 0, 0); // Personal time at 9 AM
    }
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + preset.duration);

    const blockData = {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      reason: preset.reason,
      exception_type: 'unavailable' as const,
      is_recurring: false
    };

    createBlock(blockData);
  };

  const formatTime = (timeString: string) => {
    return format(new Date(timeString), 'h:mm a');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-fjalla">Block Time</CardTitle>
          <p className="text-sm text-muted-foreground font-source">
            Schedule lunch breaks, meetings, and personal time
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Selector */}
          <div className="flex items-center space-x-4">
            <Label className="font-source">Select Date:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-60 justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Quick Block Presets */}
          <div>
            <Label className="font-source mb-2 block">Quick Actions:</Label>
            <div className="flex gap-2">
              {blockTimePresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => createQuickBlock(preset)}
                  className="flex items-center gap-2"
                >
                  <preset.icon className="h-4 w-4" />
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Add Custom Block Button */}
          <Button
            onClick={() => setShowNewBlockForm(!showNewBlockForm)}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Time Block
          </Button>

          {/* New Block Form */}
          {showNewBlockForm && (
            <Card className="p-4 bg-muted/20">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-source">Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={newBlock.start_time?.slice(0, 16) || ''}
                    onChange={(e) => setNewBlock({ ...newBlock, start_time: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div>
                  <Label className="font-source">End Time</Label>
                  <Input
                    type="datetime-local"
                    value={newBlock.end_time?.slice(0, 16) || ''}
                    onChange={(e) => setNewBlock({ ...newBlock, end_time: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="font-source">Reason</Label>
                  <Textarea
                    placeholder="Meeting, lunch, personal time, etc."
                    value={newBlock.reason || ''}
                    onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="font-source">Type</Label>
                  <Select
                    value={newBlock.exception_type}
                    onValueChange={(value: 'unavailable' | 'busy') => setNewBlock({ ...newBlock, exception_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setShowNewBlockForm(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createBlock(newBlock)} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Block'}
                </Button>
              </div>
            </Card>
          )}

          {/* Existing Blocks */}
          <div>
            <Label className="font-source mb-2 block">
              Blocked Time for {format(selectedDate, "EEEE, MMMM d")}:
            </Label>
            {blocks.length > 0 ? (
              <div className="space-y-2">
                {blocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium font-source">
                        {formatTime(block.start_time)} - {formatTime(block.end_time)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {block.reason} 
                        <span className="ml-2 text-xs bg-muted px-1 py-0.5 rounded">
                          {block.exception_type}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => block.id && deleteBlock(block.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm font-source">
                No time blocks for this date
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockTimeManager;
