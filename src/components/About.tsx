
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Target, Heart, ArrowLeft } from 'lucide-react';

interface AboutProps {
  onBack: () => void;
}

const About = ({ onBack }: AboutProps) => {
  return (
    <div className="p-4 pb-24 bg-gradient-industrial min-h-screen">
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
          <h1 className="font-anton text-3xl text-white">About LEAP</h1>
          <p className="text-steel-light font-oswald">Your recovery companion</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Mission */}
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="bg-construction p-2 rounded-lg">
              <Target className="text-midnight" size={20} />
            </div>
            <h3 className="font-oswald font-semibold text-white text-xl">Our Mission</h3>
          </div>
          <p className="text-steel-light leading-relaxed">
            LEAP is designed specifically for men in labor-intensive fields who are navigating their recovery journey. 
            We understand the unique challenges you face and provide practical, no-nonsense tools to support your progress.
          </p>
        </Card>

        {/* Privacy & Anonymity */}
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="bg-construction p-2 rounded-lg">
              <Shield className="text-midnight" size={20} />
            </div>
            <h3 className="font-oswald font-semibold text-white text-xl">Your Privacy Matters</h3>
          </div>
          <div className="space-y-3 text-steel-light">
            <p>
              <strong className="text-white">Complete Anonymity:</strong> Your identity is protected. You can use the app without revealing personal information.
            </p>
            <p>
              <strong className="text-white">Secure Communication:</strong> All peer chats and check-ins are encrypted and confidential.
            </p>
            <p>
              <strong className="text-white">No Judgment Zone:</strong> This is your safe space to be honest about your struggles and victories.
            </p>
          </div>
        </Card>

        {/* Community */}
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="bg-construction p-2 rounded-lg">
              <Users className="text-midnight" size={20} />
            </div>
            <h3 className="font-oswald font-semibold text-white text-xl">Peer Support</h3>
          </div>
          <p className="text-steel-light leading-relaxed">
            Connect with certified peer specialists who understand your industry and challenges. 
            They've walked this path and are here to support you without judgment.
          </p>
        </Card>

        {/* Values */}
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="bg-construction p-2 rounded-lg">
              <Heart className="text-midnight" size={20} />
            </div>
            <h3 className="font-oswald font-semibold text-white text-xl">Our Values</h3>
          </div>
          <div className="space-y-2 text-steel-light">
            <p>• <strong className="text-white">Respect:</strong> Your journey, your pace, your choices</p>
            <p>• <strong className="text-white">Strength:</strong> Building on the resilience you already have</p>
            <p>• <strong className="text-white">Connection:</strong> You don't have to do this alone</p>
            <p>• <strong className="text-white">Progress:</strong> Every step forward counts</p>
          </div>
        </Card>

        {/* Terms */}
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
          <h3 className="font-oswald font-semibold text-white text-xl mb-4">Terms & Conditions</h3>
          <div className="space-y-3 text-steel-light text-sm">
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
        <Card className="bg-white/10 backdrop-blur-sm border-steel-dark p-6">
          <div className="text-center">
            <img 
              src="/lovable-uploads/d0fc56a3-44b5-42e1-8fbe-eb2156380255.png" 
              alt="Thriving United" 
              className="h-16 w-auto mx-auto mb-4 opacity-90"
            />
            <p className="text-steel-light text-sm">
              LEAP is proudly developed by Thriving United, dedicated to supporting recovery in working communities.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default About;
