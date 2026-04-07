import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4 animate-fade-in">
        <div className="w-24 h-24 mx-auto rounded-full gradient-gold flex items-center justify-center shadow-lg shadow-gold/30 animate-glow">
          <span className="font-display text-4xl font-bold text-primary-foreground">404</span>
        </div>
        <h1 className="font-display text-3xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button className="gap-2 gradient-gold text-primary-foreground">
              <Home className="h-4 w-4" /> Go Home
            </Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline" className="gap-2 glass border-gold/20">
              <ArrowLeft className="h-4 w-4" /> Browse Shop
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
