// ============================================================
// STORY RENDERER — Ultimate Edition (v11 - Completo & Seguro)
// - Escudos livres (sem fundo branco) com drop-shadow
// - Telas de Match, Selection, Predictions e RANKING intactas
// - Cores vibrantes e Glassmorphism em todas as telas
// ============================================================

import { formatEventTime } from "./public-supabase";
import storyLogoUrl from "figma:asset/4bab7c1481b5ee323098c52e2406af76faa00cbc.png";

// ── TYPOGRAPHY ──────────────────────────────────────────────
const FH = '"Plus Jakarta Sans", system-ui, sans-serif';
const FB = '"Plus Jakarta Sans", system-ui, sans-serif';

// ── PALETTE ─────────────────────────────────────────────────
const C = {
  green: "#22c55e",
  greenDk: "#16a34a",
  cyan: "#22d3ee",
  gold: "#FFD700",
  silver: "#e2e8f0",
  bronze: "#f97316",
  white: "#ffffff",
  dark: "#020302",
} as const;

// ── HELPERS ─────────────────────────────────────────────────

async function loadImage(
  url: string,
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
    setTimeout(() => resolve(null), 4000);
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function adaptiveFS(
  text: string,
  breakpoints: [number, number][],
): number {
  for (const [maxLen, fs] of breakpoints) {
    if (text.length <= maxLen) return fs;
  }
  return breakpoints[breakpoints.length - 1][1];
}

// ── BACKGROUND OFICIAL ──────────────────────────────────────

function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  variant: "green" | "mixed" = "green",
) {
  if (variant === "mixed") {
    const base = ctx.createLinearGradient(0, 0, 0, H);
    base.addColorStop(0, "#0c2a14");
    base.addColorStop(0.5, "#091a0e");
    base.addColorStop(1, "#0b2212");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    const topGlow = ctx.createRadialGradient(
      W / 2,
      120,
      0,
      W / 2,
      120,
      W * 0.9,
    );
    topGlow.addColorStop(0, "rgba(34,197,94,0.18)");
    topGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, W, H * 0.5);
  } else {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#0a6c27");
    bgGrad.addColorStop(0.5, "#1db949");
    bgGrad.addColorStop(1, "#0e8a32");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.35);
    ctx.lineTo(W * 0.5, H * 0.7);
    ctx.lineTo(W, H * 0.35);
    ctx.lineTo(W, H * 0.55);
    ctx.lineTo(W * 0.5, H * 0.9);
    ctx.lineTo(0, H * 0.55);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.55);
    ctx.lineTo(W * 0.5, H * 0.9);
    ctx.lineTo(W, H * 0.55);
    ctx.lineTo(W, H * 0.75);
    ctx.lineTo(W * 0.5, H * 1.1);
    ctx.lineTo(0, H * 0.75);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 72) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += 72) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }
}

// ── FOOTER DARK GRADIENT ────────────────────────────────────

async function drawBrandImages(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  type: string = "match",
) {
  const logoImg = await loadImage(storyLogoUrl);
  if (logoImg) {
    const logoH = 68;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    ctx.drawImage(logoImg, (W - logoW) / 2, 60, logoW, logoH);
  }

  const gradHeight = 450;
  const fGrad = ctx.createLinearGradient(
    0,
    H - gradHeight,
    0,
    H,
  );
  fGrad.addColorStop(0, "rgba(0,0,0,0)");
  fGrad.addColorStop(0.5, "rgba(0,0,0,0.85)");
  fGrad.addColorStop(1, "rgba(0,0,0,1)");

  ctx.fillStyle = fGrad;
  ctx.fillRect(0, H - gradHeight, W, gradHeight);

  const ctaMap: Record<string, string> = {
    selection: "VOTE, ESCALE E COMPARTILHE",
    predictions: "FAÇA SEUS PALPITES",
    ranking: "PARTICIPE DO BOLÃO",
    match: "ACOMPANHE AO VIVO",
  };

  ctx.textAlign = "center";
  ctx.fillStyle = C.white;
  ctx.font = `900 50px ${FH}`;
  ctx.fillText(
    ctaMap[type] || "ACESSE E PARTICIPE",
    W / 2,
    H - 140,
  );

  ctx.fillStyle = "#22c55e";
  ctx.font = `700 36px ${FB}`;
  ctx.fillText("Acesse: power.jornalfv.com.br", W / 2, H - 70);
}

// ═════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═════════════════════════════════════════════════════════════

