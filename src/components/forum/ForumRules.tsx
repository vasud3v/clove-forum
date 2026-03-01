import { useState } from 'react';
import {
  Shield,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Users,
  BookOpen,
  Gavel,
  Terminal,
} from 'lucide-react';

interface Rule {
  id: number;
  title: string;
  description: string;
  icon: typeof CheckCircle2;
  severity: 'critical' | 'important' | 'moderate';
}

interface RuleSection {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Users;
  accentColor: string;
  rules: Rule[];
}

const ruleSections: RuleSection[] = [
  {
    id: 'community',
    title: 'Community Guidelines',
    subtitle: 'How we treat each other',
    icon: Users,
    accentColor: 'text-forum-pink',
    rules: [
      {
        id: 1,
        title: 'Be Respectful & Constructive',
        description:
          'Treat all members with respect regardless of experience level. Disagree with ideas, not people. Personal attacks, harassment, hate speech, or discriminatory language will result in immediate action.',
        icon: CheckCircle2,
        severity: 'critical',
      },
      {
        id: 2,
        title: 'No Personal Information Sharing',
        description:
          'Never share personal information (real names, addresses, phone numbers, emails, social media accounts) of yourself or others. Protect your privacy and respect others\' privacy.',
        icon: AlertTriangle,
        severity: 'critical',
      },
      {
        id: 3,
        title: 'Keep Content Appropriate',
        description:
          'This is a professional community. No NSFW content, graphic violence, illegal activities, or content that violates intellectual property rights. Keep discussions work-safe.',
        icon: AlertTriangle,
        severity: 'critical',
      },
      {
        id: 4,
        title: 'One Account Per Person',
        description:
          'Creating multiple accounts to manipulate votes, evade bans, or impersonate others is prohibited. If you need to change your username, contact a moderator.',
        icon: XCircle,
        severity: 'critical',
      },
      {
        id: 5,
        title: 'English Language Primary',
        description:
          'Use English as the primary language for posts and threads to ensure everyone can participate. Content in other languages is acceptable in designated international sections.',
        icon: Info,
        severity: 'moderate',
      },
    ],
  },
  {
    id: 'posting',
    title: 'Posting Guidelines',
    subtitle: 'Creating quality content',
    icon: BookOpen,
    accentColor: 'text-cyan-400',
    rules: [
      {
        id: 6,
        title: 'Write Clear, Descriptive Titles',
        description:
          'Titles should summarize your topic clearly. Bad: "Help!", "Question", "Look at this". Good: "Best vacation spots in Europe", "How to start a garden", "Recommendations for beginner-friendly recipes".',
        icon: Info,
        severity: 'important',
      },
      {
        id: 7,
        title: 'Choose the Right Category',
        description:
          'Post threads in the most relevant category. Use tags to add context. Misplaced threads may be moved by moderators. Check category descriptions before posting.',
        icon: Info,
        severity: 'moderate',
      },
      {
        id: 8,
        title: 'Search Before Asking',
        description:
          'Use the search function to check if your question has been answered. Duplicate threads clutter the forum and waste everyone\'s time. Link to related threads when relevant.',
        icon: CheckCircle2,
        severity: 'important',
      },
      {
        id: 9,
        title: 'Provide Context & Details',
        description:
          'Include relevant information: what you\'re sharing, why it matters, relevant background, sources if applicable. The more context you provide, the better discussions you\'ll have.',
        icon: Info,
        severity: 'important',
      },
      {
        id: 10,
        title: 'Format Content Properly',
        description:
          'Use proper formatting for readability. Break up long text into paragraphs, use lists for multiple points, and include images or links when relevant. Well-formatted posts get more engagement.',
        icon: Info,
        severity: 'important',
      },
      {
        id: 11,
        title: 'Stay On Topic',
        description:
          'Keep replies relevant to the thread topic. If discussion naturally diverges, create a new thread and link to it. Off-topic derailing disrupts productive conversations.',
        icon: Info,
        severity: 'moderate',
      },
      {
        id: 12,
        title: 'Mark Solutions & Give Credit',
        description:
          'When your question is answered, mark the helpful reply as the solution. Give credit to those who help you. This helps future users with similar problems.',
        icon: CheckCircle2,
        severity: 'moderate',
      },
    ],
  },
  {
    id: 'moderation',
    title: 'Community Standards',
    subtitle: 'What we don\'t allow',
    icon: Gavel,
    accentColor: 'text-amber-400',
    rules: [
      {
        id: 13,
        title: 'No Spam or Low-Effort Posts',
        description:
          'Don\'t post repetitive content, one-word replies, or "+1" comments. Use the upvote button instead. Contribute meaningful value to discussions.',
        icon: XCircle,
        severity: 'important',
      },
      {
        id: 14,
        title: 'Self-Promotion Guidelines',
        description:
          'Sharing your projects is welcome in the Showcase category. Don\'t spam links to your products, services, or social media. Contribute to the community before promoting.',
        icon: AlertTriangle,
        severity: 'important',
      },
      {
        id: 15,
        title: 'No Asking for Upvotes or Reputation',
        description:
          'Don\'t ask for upvotes, reputation points, or manipulate the voting system. Earn reputation through quality contributions. Vote manipulation results in penalties.',
        icon: XCircle,
        severity: 'critical',
      },
      {
        id: 16,
        title: 'Respect Intellectual Property',
        description:
          'Don\'t share pirated content, leaked materials, or copyrighted work without permission. Give proper attribution when sharing others\' content. Respect creators\' rights.',
        icon: AlertTriangle,
        severity: 'critical',
      },
      {
        id: 17,
        title: 'No Backseat Moderating',
        description:
          'Don\'t act as a moderator if you aren\'t one. Use the report button to flag rule violations. Publicly calling out users or issuing warnings creates unnecessary drama.',
        icon: CheckCircle2,
        severity: 'moderate',
      },
      {
        id: 18,
        title: 'No Homework or Assignment Requests',
        description:
          'Don\'t ask others to complete your homework, school assignments, or work projects. We\'re here for discussion and learning, not to do your work for you.',
        icon: XCircle,
        severity: 'important',
      },
    ],
  },
];

