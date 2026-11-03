/**
 * Generates an animated procedural video stream simulating a field inspection site.
 * Used as an ultra-reliable fallback when physical camera access is blocked or unavailable.
 */
export class SimulatedCameraStream {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private stream: MediaStream | null = null;
  private startTime: number = Date.now();

  constructor(width = 1280, height = 720) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    this.startRendering();
  }

  private startRendering() {
    const render = () => {
      const now = Date.now();
      const elapsed = (now - this.startTime) / 1000;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const ctx = this.ctx;

      // Realistic field environment: sky and terrain
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
      skyGrad.addColorStop(0, '#2d4059');
      skyGrad.addColorStop(0.6, '#4f6d7a');
      skyGrad.addColorStop(1, '#c0d6df');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.65);

      // Distant terrain hills
      ctx.fillStyle = '#34495e';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.58);
      for (let x = 0; x <= w; x += 40) {
        const y = h * 0.58 + Math.sin(x * 0.005 + 1) * 25 + Math.cos(x * 0.012) * 15;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Ground plane / gravel foundation
      const groundGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
      groundGrad.addColorStop(0, '#4b4845');
      groundGrad.addColorStop(1, '#2c2a29');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, h * 0.65, w, h * 0.35);

      // Industrial equipment / Substation structure
      const sway = Math.sin(elapsed * 1.2) * 2;
      const pX = w * 0.45 + sway;
      const pY = h * 0.3;

      // Transformer tower frame
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(pX - 120, pY + 80, 240, 190);
      ctx.strokeStyle = '#95a5a6';
      ctx.lineWidth = 4;
      ctx.strokeRect(pX - 120, pY + 80, 240, 190);

      // High voltage insulator bushings
      for (let i = -80; i <= 80; i += 80) {
        ctx.fillStyle = '#b03a2e';
        ctx.fillRect(pX + i - 12, pY + 10, 24, 70);
        // Rings
        ctx.fillStyle = '#d98880';
        for (let r = 0; r < 5; r++) {
          ctx.fillRect(pX + i - 16, pY + 20 + r * 11, 32, 4);
        }
      }

      // Wind turbine in distance with rotating blades
      const tX = w * 0.82;
      const tY = h * 0.45;
      ctx.fillStyle = '#bdc3c7';
      ctx.fillRect(tX - 4, tY - 120, 8, 120);

      const bladeAngle = elapsed * 1.5;
      ctx.save();
      ctx.translate(tX, tY - 120);
      ctx.rotate(bladeAngle);
      ctx.fillStyle = '#ecf0f1';
      for (let b = 0; b < 3; b++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.fillRect(-3, -60, 6, 60);
      }
      ctx.restore();

      // Industrial caution stripes on container base
      const stripeY = pY + 245;
      ctx.save();
      ctx.beginPath();
      ctx.rect(pX - 110, stripeY, 220, 20);
      ctx.clip();
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(pX - 110, stripeY, 220, 20);
      ctx.fillStyle = '#2c3e50';
      for (let s = -120; s < 130; s += 24) {
        ctx.beginPath();
        ctx.moveTo(pX + s, stripeY);
        ctx.lineTo(pX + s + 12, stripeY);
        ctx.lineTo(pX + s + 4, stripeY + 20);
        ctx.lineTo(pX + s - 8, stripeY + 20);
        ctx.fill();
      }
      ctx.restore();

      // Subtle sensor noise / live sensor grain
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let i = 0; i < 40; i++) {
        const nx = (Math.sin(elapsed * 10 + i) * 0.5 + 0.5) * w;
        const ny = (Math.cos(elapsed * 8 + i) * 0.5 + 0.5) * h;
        ctx.fillRect(nx, ny, 2, 2);
      }

      // Live optic simulation badge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.roundRect(16, 16, 175, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#00e5ff';
      ctx.font = '600 11px monospace';
      ctx.fillText('LIVE OPTICS FEED [SIM]', 26, 34);

      this.animationFrameId = requestAnimationFrame(render);
    };

    render();
  }

  public getStream(): MediaStream {
    if (!this.stream) {
      this.stream = this.canvas.captureStream(30);
    }
    return this.stream;
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }
}
