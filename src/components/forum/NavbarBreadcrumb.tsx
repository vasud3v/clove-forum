import { ChevronRight, Home } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Breadcrumb {
  label: string;
  path?: string;
}

export function NavbarBreadcrumb() {
  const navigate = useNavigate();
  const location = useLocation();

  const breadcrumbMap: { [key: string]: Breadcrumb[] } = {
    '/': [{ label: 'Forums', path: '/' }],
    '/members': [{ label: 'Forums', path: '/' }, { label: 'Members' }],
    '/rules': [{ label: 'Forums', path: '/' }, { label: 'Rules' }],
    '/support': [{ label: 'Forums', path: '/' }, { label: 'Support' }],
    '/watched': [{ label: 'Forums', path: '/' }, { label: 'Watched' }],
    '/bookmarks': [{ label: 'Forums', path: '/' }, { label: 'Bookmarks' }],
    '/messages': [{ label: 'Forums', path: '/' }, { label: 'Messages' }],
    '/following-feed': [{ label: 'Forums', path: '/' }, { label: 'Following Feed' }],
    '/search': [{ label: 'Forums', path: '/' }, { label: 'Search' }],
    '/whats-new': [{ label: 'Forums', path: '/' }, { label: "What's New" }],
  };

  const breadcrumbs = breadcrumbMap[location.pathname] || [{ label: 'Forums', path: '/' }];

  return (
    <nav className="hidden md:flex items-center gap-2 px-6 py-2 text-[10px] font-mono">
      {breadcrumbs.map((crumb, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {crumb.path ? (
            <button
              onClick={() => navigate(crumb.path!)}
              className="text-forum-text hover:text-primary transition-colors duration-200 hover:underline"
            >
              {idx === 0 && <Home size={10} className="inline mr-1" />}
              {crumb.label}
            </button>
          ) : (
            <span className="text-forum-muted">{crumb.label}</span>
          )}
          {idx < breadcrumbs.length - 1 && (
            <ChevronRight size={10} className="text-forum-border" />
          )}
        </div>
      ))}
    </nav>
  );
}
