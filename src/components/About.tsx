
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Target, Heart, ArrowLeft } from 'lucide-react';

interface AboutProps {
  onBack: () => void;
}

const About = ({ onBack }: AboutProps) => {
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
            <span className="font-oswald font-extralight tracking-tight">ABOUT</span><span className="font-fjalla font-extrabold italic">LEAP</span>
          </h1>
          <p className="text-steel-light font-oswald">Your recovery companion</p>
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
              Our Mission
            </h3>
          </div>
          <p className="text-card-foreground text-sm leading-relaxed">
            LEAP is designed specifically for men in labor-intensive fields who are navigating their recovery journey. 
            We understand the unique challenges you face and provide practical, no-nonsense tools to support your progress.
          </p>
        </Card>

        {/* Privacy & Anonymity */}
        <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-primary p-2 rounded-sm mr-3">
              <Shield className="text-primary-foreground" size={20} />
            </div>
            <h3 className="font-fjalla font-bold text-card-foreground text-xl tracking-wide">Your Privacy Matters</h3>
          </div>
          <div className="space-y-3 text-card-foreground text-sm">
            <p>
              <strong className="text-card-foreground">Complete Anonymity:</strong> Your identity is protected. You can use the app without revealing personal information.
            </p>
            <p>
              <strong className="text-card-foreground">Secure Communication:</strong> All peer chats and check-ins are encrypted and confidential.
            </p>
            <p>
              <strong className="text-card-foreground">No Judgment Zone:</strong> This is your safe space to be honest about your struggles and victories.
            </p>
          </div>
        </Card>

        {/* Community */}
        <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-primary p-2 rounded-sm mr-3">
              <Users className="text-primary-foreground" size={20} />
            </div>
            <h3 className="font-fjalla font-bold text-card-foreground text-xl tracking-wide">Peer Support</h3>
          </div>
          <p className="text-card-foreground text-sm leading-relaxed">
            Connect with certified peer specialists who understand your industry and challenges. 
            They've walked this path and are here to support you without judgment.
          </p>
        </Card>

        {/* Values */}
        <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
          <div className="flex items-center mb-4">
            <div className="bg-primary p-2 rounded-sm mr-3">
              <Heart className="text-primary-foreground" size={20} />
            </div>
            <h3 className="font-fjalla font-bold text-card-foreground text-xl tracking-wide">Our Values</h3>
          </div>
          <div className="space-y-2 text-card-foreground text-sm">
            <p>• <strong className="text-card-foreground">Respect:</strong> Your journey, your pace, your choices</p>
            <p>• <strong className="text-card-foreground">Strength:</strong> Building on the resilience you already have</p>
            <p>• <strong className="text-card-foreground">Connection:</strong> You don't have to do this alone</p>
            <p>• <strong className="text-card-foreground">Progress:</strong> Every step forward counts</p>
          </div>
        </Card>

        {/* Terms */}
        <Card className="bg-card p-6 rounded-lg border-0 shadow-none transition-colors duration-300">
          <h3 className="font-fjalla font-bold text-card-foreground text-xl mb-4 tracking-wide">Terms & Conditions</h3>
          <div className="space-y-3 text-card-foreground text-sm">
            <p>
              By using LEAP, you agree to use the app responsibly and respect the privacy of other users.
            </p>
            <p>
              This app is a support tool and does not replace professional medical advice or treatment.
            </p>
            <p>
              In case of emergency or immediate danger, please contact 911 or your local emergency services.
            </p>
            <p>
              For crisis support, contact the National Suicide Prevention Lifeline at 988.
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
              LEAP is proudly developed by Thriving United, dedicated to supporting recovery in working communities.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default About;
