import { Router } from "express";
import { pusher, LIVE_CHANNEL } from "../lib/pusher.js";
import type { SensorSample } from "../lib/physicsEngine.js";

const router = Router();

const THRESHOLD_MS2 = 29.4; // 3G

// POST /api/calibrate
// Same payload as /api/telemetry but returns diagnostic data without persisting.
// Returns 200 immediately; async broadcasts calibrate-result to Pusher.
router.post("/", async (req, res) => {
  res.json({ status: "received" });

  try {
    const { payload } = req.body as { payload: unknown[] };
    if (!Array.isArray(payload)) return;

    const all = payload as SensorSample[];

    const watchSamples = all.filter(
      (s) => s.sensor === "WatchTotalAcceleration"
    );

    const sensor_found = watchSamples.length > 0;

    let peak_accel_ms2 = 0;
    let peak_idx = 0;

    const parsed = watchSamples.map((s, i) => {
      const x = parseFloat(s.x);
      const y = parseFloat(s.y);
      const z = parseFloat(s.z);
      const mag = Math.sqrt(x * x + y * y + z * z);
      if (mag > peak_accel_ms2) {
        peak_accel_ms2 = mag;
        peak_idx = i;
      }
      return { x, y, z, t: parseFloat(s.seconds_elapsed), mag };
    });

    const peak_accel_g = parseFloat((peak_accel_ms2 / 9.81).toFixed(2));
    const passes_threshold = peak_accel_ms2 >= THRESHOLD_MS2;
    const pace_kmh_if_valid = passes_threshold
      ? parseFloat((peak_accel_ms2 * 3.6).toFixed(1))
      : null;

    // Build a mini acceleration histogram (magnitude of each sample, capped at 20 points)
    const step = Math.max(1, Math.floor(parsed.length / 20));
    const accel_trace = parsed
      .filter((_, i) => i % step === 0)
      .map((s) => parseFloat(s.mag.toFixed(2)));

    await pusher.trigger(LIVE_CHANNEL, "calibrate-result", {
      timestamp: new Date().toISOString(),
      sensor_found,
      sample_count: watchSamples.length,
      total_sample_count: all.length,
      peak_accel_ms2: parseFloat(peak_accel_ms2.toFixed(2)),
      peak_accel_g,
      peak_idx,
      passes_threshold,
      threshold_ms2: THRESHOLD_MS2,
      pace_kmh_if_valid,
      accel_trace,
    });
  } catch (err) {
    console.error("Calibrate async error:", err);
  }
});

export default router;
