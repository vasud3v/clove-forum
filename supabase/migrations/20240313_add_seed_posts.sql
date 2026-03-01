-- Add initial posts to seed threads that don't have any
-- This ensures all threads have at least one post (the opening post)

-- Insert posts for threads that don't have any
-- Using ON CONFLICT DO NOTHING to avoid errors if posts already exist

INSERT INTO public.posts (id, thread_id, author_id, content, created_at, likes, upvotes, downvotes, is_answer)
VALUES
  -- Welcome thread
  ('post-welcome-001', 't-welcome-001', 'admin-system', 
   E'# Welcome to Our Community! 🎉\n\nWe''re thrilled to have you here! This is a place where members can connect, share ideas, and support each other.\n\n## What You Can Do Here\n\n- **Start Discussions**: Create threads on topics you''re passionate about\n- **Share Knowledge**: Help others by answering questions\n- **Build Connections**: Follow members and engage with their content\n- **Earn Reputation**: Get recognized for your valuable contributions\n\n## Getting Started\n\n1. Complete your profile\n2. Read the forum rules\n3. Introduce yourself\n4. Start exploring!\n\nIf you have any questions, don''t hesitate to ask. Our community is here to help!\n\nHappy posting! 🚀',
   '2024-01-01 10:00:00+00', 0, 0, 0, false),

  -- Latest Updates thread
  ('post-updates-001', 't-updates-001', 'admin-system',
   E'# Latest Updates & Announcements 📢\n\nStay informed about the latest changes and improvements to our community!\n\n## Recent Updates\n\n- New reputation system launched\n- Enhanced moderation tools\n- Improved mobile experience\n- Real-time notifications\n\nCheck back regularly for more updates!',
   '2024-01-01 10:05:00+00', 0, 0, 0, false),

  -- Forum Rules thread
  ('post-rules-001', 't-rules-001', 'admin-system',
   E'# Forum Rules & Guidelines 📋\n\n## Core Rules\n\n1. **Be Respectful**: Treat all members with courtesy\n2. **No Spam**: Keep content relevant and valuable\n3. **No Harassment**: Zero tolerance for bullying or hate speech\n4. **Stay On Topic**: Post in the appropriate categories\n5. **No Illegal Content**: Follow all applicable laws\n\n## Consequences\n\nViolations may result in:\n- Warning\n- Temporary suspension\n- Permanent ban\n\nLet''s keep this community welcoming for everyone!',
   '2024-01-01 10:10:00+00', 0, 0, 0, false),

  -- How Forum Works thread
  ('post-works-001', 't-works-001', 'admin-system',
   E'# How the Forum Works 🔧\n\n## Thread Basics\n\n**Pinned Threads**: Important threads that stay at the top\n**Hot Threads**: Popular discussions with lots of activity\n**Locked Threads**: Closed for new replies\n\n## Voting System\n\n- Upvote quality content\n- Downvote spam or rule violations\n- Your votes affect user reputation\n\n## Categories & Topics\n\nThreads are organized into categories and topics for easy navigation.',
   '2024-01-01 10:15:00+00', 0, 0, 0, false),

  -- Getting Started thread
  ('post-start-001', 't-start-001', 'admin-system',
   E'# Getting Started Guide 🚀\n\n## Step 1: Set Up Your Profile\n\n- Add an avatar\n- Write a bio\n- Customize your banner\n\n## Step 2: Explore\n\n- Browse categories\n- Read popular threads\n- Follow interesting members\n\n## Step 3: Participate\n\n- Reply to threads\n- Create your first thread\n- Vote on content\n\nWelcome aboard!',
   '2024-01-01 10:20:00+00', 0, 0, 0, false),

  -- Upvoting Guide thread
  ('post-works-003-1', 't-works-003', 'admin-system',
   E'# Upvoting & Downvoting Guide 👍👎\n\n## When to Upvote\n\n- Helpful answers\n- Quality content\n- Insightful comments\n- Well-researched posts\n\n## When to Downvote\n\n- Spam\n- Off-topic content\n- Rule violations\n- Misleading information\n\n## Impact\n\nYour votes help:\n- Surface quality content\n- Build user reputation\n- Improve community quality',
   '2024-01-01 10:25:00+00', 0, 0, 0, false),

  -- Pinned & Hot Threads thread
  ('post-works-004-1', 't-works-004', 'admin-system',
   E'# Pinned & Hot Threads Explained 📌🔥\n\n## Pinned Threads\n\nThreads pinned by moderators stay at the top of their category. These usually contain:\n- Important announcements\n- Essential guides\n- Community resources\n\n## Hot Threads\n\nThreads become "hot" when they have:\n- High engagement\n- Recent activity\n- Many upvotes\n\nHot threads are automatically marked with a 🔥 badge!',
   '2024-01-01 10:30:00+00', 0, 0, 0, false),

  -- Security Updates thread
  ('post-updates-005-1', 't-updates-005', 'admin-system',
   E'# Security & Privacy Updates 🔒\n\n## Recent Security Improvements\n\n- Enhanced password requirements\n- Two-factor authentication available\n- Improved data encryption\n- Regular security audits\n\n## Privacy Policy\n\nWe''ve updated our privacy policy to be more transparent about:\n- Data collection\n- Data usage\n- Your rights\n- How to delete your data\n\nYour security and privacy are our top priorities!',
   '2024-01-01 10:35:00+00', 0, 0, 0, false),

  -- Customizing Profile thread
  ('post-start-004-1', 't-start-004', 'admin-system',
   E'# Customizing Your Profile ✨\n\n## Profile Options\n\n**Avatar**: Upload a profile picture (max 2MB)\n**Banner**: Add a cover image to your profile\n**Bio**: Tell others about yourself\n**Signature**: Appears below your posts\n\n## Tips\n\n- Use high-quality images\n- Keep your bio concise\n- Update regularly\n- Express your personality!\n\nMake your profile stand out!',
   '2024-01-01 10:40:00+00', 0, 0, 0, false),

  -- User Ranks thread
  ('post-start-003-1', 't-start-003', 'admin-system',
   E'# Understanding User Ranks & Reputation ⭐\n\n## Rank System\n\n- **Newcomer**: 0-99 reputation\n- **Member**: 100-499 reputation\n- **Regular**: 500-999 reputation\n- **Veteran**: 1000-4999 reputation\n- **Legend**: 5000+ reputation\n\n## Earning Reputation\n\n- Create threads: +10 points\n- Post replies: +5 points\n- Receive upvotes: +2 points\n- Get best answer: +15 points\n- Receive reactions: +1 point\n\nKeep contributing to level up!',
   '2024-01-01 10:45:00+00', 0, 0, 0, false),

  -- Notifications thread
  ('post-works-002-1', 't-works-002', 'admin-system',
   E'# Notifications & Activity Feed 🔔\n\n## Notification Types\n\n- New replies to your threads\n- Mentions (@username)\n- Upvotes on your content\n- New followers\n- Moderation actions\n\n## Managing Notifications\n\n- Click the bell icon to view\n- Mark as read/unread\n- Customize notification preferences\n- Enable/disable email notifications\n\nStay updated on what matters to you!',
   '2024-01-01 10:50:00+00', 0, 0, 0, false),

  -- What to Expect thread
  ('post-welcome-002-1', 't-welcome-002', 'admin-system',
   E'# What to Expect from This Community 🌟\n\n## Our Values\n\n- **Respect**: Everyone is welcome\n- **Quality**: We value thoughtful contributions\n- **Growth**: Learn and help others learn\n- **Fun**: Enjoy the discussions!\n\n## Community Culture\n\n- Friendly and supportive\n- Knowledge-sharing focused\n- Diverse perspectives welcomed\n- Constructive feedback encouraged\n\nWe''re building something special together!',
   '2024-01-01 10:55:00+00', 0, 0, 0, false),

  -- Member Spotlight thread
  ('post-welcome-003-1', 't-welcome-003', 'admin-system',
   E'# Member Spotlight & Success Stories 🏆\n\nThis thread celebrates our amazing community members!\n\n## Featured Members\n\nWe''ll regularly highlight members who:\n- Provide exceptional help\n- Create valuable content\n- Foster positive discussions\n- Contribute consistently\n\n## Share Your Story\n\nHave a success story? Share how this community helped you!\n\nLet''s celebrate our wins together! 🎉',
   '2024-01-01 11:00:00+00', 0, 0, 0, false),

  -- Upcoming Features thread
  ('post-updates-002-1', 't-updates-002', 'admin-system',
   E'# Upcoming Features & Roadmap 🗺️\n\n## Coming Soon\n\n- **Q1 2024**\n  - Direct messaging system\n  - Advanced search\n  - Custom themes\n\n- **Q2 2024**\n  - Mobile app\n  - API access\n  - Integrations\n\n- **Q3 2024**\n  - Events system\n  - Badges & achievements\n  - Enhanced analytics\n\nExcited for what''s ahead!',
   '2024-01-01 11:05:00+00', 0, 0, 0, false),

  -- Maintenance Schedule thread
  ('post-updates-003-1', 't-updates-003', 'admin-system',
   E'# Maintenance Schedule & Downtime ⚙️\n\n## Scheduled Maintenance\n\nWe perform regular maintenance to keep the forum running smoothly.\n\n**Typical Schedule**: \n- Every Sunday, 2:00 AM - 4:00 AM UTC\n- Duration: Usually under 30 minutes\n- Advance notice: 48 hours\n\n## During Maintenance\n\n- Forum will be in read-only mode\n- No new posts or edits\n- Viewing content is still possible\n\nWe''ll keep downtime to a minimum!',
   '2024-01-01 11:10:00+00', 0, 0, 0, false)

ON CONFLICT (id) DO NOTHING;

-- Update thread reply counts to match the posts we just added
UPDATE public.threads SET reply_count = 0 WHERE id IN (
  't-welcome-001', 't-updates-001', 't-rules-001', 't-works-001', 't-start-001',
  't-works-003', 't-works-004', 't-updates-005', 't-start-004', 't-start-003',
  't-works-002', 't-welcome-002', 't-welcome-003', 't-updates-002', 't-updates-003'
);
