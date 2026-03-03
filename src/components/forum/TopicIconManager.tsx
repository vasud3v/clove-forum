import { useState } from 'react';
import { Image as ImageIcon, Edit2, Trash2, Plus } from 'lucide-react';
import ImageUploadModal from './ImageUploadModal';
import { supabase } from '@/lib/supabase';

interface Topic {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category_id: string;
}

interface TopicIconManagerProps {
  topics: Topic[];
  onUpdate: () => void;
}

export default function TopicIconManager({ topics, onUpdate }: TopicIconManagerProps) {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleImageSelected = async (url: string) => {
    if (!selectedTopic) return;

    setUpdating(selectedTopic.id);

    try {
      const { error } = await supabase
        .from('topics')
        .update({ icon: url })
        .eq('id', selectedTopic.id);

      if (error) throw error;

      onUpdate();
    } catch (err) {
      console.error('Failed to update topic icon:', err);
    } finally {
      setUpdating(null);
      setSelectedTopic(null);
    }
  };

  const handleRemoveIcon = async (topicId: string) => {
    setUpdating(topicId);

    try {
      const { error } = await supabase
        .from('topics')
        .update({ icon: null })
        .eq('id', topicId);

      if (error) throw error;

      onUpdate();
    } catch (err) {
      console.error('Failed to remove topic icon:', err);
    } finally {
      setUpdating(null);
    }
  };

  const openUploadModal = (topic: Topic) => {
    setSelectedTopic(topic);
    setIsUploadModalOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-forum-text font-mono">Topic Banners</h3>
        <p className="text-[10px] text-forum-muted">
          Upload custom banners for your topics (3:1 ratio)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="hud-panel p-4 flex items-center gap-3"
          >
            {/* Icon Preview */}
            <div className="flex-shrink-0">
              {topic.icon ? (
                <div className="w-32 h-10  overflow-hidden border border-forum-border">
                  <img
                    src={topic.icon}
                    alt={topic.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-10  border-2 border-dashed border-forum-border flex items-center justify-center">
                  <ImageIcon size={20} className="text-forum-muted" />
                </div>
              )}
            </div>

            {/* Topic Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-[12px] font-semibold text-forum-text truncate">
                {topic.name}
              </h4>
              {topic.description && (
                <p className="text-[10px] text-forum-muted truncate">
                  {topic.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => openUploadModal(topic)}
                disabled={updating === topic.id}
                className="p-1.5  text-forum-muted hover:text-primary hover:bg-forum-hover transition-forum disabled:opacity-50"
                title={topic.icon ? 'Change banner' : 'Add banner'}
              >
                {topic.icon ? <Edit2 size={14} /> : <Plus size={14} />}
              </button>
              {topic.icon && (
                <button
                  onClick={() => handleRemoveIcon(topic.id)}
                  disabled={updating === topic.id}
                  className="p-1.5  text-forum-muted hover:text-red-400 hover:bg-red-500/10 transition-forum disabled:opacity-50"
                  title="Remove banner"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {topics.length === 0 && (
        <div className="hud-panel p-8 text-center">
          <ImageIcon size={32} className="mx-auto mb-3 text-forum-muted" />
          <p className="text-[12px] text-forum-muted">
            No topics found. Create topics first to add banners.
          </p>
        </div>
      )}

      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedTopic(null);
        }}
        onImageSelected={handleImageSelected}
        title={`Upload Banner for ${selectedTopic?.name || 'Topic'}`}
        aspectRatio="banner"
        maxSizeMB={2}
      />
    </div>
  );
}
