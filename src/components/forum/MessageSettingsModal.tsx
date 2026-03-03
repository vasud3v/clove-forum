import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMessagingEnhanced } from '@/hooks/useMessagingEnhanced';
import { Globe, Users, Ban } from 'lucide-react';

interface MessageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export function MessageSettingsModal({ isOpen, onClose, currentUserId }: MessageSettingsModalProps) {
  const { messageSettings, updateMessageSettings } = useMessagingEnhanced(currentUserId);
  const [selectedSetting, setSelectedSetting] = useState(messageSettings.allow_messages_from);

  useEffect(() => {
    setSelectedSetting(messageSettings.allow_messages_from);
  }, [messageSettings]);

  const handleSave = async () => {
    await updateMessageSettings({ allow_messages_from: selectedSetting });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message Privacy Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Control who can send you direct messages
          </p>
          
          <RadioGroup value={selectedSetting} onValueChange={(value: any) => setSelectedSetting(value)}>
            <div className="flex items-start space-x-3 p-3  border hover:bg-accent cursor-pointer">
              <RadioGroupItem value="everyone" id="everyone" />
              <Label htmlFor="everyone" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4" />
                  <span className="font-semibold">Everyone</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Anyone can send you messages
                </p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3  border hover:bg-accent cursor-pointer">
              <RadioGroupItem value="following" id="following" />
              <Label htmlFor="following" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">People You Follow</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Only users you follow can message you
                </p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3  border hover:bg-accent cursor-pointer">
              <RadioGroupItem value="none" id="none" />
              <Label htmlFor="none" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Ban className="w-4 h-4" />
                  <span className="font-semibold">No One</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Disable all incoming messages
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
