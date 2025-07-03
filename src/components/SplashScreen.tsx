
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(11, 20, 38, 0.4), rgba(11, 20, 38, 0.6)), url('/lovable-uploads/c61510da-8bef-4d57-8fba-f87d453bd59e.png')`
        }}
      />
      
      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        
        {/* LEAP Logo - removed background shading */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-anton text-6xl md:text-8xl text-white text-shadow mb-2 tracking-wider transform -skew-x-6">
            LEAP
          </h1>
          <p className="font-oswald text-xl md:text-2xl text-construction font-medium tracking-wide">
            Don't Tough It Out. Talk It Out.
          </p>
        </div>

        {/* Loading Animation */}
        {loading ? (
          <div className="mb-12 animate-scale-in">
            <div className="relative w-20 h-20">
              {/* Gauge Background */}
              <div className="absolute inset-0 border-4 border-steel-light rounded-full opacity-30"></div>
              {/* Animated Gauge */}
              <div className="absolute inset-0 border-4 border-construction rounded-full border-t-transparent animate-gauge-spin"></div>
              {/* Center Dot */}
              <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-construction rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <p className="text-white font-oswald mt-4 text-sm tracking-wide">
              Loading your tools...
            </p>
          </div>
        ) : (
          <Button 
            onClick={onComplete}
            className="bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold px-8 py-3 rounded-lg text-lg tracking-wide transition-all duration-200 transform hover:scale-105 industrial-shadow"
          >
            Get Started
          </Button>
        )}

        {/* Thriving United Logo */}
        <div className="absolute bottom-8 right-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <img 
              src="/lovable-uploads/d0fc56a3-44b5-42e1-8fbe-eb2156380255.png" 
              alt="Thriving United" 
              className="h-12 w-auto opacity-90"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
