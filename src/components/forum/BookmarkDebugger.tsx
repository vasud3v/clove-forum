/**
 * Bookmark Debugger Component
 * 
 * Add this to ThreadDetailPage temporarily to debug bookmark issues
 * 
 * Usage:
 * import BookmarkDebugger from '@/components/forum/BookmarkDebugger';
 * 
 * // In ThreadDetailPage, add:
 * <BookmarkDebugger threadId={threadId} />
 */

import { useState, useEffect } from 'react';
import { useForumContext } from '@/context/ForumContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface BookmarkDebuggerProps {
  threadId: string | undefined;
}

export default function BookmarkDebugger({ threadId }: BookmarkDebuggerProps) {
  const { toggleBookmark, isBookmarked, currentUser } = useForumContext();
  const { user: authUser } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const info: any = {
        threadId,
        currentUserId: currentUser?.id,
        authUserId: authUser?.id,
        isBookmarked: threadId ? isBookmarked(threadId) : false,
        timestamp: new Date().toISOString(),
      };

      // Check database
      if (authUser?.id && threadId) {
        try {
          const { data, error } = await supabase
            .from('thread_bookmarks')
            .select('*')
            .eq('user_id', authUser.id)
            .eq('thread_id', threadId)
            .maybeSingle();
          
          info.dbBookmark = data;
          info.dbError = error?.message;
        } catch (err: any) {
          info.dbError = err.message;
        }

        // Check forum_users
        try {
          const { data: forumUser, error } = await supabase
            .from('forum_users')
            .select('id, username')
            .eq('id', authUser.id)
            .maybeSingle();
          
          info.forumUserExists = !!forumUser;
          info.forumUserError = error?.message;
        } catch (err: any) {
          info.forumUserError = err.message;
        }
      }

      setDebugInfo(info);
    };

    checkStatus();
  }, [threadId, currentUser, authUser, isBookmarked]);

  const handleTest = async () => {
    if (!threadId) return;
    
    setTesting(true);
    console.log('🧪 [BookmarkDebugger] Starting test...');
    console.log('🧪 [BookmarkDebugger] Thread ID:', threadId);
    console.log('🧪 [BookmarkDebugger] Auth User ID:', authUser?.id);
    console.log('🧪 [BookmarkDebugger] Current User ID:', currentUser?.id);
    console.log('🧪 [BookmarkDebugger] Is Bookmarked:', isBookmarked(threadId));
    
    try {
      console.log('🧪 [BookmarkDebugger] Calling toggleBookmark...');
      await toggleBookmark(threadId);
      console.log('🧪 [BookmarkDebugger] toggleBookmark completed');
      
      // Recheck status
      setTimeout(async () => {
        const { data } = await supabase
          .from('thread_bookmarks')
          .select('*')
          .eq('user_id', authUser?.id)
          .eq('thread_id', threadId)
          .maybeSingle();
        
        console.log('🧪 [BookmarkDebugger] DB state after toggle:', data);
        setTesting(false);
      }, 500);
    } catch (error: any) {
      console.error('🧪 [BookmarkDebugger] Error:', error);
      setTesting(false);
    }
  };

  if (!threadId) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/90 text-black p-4  max-w-md text-xs font-mono">
      <div className="font-bold mb-2 text-yellow-700">🔍 Bookmark Debugger</div>
      
      <div className="space-y-1 mb-3">
        <div>Thread ID: <span className="text-emerald-700">{debugInfo.threadId?.slice(0, 8)}...</span></div>
        <div>Current User: <span className="text-emerald-700">{debugInfo.currentUserId?.slice(0, 8)}...</span></div>
        <div>Auth User: <span className="text-emerald-700">{debugInfo.authUserId?.slice(0, 8)}...</span></div>
        <div>Is Bookmarked: <span className={debugInfo.isBookmarked ? 'text-emerald-700' : 'text-red-600'}>
          {debugInfo.isBookmarked ? 'YES' : 'NO'}
        </span></div>
        <div>Forum User Exists: <span className={debugInfo.forumUserExists ? 'text-emerald-700' : 'text-red-600'}>
          {debugInfo.forumUserExists ? 'YES' : 'NO'}
        </span></div>
        <div>DB Bookmark: <span className={debugInfo.dbBookmark ? 'text-emerald-700' : 'text-red-600'}>
          {debugInfo.dbBookmark ? 'EXISTS' : 'NONE'}
        </span></div>
        {debugInfo.dbError && (
          <div className="text-red-600">DB Error: {debugInfo.dbError}</div>
        )}
        {debugInfo.forumUserError && (
          <div className="text-red-600">User Error: {debugInfo.forumUserError}</div>
        )}
      </div>

      <button
        onClick={handleTest}
        disabled={testing}
        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-black disabled:opacity-50"
      >
        {testing ? 'Testing...' : 'Test Toggle'}
      </button>

      <div className="mt-2 text-[10px] text-black">
        Check console for detailed logs
      </div>
    </div>
  );
}
