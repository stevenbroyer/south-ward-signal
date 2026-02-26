'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminLoadingScreen } from '@/components/admin/AdminLoadingScreen';

// Map pathnames to page titles
function getPageTitle(pathname: string): string {
  if (pathname === '/admin') return 'Overview';
  if (pathname.startsWith('/admin/articles/')) return 'Article Detail';
  if (pathname === '/admin/articles') return 'Articles';
  if (pathname.startsWith('/admin/social/')) return 'Social Post';
  if (pathname === '/admin/social') return 'Social Queue';
  if (pathname === '/admin/matches') return 'Matches';
  if (pathname === '/admin/analytics') return 'Analytics';
  if (pathname === '/admin/login') return 'Login';
  return 'Admin';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAdminAuth();

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
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title={title} userEmail={user.email} onSignOut={signOut} />
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
