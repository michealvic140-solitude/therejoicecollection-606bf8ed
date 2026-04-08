import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Gift, Sparkles, Star, RotateCcw } from "lucide-react";
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
  max_spins_per_user: number;
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
  const [spinsUsed, setSpinsUsed] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [wheelReady, setWheelReady] = useState(false);
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
          setWheel({
            id: w.id, title: w.title, prizes,
            max_spins_per_user: (w as any).max_spins_per_user || 1,
          });
          setTimeout(() => setOpen(true), 3000);
        }
      }
    });
  }, []);

  // Check how many times user has spun this wheel
  useEffect(() => {
    if (!user || !wheel) return;
    supabase.from("spin_results").select("id").eq("user_id", user.id).eq("spin_wheel_id", wheel.id)
      .then(({ data }) => {
        setSpinsUsed(data?.length || 0);
      });
  }, [user, wheel]);

  // Draw wheel when ready
  useEffect(() => {
    if (!wheel || !canvasRef.current) return;
    drawWheel(canvasRef.current, wheel.prizes, rotation);
    if (!wheelReady) setWheelReady(true);
  }, [wheel, rotation]);

  const drawWheel = (canvas: HTMLCanvasElement, prizes: Prize[], rot: number) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 12;
    const arc = (2 * Math.PI) / prizes.length;

    ctx.clearRect(0, 0, size, size);

    // Outer glow ring
    ctx.save();
    ctx.shadowColor = "hsla(40,70%,50%,0.5)";
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(center, center, radius + 10, 0, 2 * Math.PI);
    ctx.strokeStyle = "hsl(40,70%,50%)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Decorative outer dots
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(center + Math.cos(angle) * (radius + 6), center + Math.sin(angle) * (radius + 6), 3, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? "hsl(40,70%,50%)" : "hsl(0,0%,20%)";
      ctx.fill();
    }

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.translate(-center, -center);

    prizes.forEach((prize, i) => {
      const angle = i * arc;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = "hsla(40,70%,50%,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner gradient shine
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
      gradient.addColorStop(0, "hsla(0,0%,100%,0.1)");
      gradient.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Prize text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'DM Sans'";
      ctx.textAlign = "right";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 4;
      ctx.fillText(prize.name.slice(0, 14), radius - 20, 5);
      ctx.restore();
    });

    ctx.restore();

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 30, 0, 2 * Math.PI);
    const cGrad = ctx.createRadialGradient(center - 6, center - 6, 0, center, center, 30);
    cGrad.addColorStop(0, "hsl(40,80%,65%)");
    cGrad.addColorStop(1, "hsl(35,70%,38%)");
    ctx.fillStyle = cGrad;
    ctx.fill();
    ctx.strokeStyle = "hsla(0,0%,100%,0.5)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px 'DM Sans'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SPIN", center, center);
  };

  const canSpin = wheel && user && spinsUsed < wheel.max_spins_per_user && !spinning;

  const spin = async () => {
    if (!wheel || spinning || !user) {
      if (!user) toast.error("Please sign in to spin!");
      return;
    }
    if (spinsUsed >= wheel.max_spins_per_user) {
      toast.error("You've used all your spins!");
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
        setSpinsUsed(prev => prev + 1);

        supabase.from("spin_results").insert({
          user_id: user.id,
          spin_wheel_id: wheel.id,
          prize_name: prize.name,
          prize_type: prize.type,
          prize_value: prize.value,
        } as any);

        // Auto-create coupon for discount/voucher prizes
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
      <DialogContent className="max-w-[440px] p-0 border-0 overflow-hidden bg-transparent shadow-none [&>button]:hidden">
        <div className="relative glass-strong rounded-3xl overflow-hidden border-2 border-gold/30 shadow-[0_0_60px_hsla(40,70%,50%,0.15)]">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-gold/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/10 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-[60px] pointer-events-none" />

          {/* Close */}
          <button onClick={() => setOpen(false)} className="absolute top-4 right-4 z-20 p-2 rounded-full glass hover:bg-white/10 text-white/70 hover:text-white transition-all">
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="relative pt-7 pb-2 text-center px-6">
            <div className="flex justify-center gap-2 mb-3">
              <Star className="h-5 w-5 text-gold animate-pulse" />
              <RotateCcw className="h-6 w-6 text-gold animate-spin" style={{ animationDuration: "3s" }} />
              <Star className="h-5 w-5 text-gold animate-pulse" />
            </div>
            <h2 className="font-display text-3xl font-bold text-gradient-gold">{wheel.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Spin the wheel and win amazing prizes!
              {wheel.max_spins_per_user > 1 && ` (${wheel.max_spins_per_user - spinsUsed} spins left)`}
            </p>
          </div>

          {/* Wheel */}
          <div className="flex justify-center py-5 relative px-6">
            {/* Pointer */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
              <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[28px] border-l-transparent border-r-transparent border-t-gold drop-shadow-[0_2px_12px_hsla(40,70%,50%,0.6)]" />
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-full border-2 border-gold/25 animate-glow" />
              <div className="absolute -inset-6 rounded-full border border-gold/10" />
              <canvas
                ref={canvasRef}
                width={340}
                height={340}
                className="rounded-full shadow-[0_0_50px_hsla(40,70%,50%,0.25),inset_0_0_20px_hsla(0,0%,0%,0.3)]"
              />
            </div>
          </div>

          {/* Result or Spin */}
          <div className="px-6 pb-7">
            {result ? (
              <div className="text-center space-y-3 animate-fade-in">
                <div className="inline-flex items-center justify-center w-18 h-18 rounded-full gradient-gold animate-glow mx-auto p-4">
                  <Gift className="h-8 w-8 text-primary-foreground" />
                </div>
                <p className="font-display text-2xl font-bold text-gold">{result.name}</p>
                <p className="text-sm text-muted-foreground">
                  {result.type === "discount" ? `${result.value}% discount coupon added!` :
                    result.type === "voucher" ? `₦${result.value} voucher added to your account!` :
                    result.type === "nothing" ? "Better luck next time!" :
                      `${result.type} — ${result.value}`}
                </p>
                {spinsUsed < (wheel?.max_spins_per_user || 1) ? (
                  <Button onClick={() => setResult(null)} className="gradient-gold text-primary-foreground w-full gap-2">
                    <RotateCcw className="h-4 w-4" /> Spin Again ({(wheel?.max_spins_per_user || 1) - spinsUsed} left)
                  </Button>
                ) : (
                  <Button onClick={() => setOpen(false)} className="gradient-gold text-primary-foreground w-full">
                    Claim & Close
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={spin}
                disabled={!canSpin}
                className="w-full gradient-gold text-primary-foreground text-lg py-7 animate-glow font-display tracking-wider rounded-xl"
                size="lg"
              >
                {spinning ? (
                  <span className="flex items-center gap-2"><RotateCcw className="h-5 w-5 animate-spin" /> Spinning...</span>
                ) : !canSpin && spinsUsed >= (wheel?.max_spins_per_user || 1) ? "No Spins Left" : (
                  <span className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> SPIN NOW!</span>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
