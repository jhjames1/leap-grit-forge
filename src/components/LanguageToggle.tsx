import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="h-9 w-9 transition-all duration-300 relative"
      aria-label={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
    >
      <Globe className="h-4 w-4" />
      <span className="absolute -bottom-1 -right-1 text-[10px] font-bold font-oswald tracking-wide bg-primary text-primary-foreground rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
        {language.toUpperCase()}
      </span>
    </Button>
  );
}