const severityConfig = {
  critical: {
    label: 'CRITICAL',
    dotColor: 'bg-red-400',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  important: {
    label: 'IMPORTANT',
    dotColor: 'bg-amber-400',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  moderate: {
    label: 'MODERATE',
    dotColor: 'bg-forum-muted',
    textColor: 'text-forum-muted',
    bgColor: 'bg-forum-bg/50',
    borderColor: 'border-forum-border',
  },
};

function RuleSectionPanel({ section }: { section: RuleSection }) {
  const [isOpen, setIsOpen] = useState(true);
  const SectionIcon = section.icon;

  return (
    <div className="rounded-md border border-forum-border/50 bg-forum-bg/30 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="transition-forum flex w-full items-center justify-between px-3 py-2.5 hover:bg-forum-hover group"
      >
        <div className="flex items-center gap-2.5">
          <SectionIcon size={13} className={section.accentColor} />
          <div className="text-left">
            <span className="text-[11px] font-bold text-forum-text font-mono group-hover:text-forum-pink transition-forum">
              {section.title}
            </span>
            <span className="text-[9px] text-forum-muted font-mono ml-2">
              — {section.subtitle}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono text-forum-muted/50 uppercase tracking-wider">
            {section.rules.length} rules
          </span>
          <div className="transition-forum text-forum-muted group-hover:text-forum-pink">
            {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </div>
        </div>
      </button>

      <div
        className="transition-all duration-200 ease-out overflow-hidden"
        style={{
          maxHeight: isOpen ? `${section.rules.length * 100 + 20}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="border-t border-forum-border/30 px-3 py-2 space-y-1.5">
          {section.rules.map((rule) => {
            const RuleIcon = rule.icon;
            const sev = severityConfig[rule.severity];
            return (
              <div
                key={rule.id}
                className="flex items-start gap-2.5 rounded-sm px-2.5 py-2 bg-forum-card/30 border border-forum-border/30 hover:border-forum-pink/20 transition-forum group/rule"
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-sm border flex-shrink-0 mt-0.5 ${sev.bgColor} ${sev.borderColor}`}
                >
                  <RuleIcon size={10} className={sev.textColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-forum-text font-mono group-hover/rule:text-forum-pink transition-forum">
                      {rule.title}
                    </span>
                    <span
                      className={`text-[7px] font-mono font-bold uppercase tracking-widest px-1.5 py-[1px] rounded-sm border ${sev.bgColor} ${sev.borderColor} ${sev.textColor}`}
                    >
                      {sev.label}
                    </span>
                  </div>
                  <p className="text-[9px] text-forum-muted font-mono leading-[1.6]">
                    {rule.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ForumRules() {
  const [isExpanded, setIsExpanded] = useState(true);
  const totalRules = ruleSections.reduce((sum, s) => sum + s.rules.length, 0);

  return (
    <div className="hud-panel overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="transition-forum flex w-full items-center justify-between px-4 py-3 hover:bg-forum-hover group"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-forum-pink/10 border border-forum-pink/20">
            <Shield size={14} className="text-forum-pink" />
          </div>
          <div className="text-left">
            <h4 className="text-[12px] font-bold text-forum-text font-mono group-hover:text-forum-pink transition-forum">
              Forum Rules & Guidelines
            </h4>
            <p className="text-[9px] text-forum-muted font-mono">
              {totalRules} rules • {ruleSections.length} sections • Please read carefully
            </p>
          </div>
        </div>
        <div className="transition-forum text-forum-muted group-hover:text-forum-pink">
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      <div
        className="transition-all duration-200 ease-out overflow-hidden"
        style={{
          maxHeight: isExpanded ? '3000px' : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="border-t border-forum-border px-4 py-3 space-y-3">
          {/* Terminal-style intro */}
          <div className="rounded-md border border-forum-border/50 bg-forum-bg/60 px-3 py-2.5">
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={11} className="text-forum-pink" />
              <span className="text-[9px] font-mono font-bold text-forum-pink uppercase tracking-wider">
                system://rules.init
              </span>
            </div>
            <div className="font-mono text-[9px] text-forum-muted leading-[1.7] space-y-1">
              <p>
                <span className="text-forum-pink">$</span> Welcome to our community. These rules help maintain a productive, respectful, and helpful environment for everyone.
              </p>
              <p>
                <span className="text-forum-pink">$</span> By participating, you agree to follow all guidelines. Violations may result in warnings, temporary suspensions, or permanent bans depending on severity.
              </p>
              <p>
                <span className="text-forum-pink">$</span> Rules are enforced fairly by our moderation team. If you believe a decision was unfair, you may appeal through the proper channels.
              </p>
            </div>
          </div>

          {/* Severity Legend */}
          <div className="flex items-center gap-4 pb-2 border-b border-forum-border/50">
            <span className="text-[9px] font-mono font-bold text-forum-muted uppercase tracking-wider">Severity:</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="text-[9px] font-mono text-red-400">Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-[9px] font-mono text-amber-400">Important</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-forum-muted" />
              <span className="text-[9px] font-mono text-forum-muted">Moderate</span>
            </div>
          </div>

          {/* Collapsible rule sections */}
          {ruleSections.map((section) => (
            <RuleSectionPanel key={section.id} section={section} />
          ))}

          {/* Violation Consequences */}
          <div className="rounded-md border border-red-500/20 bg-red-500/[0.03] px-3 py-3">
            <h5 className="text-[10px] font-bold text-forum-pink font-mono mb-2.5 flex items-center gap-1.5">
              <AlertTriangle size={10} />
              Enforcement & Consequences
            </h5>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="text-[9px] font-mono text-forum-muted/50 w-6 flex-shrink-0 text-right mt-[1px]">01</span>
                <div className="h-[1px] flex-shrink-0 w-3 bg-forum-border mt-[7px]" />
                <p className="text-[9px] text-forum-muted font-mono leading-relaxed">
                  <span className="text-amber-400 font-semibold">First Violation:</span> Official warning via private message with explanation
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-[9px] font-mono text-forum-muted/50 w-6 flex-shrink-0 text-right mt-[1px]">02</span>
                <div className="h-[1px] flex-shrink-0 w-3 bg-forum-border mt-[7px]" />
                <p className="text-[9px] text-forum-muted font-mono leading-relaxed">
                  <span className="text-amber-400 font-semibold">Second Violation:</span> 3-7 day temporary suspension + content removal
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-[9px] font-mono text-forum-muted/50 w-6 flex-shrink-0 text-right mt-[1px]">03</span>
                <div className="h-[1px] flex-shrink-0 w-3 bg-forum-border mt-[7px]" />
                <p className="text-[9px] text-forum-muted font-mono leading-relaxed">
                  <span className="text-red-400 font-semibold">Third Violation:</span> 30-day suspension + reputation reset
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-[9px] font-mono text-forum-muted/50 w-6 flex-shrink-0 text-right mt-[1px]">!!</span>
                <div className="h-[1px] flex-shrink-0 w-3 bg-red-500/30 mt-[7px]" />
                <p className="text-[9px] text-forum-muted font-mono leading-relaxed">
                  <span className="text-red-400 font-semibold">Severe Violations:</span> Immediate permanent ban (harassment, illegal content, doxxing)
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-red-500/10">
              <p className="text-[9px] text-forum-muted/70 font-mono leading-relaxed italic">
                Note: Moderators may adjust penalties based on context, intent, and violation history. Repeat offenders face escalating consequences.
              </p>
            </div>
          </div>

          {/* Appeals process */}
          <div className="rounded-md border border-forum-border/50 bg-forum-bg/40 px-3 py-2.5">
            <h5 className="text-[10px] font-bold text-cyan-400 font-mono mb-1.5 flex items-center gap-1.5">
              <Info size={10} />
              Appeals & Questions
            </h5>
            <div className="font-mono text-[9px] text-forum-muted leading-[1.7] space-y-1">
              <p>
                <span className="text-cyan-400">→</span> If you believe a moderation decision was unfair, submit an appeal via the <span className="text-forum-pink">Moderation Appeals</span> thread within 7 days.
              </p>
              <p>
                <span className="text-cyan-400">→</span> Appeals are reviewed by a different moderator within 48-72 hours. Provide clear reasoning and evidence to support your case.
              </p>
              <p>
                <span className="text-cyan-400">→</span> For rule clarifications or questions, contact moderators via private message. Don't argue about rules in public threads.
              </p>
              <p>
                <span className="text-cyan-400">→</span> Abusing the appeals process or harassing moderators will result in additional penalties and loss of appeal privileges.
              </p>
            </div>
          </div>

          <p className="text-[9px] text-forum-muted/60 font-mono text-center mt-3 italic">
            Last updated: February 2026 · Questions? Contact a moderator · <span className="text-forum-pink/50">v3.0.0</span>
          </p>
        </div>
      </div>
    </div>
  );
}
