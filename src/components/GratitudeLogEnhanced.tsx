import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Clock } from 'lucide-react';

interface GratitudeEntry {
  id: string;
  text: string;
  timestamp: string;
  date: string;
}

interface GratitudeLogEnhancedProps {
  onClose: () => void;
  onCancel?: () => void;
}

const GratitudeLogEnhanced = ({ onClose, onCancel }: GratitudeLogEnhancedProps) => {
  const [newEntry, setNewEntry] = useState('');
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);

  useEffect(() => {
    // Load existing entries for current user
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userKey = `user_${currentUser.toLowerCase()}`;
      const userData = localStorage.getItem(userKey);
      if (userData) {
        const parsed = JSON.parse(userData);
        setEntries(parsed.gratitudeEntries || []);
      }
    }
  }, []);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleSaveEntry = () => {
    if (!newEntry.trim()) return;

    const now = new Date();
    const entry: GratitudeEntry = {
      id: Date.now().toString(),
      text: newEntry.trim(),
      timestamp: now.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      date: now.toISOString()
    };

    const updatedEntries = [entry, ...entries];
    setEntries(updatedEntries);

    // Save to user data
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userKey = `user_${currentUser.toLowerCase()}`;
      const userData = localStorage.getItem(userKey);
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.gratitudeEntries = updatedEntries;
        localStorage.setItem(userKey, JSON.stringify(parsed));
      }
    }

    setNewEntry('');
    // Call onClose when entry is successfully saved (completion)
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-midnight border-steel-dark p-6 max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-construction/20 rounded-full flex items-center justify-center">
              <Heart className="text-construction" size={20} />
            </div>
            <h3 className="font-oswald font-semibold text-white text-xl">Gratitude Log</h3>
          </div>
        </div>

        {/* New Entry Input */}
        <div className="mb-6">
          <textarea 
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="What are you grateful for today?"
            className="w-full h-24 p-3 bg-steel-dark border border-steel text-white placeholder:text-steel-light rounded focus:border-construction focus:ring-1 focus:ring-construction resize-none"
          />
          <div className="flex space-x-3 mt-3">
            <Button 
              onClick={handleSaveEntry}
              disabled={!newEntry.trim()}
              className="flex-1 bg-construction hover:bg-construction-dark text-midnight font-oswald font-semibold"
            >
              Add Entry
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="border-steel text-steel-light hover:bg-steel/10"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Entries History */}
        {entries.length > 0 && (
          <div className="space-y-4 max-h-64 overflow-y-auto">
            <h4 className="font-oswald font-medium text-steel-light text-sm uppercase tracking-wide">
              Your Gratitude History
            </h4>
            
            {entries.map((entry, index) => (
              <div 
                key={entry.id} 
                className={`p-4 rounded-lg border ${
                  index === 0 
                    ? 'bg-construction/10 border-construction/30' 
                    : 'bg-steel-dark/30 border-steel-dark'
                }`}
              >
                <p className={`text-white mb-2 ${
                  index === 0 ? 'font-medium text-lg' : 'text-sm'
                }`}>
                  "{entry.text}"
                </p>
                <div className="flex items-center space-x-2 text-xs text-steel-light">
                  <Clock size={12} />
                  <span>{entry.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-8">
            <p className="text-steel-light text-sm">
              Your gratitude entries will appear here after you add your first one.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default GratitudeLogEnhanced;
