import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  category_id: string;
}

interface SelectTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SelectTopicModal({ isOpen, onClose }: SelectTopicModalProps) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCategory) {
      fetchTopics(selectedCategory);
    } else {
      setTopics([]);
      setSelectedTopic('');
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTopics = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('category_id', categoryId)
        .order('name', { ascending: true });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const handleContinue = () => {
    if (selectedCategory && selectedTopic) {
      navigate(`/create-thread?category=${selectedCategory}&topic=${selectedTopic}`);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 z-[100]">
        <DialogHeader>
          <DialogTitle className="text-xl text-zinc-100">Select Topic</DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            Choose a category and topic to create your thread
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-zinc-300">
              Category
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 z-[150]">
                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}
                    className="text-zinc-100 focus:bg-zinc-700"
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic" className="text-zinc-300">
              Topic (Subcategory)
            </Label>
            <Select
              value={selectedTopic}
              onValueChange={setSelectedTopic}
              disabled={!selectedCategory || topics.length === 0}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 disabled:opacity-50">
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 z-[150]">
                {topics.map((topic) => (
                  <SelectItem
                    key={topic.id}
                    value={topic.id}
                    className="text-zinc-100 focus:bg-zinc-700"
                  >
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory && topics.length === 0 && (
              <p className="text-sm text-zinc-500">No topics available in this category</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedCategory || !selectedTopic}
            className="bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
