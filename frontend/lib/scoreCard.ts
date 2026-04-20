/**
 * Score card image generator.
 * Uses the Canvas API directly — no external libraries required.
 * Produces a 1200×630 PNG (standard LinkedIn / Open Graph size).
 */

import type { ScoreResult } from "./api";

const W = 1200;
const H = 630;

function scoreColor(score: number): string {
  if (score < 200) return "#EF4444";
  if (score < 350) return "#F97316";
  if (score < 500) return "#F59E0B";
  if (score < 650) return "#10B981";
  return "#059669";
}

/**
 * Draw the semi-circular gauge arc on a canvas context.
 *
 * Canvas arc convention:
 *   angle 0  = 3-o'clock (right)
 *   angle π  = 9-o'clock (left)
 *   angle 3π/2 = 12-o'clock (top)  ← note: y-axis is flipped vs. math convention
 *   anticlockwise=false → clockwise on screen (right → down → left → up)
 *
 * Top semi-circle = clockwise from π (left) to 2π (right), anticlockwise=false.
 */
function drawGauge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  score: number,
  strokeWidth: number,
) {
  const pct = Math.min(score / 850, 0.9999);
  const color = scoreColor(score);

  // Background arc — full top semi-circle (left → top → right, clockwise)
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, Math.PI * 2, false);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";
  ctx.stroke();

  // Score arc — pct of the top semi-circle from left clockwise
  // endAngle = π + pct*π  → π at pct=0 (left), 3π/2 at pct=0.5 (top), 2π at pct=1 (right)
  if (pct > 0) {
    const endAngle = Math.PI + pct * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, endAngle, false);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

/** Wrap canvas.toBlob in a Promise for proper async/await usage. */
function toBlobAsync(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas.toBlob returned null — image generation failed."));
    }, type);
  });
}

export async function downloadScoreCard(
  result: ScoreResult,
  jobTitle: string,
  industry: string,
): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");

  const accent = scoreColor(result.score);

  // ── Background ──────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0F172A");
  bg.addColorStop(1, "#1E1B4B");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(200, 150, 0, 200, 150, 400);
  glow.addColorStop(0, `${accent}22`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Left panel — gauge ───────────────────────────────────────────────────
  const gaugeCX = 290;
  const gaugeCY = 360;
  const gaugeR  = 185;

  drawGauge(ctx, gaugeCX, gaugeCY, gaugeR, result.score, 20);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 110px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(result.score.toString(), gaugeCX, gaugeCY - 10);

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "400 24px Arial, sans-serif";
  ctx.fillText("out of 850", gaugeCX, gaugeCY + 28);

  // Score label badge
  const badgeW = 170;
  const badgeH = 38;
  const badgeX = gaugeCX - badgeW / 2;
  const badgeY = gaugeCY + 52;
  ctx.fillStyle = accent;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 19);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(result.label.toUpperCase(), gaugeCX, badgeY + 25);

  // ── Divider ──────────────────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(560, 60);
  ctx.lineTo(560, H - 60);
  ctx.stroke();

  // ── Right panel ──────────────────────────────────────────────────────────
  const rx = 610;

  ctx.fillStyle = "rgba(255,255,255,0.50)";
  ctx.font = "400 20px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("ResilienceIQ", rx, 100);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 38px Arial, sans-serif";
  ctx.fillText("AI Career", rx, 158);
  ctx.fillText("Resilience Score", rx, 202);

  ctx.fillStyle = accent;
  ctx.fillRect(rx, 222, 55, 4);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "400 18px Arial, sans-serif";
  ctx.fillText("Role", rx, 265);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 22px Arial, sans-serif";
  const displayTitle = jobTitle.length > 32 ? jobTitle.slice(0, 30) + "…" : jobTitle;
  ctx.fillText(displayTitle, rx, 294);

  // ── Factor bars ──────────────────────────────────────────────────────────
  // Layout budget: from y=320 to y=580 → 260px for 5 bars
  // Each bar slot = 52px (label 18px + gap 6px + bar 10px + bottom gap 18px)
  const barTop     = 320;
  const barSpacing = 50; // 5 bars × 50px = 250px → last bar ends at y=570 (bar bottom ~580)
  const barW       = 480;
  const barH       = 9;

  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.font = "400 16px Arial, sans-serif";
  ctx.fillText("Score breakdown", rx, barTop - 8);

  result.factors.forEach((f, i) => {
    const y   = barTop + 16 + i * barSpacing; // label baseline
    const pct = f.score / f.max_score;

    // Short label
    ctx.fillStyle = "rgba(255,255,255,0.60)";
    ctx.font = "400 14px Arial, sans-serif";
    ctx.textAlign = "left";
    const shortName = f.name
      .replace("Task Automation Resistance", "Automation Resistance")
      .replace("Human Judgment Demand",      "Human Judgment")
      .replace("Industry AI Adoption Speed", "AI Adoption Speed")
      .replace("Sociotechnical Barriers",    "Barriers")
      .replace("Skill Adaptability",         "Adaptability");
    ctx.fillText(shortName, rx, y);

    // Score number (right-aligned)
    ctx.fillStyle = "rgba(255,255,255,0.40)";
    ctx.font = "400 13px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${f.score}/${f.max_score}`, rx + barW, y);
    ctx.textAlign = "left";

    // Bar background
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, rx, y + 5, barW, barH, 4);
    ctx.fill();

    // Bar fill — minimum 3px wide so even tiny scores show a visible pip
    if (pct > 0) {
      ctx.fillStyle = accent;
      roundRect(ctx, rx, y + 5, Math.max(3, pct * barW), barH, 4);
      ctx.fill();
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "400 17px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("resilienceiq.com  ·  Free AI Career Risk Score", W / 2, H - 30);

  // ── Download (properly awaited) ───────────────────────────────────────────
  const blob = await toBlobAsync(canvas, "image/png");
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `resilienceiq-${result.score}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Draw a rounded rectangle path. Needed for browsers that don't support ctx.roundRect(). */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const safeR = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeR, y);
  ctx.lineTo(x + w - safeR, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + safeR);
  ctx.lineTo(x + w, y + h - safeR);
  ctx.quadraticCurveTo(x + w, y + h, x + w - safeR, y + h);
  ctx.lineTo(x + safeR, y + h);
  ctx.quadraticCurveTo(x,     y + h, x, y + h - safeR);
  ctx.lineTo(x, y + safeR);
  ctx.quadraticCurveTo(x,     y,     x + safeR, y);
  ctx.closePath();
}
