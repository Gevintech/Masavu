import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let email = formData.identifier;

      // If not an email, search by username
      if (!formData.identifier.includes('@')) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', formData.identifier.toLowerCase())
          .maybeSingle();
        
        if (!userData) {
          toast({ title: 'User not found', variant: 'destructive' });
          setLoading(false);
          return;
        }
        email = userData.email;
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error || !authData.user) {
        toast({ title: 'Invalid credentials', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast({ title: 'Access denied. Admin only.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      toast({ title: 'Admin login successful!' });
      navigate('/admin/dashboard');
    } catch (error) {
      console.error(error);
      toast({ title: 'Login failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-muted-foreground">Login with your admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="identifier">Username or Email</Label>
            <Input
              id="identifier"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              placeholder="Enter username or email"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
              required
            />
          </div>

          <Button type="submit" className="w-full gradient-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login as Admin'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
