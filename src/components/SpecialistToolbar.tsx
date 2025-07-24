import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, UserPlus, RefreshCw } from 'lucide-react';
import { SpecialistPerformance } from '@/services/adminAnalyticsService';

interface SpecialistToolbarProps {
  specialists: SpecialistPerformance[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: string;
  onFilterChange: (value: string) => void;
  onExportData: () => void;
  onInviteSpecialist: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const SpecialistToolbar = ({
  specialists,
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  onExportData,
  onInviteSpecialist,
  onRefresh,
  isLoading = false
}: SpecialistToolbarProps) => {
  const activeCount = specialists.filter(s => s.isActive && s.isVerified).length;
  const totalCount = specialists.length;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card border rounded-lg mb-6">
      {/* Left Section - Search and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search specialists..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
        
        <Select value={filterStatus} onValueChange={onFilterChange}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialists</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
            <SelectItem value="verified">Verified Only</SelectItem>
            <SelectItem value="unverified">Unverified Only</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {activeCount} Active
          </Badge>
          <Badge variant="outline">
            {totalCount} Total
          </Badge>
        </div>
      </div>

      {/* Right Section - Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onExportData}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
        
        <Button
          onClick={onInviteSpecialist}
          size="sm"
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Invite Specialist
        </Button>
      </div>
    </div>
  );
};