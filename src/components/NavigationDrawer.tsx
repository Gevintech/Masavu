import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Menu,
  Home,
  Youtube,
  Music2,
  HelpCircle,
  Calculator,
  Gift,
  Plane,
  Banknote,
  Users,
  Wallet,
  History,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';

interface NavigationDrawerProps {
  onLogout: () => void;
}

const NavigationDrawer = ({ onLogout }: NavigationDrawerProps) => {
  const [open, setOpen] = useState(false);

  const closeDrawer = () => setOpen(false);

  const menuItems = [
    { label: 'Dashboard', icon: Home, to: '/dashboard' },
    { label: 'YouTube Earnings', icon: Youtube, to: '/earn/youtube' },
    { label: 'TikTok Earnings', icon: Music2, to: '/earn/tiktok' },
    { label: 'Quiz Earnings', icon: HelpCircle, to: '/earn/quiz' },
    { label: 'Math Earnings', icon: Calculator, to: '/earn/math' },
    { label: 'Daily Bonus', icon: Gift, to: '/earn/daily' },
    { label: 'Aviator Signals', icon: Plane, to: '/earn/aviator' },
    { label: 'Apply Loan', icon: Banknote, to: '/apply-loan' },
    { label: 'Referrals', icon: Users, to: '/referrals' },
    { label: 'Withdraw', icon: Wallet, to: '/withdraw' },
    { label: 'Transaction History', icon: History, to: '/transactions' },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-left">💰 Supercash</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeDrawer}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <item.icon className="w-5 h-5 text-primary" />
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => {
              closeDrawer();
              onLogout();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default NavigationDrawer;
