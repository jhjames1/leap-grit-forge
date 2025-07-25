import React from 'react';
import { 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  GraduationCap,
  Settings,
  LogOut,
  Activity,
  History,
  BookOpen
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface SpecialistSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  onOpenChatHistory: () => void;
  onOpenPerformance: () => void;
  onOpenActivity: () => void;
  onOpenSettings: () => void;
  activeSessions: number;
  waitingSessions: number;
}

const mainMenuItems = [
  { id: 'sessions', label: 'Chat Sessions', icon: MessageSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'training', label: 'Training', icon: GraduationCap },
];

export function SpecialistSidebar({ 
  activeSection, 
  onSectionChange, 
  onLogout,
  onOpenChatHistory,
  onOpenPerformance,
  onOpenActivity,
  onOpenSettings,
  activeSessions,
  waitingSessions
}: SpecialistSidebarProps) {
  return (
    <Sidebar collapsible="icon" className="bg-white border-gray-200 shadow-sm">
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold">Peer Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    className={`w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${
                      activeSection === item.id ? 'bg-primary text-white font-semibold' : ''
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.id === 'sessions' && (activeSessions > 0 || waitingSessions > 0) && (
                      <div className="ml-auto flex gap-1">
                        {activeSessions > 0 && (
                          <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {activeSessions}
                          </span>
                        )}
                        {waitingSessions > 0 && (
                          <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {waitingSessions}
                          </span>
                        )}
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Tools & Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onOpenChatHistory}
                  className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <History className="h-4 w-4" />
                  <span>Chat History</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onOpenPerformance}
                  className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Performance</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onOpenActivity}
                  className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <Activity className="h-4 w-4" />
                  <span>Activity Log</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onOpenSettings}
                  className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => window.open('/specialist-manual', '_blank')}
                  className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>User Manual</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}