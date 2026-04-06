import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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

const COLORS = ["#C8A23D", "#1a1a2e", "#D4AF37", "#2d2d44", "#B8860B", "#3d3d5c", "#DAA520", "#4d4d6e"];

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
          // Show after 3 second delay
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
    const radius = center - 10;
    const arc = (2 * Math.PI) / prizes.length;

    ctx.clearRect(0, 0, size, size);
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
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px 'DM Sans'";
      ctx.textAlign = "right";
      ctx.fillText(prize.name.slice(0, 14), radius - 15, 4);
      ctx.restore();
    });

    ctx.restore();

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#C8A23D";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px 'DM Sans'";
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

        // Save result
        supabase.from("spin_results").insert({
          user_id: user.id,
          spin_wheel_id: wheel.id,
          prize_name: prize.name,
          prize_type: prize.type,
          prize_value: prize.value,
        } as any);

        toast.success(`🎉 You won: ${prize.name}!`);
      }
    };
    requestAnimationFrame(animate);
  };

  if (!wheel) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass-strong max-w-sm p-0 border-gold/20 overflow-hidden">
        <div className="relative">
          <div className="absolute top-3 right-3 z-10">
            <button onClick={() => setOpen(false)} className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="bg-gradient-to-b from-gold/20 to-transparent p-6 text-center">
            <h2 className="font-display text-2xl font-bold text-gradient-gold mb-1">{wheel.title}</h2>
            <p className="text-sm text-muted-foreground">Spin the wheel for a chance to win!</p>
          </div>
          <div className="flex justify-center py-4 relative">
            {/* Pointer */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-gold" />
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              className="rounded-full shadow-[0_0_30px_hsla(40,70%,50%,0.3)]"
            />
          </div>
          {result ? (
            <div className="p-6 text-center space-y-3">
              <div className="text-4xl">🎉</div>
              <p className="font-display text-xl font-bold text-gold">You won: {result.name}!</p>
              <p className="text-sm text-muted-foreground">Type: {result.type} — Value: {result.value}</p>
              <Button onClick={() => setOpen(false)} className="gradient-gold text-primary-foreground">
                Claim Prize
              </Button>
            </div>
          ) : (
            <div className="p-6 text-center">
              <Button
                onClick={spin}
                disabled={spinning || hasSpun}
                className="gradient-gold text-primary-foreground text-lg px-8 py-3 animate-glow"
                size="lg"
              >
                {spinning ? "Spinning..." : hasSpun ? "Already Spun" : "SPIN NOW!"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
