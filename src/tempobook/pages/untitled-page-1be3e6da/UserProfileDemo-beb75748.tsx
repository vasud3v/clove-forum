import { useNavigate } from "react-router-dom";
import { useForumContext } from "@/context/ForumContext";

export default function UserProfileDemo() {
  const navigate = useNavigate();
  const { currentUser } = useForumContext();

  // Demo now shows only the current user since we removed mock data
  const users = currentUser ? [currentUser] : [];

  return (
    <div className="min-h-screen bg-forum-bg p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-[16px] font-bold text-forum-text font-mono mb-2">
          User Profile Pages
        </h2>
        <p className="text-[11px] text-forum-muted font-mono mb-6">
          Click any user below to view their full profile page.
        </p>
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => navigate(`/user/${user.id}`)}
              className="hud-panel flex items-center gap-3 px-4 py-3 cursor-pointer hover:border-forum-pink/30 transition-forum group"
            >
              <img
                src={user.avatar}
                alt={user.username}
                className="h-10 w-10 rounded-lg border border-forum-border object-cover group-hover:border-forum-pink/40 transition-forum"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-mono font-bold text-forum-text group-hover:text-forum-pink transition-forum">
                  {user.username}
                </div>
                <div className="text-[9px] font-mono text-forum-muted">
                  {user.rank || "Member"} · {user.postCount} posts · {user.reputation} rep
                </div>
              </div>
              <div className={`h-2 w-2 rounded-full ${user.isOnline ? "bg-emerald-400" : "bg-forum-muted/30"}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
