
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Target, Heart, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AboutProps {
  onBack: () => void;
}

const About = ({ onBack }: AboutProps) => {
  const { t } = useLanguage();

  return (
    <div className="p-4 pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-steel-light hover:text-white mr-3"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-5xl font-bold text-foreground mb-1 tracking-wide">
            <span className="font-oswald font-extralight tracking-tight">{t('about.title').split('LEAP')[0]}</span><span className="font-fjalla font-extrabold italic">LEAP</span>
          </h1>
          <p className="text-steel-light font-oswald">{t('about.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Mission */}
        <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-primary p-2 rounded-sm mr-3">
              <Target className="text-primary-foreground" size={20} />
            </div>
            <h3 className="font-fjalla font-bold text-card-foreground text-xl tracking-wide">
              {t('about.mission.title')}
            </h3>
          </div>
          <p className="text-card-foreground text-sm leading-relaxed">
            {t('about.mission.description')}
          </p>
        </Card>

        {/* Privacy & Anonymity */}
        <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-primary p-2 rounded-sm mr-3">
              <Shield className="text-primary-foreground" size={20} />
            </div>
            <h3 className="font-fjalla font-bold text-card-foreground text-xl tracking-wide">{t('about.privacy.title')}</h3>
          </div>
          <div className="space-y-3 text-card-foreground text-sm">
            <p>
              <strong className="text-card-foreground">{t('about.privacy.anonymity')}</strong> {t('about.privacy.anonymityDesc')}
            </p>
            <p>
              <strong className="text-card-foreground">{t('about.privacy.communication')}</strong> {t('about.privacy.communicationDesc')}
            </p>
            <p>
              <strong className="text-card-foreground">{t('about.privacy.judgment')}</strong> {t('about.privacy.judgmentDesc')}
            </p>
          </div>
        </Card>

        {/* Community */}
        <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-primary p-2 rounded-sm mr-3">
              <Users className="text-primary-foreground" size={20} />
            </div>
            <h3 className="font-fjalla font-bold text-card-foreground text-xl tracking-wide">{t('about.community.title')}</h3>
          </div>
          <p className="text-card-foreground text-sm leading-relaxed">
            {t('about.community.description')}
          </p>
        </Card>

        {/* Values */}
        <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-primary p-2 rounded-sm mr-3">
              <Heart className="text-primary-foreground" size={20} />
            </div>
            <h3 className="font-fjalla font-bold text-card-foreground text-xl tracking-wide">{t('about.values.title')}</h3>
          </div>
          <div className="space-y-2 text-card-foreground text-sm">
            <p>• <strong className="text-card-foreground">{t('about.values.respect')}</strong> {t('about.values.respectDesc')}</p>
            <p>• <strong className="text-card-foreground">{t('about.values.strength')}</strong> {t('about.values.strengthDesc')}</p>
            <p>• <strong className="text-card-foreground">{t('about.values.connection')}</strong> {t('about.values.connectionDesc')}</p>
            <p>• <strong className="text-card-foreground">{t('about.values.progress')}</strong> {t('about.values.progressDesc')}</p>
          </div>
        </Card>

        {/* Terms */}
        <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
          <h3 className="font-fjalla font-bold text-card-foreground text-xl mb-4 tracking-wide">{t('about.terms.title')}</h3>
          <div className="space-y-3 text-card-foreground text-sm">
            <p>
              {t('about.terms.usage')}
            </p>
            <p>
              {t('about.terms.medical')}
            </p>
            <p>
              {t('about.terms.emergency')}
            </p>
            <p>
              {t('about.terms.crisis')}
            </p>
          </div>
        </Card>

        {/* Thriving United */}
        <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="text-center">
            <img 
              src="/lovable-uploads/5a09c9b4-51a6-4dce-9f67-dd8de1db52dd.png" 
              alt="Thriving United" 
              className="h-16 w-auto mx-auto mb-4 opacity-90"
            />
            <p className="text-muted-foreground text-sm">
              {t('about.footer')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default About;
