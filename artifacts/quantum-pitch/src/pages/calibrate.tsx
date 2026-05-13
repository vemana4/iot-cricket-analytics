import { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Copy, Check, Radio, Cpu, ChevronRight, Activity } from "lucide-react";

const PUSHER_KEY = "7551dc90d2d1a24b4eee";
const PUSHER_CLUSTER = "ap2";
const LIVE_CHANNEL = "live-session-0338";
const THRESHOLD_MS2 = 29.4;

interface CalibrateResult {
  timestamp: string;
  sensor_found: boolean;
  sample_count: number;
  total_sample_count: number;
  peak_accel_ms2: number;
  peak_accel_g: number;
  peak_idx: number;
  passes_threshold: boolean;
  threshold_ms2: number;
  pace_kmh_if_valid: number | null;
  accel_trace: number[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      data-testid="button-copy-url"
      className="ml-2 p-1.5 text-muted-foreground hover:text-primary transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function AccelBar({ value, max = 60 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const isHot = value >= THRESHOLD_MS2;
  return (
    <div className="w-full h-1.5 bg-muted rounded-none overflow-hidden">
      <div
        className={`h-full transition-all duration-150 ${isHot ? "bg-primary" : "bg-muted-foreground/40"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function MiniTrace({ trace }: { trace: number[] }) {
  if (trace.length < 2) return null;
  const max = Math.max(...trace, THRESHOLD_MS2 * 1.1);
  const W = 200;
  const H = 48;
  const pts = trace.map((v, i) => {
    const x = (i / (trace.length - 1)) * W;
    const y = H - (v / max) * H;
    return `${x},${y}`;
  });
  const threshY = H - (THRESHOLD_MS2 / max) * H;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
      <line x1="0" y1={threshY} x2={W} y2={threshY} stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResultCard({ result, index }: { result: CalibrateResult; index: number }) {
  const pass = result.passes_threshold;
  return (
    <div
      data-testid={`card-calibrate-result-${index}`}
      className={`border-l-2 pl-4 py-3 pr-4 bg-card space-y-2 ${pass ? "border-primary" : "border-destructive"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono uppercase tracking-widest ${pass ? "text-primary" : "text-destructive"}`}>
            {pass ? "PASS" : "FAIL"}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {new Date(result.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {result.sensor_found ? (
            <Badge variant="outline" className="text-[10px] font-mono rounded-none border-primary/40 text-primary">SENSOR OK</Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px] font-mono rounded-none">NO SENSOR</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold font-mono tracking-tight" data-testid={`text-peak-g-${index}`}>
            {result.peak_accel_g}<span className="text-xs text-muted-foreground ml-0.5">G</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono uppercase">Peak</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono tracking-tight text-muted-foreground">
            {result.sample_count}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono uppercase">Samples</div>
        </div>
        <div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${pass ? "text-primary" : "text-muted-foreground"}`}>
            {pass ? `${result.pace_kmh_if_valid}` : "—"}
            {pass && <span className="text-xs text-muted-foreground ml-0.5">km/h</span>}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono uppercase">Est. Pace</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>0 m/s²</span>
          <span className="text-primary/60">3G threshold ({THRESHOLD_MS2} m/s²)</span>
          <span>60 m/s²</span>
        </div>
        <AccelBar value={result.peak_accel_ms2} max={60} />
      </div>

      {result.accel_trace.length > 1 && (
        <MiniTrace trace={result.accel_trace} />
      )}
    </div>
  );
}

export default function Calibrate() {
  const [connected, setConnected] = useState(false);
  const [results, setResults] = useState<CalibrateResult[]>([]);
  const pusherRef = useRef<Pusher | null>(null);

  const domain = window.location.hostname.includes("localhost")
    ? window.location.origin
    : `https://${window.location.hostname}`;
  const telemetryUrl = `${domain}/api/telemetry`;
  const calibrateUrl = `${domain}/api/calibrate`;

  useEffect(() => {
    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
    pusherRef.current = pusher;

    const channel = pusher.subscribe(LIVE_CHANNEL);

    pusher.connection.bind("connected", () => setConnected(true));
    pusher.connection.bind("disconnected", () => setConnected(false));
    pusher.connection.bind("error", () => setConnected(false));

    channel.bind("calibrate-result", (data: CalibrateResult) => {
      setResults((prev) => [data, ...prev].slice(0, 20));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(LIVE_CHANNEL);
      pusher.disconnect();
    };
  }, []);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-mono uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-primary shadow-[0_0_10px_var(--primary)]" />
              Watch Calibration
            </h2>
            <p className="text-sm text-muted-foreground font-mono mt-1 uppercase tracking-wide">
              Galaxy Watch 6 — Sensor Logger Setup
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase">
            {connected ? (
              <><Wifi className="w-4 h-4 text-primary" /><span className="text-primary">Pusher Live</span></>
            ) : (
              <><WifiOff className="w-4 h-4 text-destructive" /><span className="text-destructive">Connecting...</span></>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step 1: Connection Setup */}
          <div className="space-y-4">
            <Card className="rounded-none border-border bg-card shadow-none">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 border border-primary text-primary text-xs flex items-center justify-center font-bold">1</span>
                  Sensor Logger — Sensor Config
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-3">
                <div className="text-xs font-mono text-muted-foreground space-y-2 leading-relaxed">
                  <p>Open <span className="text-foreground">Sensor Logger</span> on your Galaxy Watch 6.</p>
                  <div className="space-y-1 border border-border p-3">
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                      <span>Enable sensor: <span className="text-primary">Total Acceleration (Watch)</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                      <span>Set sampling rate: <span className="text-primary">100 Hz</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                      <span>Payload key name must be: <span className="text-primary">WatchTotalAcceleration</span></span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none border-border bg-card shadow-none">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 border border-primary text-primary text-xs flex items-center justify-center font-bold">2</span>
                  Sensor Logger — HTTP Push Config
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="text-xs font-mono text-muted-foreground space-y-2 leading-relaxed">
                  <p>In Sensor Logger, go to <span className="text-foreground">Push → HTTP Push</span> and configure:</p>
                  <div className="space-y-1 border border-border p-3">
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                      <span>Method: <span className="text-primary">POST</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                      <span>Push interval: <span className="text-primary">1000 ms (1 second)</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                      <span>Content-Type: <span className="text-primary">application/json</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                      <span>Payload key: <span className="text-primary">payload</span></span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Calibration URL (use during setup):</p>
                  <div className="flex items-center bg-muted border border-border px-3 py-2">
                    <span className="text-xs font-mono text-primary flex-1 break-all" data-testid="text-calibrate-url">{calibrateUrl}</span>
                    <CopyButton text={calibrateUrl} />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Live Telemetry URL (use during match):</p>
                  <div className="flex items-center bg-muted border border-border px-3 py-2">
                    <span className="text-xs font-mono text-foreground/70 flex-1 break-all" data-testid="text-telemetry-url">{telemetryUrl}</span>
                    <CopyButton text={telemetryUrl} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none border-border bg-card shadow-none">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 border border-primary text-primary text-xs flex items-center justify-center font-bold">3</span>
                  Physics Engine — Thresholds
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex items-center justify-between border border-border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground uppercase">Ball detection threshold</span>
                    </div>
                    <span className="text-primary font-bold">3G / 29.4 m/s²</span>
                  </div>
                  <div className="flex items-center justify-between border border-border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground uppercase">ZUPT rest band</span>
                    </div>
                    <span className="text-primary font-bold">9.0 – 10.5 m/s²</span>
                  </div>
                  <div className="flex items-center justify-between border border-border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Radio className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground uppercase">Swing window</span>
                    </div>
                    <span className="text-primary font-bold">Peak −20 / +10 samples</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pt-1">
                    A delivery is logged only when resultant acceleration exceeds <span className="text-foreground">3G</span>.
                    Pace = peak accel × 3.6 km/h. Do a full bowling action to pass calibration.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live calibration results */}
          <div>
            <Card className="rounded-none border-border bg-card shadow-none h-full flex flex-col">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Radio className="w-4 h-4" />
                    Live Throw Analysis
                  </span>
                  {results.length > 0 && (
                    <span
                      className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]"
                      data-testid="status-calibrate-live"
                    />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[700px]">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
                    <Radio className="w-10 h-10 text-muted-foreground/30 animate-pulse" />
                    <p className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
                      Awaiting throw data...
                    </p>
                    <p className="text-xs text-muted-foreground/60 max-w-xs leading-relaxed">
                      Point Sensor Logger at the calibration URL and do a bowling action.
                      Results appear here in real time.
                    </p>
                  </div>
                ) : (
                  results.map((r, i) => (
                    <ResultCard key={r.timestamp} result={r} index={i} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payload example */}
        <Card className="rounded-none border-border bg-card shadow-none">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Expected Payload Shape
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <pre className="text-xs font-mono text-muted-foreground bg-muted p-4 overflow-x-auto leading-relaxed">{`{
  "payload": [
    {
      "sensor": "WatchTotalAcceleration",
      "x": "0.123",
      "y": "-9.812",
      "z": "1.045",
      "seconds_elapsed": "0.012"
    },
    ...
  ]
}`}</pre>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
