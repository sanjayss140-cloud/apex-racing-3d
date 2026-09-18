import { audio } from './audio.js';

export class RacingHUD {
  constructor() {
    this.gaugeCanvas = document.getElementById('gauge-canvas');
    if (this.gaugeCanvas) {
      this.gaugeCtx = this.gaugeCanvas.getContext('2d');
      this.resizeCanvas(this.gaugeCanvas, 300, 230);
    }

    this.minimapCanvas = document.getElementById('minimap-canvas');
    if (this.minimapCanvas) {
      this.minimapCtx = this.minimapCanvas.getContext('2d');
      this.resizeCanvas(this.minimapCanvas, 140, 140);
    }

    this.lapTimeEl = document.getElementById('lap-time');
    this.checkpointBadgeEl = document.getElementById('cp-badge');
    this.checkpointDistEl = document.getElementById('cp-dist');
    this.splitNotificationEl = document.getElementById('split-notice');
    this.driftScoreEl = document.getElementById('drift-score');
    this.countdownOverlay = document.getElementById('countdown-overlay');
    this.countdownText = document.getElementById('countdown-text');

    this.splitTimer = null;
    this.smoothRPM = 1000;
    this.smoothSpeed = 0;
  }

  resizeCanvas(canvas, cssWidth, cssHeight) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
  }

  showPreparingMessage() {
    if (this.countdownOverlay && this.countdownText) {
      this.countdownOverlay.classList.add('active');
      this.countdownText.textContent = 'READYING HYPERCAR';
      this.countdownText.style.fontSize = '2.2rem';
      this.countdownText.style.letterSpacing = '4px';
      this.countdownText.style.color = '#00f0ff';
    }
  }

  hidePreparingMessage() {
    if (this.countdownText) {
      this.countdownText.style.fontSize = '';
      this.countdownText.style.letterSpacing = '';
    }
  }

  startCountdown(onComplete) {
    if (!this.countdownOverlay || !this.countdownText) {
      if (onComplete) onComplete();
      return;
    }

    this.hidePreparingMessage();
    this.countdownOverlay.classList.add('active');
    const steps = ['3', '2', '1', 'GO!'];
    let stepIdx = 0;

    const nextStep = () => {
      if (stepIdx < steps.length) {
        const text = steps[stepIdx];
        this.countdownText.textContent = text;
        const isGo = text === 'GO!';
        this.countdownText.style.color = isGo ? '#22c55e' : (text === '3' ? '#ef4444' : '#f59e0b');
        audio.playCountdownBeep(isGo);

        stepIdx++;
        setTimeout(nextStep, 900);
      } else {
        this.countdownOverlay.classList.remove('active');
        if (onComplete) onComplete();
      }
    };

    nextStep();
  }

  updateDashboard(speedMps, rpm, gear, isNitro, nitroFuel, isDrifting, driftScore) {
    const targetSpeedKmh = Math.max(0, Math.round(speedMps * 3.6));
    this.smoothSpeed += (targetSpeedKmh - this.smoothSpeed) * 0.28;
    this.smoothRPM += (rpm - this.smoothRPM) * 0.22;

    this.drawHypercarGauge(this.smoothSpeed, this.smoothRPM, gear, isNitro, nitroFuel);
    this.updateDriftScore(driftScore, isDrifting);
  }

  drawHypercarGauge(speedKmh, rpm, gear, isNitro, nitroFuel) {
    if (!this.gaugeCtx) return;
    const ctx = this.gaugeCtx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    ctx.save();
    ctx.scale(dpr, dpr);

    const w = 300;
    const h = 230;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = 138;
    const radius = 98;

    // Tachometer Angles (-135° to +45°)
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const totalAngle = endAngle - startAngle;

    // 1. Background Arc Track
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.65)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.stroke();

    // 2. Active RPM Fill Arc
    const rpmFraction = Math.min(1.0, Math.max(0, (rpm - 1000) / 7800));
    const currentAngle = startAngle + rpmFraction * totalAngle;

    if (rpmFraction > 0.01) {
      const grad = ctx.createLinearGradient(0, cy, w, cy);
      grad.addColorStop(0, '#00f0ff');
      grad.addColorStop(0.65, '#f59e0b');
      grad.addColorStop(1, '#ef4444');

      ctx.strokeStyle = grad;
      ctx.shadowColor = rpmFraction > 0.85 ? '#ef4444' : '#00f0ff';
      ctx.shadowBlur = rpmFraction > 0.85 ? 18 : 10;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, currentAngle);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 3. Digital Speedometer (Center)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = isNitro ? '#00f0ff' : 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = isNitro ? 24 : 6;
    ctx.fillText(Math.round(speedKmh).toString(), cx, cy - 14);
    ctx.shadowBlur = 0;

    // Speed Unit
    ctx.fillStyle = isNitro ? '#00f0ff' : '#94a3b8';
    ctx.font = 'bold 14px "Space Grotesk", sans-serif';
    ctx.fillText('KM / H', cx, cy + 24);

    // 4. Current Gear Pill (Center Bottom)
    const gearText = speedKmh < -0.5 ? 'R' : `GEAR ${gear}`;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(cx - 38, cy + 42, 76, 22, 6);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(gearText, cx, cy + 53);

    // 5. Nitro NOS Bar at Bottom
    const barW = 160;
    const barH = 6;
    const barX = cx - barW / 2;
    const barY = cy + 74;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();

    const fillW = (nitroFuel / 100) * barW;
    ctx.fillStyle = isNitro ? '#ffffff' : '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = isNitro ? 16 : 8;
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillW, barH, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10px "Space Grotesk", sans-serif';
    ctx.fillText(`NOS ${Math.round(nitroFuel)}% [SHIFT]`, cx, barY + 16);

    ctx.restore();
  }

  updateTimer(elapsedSeconds) {
    if (this.lapTimeEl) {
      this.lapTimeEl.textContent = this.formatTime(elapsedSeconds);
    }
  }

  updateCheckpointStatus(currentCP, totalCP, distToNext, nextCPName) {
    if (this.checkpointBadgeEl) {
      this.checkpointBadgeEl.textContent = `GATE ${currentCP} / ${totalCP}`;
    }
    if (this.checkpointDistEl) {
      this.checkpointDistEl.textContent = `${Math.round(distToNext)}m • ${nextCPName}`;
    }
  }

  showSplitTime(cpId, cpName, splitSeconds) {
    if (!this.splitNotificationEl) return;
    if (this.splitTimer) clearTimeout(this.splitTimer);

    const formatted = this.formatTime(splitSeconds);
    this.splitNotificationEl.innerHTML = `
      <div class="split-title">GATE 0${cpId} CLEARED!</div>
      <div class="split-time">${formatted}</div>
      <div class="split-sub">${cpName}</div>
    `;

    this.splitNotificationEl.classList.add('visible');
    this.splitTimer = setTimeout(() => {
      this.splitNotificationEl.classList.remove('visible');
    }, 2800);
  }

  updateDriftScore(score, isDrifting) {
    if (!this.driftScoreEl) return;
    if (score > 0) {
      this.driftScoreEl.style.display = 'block';
      this.driftScoreEl.innerHTML = `
        <span class="drift-label">DRIFT SCORE</span>
        <span class="drift-val">+${score.toLocaleString()} PTS</span>
      `;
      if (isDrifting) {
        this.driftScoreEl.classList.add('active');
      } else {
        this.driftScoreEl.classList.remove('active');
      }
    } else {
      this.driftScoreEl.style.display = 'none';
    }
  }

  drawMinimap(carPos, carHeading, checkpoints, activeCPId) {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    ctx.save();
    ctx.scale(dpr, dpr);

    const w = 140;
    const h = 140;
    ctx.clearRect(0, 0, w, h);

    const scale = 0.22;
    const centerX = 78;
    const centerY = 68;

    // Track loop connecting all 7 world wonders checkpoints
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    checkpoints.forEach((cp, i) => {
      const cx = centerX + cp.pos.x * scale;
      const cy = centerY + cp.pos.z * scale;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.stroke();

    // Checkpoints
    checkpoints.forEach((cp) => {
      const cx = centerX + cp.pos.x * scale;
      const cy = centerY + cp.pos.z * scale;
      const isActive = cp.id === activeCPId;

      ctx.fillStyle = isActive ? cp.color : '#64748b';
      ctx.beginPath();
      ctx.arc(cx, cy, isActive ? 5.5 : 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (isActive) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    });

    // Player marker
    const carX = centerX + carPos.x * scale;
    const carY = centerY + carPos.z * scale;

    ctx.save();
    ctx.translate(carX, carY);
    ctx.rotate(carHeading);

    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(-5, -6);
    ctx.lineTo(5, -6);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const ms = Math.floor((totalSec % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
}
