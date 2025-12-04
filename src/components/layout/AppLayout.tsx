import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  DollarSign,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const adminNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Inspection Reports', href: '/admin/inspections', icon: FileText },
  { title: 'Payout Reports', href: '/admin/payouts', icon: DollarSign },
  { title: 'User Management', href: '/admin/users', icon: Users },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

const agentNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/agent', icon: LayoutDashboard },
  { title: 'Inspection Reports', href: '/agent/inspections', icon: FileText },
  { title: 'Payout Reports', href: '/agent/payouts', icon: DollarSign },
];

interface HeaderDetails {
  company_name: string;
  logo_url: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [headerDetails, setHeaderDetails] = useState<HeaderDetails>({
    company_name: 'Loan Verification',
    logo_url: '',
  });

  const isAdmin = userRole === 'admin';
  const navItems = isAdmin ? adminNavItems : agentNavItems;

  useEffect(() => {
    fetchHeaderDetails();
  }, []);

  const fetchHeaderDetails = async () => {
    const { data } = await supabase
      .from('header_details')
      .select('company_name, logo_url')
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setHeaderDetails(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {headerDetails.logo_url ? (
            <img src={headerDetails.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate text-sm">
              {headerDetails.company_name}
            </h2>
            <p className="text-xs text-muted-foreground capitalize">
              {isAdmin ? 'Admin Portal' : 'Agent Portal'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => {
                navigate(item.href);
                setIsMobileOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-left">{item.title}</span>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="p-3 bg-secondary rounded-lg mb-3">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium text-foreground truncate">
            {user?.email}
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card">
        <NavContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <NavContent />
                </SheetContent>
              </Sheet>
              <h1 className="font-semibold text-foreground truncate">
                {headerDetails.company_name}
              </h1>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
