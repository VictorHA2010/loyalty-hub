import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-elevated">
          <Shield size={28} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">LoyaltyHub</h1>
          <p className="text-muted-foreground mt-2">Plataforma de gestión de programas de lealtad</p>
        </div>
        <Button onClick={() => navigate('/login')} className="h-11 px-8 font-semibold">
          Acceder
        </Button>
      </div>
    </div>
  );
};

export default Index;
