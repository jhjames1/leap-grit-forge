import { AlertCircle, Download, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";

export function AppUpdateNotification() {
  const { updateAvailable, updateReady, installUpdate, dismissUpdate } = usePWA();

  if (!updateAvailable || !updateReady) {
    return null;
  }

  return (
    <Alert className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md border-primary bg-card shadow-lg">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1 pr-4">
          <p className="font-medium">Update Available</p>
          <p className="text-sm text-muted-foreground">
            A new version of LEAP is ready. Your data will be preserved.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={installUpdate}
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="h-3 w-3 mr-1" />
            Update
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={dismissUpdate}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}