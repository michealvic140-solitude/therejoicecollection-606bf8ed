import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Gift, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

interface Prize {
  name: string;
  type: string;
  value: string;
  color: string;
}

interface SpinWheelData {
  id: string;
  title: string;
  prizes: Prize[];
}

const COLORS = [
  "hsl(40,70%,45%)", "hsl(220,50%,25%)", "hsl(35,80%,50%)", "hsl(240,30%,20%)",
  "hsl(30,60%,40%)", "hsl(260,40%,25%)", "hsl(45,65%,55%)", "hsl(200,40%,20%)",
];

export function SpinWheel() {
  const { user } = useAuth();
  const [wheel, setWheel] = useState<SpinWheelData | null>(null);
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    supabase.from("spin_wheels").select("*").eq("active", true).limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        const w = data[0];
        const prizes = (w.prizes as any[] || []).map((p: any, i: number) => ({
          ...p,
          color: COLORS[i % COLORS.length],
        }));
        if (prizes.length >= 2) {
          setWheel({ id: w.id, title: w.title, prizes });
          setTimeout(() => setOpen(true), 3000);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!wheel || !canvasRef.current) return;
    drawWheel(canvasRef.current, wheel.prizes, rotation);
  }, [wheel, rotation]);

  const drawWheel = (canvas: HTMLCanvasElement, prizes: Prize[], rot: number) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 12;
    const arc = (2 * Math.PI) / prizes.length;

    ctx.clearRect(0, 0, size, size);

    // Outer glow
    ctx.save();
    ctx.shadowColor = "hsla(40,70%,50%,0.4)";
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.strokeStyle = "hsl(40,70%,50%)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.translate(-center, -center);

    prizes.forEach((prize, i) => {
      const angle = i * arc;
      // Segment
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.fillStyle = prize.color;
      ctx.fill();
      // Border
      ctx.strokeStyle = "hsla(40,70%,50%,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner shine
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
      gradient.addColorStop(0, "hsla(0,0%,100%,0.08)");
      gradient.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px 'DM Sans'";
      ctx.textAlign = "right";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(prize.name.slice(0, 14), radius - 18, 4);
      ctx.restore();
    });

    // Decorative dots
    prizes.forEach((_, i) => {
      const angle = i * arc;
      for (let d = 0.3; d < 0.9; d += 0.15) {
        ctx.beginPath();
        ctx.arc(center + Math.cos(angle + arc / 2) * radius * d, center + Math.sin(angle + arc / 2) * radius * d, 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = "hsla(40,70%,50%,0.15)";
        ctx.fill();
      }
    });

    ctx.restore();

    // Center button
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    const cGrad = ctx.createRadialGradient(center - 5, center - 5, 0, center, center, 28);
    cGrad.addColorStop(0, "hsl(40,80%,60%)");
    cGrad.addColorStop(1, "hsl(35,70%,40%)");
    ctx.fillStyle = cGrad;
    ctx.fill();
    ctx.strokeStyle = "hsla(0,0%,100%,0.4)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px 'DM Sans'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SPIN", center, center);
  };

  const spin = async () => {
    if (!wheel || spinning || !user) {
      if (!user) toast.error("Please sign in to spin!");
      return;
    }
    setSpinning(true);
    setResult(null);

    const winIndex = Math.floor(Math.random() * wheel.prizes.length);
    const arc = 360 / wheel.prizes.length;
    const targetAngle = 360 - (winIndex * arc + arc / 2);
    const totalRotation = 360 * 8 + targetAngle;

    let start = rotation;
    const duration = 5000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = start + totalRotation * eased;
      setRotation(current % 360);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setRotation(totalRotation % 360);
        const prize = wheel.prizes[winIndex];
        setResult(prize);
        setSpinning(false);
        setHasSpun(true);

        supabase.from("spin_results").insert({
          user_id: user.id,
          spin_wheel_id: wheel.id,
          prize_name: prize.name,
          prize_type: prize.type,
          prize_value: prize.value,
        } as any);

        // If prize is a coupon/discount, auto-create coupon for user
        if (prize.type === "discount" || prize.type === "voucher") {
          supabase.from("coupons").insert({
            code: `SPIN-${Date.now().toString(36).toUpperCase()}`,
            discount_percent: prize.type === "discount" ? parseFloat(prize.value) || 0 : 0,
            discount_amount: prize.type === "voucher" ? parseFloat(prize.value) || 0 : 0,
            user_id: user.id,
            for_all_users: false,
            source: "spin",
            active: true,
            expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
          } as any);
        }

        toast.success(`You won: ${prize.name}!`);
      }
    };
    requestAnimationFrame(animate);
  };

  if (!wheel) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[420px] p-0 border-0 overflow-hidden bg-transparent shadow-none [&>button]:hidden">
        <div className="relative glass-strong rounded-2xl overflow-hidden border border-gold/20">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gold/10 rounded-full blur-[60px] pointer-events-none" />

          {/* Close button */}
          <button onClick={() => setOpen(false)} className="absolute top-4 right-4 z-20 p-2 rounded-full glass hover:bg-white/10 text-white/70 hover:text-white transition-all">
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="relative pt-6 pb-3 text-center px-6">
            <div className="flex justify-center gap-1 mb-2">
              <Star className="h-4 w-4 text-gold animate-pulse" />
              <Sparkles className="h-5 w-5 text-gold" />
              <Star className="h-4 w-4 text-gold animate-pulse" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gradient-gold">{wheel.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">Try your luck and win amazing prizes!</p>
          </div>

          {/* Wheel */}
          <div className="flex justify-center py-4 relative px-6">
            {/* Pointer */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10">
              <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-gold drop-shadow-[0_2px_8px_hsla(40,70%,50%,0.5)]" />
            </div>
            <div className="relative">
              {/* Outer ring */}
              <div className="absolute -inset-3 rounded-full border-2 border-gold/20 animate-glow" />
              <canvas
                ref={canvasRef}
                width={320}
                height={320}
                className="rounded-full shadow-[0_0_40px_hsla(40,70%,50%,0.2),inset_0_0_20px_hsla(0,0%,0%,0.3)]"
              />
            </div>
          </div>

          {/* Result or Spin Button */}
          <div className="px-6 pb-6">
            {result ? (
              <div className="text-center space-y-3 animate-fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-gold animate-glow mx-auto">
                  <Gift className="h-8 w-8 text-primary-foreground" />
                </div>
                <p className="font-display text-xl font-bold text-gold">{result.name}</p>
                <p className="text-sm text-muted-foreground">
                  {result.type === "discount" ? `${result.value}% discount coupon added!` :
                    result.type === "voucher" ? `₦${result.value} voucher added to your account!` :
                      `${result.type} — ${result.value}`}
                </p>
                <Button onClick={() => setOpen(false)} className="gradient-gold text-primary-foreground w-full">
                  Claim Prize
                </Button>
              </div>
            ) : (
              <Button
                onClick={spin}
                disabled={spinning || hasSpun}
                className="w-full gradient-gold text-primary-foreground text-lg py-6 animate-glow font-display tracking-wide"
                size="lg"
              >
                {spinning ? "Spinning..." : hasSpun ? "Already Spun" : "SPIN NOW!"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
