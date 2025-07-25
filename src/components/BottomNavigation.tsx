
import { Home, MessageCircle, Target, User, Wrench } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();
  
  const tabs = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'journey', label: t('nav.journey'), icon: Target },
    { id: 'toolbox', label: t('nav.toolbox'), icon: Wrench },
    { id: 'chat', label: 'Peer Chat', icon: MessageCircle },
    { id: 'profile', label: t('nav.profile'), icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-midnight border-t border-steel-dark z-50">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] relative ${
                isActive 
                  ? 'text-construction bg-construction/10' 
                  : 'text-steel-light hover:text-white hover:bg-steel-dark/20'
              }`}
            >
              <Icon size={20} className="mb-1" />
              {tab.id === 'profile' && unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
              <span className="text-xs font-oswald font-medium tracking-wide">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
