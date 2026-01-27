
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Edit, Bell, Calendar, Phone, BookOpen, LogOut, Shield, UserCheck, Check, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUserData } from '@/hooks/useUserData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { audioNotification } from '@/utils/audioNotification';
import { trackingManager } from '@/utils/trackingManager';
import EditProfile from './EditProfile';
import NotificationSettings from './NotificationSettings';
import { SavedWisdom } from './SavedWisdom';
import { getEarnedBadges } from '@/utils/badgeUtils';
import { DemoNotificationGenerator } from './DemoNotificationGenerator';

interface UserProfileProps {
  onNavigate?: (page: string) => void;
}

const UserProfile = ({ onNavigate }: UserProfileProps) => {
  const { t, language } = useLanguage();
  const [currentView, setCurrentView] = useState<'profile' | 'edit' | 'notifications' | 'saved-wisdom' | 'notification-center'>('profile');
  const [realTimeStats, setRealTimeStats] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSpecialist, setIsSpecialist] = useState(false);
  const { userData } = useUserData();
  const { signOut, user: authUser } = useAuth();
  const { notifications, unreadCount, loading: notificationsLoading, markAsRead, markAllAsRead, clearAll } = useNotifications();

  // Play notification sound when new unread notifications arrive
  useEffect(() => {
    if (unreadCount > 0) {
      audioNotification.playTwoToneNotification();
    }
  }, [unreadCount]);

  const handleSignOut = async () => {
    await signOut();
    onNavigate?.('home');
  };

  // Check admin and specialist status
  useEffect(() => {
    const checkUserRoles = async () => {
      if (!authUser) {
        setIsAdmin(false);
        setIsSpecialist(false);
        return;
      }

      try {
        // Check admin status
        const { data: adminData, error: adminError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .eq('role', 'admin')
          .single();
        
        if (adminError && adminError.code !== 'PGRST116') {
          console.error('Error checking admin status:', adminError);
        }
        
        setIsAdmin(!!adminData);

        // Check specialist status
        const { data: specialistData, error: specialistError } = await supabase
          .from('peer_specialists')
          .select('id')
          .eq('user_id', authUser.id)
          .eq('is_active', true)
          .eq('is_verified', true)
          .single();
        
        if (specialistError && specialistError.code !== 'PGRST116') {
          console.error('Error checking specialist status:', specialistError);
        }
        
        setIsSpecialist(!!specialistData);
      } catch (error) {
        console.error('Error checking user roles:', error);
        setIsAdmin(false);
        setIsSpecialist(false);
      }
    };

    checkUserRoles();
  }, [authUser]);
  
  // Get real-time tracking data for all metrics
  useEffect(() => {
    const updateStats = () => {
      try {
        const liveStats = trackingManager.getTodaysStats();
        const streakData = trackingManager.getStreakData();
        setRealTimeStats({ 
          ...liveStats, 
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          urgesTracked: userData?.toolboxStats?.urgesThisWeek || 0
        });
      } catch (error) {
        // Fallback to userData if tracking manager fails
        console.warn('TrackingManager failed, using userData:', error);
        setRealTimeStats(null);
      }
    };
    
    // Update immediately and then every 2 seconds for real-time feel
    updateStats();
    const interval = setInterval(updateStats, 2000);
    
    return () => clearInterval(interval);
  }, [userData]);
  
  const phoneNumber = localStorage.getItem('phoneNumber');
  const lastLogin = localStorage.getItem('lastLogin') || new Date().toDateString();
  
  // Helper function to format dates based on language
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    
    if (language === 'es') {
      const monthKey = month.toLowerCase() as keyof typeof t;
      const translatedMonth = t(`profile.months.${monthKey}`) || month;
      return `${translatedMonth} ${year}`;
    }
    
    return `${month} ${year}`;
  };
  
  // Helper function to translate tool names
  const translateTool = (toolName: string) => {
    const toolMap: { [key: string]: string } = {
      'SteadySteel': t('profile.tools.steadySteel'),
      'Peer Chat': t('profile.tools.peerChat'),
      'The Foreman': t('profile.tools.foremanChat'),
      'Redline Recovery': t('profile.tools.urgeTracker'),
      'Gratitude Log': t('profile.tools.gratitudeLog'),
      'None yet': t('profile.tools.noneYet')
    };
    
    return toolMap[toolName] || toolName;
  };
  
  // Use journey completed days as single source of truth for streak
  const totalCompletedDays = userData?.journeyProgress?.completedDays?.length || 0;
  const liveRecoveryStreak = totalCompletedDays;
  const liveTotalToolsUsed = realTimeStats?.totalToolsUsed ?? userData?.toolboxStats?.totalSessions ?? 0;
  const liveActionsToday = realTimeStats?.actionsToday ?? 0;
  const liveUrgesTracked = realTimeStats?.urgesTracked ?? userData?.toolboxStats?.urgesThisWeek ?? 0;
  
  // Calculate real-time weekly progress
  const getWeeklyProgress = () => {
    // Fallback calculation using journey progress
    const completedDays = userData?.journeyProgress?.completedDays || [];
    const currentWeekNumber = Math.ceil((completedDays.length > 0 ? Math.max(...completedDays) : 1) / 7);
    const weekStartDay = (currentWeekNumber - 1) * 7 + 1;
    const weekEndDay = currentWeekNumber * 7;
    
    return completedDays.filter(day => day >= weekStartDay && day <= weekEndDay).length;
  };
  
  const weekCompletedDays = getWeeklyProgress();
  const weeklyProgressPercentage = Math.round((weekCompletedDays / 7) * 100);
  
  // Get real-time favorite tools based on actual usage
  const getFavoriteTools = () => {
    if (!userData?.activityLog) return [t('profile.tools.steadySteel'), t('profile.tools.peerChat'), t('profile.tools.foremanChat')];
    
    // Count tool usage from activity log (completed actions)
    const toolCounts = userData.activityLog.reduce((acc: { [key: string]: number }, entry) => {
      if (entry.action.includes('Completed')) {
        let tool = '';
        if (entry.action.includes('SteadySteel')) tool = 'SteadySteel';
        else if (entry.action.includes('Redline Recovery')) tool = 'Redline Recovery';
        else if (entry.action.includes('Gratitude')) tool = 'Gratitude Log';
        else if (entry.action.includes('Foreman')) tool = 'The Foreman';
        
        if (tool) {
          acc[tool] = (acc[tool] || 0) + 1;
        }
      }
      return acc;
    }, {});
    
    // Get top 3 most used tools
    const sortedTools = Object.entries(toolCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tool]) => translateTool(tool));
    
    // If less than 3 tools used, add defaults
    const defaultTools = [t('profile.tools.steadySteel'), t('profile.tools.peerChat'), t('profile.tools.foremanChat')];
    const favorites = [...sortedTools];
    
    defaultTools.forEach(tool => {
      if (favorites.length < 3 && !favorites.includes(tool)) {
        favorites.push(tool);
      }
    });
    
    return favorites.slice(0, 3);
  };

  // Use shared badge utility
  const earnedBadges = getEarnedBadges(userData, t, liveRecoveryStreak);

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'appointment_confirmed':
      case 'appointment_scheduled':
        return '📅';
      case 'appointment_cancelled':
        return '❌';
      case 'new_message':
        return '💬';
      case 'badge_earned':
        return '🏆';
      case 'reminder':
        return '⏰';
      case 'weekly_progress':
        return '📊';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('notifications.justNow') || 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };


  const profileStats = [
    { 
      label: "Streak", 
      value: liveRecoveryStreak, 
      unit: "", 
      color: "text-construction" 
    },
    { 
      label: "Tools Used", 
      value: liveTotalToolsUsed, 
      unit: "", 
      color: "text-construction" 
    },
    { 
      label: "Actions\nToday", 
      value: liveActionsToday, 
      unit: "", 
      color: "text-construction" 
    }
  ];

  const user = {
    name: authUser?.user_metadata?.first_name || "User",
    joinDate: formatDate("March 1, 2024"), // Could be calculated from userData creation date
    streakDays: liveRecoveryStreak,
    totalSessions: liveTotalToolsUsed,
    favoriteTools: getFavoriteTools(),
    badges: earnedBadges
  };


  if (currentView === 'edit') {
    return <EditProfile onBack={() => setCurrentView('profile')} />;
  }

  if (currentView === 'notifications') {
    return <NotificationSettings onBack={() => setCurrentView('profile')} />;
  }

  if (currentView === 'notification-center') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentView('profile')}
              className="text-steel-light hover:text-white"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-steel-light hover:text-white">
                  <MoreVertical size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-midnight border-steel-dark">
                <DropdownMenuItem 
                  onClick={markAllAsRead}
                  className="text-white hover:bg-steel-dark"
                  disabled={unreadCount === 0}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Mark all as read
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={clearAll}
                  className="text-white hover:bg-steel-dark"
                  disabled={notifications.length === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            {notificationsLoading ? (
              <div className="text-center py-8 text-steel-light">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-steel-light">
                <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.is_read 
                      ? 'bg-card border-steel-dark' 
                      : 'bg-construction/5 border-construction/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-lg">{getNotificationIcon(notification.notification_type)}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium ${notification.is_read ? 'text-steel-light' : 'text-white'}`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm mt-1 ${notification.is_read ? 'text-steel-light/70' : 'text-steel-light'}`}>
                          {notification.body}
                        </p>
                        <p className="text-xs text-steel-light/50 mt-2">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="ml-2 px-2 py-1 text-xs bg-construction text-black rounded hover:bg-construction/80"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'saved-wisdom') {
    return <SavedWisdom onBack={() => setCurrentView('profile')} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
                <span className="font-oswald font-extralight tracking-tight">MY</span><span className="font-fjalla font-extrabold italic">PROFILE</span>
              </h1>
              <p className="text-muted-foreground font-oswald">Your personal recovery dashboard</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs min-w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <div className="flex items-center justify-between pr-8">
                    <DialogTitle>Notifications</DialogTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={markAllAsRead}
                          disabled={unreadCount === 0}
                        >
                           <Check className="mr-2 h-4 w-4" />
                           Mark All As Read
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={clearAll}
                          disabled={notifications.length === 0}
                        >
                           <Trash2 className="mr-2 h-4 w-4" />
                           Clear All
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </DialogHeader>
                
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {notificationsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
                       <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          notification.is_read 
                            ? 'bg-muted/30 border-border' 
                            : 'bg-primary/5 border-primary/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <span className="text-lg">{getNotificationIcon(notification.notification_type)}</span>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-medium ${notification.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {notification.title}
                              </h3>
                              <p className={`text-sm mt-1 ${notification.is_read ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                                {notification.body}
                              </p>
                              <p className="text-xs text-muted-foreground/50 mt-2">
                                {formatTimeAgo(notification.created_at)}
                              </p>
                            </div>
                          </div>
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="mb-4">
          <Button 
            onClick={handleSignOut}
            variant="outline" 
            className="w-full border-border text-card-foreground hover:bg-accent justify-start font-source"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>

      {/* Profile Card */}
      <Card className="bg-card mb-6 p-6 border-0 shadow-none">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <User className="text-primary-foreground" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="font-fjalla font-bold text-card-foreground text-xl">{authUser?.user_metadata?.first_name || user.name}</h2>
            <p className="text-muted-foreground font-source">Member since {user.joinDate}</p>
            {phoneNumber && (
              <div className="flex items-center space-x-2 mt-1">
                <Phone size={14} className="text-muted-foreground" />
                <p className="text-muted-foreground text-sm font-source">{phoneNumber}</p>
              </div>
            )}
            <p className="text-muted-foreground text-sm font-source">Last login: {formatDate(lastLogin)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          {profileStats.map((stat, index) => (
            <div key={index}>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground font-source">{stat.unit}</div>
              <div className="text-xs text-muted-foreground font-source whitespace-pre-line">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm font-source">Weekly Progress</span>
            <span className="text-primary font-fjalla font-medium">{weeklyProgressPercentage}% ({weekCompletedDays}/7 days)</span>
          </div>
        </div>
      </Card>

      {/* Favorite Tools */}
      <Card className="bg-card mb-6 p-6 border-0 shadow-none">
        <h3 className="font-fjalla font-bold text-card-foreground mb-4">Favorite Tools</h3>
        <div className="flex flex-wrap gap-2">
          {user.favoriteTools.map((tool, index) => (
            <Badge key={index} className="bg-primary text-primary-foreground text-xs font-source">
              {tool}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Badges & Achievements */}
      <Card className="bg-card mb-6 p-6 border-0 shadow-none">
        <h3 className="font-fjalla font-bold text-card-foreground mb-4">Badges & Achievements</h3>
        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {earnedBadges.map((badge, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-muted/20 rounded-lg">
                <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{badge.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-card-foreground font-medium font-fjalla">{badge.name}</p>
                  <p className="text-muted-foreground text-sm font-source mb-1">{badge.description}</p>
                  <p className="text-muted-foreground text-xs font-source opacity-75">Earned {badge.earned}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <p className="text-muted-foreground font-source">Keep going! Your first badge is waiting.</p>
            <p className="text-muted-foreground text-sm font-source mt-1">Complete 7 days to earn your Week Warrior badge!</p>
          </div>
        )}
      </Card>

      {/* Settings */}
      <Card className="bg-card p-6 border-0 shadow-none">
        <h3 className="font-fjalla font-bold text-card-foreground mb-4">Settings</h3>
        <div className="space-y-3">
          
          <Button 
            onClick={() => setCurrentView('edit')}
            variant="outline" 
            className="w-full border-border text-card-foreground hover:bg-accent justify-start font-source"
          >
            <Edit size={16} className="mr-2" />
            Edit Profile
          </Button>
          <Button 
            onClick={() => setCurrentView('notifications')}
            variant="outline" 
            className="w-full border-border text-card-foreground hover:bg-accent justify-start font-source"
          >
            <Bell size={16} className="mr-2" />
            Notification Settings
          </Button>
          <Button 
            onClick={() => setCurrentView('saved-wisdom')}
            variant="outline" 
            className="w-full border-border text-card-foreground hover:bg-accent justify-start font-source"
          >
            <BookOpen size={16} className="mr-2" />
            Saved Wisdom
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-border text-card-foreground hover:bg-accent justify-start font-source"
          >
            <Calendar size={16} className="mr-2" />
            Weekly Check-In
          </Button>
          
          {/* Admin Portal Access */}
          {isAdmin && (
            <Button 
              onClick={() => window.location.href = '/admin'}
              variant="outline" 
              className="w-full border-border text-card-foreground hover:bg-accent justify-start font-source"
            >
              <Shield size={16} className="mr-2" />
              Admin Portal
            </Button>
          )}
          
          {/* Specialist Portal Access */}
          {isSpecialist && (
            <Button 
              onClick={() => window.location.href = '/specialist'}
              variant="outline" 
              className="w-full border-border text-card-foreground hover:bg-accent justify-start font-source"
            >
              <UserCheck size={16} className="mr-2" />
              Specialist Portal
            </Button>
          )}
        </div>
      </Card>

      {/* Demo Notification Generator - Development Tool */}
      <DemoNotificationGenerator />

      </div>
    </div>
  );
};

export default UserProfile;
