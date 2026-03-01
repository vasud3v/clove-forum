import { useState } from 'react';
import { X, User, Save, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  userId: string;
  onSuccess: () => void;
}

export default function EditProfileModal({ isOpen, onClose, currentUsername, userId, onSuccess }: Props) {
  const [username, setUsername] = useState(currentUsername);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  if (!isOpen) return null;

  const validateUsername = (value: string): boolean => {
    setUsernameError('');
    
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    
    if (value.length > 20) {
      setUsernameError('Username must be less than 20 characters');
      return false;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      setUsernameError('Username can only contain letters, numbers, hyphens, and underscores');
      return false;
    }
    
    return true;
  };

  const checkUsernameAvailability = async (value: string): Promise<boolean> => {
    if (value === currentUsername) return true;
    
    const { data, error } = await supabase
      .from('forum_users')
      .select('username')
      .eq('username', value)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking username:', error);
      return false;
    }
    
    if (data) {
      setUsernameError('Username is already taken');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUsername(username)) return;
    
    setIsSubmitting(true);
    
    try {
      // Check if username is available
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        setIsSubmitting(false);
        return;
      }
      
      // Update forum_users table
      const { error: updateError } = await supabase
        .from('forum_users')
        .update({
          username: username.trim(),
          // TODO: Add bio, location, website fields when schema is updated
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }
      
      toast.success('Profile updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative hud-panel w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-forum-card border-b border-forum-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[14px] font-mono font-bold text-forum-text flex items-center gap-2">
            <User size={14} className="text-forum-pink" />
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="text-forum-muted hover:text-forum-text transition-forum"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-[10px] font-mono text-forum-muted uppercase tracking-wider mb-2">
              Username *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                validateUsername(e.target.value);
              }}
              onBlur={() => {
                if (username !== currentUsername) {
                  checkUsernameAvailability(username);
                }
              }}
              className={`w-full rounded-md border ${
                usernameError ? 'border-red-500/50' : 'border-forum-border'
              } bg-forum-bg px-3 py-2 text-[11px] font-mono text-forum-text outline-none focus:border-forum-pink`}
              placeholder="Enter username"
              required
            />
            {usernameError && (
              <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-mono text-red-400">
                <AlertCircle size={10} />
                {usernameError}
              </div>
            )}
            <p className="text-[9px] font-mono text-forum-muted mt-1.5">
              3-20 characters. Letters, numbers, hyphens, and underscores only.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[10px] font-mono text-forum-muted uppercase tracking-wider mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-md border border-forum-border bg-forum-bg px-3 py-2 text-[11px] font-mono text-forum-text outline-none focus:border-forum-pink resize-none"
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
            />
            <p className="text-[9px] font-mono text-forum-muted mt-1.5 text-right">
              {bio.length}/500
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[10px] font-mono text-forum-muted uppercase tracking-wider mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-md border border-forum-border bg-forum-bg px-3 py-2 text-[11px] font-mono text-forum-text outline-none focus:border-forum-pink"
              placeholder="e.g., San Francisco, CA"
              maxLength={100}
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-[10px] font-mono text-forum-muted uppercase tracking-wider mb-2">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-md border border-forum-border bg-forum-bg px-3 py-2 text-[11px] font-mono text-forum-text outline-none focus:border-forum-pink"
              placeholder="https://example.com"
            />
          </div>

          {/* Info Box */}
          <div className="bg-forum-pink/5 border border-forum-pink/20 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={12} className="text-forum-pink flex-shrink-0 mt-0.5" />
              <div className="text-[9px] font-mono text-forum-muted leading-relaxed">
                <p className="text-forum-pink font-bold mb-1">Important:</p>
                <p>Changing your username will update it across the entire forum. Your old username may become available for others to use.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !!usernameError || !username.trim()}
              className="flex-1 transition-forum flex items-center justify-center gap-2 rounded-md bg-forum-pink px-4 py-2.5 text-[11px] font-mono font-bold text-white hover:bg-forum-pink/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Save size={12} />
                  Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="transition-forum rounded-md border border-forum-border px-4 py-2.5 text-[11px] font-mono text-forum-muted hover:text-forum-text hover:bg-forum-hover"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
