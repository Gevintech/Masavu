import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, Gift, TrendingUp } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">💰 Supercash</h1>
        <Link to="/login">
          <Button variant="outline" size="sm">Login</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="px-4 py-12 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Earn Money <span className="text-primary">Daily!</span>
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Watch videos, complete tasks, refer friends and earn real money with Supercash!
        </p>
        <Link to="/register">
          <Button size="lg" className="gradient-primary text-primary-foreground font-semibold px-8">
            Get Started
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="px-4 py-8 grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <FeatureCard 
          icon={<DollarSign className="w-8 h-8" />}
          title="Daily Earnings"
          description="Earn up to 5000 UGX daily"
          color="text-green-400"
        />
        <FeatureCard 
          icon={<Users className="w-8 h-8" />}
          title="Referral Bonus"
          description="Get 2500 UGX per referral"
          color="text-blue-400"
        />
        <FeatureCard 
          icon={<Gift className="w-8 h-8" />}
          title="Free Tasks"
          description="Complete simple tasks"
          color="text-purple-400"
        />
        <FeatureCard 
          icon={<TrendingUp className="w-8 h-8" />}
          title="Instant Withdraw"
          description="Withdraw to Mobile Money"
          color="text-yellow-400"
        />
      </section>

      {/* CTA */}
      <section className="px-4 py-12 text-center">
        <div className="bg-card rounded-2xl p-6 max-w-md mx-auto card-glow">
          <h3 className="text-xl font-bold mb-2">Start Earning Now!</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Join thousands of users already making money
          </p>
          <Link to="/register">
            <Button className="w-full gradient-gold text-accent-foreground font-semibold">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) => (
  <div className="bg-card rounded-xl p-4 text-center">
    <div className={`${color} mb-2 flex justify-center`}>{icon}</div>
    <h4 className="font-semibold text-sm">{title}</h4>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

export default Index;
