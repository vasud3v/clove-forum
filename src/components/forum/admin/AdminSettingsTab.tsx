import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/forum/Toast';
import { Save, RefreshCw, Globe, Users, MessageSquare, Shield, Eye, Clock } from 'lucide-react';

interface ForumSettings {
  forum_name: string;
  forum_description: string;
  allow_registration: boolean;
  require_email_verification: boolean;
  min_post_length: number;
  max_post_length: number;
  posts_per_page: number;
  threads_per_page: number;
  allow_guest_viewing: boolean;
  enable_reputation: boolean;
  enable_reactions: boolean;
  enable_mentions: boolean;
  auto_lock_threads_days: number;
  max_attachments_per_post: number;
  enable_markdown: boolean;
  enable_emojis: boolean;
  enable_polls: boolean;
  enable_private_messages: boolean;
  min_reputation_to_post: number;
  min_reputation_to_create_thread: number;
  spam_detection_enabled: boolean;
  profanity_filter_enabled: boolean;
  max_thread_title_length: number;
  enable_user_signatures: boolean;
  enable_user_profiles: boolean;
}

export default function AdminSettingsTab() {
  const [settings, setSettings] = useState<ForumSettings>({
    forum_name: 'Chuglii Forums',
    forum_description: 'A modern forum community',
    allow_registration: true,
    require_email_verification: false,
    min_post_length: 10,
    max_post_length: 10000,
    posts_per_page: 20,
    threads_per_page: 25,
    allow_guest_viewing: true,
    enable_reputation: true,
    enable_reactions: true,
    enable_mentions: true,
    auto_lock_threads_days: 0,
    max_attachments_per_post: 5,
    enable_markdown: true,
    enable_emojis: true,
    enable_polls: false,
    enable_private_messages: true,
    min_reputation_to_post: 0,
    min_reputation_to_create_thread: 0,
    spam_detection_enabled: true,
    profanity_filter_enabled: false,
    max_thread_title_length: 200,
    enable_user_signatures: true,
    enable_user_profiles: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('forum_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Settings load error:', error);
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load forum settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      console.log('[Settings] Attempting to save:', settings);
      
      // First, check if settings exist
      const { data: existing, error: fetchError } = await supabase
        .from('forum_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      console.log('[Settings] Existing settings:', existing, 'Error:', fetchError);

      if (existing) {
        // Update existing settings - only send the fields we want to update
        const updateData = {
          forum_name: settings.forum_name,
          forum_description: settings.forum_description,
          allow_registration: settings.allow_registration,
          require_email_verification: settings.require_email_verification,
          min_post_length: settings.min_post_length,
          max_post_length: settings.max_post_length,
          posts_per_page: settings.posts_per_page,
          threads_per_page: settings.threads_per_page,
          allow_guest_viewing: settings.allow_guest_viewing,
          enable_reputation: settings.enable_reputation,
          enable_reactions: settings.enable_reactions,
          enable_mentions: settings.enable_mentions,
          auto_lock_threads_days: settings.auto_lock_threads_days,
          max_attachments_per_post: settings.max_attachments_per_post,
        };

        console.log('[Settings] Updating with:', updateData);
        
        const { data: updated, error } = await supabase
          .from('forum_settings')
          .update(updateData)
          .eq('id', existing.id)
          .select();

        console.log('[Settings] Update result:', updated, 'Error:', error);

        if (error) {
          console.error('[Settings] Update error details:', error);
          throw error;
        }
      } else {
        // Insert new settings
        console.log('[Settings] No existing settings, inserting new');
        const { data: inserted, error } = await supabase
          .from('forum_settings')
          .insert([{
            forum_name: settings.forum_name,
            forum_description: settings.forum_description,
            allow_registration: settings.allow_registration,
            require_email_verification: settings.require_email_verification,
            min_post_length: settings.min_post_length,
            max_post_length: settings.max_post_length,
            posts_per_page: settings.posts_per_page,
            threads_per_page: settings.threads_per_page,
            allow_guest_viewing: settings.allow_guest_viewing,
            enable_reputation: settings.enable_reputation,
            enable_reactions: settings.enable_reactions,
            enable_mentions: settings.enable_mentions,
            auto_lock_threads_days: settings.auto_lock_threads_days,
            max_attachments_per_post: settings.max_attachments_per_post,
          }])
          .select();

        console.log('[Settings] Insert result:', inserted, 'Error:', error);

        if (error) {
          console.error('[Settings] Insert error details:', error);
          throw error;
        }
      }

      toast.success('Forum settings saved successfully');
      await loadSettings(); // Reload to get any server-side changes
    } catch (error: any) {
      console.error('[Settings] Failed to save settings:', error);
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof ForumSettings>(key: K, value: ForumSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="hud-panel flex items-center justify-center py-20">
        <RefreshCw size={20} className="text-primary animate-spin" />
        <span className="ml-3 text-[12px] font-mono text-forum-muted">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="hud-panel p-6 flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-mono font-bold text-forum-text flex items-center gap-2">
            <Globe size={14} className="text-primary" /> Forum Settings
          </h2>
          <p className="text-[10px] font-mono text-forum-muted mt-1">
            Configure global forum behavior and features
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="transition-forum flex items-center gap-1.5  bg-primary px-4 py-2 text-[11px] font-mono font-medium text-black hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* General Settings */}
      <div className="hud-panel p-6 space-y-4">
        <h3 className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
          <Globe size={12} className="text-primary" /> General
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono text-forum-muted mb-1">Forum Name</label>
            <input
              type="text"
              value={settings.forum_name}
              onChange={(e) => updateSetting('forum_name', e.target.value)}
              className="w-full  border border-forum-border bg-forum-hover px-3 py-2 text-[11px] font-mono text-forum-text focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-forum-muted mb-1">Forum Description</label>
            <textarea
              value={settings.forum_description}
              onChange={(e) => updateSetting('forum_description', e.target.value)}
              rows={3}
              className="w-full  border border-forum-border bg-forum-hover px-3 py-2 text-[11px] font-mono text-forum-text focus:border-primary focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* User Settings */}
      <div className="hud-panel p-6 space-y-4">
        <h3 className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
          <Users size={12} className="text-primary" /> User & Registration
        </h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allow_registration}
              onChange={(e) => updateSetting('allow_registration', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Allow new user registration</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.require_email_verification}
              onChange={(e) => updateSetting('require_email_verification', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Require email verification</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allow_guest_viewing}
              onChange={(e) => updateSetting('allow_guest_viewing', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Allow guests to view forum</span>
          </label>
        </div>
      </div>

      {/* Content Settings */}
      <div className="hud-panel p-6 space-y-4">
        <h3 className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
          <MessageSquare size={12} className="text-primary" /> Content & Posts
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono text-forum-muted mb-1">Min Post Length (characters)</label>
            <input
              type="number"
              min="1"
              value={settings.min_post_length}
              onChange={(e) => updateSetting('min_post_length', parseInt(e.target.value) || 1)}
              className="w-full  border border-forum-border bg-forum-hover px-3 py-2 text-[11px] font-mono text-forum-text focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-forum-muted mb-1">Max Post Length (characters)</label>
            <input
              type="number"
              min="100"
              value={settings.max_post_length}
              onChange={(e) => updateSetting('max_post_length', parseInt(e.target.value) || 100)}
              className="w-full  border border-forum-border bg-forum-hover px-3 py-2 text-[11px] font-mono text-forum-text focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-forum-muted mb-1">Posts Per Page</label>
            <input
              type="number"
              min="5"
              max="100"
              value={settings.posts_per_page}
              onChange={(e) => updateSetting('posts_per_page', parseInt(e.target.value) || 20)}
              className="w-full  border border-forum-border bg-forum-hover px-3 py-2 text-[11px] font-mono text-forum-text focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-forum-muted mb-1">Threads Per Page</label>
            <input
              type="number"
              min="5"
              max="100"
              value={settings.threads_per_page}
              onChange={(e) => updateSetting('threads_per_page', parseInt(e.target.value) || 25)}
              className="w-full  border border-forum-border bg-forum-hover px-3 py-2 text-[11px] font-mono text-forum-text focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-forum-muted mb-1">Max Attachments Per Post</label>
            <input
              type="number"
              min="0"
              max="20"
              value={settings.max_attachments_per_post}
              onChange={(e) => updateSetting('max_attachments_per_post', parseInt(e.target.value) || 5)}
              className="w-full  border border-forum-border bg-forum-hover px-3 py-2 text-[11px] font-mono text-forum-text focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-forum-muted mb-1">Auto-lock Threads (days, 0=never)</label>
            <input
              type="number"
              min="0"
              value={settings.auto_lock_threads_days}
              onChange={(e) => updateSetting('auto_lock_threads_days', parseInt(e.target.value) || 0)}
              className="w-full  border border-forum-border bg-forum-hover px-3 py-2 text-[11px] font-mono text-forum-text focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Feature Settings */}
      <div className="hud-panel p-6 space-y-4">
        <h3 className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
          <Shield size={12} className="text-primary" /> Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_reputation}
              onChange={(e) => updateSetting('enable_reputation', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Enable reputation system</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_reactions}
              onChange={(e) => updateSetting('enable_reactions', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Enable post reactions</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_mentions}
              onChange={(e) => updateSetting('enable_mentions', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Enable @mentions</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_markdown}
              onChange={(e) => updateSetting('enable_markdown', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Enable markdown formatting</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_emojis}
              onChange={(e) => updateSetting('enable_emojis', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Enable emoji picker</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_polls}
              onChange={(e) => updateSetting('enable_polls', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Enable polls</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_private_messages}
              onChange={(e) => updateSetting('enable_private_messages', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Enable private messages</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_user_signatures}
              onChange={(e) => updateSetting('enable_user_signatures', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Enable user signatures</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_user_profiles}
              onChange={(e) => updateSetting('enable_user_profiles', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Enable user profiles</span>
          </label>
        </div>
      </div>

      {/* Security & Moderation */}
      <div className="hud-panel p-6 space-y-4">
        <h3 className="text-[12px] font-mono font-bold text-forum-text flex items-center gap-2">
          <Shield size={12} className="text-primary" /> Security & Moderation
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono text-forum-muted mb-1">Min Reputation to Post</label>
            <input
              type="number"
              min="0"
              value={settings.min_reputation_to_post}
              onChange={(e) => updateSetting('min_reputation_to_post', parseInt(e.target.value) || 0)}
              className="w-full  border border-forum-border bg-forum-hover px-3 py-2 text-[11px] font-mono text-forum-text focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-forum-muted mb-1">Min Reputation to Create Thread</label>
            <input
              type="number"
              min="0"
              value={settings.min_reputation_to_create_thread}
              onChange={(e) => updateSetting('min_reputation_to_create_thread', parseInt(e.target.value) || 0)}
              className="w-full  border border-forum-border bg-forum-hover px-3 py-2 text-[11px] font-mono text-forum-text focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-forum-muted mb-1">Max Thread Title Length</label>
            <input
              type="number"
              min="50"
              max="500"
              value={settings.max_thread_title_length}
              onChange={(e) => updateSetting('max_thread_title_length', parseInt(e.target.value) || 200)}
              className="w-full  border border-forum-border bg-forum-hover px-3 py-2 text-[11px] font-mono text-forum-text focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.spam_detection_enabled}
              onChange={(e) => updateSetting('spam_detection_enabled', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Enable spam detection</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.profanity_filter_enabled}
              onChange={(e) => updateSetting('profanity_filter_enabled', e.target.checked)}
              className="rounded border-forum-border bg-forum-hover text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] font-mono text-forum-text">Enable profanity filter</span>
          </label>
        </div>
      </div>
    </div>
  );
}
