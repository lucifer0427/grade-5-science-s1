// src/ui/VirtualJoystick.js
export class VirtualJoystick {
  constructor(container, onMove) {
    this.container = container;
    this.onMove = onMove;

    this.container.innerHTML = `
      <div id="joystick-base" class="w-32 h-32 rounded-full bg-slate-900/40 backdrop-blur-sm border-2 border-white/60 relative flex items-center justify-center touch-none">
        <div id="joystick-thumb" class="w-14 h-14 rounded-full bg-amber-400 border-2 border-white shadow-lg pointer-events-none transition-transform duration-75"></div>
      </div>
    `;

    this.base = this.container.querySelector('#joystick-base');
    this.thumb = this.container.querySelector('#joystick-thumb');

    this.touchId = null;
    this.baseRect = null;
    this.maxRadius = 45; // 最大推動半徑

    this.initEvents();
  }

  initEvents() {
    this.base.addEventListener('pointerdown', (e) => {
      this.touchId = e.pointerId;
      this.base.setPointerCapture(e.pointerId);
      this.baseRect = this.base.getBoundingClientRect();
      this.handlePointer(e);
    });

    this.base.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.touchId) {
        this.handlePointer(e);
      }
    });

    const resetThumb = (e) => {
      if (e.pointerId === this.touchId) {
        this.touchId = null;
        this.thumb.style.transform = `translate(0px, 0px)`;
        if (this.onMove) this.onMove(0, 0);
      }
    };

    this.base.addEventListener('pointerup', resetThumb);
    this.base.addEventListener('pointercancel', resetThumb);
  }

  handlePointer(e) {
    if (!this.baseRect) return;

    const centerX = this.baseRect.left + this.baseRect.width / 2;
    const centerY = this.baseRect.top + this.baseRect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.hypot(dx, dy);

    let normX = 0;
    let normY = 0;

    if (distance > 0) {
      const clampedDist = Math.min(this.maxRadius, distance);
      const angle = Math.atan2(dy, dx);

      const thumbX = Math.cos(angle) * clampedDist;
      const thumbY = Math.sin(angle) * clampedDist;

      this.thumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;

      normX = thumbX / this.maxRadius;
      normY = thumbY / this.maxRadius;
    }

    if (this.onMove) {
      this.onMove(normX, normY);
    }
  }
}
