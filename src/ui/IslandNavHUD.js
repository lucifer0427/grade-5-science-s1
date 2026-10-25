// src/ui/IslandNavHUD.js
import { AudioManager } from '../core/AudioManager.js';
import { ProgressManager } from '../game/ProgressManager.js';

export class IslandNavHUD {
  constructor(container, onSelectIsland) {
    this.container = container;
    this.onSelectIsland = onSelectIsland;
    this.currentIsland = 0;
    this.bitmask = 0;

    this.islandsMeta = [
      { id: 0, title: '1. 逆光盲盒', icon: '🌑', desc: '180°背光' },
      { id: 1, title: '2. 縮影神殿', icon: '🏛️', desc: '高度角滑軌' },
      { id: 2, title: '3. 冬至南天', icon: '🔭', desc: '正午43°' },
      { id: 3, title: '4. 幾何晶礦', icon: '📐', desc: '磁吸量角器' },
      { id: 4, title: '5. 光能風暴', icon: '🌻', desc: '向日葵直射' }
    ];
  }

  update(currentStage, bitmask) {
    this.currentIsland = currentStage;
    this.bitmask = bitmask;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar pointer-events-auto">
        ${this.islandsMeta.map((meta, idx) => {
          const isUnlocked = ProgressManager.isStageUnlocked(this.bitmask, idx);
          const isActive = idx === this.currentIsland;
          const stars = ProgressManager.getStageStars(this.bitmask, idx);

          let btnClass = 'flex flex-col items-center px-3 py-1.5 rounded-2xl border-2 transition-all duration-200 flex-shrink-0 ';
          if (isActive) {
            btnClass += 'bg-amber-400 text-slate-900 border-white shadow-lg scale-105 font-black ring-2 ring-amber-300';
          } else if (isUnlocked) {
            btnClass += 'bg-white/90 hover:bg-white text-slate-700 border-sky-200 shadow-sm font-bold active:scale-95';
          } else {
            btnClass += 'bg-slate-200/70 text-slate-400 border-slate-300 cursor-not-allowed opacity-60';
          }

          return `
            <button data-idx="${idx}" class="island-nav-btn ${btnClass}" ${!isUnlocked ? 'disabled' : ''}>
              <div class="flex items-center gap-1 text-xs">
                <span>${meta.icon}</span>
                <span>${meta.title}</span>
                ${!isUnlocked ? '<span class="text-[10px]">🔒</span>' : ''}
              </div>
              <div class="text-[10px] ${isActive ? 'text-amber-950 font-bold' : 'text-slate-400'}">
                ${stars > 0 ? '⭐'.repeat(stars) : meta.desc}
              </div>
            </button>
          `;
        }).join('')}
      </div>
    `;

    const buttons = this.container.querySelectorAll('.island-nav-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        if (idx !== this.currentIsland) {
          AudioManager.playClick();
          if (this.onSelectIsland) this.onSelectIsland(idx);
        }
      });
    });
  }
}
