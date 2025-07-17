import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Clock, Palette, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const appointmentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  default_duration: z.number().min(5, 'Duration must be at least 5 minutes'),
  color: z.string().min(1, 'Color is required'),
});

type AppointmentTypeForm = z.infer<typeof appointmentTypeSchema>;

interface AppointmentType {
  id: string;
  name: string;
  description: string;
  default_duration: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const predefinedColors = [
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export default function AppointmentTypeManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<AppointmentTypeForm>({
    resolver: zodResolver(appointmentTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      default_duration: 30,
      color: predefinedColors[0],
    }
  });

  const selectedColor = watch('color');

  // Fetch appointment types
  const fetchAppointmentTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setAppointmentTypes(data || []);
    } catch (error) {
      console.error('Error fetching appointment types:', error);
      toast({
        title: "Error",
        description: "Failed to load appointment types",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create or update appointment type
  const onSubmit = async (data: AppointmentTypeForm) => {
    try {
      if (editingType) {
        // Update existing type
        const { error } = await supabase
          .from('appointment_types')
          .update({
            name: data.name,
            description: data.description,
            default_duration: data.default_duration,
            color: data.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingType.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Appointment type updated successfully"
        });
      } else {
        // Create new type
        const { error } = await supabase
          .from('appointment_types')
          .insert({
            name: data.name,
            description: data.description,
            default_duration: data.default_duration,
            color: data.color,
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Appointment type created successfully"
        });
      }

      fetchAppointmentTypes();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving appointment type:', error);
      toast({
        title: "Error",
        description: "Failed to save appointment type",
        variant: "destructive"
      });
    }
  };

  // Toggle active status
  const toggleActiveStatus = async (typeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('appointment_types')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', typeId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Appointment type ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      
      fetchAppointmentTypes();
    } catch (error) {
      console.error('Error updating appointment type:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment type",
        variant: "destructive"
      });
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingType(null);
    reset();
  };

  // Handle edit
  const handleEdit = (type: AppointmentType) => {
    setEditingType(type);
    setValue('name', type.name);
    setValue('description', type.description || '');
    setValue('default_duration', type.default_duration);
    setValue('color', type.color);
    setIsDialogOpen(true);
  };

  // Initialize data
  useEffect(() => {
    fetchAppointmentTypes();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Appointment Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Appointment Types
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingType ? 'Edit Appointment Type' : 'Create Appointment Type'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="e.g., Quick Chat"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Brief description of this appointment type"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_duration">Default Duration (minutes)</Label>
                  <Input
                    id="default_duration"
                    type="number"
                    {...register('default_duration', { valueAsNumber: true })}
                    min="5"
                    step="5"
                  />
                  {errors.default_duration && (
                    <p className="text-sm text-destructive">{errors.default_duration.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedColor === color ? 'border-foreground' : 'border-border'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setValue('color', color)}
                      >
                        {selectedColor === color && (
                          <Check className="w-4 h-4 text-white mx-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    <Input
                      type="color"
                      {...register('color')}
                      className="w-16 h-8"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingType ? 'Update' : 'Create'} Type
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointmentTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No appointment types created yet. Create your first type to get started.
            </div>
          ) : (
            appointmentTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <div>
                    <h3 className="font-medium">{type.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">
                        {type.default_duration} min
                      </Badge>
                      <Badge variant={type.is_active ? "default" : "secondary"}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(type)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={type.is_active ? "destructive" : "default"}
                    onClick={() => toggleActiveStatus(type.id, type.is_active)}
                  >
                    {type.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}