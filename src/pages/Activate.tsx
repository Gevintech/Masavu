import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, ExternalLink, MessageCircle } from 'lucide-react';

const Activate = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && profile?.is_activated) {
      navigate('/dashboard');
    }
  }, [profile, loading, navigate]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-2">💰 Smart Cash</h1>
        <p className="text-center text-muted-foreground mb-6">Activate Your Account</p>

        <div className="bg-card rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-warning flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Activation Required</h3>
              <p className="text-sm text-muted-foreground">
                Pay 5,000 UGX (or $2 USD) to activate your account and start earning!
              </p>
            </div>
          </div>

          <div className="bg-secondary rounded-lg p-4 mb-4">
            <h4 className="font-semibold mb-3">Payment Steps:</h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <div>
                  <p className="text-sm font-medium">Click the payment link below</p>
                  <p className="text-xs text-muted-foreground">Amount: 5,000 UGX</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <div>
                  <p className="text-sm font-medium">Enter your details:</p>
                  <p className="text-xs text-muted-foreground">
                    Username: <span className="font-mono text-primary">{profile.username}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Email: <span className="font-mono text-primary">{profile.email}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <div>
                  <p className="text-sm font-medium">Send screenshot proof to WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Include your username and email</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href="https://eversend.me/betasolutions"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full gradient-gold text-accent-foreground">
                <ExternalLink className="w-4 h-4 mr-2" />
                Pay 5,000 UGX Now
              </Button>
            </a>

            <a
              href={`https://wa.me/256778999768?text=${encodeURIComponent(`Hi, I just paid the activation fee for Smart Cash.\n\nUsername: ${profile.username}\nEmail: ${profile.email}\n\nPlease activate my account.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Proof to WhatsApp
              </Button>
            </a>
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground mt-4">
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <span>Your account will be activated within 24 hours after verification</span>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4">
          <h4 className="font-semibold mb-2">Your Details:</h4>
          <p className="text-sm text-muted-foreground">
            Username: <span className="font-mono">{profile.username}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Email: <span className="font-mono">{profile.email}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Referral Code: <span className="font-mono text-primary">{profile.referral_code}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Activate;
