
import { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      // Auto-transition after splash animation
      setTimeout(() => {
        onComplete();
      }, 500); // Small delay for smooth transition
    }, 2500); // 2.5 seconds total

    return () => clearTimeout(timer);
  }, [onComplete]);

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
        
        {/* LEAP Logo */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-1 tracking-wide">
            <span className="font-fjalla font-extrabold italic">LEAP</span>
          </h1>
          <p className="text-white text-lg font-oswald font-extralight tracking-wide">
            Don't Tough It Out. Talk It Out.
          </p>
        </div>

        {/* Loading Animation */}
        <div className="mb-12 animate-scale-in">
          <div className="relative w-20 h-20">
            {/* Logo */}
            <img 
              src="/lovable-uploads/a2a531dc-d4e3-4fd1-bd33-12f9b5644f1e.png" 
              alt="LEAP Logo" 
              className="w-full h-full object-contain animate-spin"
              style={{ animation: 'spin 2s linear infinite' }}
            />
          </div>
          <p className="text-white font-oswald mt-4 text-sm tracking-wide">
            Loading your tools...
          </p>
        </div>

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