export async function generateStoryImage(
  type: "match" | "selection" | "predictions" | "ranking",
  data: any,
): Promise<Blob | null> {
  try {
    await document.fonts.ready;
  } catch {
    /* */
  }

  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // ─────────────────────────────────────────────
  //  MATCH
  // ─────────────────────────────────────────────
  if (type === "match" && data.match) {
    drawBackground(ctx, W, H, "green");
    await drawBrandImages(ctx, W, H, "match");

    const m = data.match;
    const hasScore =
      m.score_home != null && m.score_away != null;
    ctx.textAlign = "center";

    const topY = 180;

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    roundRect(ctx, W / 2 - 220, topY, 440, 44, 22);
    ctx.fill();
    ctx.fillStyle = C.white;
    ctx.font = `600 18px ${FB}`;
    ctx.fillText(
      "26ª Regional Certel/Sicredi 2025",
      W / 2,
      topY + 28,
    );

    ctx.fillStyle = C.white;
    ctx.font = `800 32px ${FH}`;
    ctx.fillText(
      (
        m.round_name || `RODADA ${m.round_number}`
      ).toUpperCase(),
      W / 2,
      topY + 90,
    );

    const cardY = topY + 140;
    const cardH = 500;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    roundRect(ctx, 60, cardY, W - 120, cardH, 32);
    ctx.fill();

    ctx.fillStyle = C.white;
    ctx.font = `800 48px ${FH}`;
    ctx.fillText(
      (m.home_team?.short_name || "?").toUpperCase(),
      W / 2,
      cardY + 80,
    );

    if (hasScore) {
      ctx.fillStyle = C.white;
      ctx.font = `800 160px ${FH}`;
      ctx.fillText(`${m.score_home}`, W / 2 - 120, cardY + 290);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = `300 80px ${FH}`;
      ctx.fillText("x", W / 2, cardY + 270);
      ctx.fillStyle = C.white;
      ctx.font = `800 160px ${FH}`;
      ctx.fillText(`${m.score_away}`, W / 2 + 120, cardY + 290);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = `700 100px ${FH}`;
      ctx.fillText("VS", W / 2, cardY + 280);
    }

    ctx.fillStyle = C.white;
    ctx.font = `800 48px ${FH}`;
    ctx.fillText(
      (m.away_team?.short_name || "?").toUpperCase(),
      W / 2,
      cardY + 430,
    );
    ctx.fillStyle = hasScore
      ? "rgba(255,255,255,0.5)"
      : C.white;
    ctx.font = `700 22px ${FH}`;
    ctx.fillText(
      hasScore ? "RESULTADO FINAL" : "EM BREVE",
      W / 2,
      cardY + 480,
    );

    if (data.goalScorers?.length > 0) {
      let gy = cardY + 540;
      const gCount = Math.min(data.goalScorers.length, 8);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      roundRect(ctx, 80, gy, W - 160, gCount * 52 + 64, 20);
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.font = `800 22px ${FH}`;
      ctx.fillText("GOLS", W / 2, gy + 35);
      gy += 60;
      ctx.font = `500 22px ${FB}`;
      for (const scorer of data.goalScorers.slice(0, 8)) {
        ctx.fillStyle = C.white;
        const t = formatEventTime(scorer.minute, scorer.half);
        ctx.fillText(
          t ? `${scorer.name}  ${t}` : scorer.name,
          W / 2,
          gy,
        );
        gy += 52;
      }
    }
  }

  // ─────────────────────────────────────────────
  //  SELECTION
  // ─────────────────────────────────────────────
  else if (type === "selection") {
    drawBackground(ctx, W, H, "green");
    await drawBrandImages(ctx, W, H, "selection");

    const isPersonal = !!data.isPersonal;
    ctx.textAlign = "center";

    const isArena = data.source === "arena";
    ctx.fillStyle = C.white;
    ctx.font = `900 70px ${FH}`;
    ctx.fillText(isArena ? "SELEÇÃO DO ARENA" : "SELEÇÃO", W / 2, 230); 

    const selUser = data.userName || data.display_name || "Torcedor";
    const h2 = isArena ? "" : `DE ${selUser.toUpperCase()}`;
    if (!isArena) {
      ctx.font = `900 ${adaptiveFS(h2, [
        [12, 56],
        [18, 50],
        [24, 40],
        [99, 34],
      ])}px ${FH}`;
      ctx.fillText(h2, W / 2, 290); 
    }

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `600 22px ${FB}`;
    ctx.letterSpacing = "1px";
    ctx.fillText(
      `RODADA ${data.round} · REGIONAL CERTEL/SICREDI`,
      W / 2,
      isArena ? 290 : 334
    );
    ctx.letterSpacing = "0px";

    const FX = 50;
    const FY = 410;
    const FW = W - 100;
    const FH_f = 1180;

    ctx.save();
    roundRect(ctx, FX, FY, FW, FH_f, 22);
    ctx.clip();

    const STRIPES = 12;
    const stripeH = FH_f / STRIPES;
    for (let i = 0; i < STRIPES; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#1b5e2e" : "#237a3b";
      ctx.fillRect(FX, FY + i * stripeH, FW, stripeH + 1);
    }

    const vig = ctx.createRadialGradient(
      FX + FW / 2,
      FY + FH_f / 2,
      FW * 0.15,
      FX + FW / 2,
      FY + FH_f / 2,
      FW * 0.85,
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vig;
    ctx.fillRect(FX, FY, FW, FH_f);
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 3;
    roundRect(ctx, FX, FY, FW, FH_f, 22);
    ctx.stroke();

    const M = 24;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(FX + M, FY + M, FW - M * 2, FH_f - M * 2);

    const midY = FY + FH_f * 0.46;
    ctx.beginPath();
    ctx.moveTo(FX + M, midY);
    ctx.lineTo(FX + FW - M, midY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(FX + FW / 2, midY, FW * 0.11, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.arc(FX + FW / 2, midY, 5, 0, Math.PI * 2);
    ctx.fill();

    const pbw = FW * 0.5, pbh = FH_f * 0.13;
    ctx.strokeRect(FX + (FW - pbw) / 2, FY + M, pbw, pbh);
    ctx.strokeRect(FX + (FW - pbw) / 2, FY + FH_f - M - pbh, pbw, pbh);

    const gbw = FW * 0.22, gbh = FH_f * 0.05;
    ctx.strokeRect(FX + (FW - gbw) / 2, FY + M, gbw, gbh);
    ctx.strokeRect(FX + (FW - gbw) / 2, FY + FH_f - M - gbh, gbw, gbh);

    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(FX + FW / 2, FY + M + pbh, FW * 0.08, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(FX + FW / 2, FY + FH_f - M - pbh, FW * 0.08, Math.PI, Math.PI * 2); ctx.stroke();

    const formCoords: Record<string, { top: number; left: number }[]> = {
      goleiro: [{ top: 0.88, left: 0.5 }],
      zagueiro: [{ top: 0.72, left: 0.33 }, { top: 0.72, left: 0.67 }],
      lateral: [{ top: 0.58, left: 0.16 }, { top: 0.58, left: 0.84 }],
      meia: [{ top: 0.4, left: 0.22 }, { top: 0.36, left: 0.5 }, { top: 0.4, left: 0.78 }],
      atacante: [{ top: 0.18, left: 0.26 }, { top: 0.12, left: 0.5 }, { top: 0.18, left: 0.74 }],
      treinador: [{ top: 0.94, left: 0.85 }],
    };

    const posLabels: Record<string, string> = {
      goleiro: "GOL", zagueiro: "ZAG", lateral: "LAT",
      meia: "MEI", atacante: "ATA", treinador: "TEC",
    };

    let filledCount = 0;

    for (const [pos, coords] of Object.entries(formCoords)) {
      for (let i = 0; i < coords.length; i++) {
        const key = `${pos}:${i}`;
        const w = data.winners?.[key];
        if (!w) continue;
        filledCount++;

        const px = FX + coords[i].left * FW;
        const py = FY + coords[i].top * FH_f;
        const isCoach = pos === "treinador";
        const player = w.player_id ? data.playerMap?.[w.player_id] : null;
        const team = w.team_id && data.teamMap ? data.teamMap[w.team_id] : null;

        let fullName = isCoach ? w.coach_name || "" : player?.name || "?";
        const nameParts = fullName.trim().split(" ");
        const name = nameParts.length > 2 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : fullName;

        const r = 58;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        let photoDrawn = false;
        if (player?.photo_url) {
          try {
            const img = await loadImage(player.photo_url);
            if (img) {
              ctx.save();
              ctx.beginPath(); ctx.arc(px, py, r - 3, 0, Math.PI * 2); ctx.clip();
              ctx.drawImage(img, px - r + 3, py - r + 3, (r - 3) * 2, (r - 3) * 2);
              ctx.restore();
              photoDrawn = true;
            }
          } catch { /* */ }
        }
        if (!photoDrawn) {
          const grad = ctx.createRadialGradient(px, py - r * 0.3, 0, px, py, r);
          grad.addColorStop(0, "#34d399");
          grad.addColorStop(1, "#065f46");
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(px, py, r - 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = C.white;
          ctx.font = `900 28px ${FH}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(posLabels[pos] || "?", px, py);
          ctx.textBaseline = "alphabetic";
        }

        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();

        if (team && team.logo_url) {
          try {
            const teamImg = await loadImage(team.logo_url);
            if (teamImg) {
              const tr = 17;
              const angle = Math.PI / 4;
              const tx = px + Math.cos(angle) * (r + 4);
              const ty = py + Math.sin(angle) * (r + 4);

              ctx.save();
              ctx.beginPath(); ctx.arc(tx, ty, tr + 2, 0, Math.PI * 2); ctx.fillStyle = "#000000"; ctx.fill();
              ctx.strokeStyle = "#16a34a"; ctx.lineWidth = 2.5; ctx.stroke();
              ctx.beginPath(); ctx.arc(tx, ty, tr, 0, Math.PI * 2); ctx.clip();
              ctx.fillStyle = "#ffffff"; ctx.fill();
              ctx.drawImage(teamImg, tx - tr, ty - tr, tr * 2, tr * 2);
              ctx.restore();
            }
          } catch { /* */ }
        }

        const nameUp = name.toUpperCase();
        const teamSigla = team?.short_name ? team.short_name.substring(0, 3).toUpperCase() : "";
        const nFS = 18;
        const siglaFS = 13;

        ctx.font = `800 ${nFS}px ${FH}`;
        const nameW = ctx.measureText(nameUp).width;
        ctx.font = `500 ${siglaFS}px ${FB}`;
        const siglaW = teamSigla ? ctx.measureText(teamSigla).width + 8 : 0;
        const tagW = nameW + siglaW + 24;
        const tagH = nFS + 12;
        const tagY = py + r + 6;

        ctx.fillStyle = "rgba(0,0,0,0.88)";
        roundRect(ctx, px - tagW / 2, tagY, tagW, tagH, 6);
        ctx.fill();

        const startX = px - (nameW + siglaW) / 2;
        const textY = tagY + tagH / 2 + 1;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        ctx.fillStyle = C.white;
        ctx.font = `800 ${nFS}px ${FH}`;
        ctx.fillText(nameUp, startX, textY);

        if (teamSigla) {
          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.font = `500 ${siglaFS}px ${FB}`;
          ctx.fillText(teamSigla, startX + nameW + 8, textY);
        }
      }
    }

    if (filledCount === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = `600 28px ${FH}`;
      ctx.textAlign = "center";
      ctx.fillText(
        isPersonal ? "Monte sua selecao e compartilhe!" : "Nenhum voto registrado",
        W / 2, FY + FH_f / 2
      );
    }
  }

  // ─────────────────────────────────────────────
  //  PREDICTIONS (TELA DE PALPITES)
  // ─────────────────────────────────────────────
  else if (type === "predictions") {
    drawBackground(ctx, W, H, "mixed");
    await drawBrandImages(ctx, W, H, "predictions");

    ctx.textAlign = "center";

    // ── HEADER ──
    const userName = data.userName || "Torcedor";
    const topY = 170;

    ctx.fillStyle = C.white;
    ctx.font = `900 70px ${FH}`;
    ctx.fillText("OS PALPITES", W / 2, topY);

    const h2 = `DE ${userName.toUpperCase()}`;
    ctx.fillStyle = C.white;
    ctx.font = `900 ${adaptiveFS(h2, [
      [20, 56],
      [28, 48],
      [36, 40],
      [99, 32],
    ])}px ${FH}`;
    ctx.fillText(h2, W / 2, topY + 70);

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = `700 22px ${FB}`;
    ctx.letterSpacing = "1px";
    ctx.fillText(
      `RODADA ${data.round || "?"} · REGIONAL CERTEL/SICREDI`,
      W / 2,
      topY + 120,
    );
    ctx.letterSpacing = "0px";

    const preds = data.predictions || [];
    const maxP = Math.min(preds.length, 6);

    const cardZoneTop = 330;
    const cardZoneBot = 1140; 
    const gap = 20;

    if (maxP === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = `800 32px ${FH}`;
      ctx.fillText("Nenhum palpite registrado", W / 2, (cardZoneTop + cardZoneBot) / 2);
    } else {
      const cardH = Math.min(
        Math.floor((cardZoneBot - cardZoneTop - gap * (maxP - 1)) / maxP),
        155, 
      );
      const totalCardsH = maxP * cardH + (maxP - 1) * gap;
      const startY = cardZoneTop + (cardZoneBot - cardZoneTop - totalCardsH) / 2;
      const cardX = 40;
      const cardW = W - 80;

      async function drawSmallLogo(cx: number, cy_logo: number, logoUrl: string | null, r: number) {
        if (logoUrl) {
          try {
            const img = await loadImage(logoUrl);
            if (img) {
              ctx.save();
              ctx.shadowColor = "rgba(0,0,0,0.6)";
              ctx.shadowBlur = 12;
              ctx.shadowOffsetY = 6;

              const imgAspect = img.width / img.height;
              let drawW, drawH;
              if (imgAspect > 1) {
                drawH = r * 2.2;
                drawW = drawH * imgAspect;
              } else {
                drawW = r * 2.2;
                drawH = drawW / imgAspect;
              }
              
              ctx.drawImage(img, cx - drawW / 2, cy_logo - drawH / 2, drawW, drawH);
              ctx.restore();
              return;
            }
          } catch {
            /* */
          }
        }
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath();
        ctx.arc(cx, cy_logo, r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < maxP; i++) {
        const p = preds[i];
        const cy = startY + i * (cardH + gap);
        const midY = cy + cardH / 2;
        const hasResult = p.real_home != null && p.real_away != null;

        let statusColor = "#34d399";
        let statusLabel = "";
        if (hasResult) {
          if (p.status === "exact") {
            statusColor = "#10b981";
            statusLabel = "CRAVOU!";
          } else if (p.status === "result") {
            statusColor = "#f59e0b";
            statusLabel = "ACERTOU";
          } else {
            statusColor = "#ef4444";
            statusLabel = "ERROU";
          }
        }

        ctx.save();
        if (hasResult && p.status !== "miss") {
          ctx.shadowColor = statusColor;
          ctx.shadowBlur = p.status === "exact" ? 25 : 15;
        } else {
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 20;
          ctx.shadowOffsetY = 10;
        }

        ctx.fillStyle =
          hasResult && p.status === "exact"
            ? "rgba(16, 185, 129, 0.15)"
            : "rgba(255, 255, 255, 0.08)"; 

        roundRect(ctx, cardX, cy, cardW, cardH, 24);
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle =
          hasResult && p.status !== "miss"
            ? statusColor
            : "rgba(255,255,255,0.15)";
        ctx.lineWidth = hasResult && p.status === "exact" ? 3 : 1.5;
        roundRect(ctx, cardX, cy, cardW, cardH, 24);
        ctx.stroke();

        const logoR = 38;
        const contentY = hasResult ? midY - 12 : midY;
        const homeLabel = (p.home_team || "?").substring(0, 3).toUpperCase();
        const awayLabel = (p.away_team || "?").substring(0, 3).toUpperCase();

        ctx.textAlign = "left";
        ctx.fillStyle = C.white;
        ctx.font = `900 26px ${FH}`;
        const homeLabelX = cardX + 30;
        ctx.fillText(homeLabel, homeLabelX, contentY + 9);
        const homeLabelW = ctx.measureText(homeLabel).width;
        const hLogoX = homeLabelX + homeLabelW + 15 + logoR;
        await drawSmallLogo(hLogoX, contentY, p.home_logo, logoR);

        ctx.textAlign = "right";
        ctx.fillStyle = C.white;
        ctx.font = `900 26px ${FH}`;
        const awayLabelX = cardX + cardW - 30;
        ctx.fillText(awayLabel, awayLabelX, contentY + 9);
        const awayLabelW = ctx.measureText(awayLabel).width;
        const aLogoX = awayLabelX - awayLabelW - 15 - logoR;
        await drawSmallLogo(aLogoX, contentY, p.away_logo, logoR);

        ctx.textAlign = "center";
        ctx.save();
        ctx.shadowColor = hasResult && p.status === "exact" ? statusColor : "rgba(255,255,255,0.2)";
        ctx.shadowBlur = 15;

        ctx.fillStyle = hasResult && p.status === "exact" ? statusColor : C.white;
        ctx.font = `900 76px ${FH}`;
        ctx.fillText(`${p.pred_home}`, W / 2 - 55, contentY + 26);
        ctx.fillText(`${p.pred_away}`, W / 2 + 55, contentY + 26);
        ctx.restore();

        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = `500 36px ${FH}`;
        ctx.fillText("×", W / 2, contentY + 14);

        if (hasResult) {
          const resText = `${statusLabel}  •  REAL: ${p.real_home} x ${p.real_away}`;
          ctx.font = `800 15px ${FH}`;
          const pillW = ctx.measureText(resText).width + 40;
          const pillH = 34;
          const pillX = W / 2 - pillW / 2;
          const pillY = cy + cardH - pillH / 2;

          ctx.fillStyle = statusColor;
          roundRect(ctx, pillX, pillY, pillW, pillH, 17);
          ctx.fill();

          ctx.fillStyle = p.status === "exact" || p.status === "result" ? "#000000" : C.white;
          ctx.font = `900 14px ${FH}`;
          ctx.fillText(resText, W / 2, pillY + 22);

          if (p.points != null && p.points > 0) {
            const badge = `+${p.points} PTS`;
            ctx.font = `900 16px ${FH}`;
            const bw = ctx.measureText(badge).width + 20;
            const bx = cardX + cardW - bw + 10;
            const by = cy - 10;

            ctx.fillStyle = statusColor;
            roundRect(ctx, bx, by, bw, 30, 15);
            ctx.fill();

            ctx.fillStyle = "#000000";
            ctx.fillText(badge, bx + bw / 2, by + 21);
          }
        }
      }
    }

    const myPos = data.myPosition || "-";
    const myPts = data.myPoints || 0;
    const myExact = data.myExact || 0;
    const myResult = data.myResult || 0;

    const perfY = 1170;
    const perfX = 40;
    const perfW = W - 80;

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(perfX + 120, perfY - 20);
    ctx.lineTo(perfX + perfW - 120, perfY - 20);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `800 20px ${FH}`;
    ctx.fillText("MEU DESEMPENHO GERAL", W / 2, perfY + 10);

    const rowY = perfY + 35;
    const rowH = 170; 

    const posCardW = Math.floor(perfW * 0.4);
    const posCardX = perfX;

    const posBg = ctx.createLinearGradient(
      posCardX,
      rowY,
      posCardX + posCardW,
      rowY + rowH,
    );
    posBg.addColorStop(0, "#0ea5e9"); 
    posBg.addColorStop(1, "#3b82f6"); 

    ctx.save();
    ctx.shadowColor = "rgba(14, 165, 233, 0.4)";
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = posBg;
    roundRect(ctx, posCardX, rowY, posCardW, rowH, 28);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.font = `900 ${myPos === "-" ? 100 : 120}px ${FH}`; 
    ctx.fillText(
      `${myPos}${myPos !== "-" ? "º" : ""}`,
      posCardX + posCardW / 2,
      rowY + 115,
    );
    ctx.shadowBlur = 0; 
    ctx.shadowOffsetY = 0;

    const posLabel = myPos === 1 ? "LÍDER!" : "LUGAR";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = `900 20px ${FH}`;
    ctx.fillText(
      posLabel,
      posCardX + posCardW / 2,
      rowY + 145,
    );

    const statsX = posCardX + posCardW + 16;
    const statsW = perfW - posCardW - 16;
    const statH = Math.floor((rowH - 16) / 3);
    const statGap = 8;

    ctx.fillStyle = "rgba(250, 204, 21, 0.12)";
    roundRect(ctx, statsX, rowY, statsW, statH, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(250, 204, 21, 0.3)";
    ctx.lineWidth = 1.5; ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#fde047";
    ctx.font = `800 16px ${FH}`;
    ctx.fillText("PONTOS", statsX + 20, rowY + statH / 2 + 5);
    ctx.textAlign = "right";
    ctx.fillStyle = C.white;
    ctx.font = `900 36px ${FH}`;
    ctx.fillText(`${myPts}`, statsX + statsW - 20, rowY + statH / 2 + 12);

    const s2Y = rowY + statH + statGap;
    ctx.fillStyle = "rgba(34, 197, 94, 0.12)"; 
    roundRect(ctx, statsX, s2Y, statsW, statH, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(34, 197, 94, 0.3)";
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#86efac";
    ctx.font = `800 16px ${FH}`;
    ctx.fillText("EXATOS", statsX + 20, s2Y + statH / 2 + 5);
    ctx.textAlign = "right";
    ctx.fillStyle = C.white;
    ctx.font = `900 36px ${FH}`;
    ctx.fillText(`${myExact}`, statsX + statsW - 20, s2Y + statH / 2 + 12);

    const s3Y = s2Y + statH + statGap;
    ctx.fillStyle = "rgba(34, 211, 238, 0.12)";
    roundRect(ctx, statsX, s3Y, statsW, statH, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#67e8f9";
    ctx.font = `800 16px ${FH}`;
    ctx.fillText("ACERTOS", statsX + 20, s3Y + statH / 2 + 5);
    ctx.textAlign = "right";
    ctx.fillStyle = C.white; 
    ctx.font = `900 36px ${FH}`;
    ctx.fillText(`${myResult}`, statsX + statsW - 20, s3Y + statH / 2 + 12);
  }

  // ─────────────────────────────────────────────
  //  RANKING (A TELA QUE HAVIA SIDO REMOVIDA)
  // ─────────────────────────────────────────────
  else if (type === "ranking") {
    drawBackground(ctx, W, H, "mixed");
    await drawBrandImages(ctx, W, H, "ranking");

    const ranking = data.ranking || [];
    const myUserId = data.myUserId;
    const myIdx = myUserId ? ranking.findIndex((r: any) => r.user_id === myUserId) : -1;
    const myData = myIdx >= 0 ? ranking[myIdx] : null;
    const myPos = myIdx >= 0 ? myIdx + 1 : 0;

    ctx.textAlign = "center";

    if (myData) {
      const topY = 180;

      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = `700 24px ${FB}`;
      ctx.letterSpacing = "2px";
      ctx.fillText("BOLÃO DE ENCANTADO", W / 2, topY);
      ctx.letterSpacing = "0px";

      ctx.fillStyle = C.white;
      ctx.font = `900 80px ${FH}`;
      ctx.fillText("MEU DESEMPENHO", W / 2, topY + 80);

      const uName = myData.display_name || data.displayName || "Torcedor";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = `700 30px ${FB}`;
      ctx.fillText(uName, W / 2, topY + 130);

      // Posição gigante no centro
      const posY = topY + 180;
      const posH = 280;

      const posBg = ctx.createLinearGradient(80, posY, W - 80, posY + posH);
      posBg.addColorStop(0, "rgba(255, 255, 255, 0.08)");
      posBg.addColorStop(1, "rgba(255, 255, 255, 0.02)");
      ctx.fillStyle = posBg;
      roundRect(ctx, 80, posY, W - 160, posH, 32);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1.5;
      roundRect(ctx, 80, posY, W - 160, posH, 32);
      ctx.stroke();

      const posColor = myPos === 1 ? C.gold : myPos === 2 ? C.silver : myPos === 3 ? C.bronze : C.white;

      ctx.save();
      ctx.shadowColor = myPos <= 3 ? posColor : "rgba(255,255,255,0.2)";
      ctx.shadowBlur = 30;
      ctx.fillStyle = posColor;
      ctx.font = `900 180px ${FH}`;
      ctx.fillText(`${myPos}º`, W / 2, posY + 180);
      ctx.restore();

      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = `700 24px ${FB}`;
      ctx.fillText("LUGAR NO RANKING", W / 2, posY + 240);

      // Stats ao lado um do outro
      const sY = posY + 320;
      const cW = (W - 160 - 20) / 2;
      const cH = 140;

      // Card Pontos
      ctx.fillStyle = "rgba(250, 204, 21, 0.1)";
      roundRect(ctx, 80, sY, cW, cH, 24);
      ctx.fill();
      ctx.strokeStyle = "rgba(250, 204, 21, 0.3)";
      ctx.lineWidth = 1.5; ctx.stroke();
      
      ctx.fillStyle = "#fde047";
      ctx.font = `900 58px ${FH}`;
      ctx.fillText(`${myData.points}`, 80 + cW / 2, sY + 80);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = `700 18px ${FB}`;
      ctx.fillText("PONTOS", 80 + cW / 2, sY + 115);

      // Card Acertos (Soma exatos e normais)
      const totalAcertos = (myData.exact || 0) + (myData.result || 0);
      const e2X = 80 + cW + 20;
      ctx.fillStyle = "rgba(34, 211, 238, 0.1)";
      roundRect(ctx, e2X, sY, cW, cH, 24);
      ctx.fill();
      ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
      ctx.stroke();

      ctx.fillStyle = "#67e8f9";
      ctx.font = `900 58px ${FH}`;
      ctx.fillText(`${totalAcertos}`, e2X + cW / 2, sY + 80);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = `700 18px ${FB}`;
      ctx.fillText("ACERTOS NO TOTAL", e2X + cW / 2, sY + 115);

      // Mini Ranking abaixo
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = `800 20px ${FB}`;
      ctx.fillText("TOP PARTICIPANTES", W / 2, sY + 210);

      const showEntries = ranking.slice(0, 4);
      const rH = 75;
      let ry = sY + 240;

      for (let i = 0; i < showEntries.length; i++) {
        const entry = showEntries[i];
        const isMe = myUserId && entry.user_id === myUserId;

        ctx.fillStyle = isMe ? "rgba(34, 211, 238, 0.15)" : "rgba(255,255,255,0.06)";
        roundRect(ctx, 80, ry, W - 160, rH, 16);
        ctx.fill();

        if (isMe) {
          ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
          ctx.lineWidth = 2;
          roundRect(ctx, 80, ry, W - 160, rH, 16);
          ctx.stroke();
        }

        ctx.textAlign = "left";
        const entryPos = i + 1;
        const eColor = entryPos === 1 ? C.gold : entryPos === 2 ? C.silver : entryPos === 3 ? C.bronze : "rgba(255,255,255,0.5)";
        ctx.fillStyle = eColor;
        ctx.font = `900 26px ${FH}`;
        ctx.fillText(`${entryPos}º`, 110, ry + 46);

        ctx.fillStyle = isMe ? C.white : "rgba(255,255,255,0.9)";
        ctx.font = `700 22px ${FB}`;
        const dn = entry.display_name || "Torcedor";
        ctx.fillText(dn.length > 20 ? dn.slice(0, 18) + "…" : dn, 170, ry + 46);

        ctx.textAlign = "right";
        ctx.fillStyle = isMe ? "#67e8f9" : "#34d399";
        ctx.font = `900 28px ${FH}`;
        ctx.fillText(`${entry.points} pts`, W - 110, ry + 46);

        ctx.textAlign = "center";
        ry += rH + 12;
      }
    } else {
      // Ranking Geral
      const topY = 240;
      ctx.fillStyle = C.white;
      ctx.font = `900 80px ${FH}`;
      ctx.fillText("RANKING", W / 2, topY);
      ctx.fillText("DO BOLÃO", W / 2, topY + 80);

      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = `700 24px ${FB}`;
      ctx.fillText("REGIONAL CERTEL/SICREDI", W / 2, topY + 140);

      let gy = topY + 220;
      const topE = ranking.slice(0, 8);

      if (topE.length === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = `700 28px ${FB}`;
        ctx.fillText("Nenhum palpite registrado", W / 2, 700);
      }

      for (let i = 0; i < topE.length; i++) {
        const r = topE[i];
        const pos = i + 1;
        const rH = 80;

        ctx.fillStyle = "rgba(255,255,255,0.08)";
        roundRect(ctx, 80, gy, W - 160, rH, 16);
        ctx.fill();

        const posColor = pos === 1 ? C.gold : pos === 2 ? C.silver : pos === 3 ? C.bronze : "rgba(255,255,255,0.5)";
        ctx.textAlign = "left";
        ctx.fillStyle = posColor;
        ctx.font = `900 30px ${FH}`;
        ctx.fillText(`${pos}º`, 110, gy + 50);

        ctx.fillStyle = C.white;
        ctx.font = `700 24px ${FB}`;
        ctx.fillText(r.display_name || "Torcedor", 170, gy + 42);
        
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = `600 14px ${FB}`;
        ctx.fillText(`${r.exact || 0} exatos  ·  ${r.result || 0} acertos`, 170, gy + 66);

        ctx.textAlign = "right";
        ctx.fillStyle = "#34d399";
        ctx.font = `900 32px ${FH}`;
        ctx.fillText(`${r.points}`, W - 110, gy + 50);
        ctx.textAlign = "center";

        gy += rH + 16;
      }
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

// ── DOWNLOAD / SHARE ────────────────────────────────────────

export async function downloadStoryImage(
  blob: Blob,
  filename: string,
) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareStoryImage(
  blob: Blob,
  title: string,
) {
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], `${title}.png`, {
      type: "image/png",
    });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title });
        return true;
      } catch {
        /* user cancelled */
      }
    }
  }
  await downloadStoryImage(blob, `${title}.png`);
  return false;
}