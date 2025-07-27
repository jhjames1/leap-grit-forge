import React, { useState, useEffect } from 'react';
import { Target, Wrench, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardHomeProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const DashboardHome = ({ activeTab, onTabChange }: DashboardHomeProps) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [currentDay, setCurrentDay] = useState(1);
  const [currentStreak, setCurrentStreak] = useState(7);
  const [strength, setStrength] = useState(82);

  useEffect(() => {
    // Mock data updates - replace with actual data fetching
    const updateData = () => {
      setCurrentDay((prevDay) => (prevDay < 90 ? prevDay + 1 : 1));
      setCurrentStreak((prevStreak) => (prevStreak < 90 ? prevStreak + 1 : 1));
      setStrength((prevStrength) =>
        Math.min(100, prevStrength + Math.random() * 5 - 2.5)
      );
    };

    const intervalId = setInterval(updateData, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <div className="min-h-screen bg-midnight text-white pb-20">
      {/* Header and Welcome Section */}
      <div className="px-4 py-6">
        <h1 className="text-2xl font-oswald font-bold text-construction">
          {t('home.welcome')}, {currentUser?.firstName || t('home.defaultWelcome')}
        </h1>
        <p className="text-steel-light mt-2">
          {t('home.journeyContinues')}
        </p>
      </div>
      
      <div className="px-4 space-y-6">
        {/* Today's Motivation */}
        <div className="bg-steel-dark rounded-lg p-6 border border-steel-dark">
          <h3 className="text-lg font-oswald font-semibold text-construction mb-4">
            {t('home.todaysMotivation')}
          </h3>
          <p className="text-steel-light leading-relaxed">
            {t('home.motivation.headers')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-steel-dark rounded-lg p-4 border border-steel-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-steel-light font-oswald uppercase tracking-wide">
                  {t('home.streak.title')}
                </p>
                <p className="text-2xl font-bold text-construction">
                  {currentStreak}
                </p>
                <p className="text-xs text-steel-light">
                  {t('home.streak.days')}
                </p>
              </div>
              <Target className="h-8 w-8 text-construction" />
            </div>
          </div>

          <div className="bg-steel-dark rounded-lg p-4 border border-steel-dark">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-steel-light font-oswald uppercase tracking-wide">
                  {t('home.strengthLevel')}
                </p>
                <p className="text-2xl font-bold text-construction">
                  {Math.round(strength)}%
                </p>
                <p className="text-xs text-steel-light">
                  {t('home.leapProgress')}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-construction" />
            </div>
          </div>
        </div>

        {/* The Foreman Card */}
        <div className="bg-gradient-to-r from-construction/10 to-construction/5 rounded-lg p-6 border border-construction/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-oswald font-semibold text-construction mb-2">
                {t('home.foreman.title')}
              </h3>
              <p className="text-steel-light text-sm mb-4">
                {t('home.foreman.subtitle')}
              </p>
              <button
                onClick={() => onTabChange('chat')}
                className="bg-construction hover:bg-construction/80 text-midnight px-4 py-2 rounded-lg font-oswald font-medium transition-colors"
              >
                {t('home.foreman.button')}
              </button>
            </div>
            <MessageCircle className="h-12 w-12 text-construction" />
          </div>
        </div>

        {/* Start Your Day */}
        <div className="bg-steel-dark rounded-lg p-6 border border-steel-dark">
          <h3 className="text-lg font-oswald font-semibold text-white mb-4">
            {t('home.startDay')}
          </h3>
          <button
            onClick={() => onTabChange('journey')}
            className="w-full bg-construction hover:bg-construction/80 text-midnight py-3 rounded-lg font-oswald font-medium transition-colors"
          >
            {t('journey.dayModules.day1.title')} - {t('common.day')} {currentDay}
          </button>
        </div>

        {/* Coming Up This Week */}
        <div className="bg-steel-dark rounded-lg p-6 border border-steel-dark">
          <h3 className="text-lg font-oswald font-semibold text-white mb-4">
            {t('home.comingUp')}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-steel-light">{t('home.upcomingActivities.weekend')}</span>
              <span className="text-xs text-steel-light bg-steel-dark px-2 py-1 rounded">
                {t('home.time.tomorrow')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-steel-light">{t('home.upcomingActivities.communication')}</span>
              <span className="text-xs text-steel-light bg-steel-dark px-2 py-1 rounded">
                {t('home.time.days', { count: 3 })}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-steel-light">{t('home.upcomingActivities.milestone')}</span>
              <span className="text-xs text-steel-light bg-steel-dark px-2 py-1 rounded">
                {t('home.time.week', { count: 1 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
