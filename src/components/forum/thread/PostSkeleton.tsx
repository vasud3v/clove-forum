import { memo } from 'react';

const PostSkeleton = memo(() => {
  return (
    <div className="hud-panel flex flex-col md:flex-row relative  animate-pulse">
      {/* Author Sidebar Skeleton */}
      <div className="md:w-[200px] flex-shrink-0 bg-forum-bg/30 border-b md:border-b-0 md:border-r border-forum-border/20 p-4 flex flex-col items-center">
        <div className="flex flex-row md:flex-col items-center justify-center w-full gap-4 md:gap-3">
          {/* Avatar */}
          <div className="h-14 w-14 md:h-24 md:w-24  bg-forum-border/30" />
          
          <div className="flex flex-col flex-1 md:w-full items-start md:items-center gap-2 mt-0 md:mt-1">
            {/* Username */}
            <div className="h-4 w-24 bg-forum-border/30 rounded" />
            {/* Role Badge */}
            <div className="h-5 w-20 bg-forum-border/30 rounded" />
            {/* Rank Badge */}
            <div className="h-5 w-28 bg-forum-border/30 rounded" />
          </div>
        </div>

        {/* Stats (Hidden on mobile) */}
        <div className="hidden md:flex flex-col w-full mt-5 space-y-2 border-t border-forum-border/20 pt-4">
          <div className="flex items-center justify-between">
            <div className="h-3 w-12 bg-forum-border/30 rounded" />
            <div className="h-3 w-16 bg-forum-border/30 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 bg-forum-border/30 rounded" />
            <div className="h-3 w-12 bg-forum-border/30 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 bg-forum-border/30 rounded" />
            <div className="h-3 w-10 bg-forum-border/30 rounded" />
          </div>
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-forum-border/10 bg-forum-bg/20">
          <div className="h-3 w-32 bg-forum-border/30 rounded" />
          <div className="h-3 w-8 bg-forum-border/30 rounded" />
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex-1 space-y-2">
          <div className="h-3 w-full bg-forum-border/30 rounded" />
          <div className="h-3 w-5/6 bg-forum-border/30 rounded" />
          <div className="h-3 w-4/5 bg-forum-border/30 rounded" />
          <div className="h-3 w-full bg-forum-border/30 rounded" />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-forum-border/10 bg-forum-bg/10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-24 bg-forum-border/30 rounded" />
            <div className="h-7 w-16 bg-forum-border/30 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-16 bg-forum-border/30 rounded" />
            <div className="h-7 w-16 bg-forum-border/30 rounded" />
            <div className="h-7 w-16 bg-forum-border/30 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
});

PostSkeleton.displayName = 'PostSkeleton';

export default PostSkeleton;
