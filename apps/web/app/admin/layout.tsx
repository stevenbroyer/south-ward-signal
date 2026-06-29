'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminLoadingScreen } from '@/components/admin/AdminLoadingScreen';

// Map pathnames to page titles
function getPageTitle(pathname: string): string {
  if (pathname === '/admin') return 'Overview';
  if (pathname === '/admin/articles/new') return 'New Article';
  if (pathname.endsWith('/edit')) return 'Edit Article';
  if (pathname.startsWith('/admin/articles/')) return 'Article Detail';
  if (pathname === '/admin/articles') return 'Articles';
  if (pathname.startsWith('/admin/social/')) return 'Social Post';
  if (pathname === '/admin/social') return 'Social Queue';
  if (pathname === '/admin/matches') return 'Matches';
  if (pathname === '/admin/analytics') return 'Analytics';
  if (pathname === '/admin/team') return 'Team';
  if (pathname === '/admin/login') return 'Login';
  return 'Admin';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Login page renders without the admin shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show loading screen while verifying session
  if (loading) {
    return <AdminLoadingScreen />;
  }

  // If not authenticated, redirect to login
  if (!user) {
    router.push('/admin/login');
    return <AdminLoadingScreen />;
  }

  const title = getPageTitle(pathname);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <AdminSidebar className="hidden md:flex" />

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <AdminSidebar className="relative z-10 flex" onNavigate={() => setMenuOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title={title}
          userEmail={user.email}
          onSignOut={signOut}
          onMenuClick={() => setMenuOpen(true)}
        />
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
