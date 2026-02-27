import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

const Home = lazy(() => import("./components/home"));
const CategoryThreadsPage = lazy(() => import("./components/forum/CategoryThreadsPage"));
const ThreadDetailPage = lazy(() => import("./components/forum/ThreadDetailPage"));
const UserProfilePage = lazy(() => import("./components/forum/UserProfilePage"));
const LoginPage = lazy(() => import("./components/auth/LoginPage"));
const SignupPage = lazy(() => import("./components/auth/SignupPage"));
const WhatsNewPage = lazy(() => import("./components/forum/WhatsNewPage"));
const MembersPage = lazy(() => import("./components/forum/MembersPage"));
const ForumRulesPage = lazy(() => import("./components/forum/ForumRulesPage"));
const SearchPage = lazy(() => import("./components/forum/SearchPage"));
const PostBookmarksPage = lazy(() => import("./components/forum/PostBookmarksPage"));
const WatchedThreadsPage = lazy(() => import("./components/forum/WatchedThreadsPage"));
const AdminDashboard = lazy(() => import("./components/forum/AdminDashboard"));
const AnalyticsDashboard = lazy(() => import("./components/forum/AnalyticsDashboard"));

import { ForumProvider } from "@/context/ForumContext";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ToastContainer, useToast } from "@/components/forum/Toast";

function AppContent() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/whats-new" element={<WhatsNewPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/rules" element={<ForumRulesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/bookmarks" element={<PostBookmarksPage />} />
          <Route path="/watched" element={<WatchedThreadsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/category/:categoryId" element={<CategoryThreadsPage />} />
          <Route path="/thread/:threadId" element={<ThreadDetailPage />} />
          <Route path="/user/:userId" element={<UserProfilePage />} />
        </Routes>
      </Suspense>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ForumProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ForumProvider>
    </AuthProvider>
  );
}

export default App;
