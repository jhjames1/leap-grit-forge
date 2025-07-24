import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, Clock, TrendingUp, AlertCircle, MoreHorizontal, Edit, RotateCcw, UserX } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { SpecialistPerformance } from '@/services/adminAnalyticsService';
import { SpecialistCoachingModal } from './SpecialistCoachingModal';
import { useState } from 'react';

interface SpecialistPerformanceTableProps {
  specialists: SpecialistPerformance[];
}

export const SpecialistPerformanceTable = ({ specialists }: SpecialistPerformanceTableProps) => {
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistPerformance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (specialist: SpecialistPerformance) => {
    setSelectedSpecialist(specialist);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSpecialist(null);
  };

  const handleEditSpecialist = (specialist: SpecialistPerformance) => {
    // TODO: Implement edit specialist functionality
    console.log('Edit specialist:', specialist);
  };

  const handleResetPassword = (specialist: SpecialistPerformance) => {
    // TODO: Implement reset password functionality
    console.log('Reset password for specialist:', specialist);
  };

  const handleDeactivateSpecialist = (specialist: SpecialistPerformance) => {
    // TODO: Implement deactivate specialist functionality
    console.log('Deactivate specialist:', specialist);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getWorkloadColor = (score: number) => {
    if (score >= 90) return 'text-red-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 30) return 'text-blue-500';
    return 'text-green-500';
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Individual Specialist Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Specialist</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Sessions</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead className="text-center">Response</TableHead>
                <TableHead className="text-center">Workload</TableHead>
                <TableHead className="text-center">Performance</TableHead>
                <TableHead className="text-center">Last Active</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specialists.map((specialist) => (
                <TableRow key={specialist.specialistId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{specialist.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={specialist.isVerified ? "default" : "secondary"}>
                          {specialist.isVerified ? "Verified" : "Pending"}
                        </Badge>
                        <Badge variant={specialist.isActive ? "default" : "destructive"}>
                          {specialist.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(specialist.status)}`}></div>
                      <span className="text-sm capitalize">{specialist.status}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {specialist.activeSessions}/{specialist.completedSessions}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">
                        {specialist.averageRating > 0 ? specialist.averageRating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatTime(specialist.responseTime)}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline" 
                      className={`${getWorkloadColor(specialist.workloadScore)} border-current`}
                    >
                      {specialist.workloadScore.toFixed(0)}%
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Badge 
                        variant="outline" 
                        className={`${getPerformanceColor(specialist.performanceScore)} border-current`}
                      >
                        {specialist.performanceScore.toFixed(0)}%
                      </Badge>
                      {specialist.performanceScore < 50 && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(specialist.lastActive)}
                    </span>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(specialist)}>
                          Coaching Tips
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditSpecialist(specialist)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(specialist)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeactivateSpecialist(specialist)} className="text-destructive">
                          <UserX className="mr-2 h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {specialists.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No specialist data available
            </div>
          )}
        </div>
      </CardContent>

      <SpecialistCoachingModal
        specialist={selectedSpecialist ? {
          id: selectedSpecialist.specialistId,
          name: selectedSpecialist.name,
          email: selectedSpecialist.email,
          status: selectedSpecialist.status,
          active_sessions: selectedSpecialist.activeSessions,
          completed_sessions: selectedSpecialist.completedSessions,
          total_sessions: selectedSpecialist.activeSessions + selectedSpecialist.completedSessions,
          avg_rating: selectedSpecialist.averageRating,
          avg_response_time_seconds: selectedSpecialist.responseTime,
          workload_score: selectedSpecialist.workloadScore,
          performance_score: selectedSpecialist.performanceScore,
          last_active: selectedSpecialist.lastActive
        } : null}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </Card>
  );
};