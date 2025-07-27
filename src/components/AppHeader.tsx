
import { LanguageToggle } from "./LanguageToggle";

export function AppHeader() {
  return (
    <div className="fixed top-0 left-0 right-0 bg-midnight border-b border-steel-dark z-50 px-4 py-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-construction font-oswald font-bold text-lg">LEAP</span>
        </div>
        <LanguageToggle />
      </div>
    </div>
  );
}
