import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Heart, 
  Shield, 
  AlertTriangle, 
  Settings,
  PieChart
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

interface ConocoSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: PieChart },
  { id: 'engagement', label: 'Engagement', icon: TrendingUp },
  { id: 'wellbeing', label: 'Well-Being Trends', icon: Heart },
  { id: 'program', label: 'Program Health', icon: Shield },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function ConocoSidebar({ activeSection, onSectionChange }: ConocoSidebarProps) {
  return (
    <Sidebar collapsible="icon" className="bg-white border-gray-200 shadow-sm">
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-red-600 font-oswald font-bold">LEAP Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
                    className={`w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${
                      activeSection === item.id ? 'bg-red-600 text-white font-semibold' : ''
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}