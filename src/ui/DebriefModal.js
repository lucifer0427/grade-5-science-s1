// src/ui/DebriefModal.js
import { AudioManager } from '../core/AudioManager.js';

export class DebriefModal {
  constructor(container, onNext) {
    this.container = container;
    this.onNext = onNext;
  }

  showSuccess(title, misconceptionTarget, explanation, isFinalStage = false) {
    AudioManager.playSuccess();
    this.container.innerHTML = `
      <div class="pointer-events-auto max-w-lg w-full bg-white rounded-3xl shadow-2xl border-4 border-amber-400 p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <!-- 頂部榮譽徽章 -->
        <div class="flex items-center justify-between border-b pb-3 border-slate-100">
          <div class="flex items-center gap-2">
            <span class="text-2xl animate-bounce">🏆</span>
            <span class="font-black text-slate-800 text-base">${title}</span>
          </div>
          <div class="flex text-amber-400 text-lg">
            <span>⭐</span><span>⭐</span><span>⭐</span>
          </div>
        </div>

        <!-- 破除迷思目標標籤 -->
        <div class="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-xs">
          <span class="font-black text-amber-900">破除迷思：</span>
          <span class="text-amber-800 font-medium">${misconceptionTarget}</span>
        </div>

        <!-- POE 科學原理核心論證 -->
        <div class="bg-sky-50 rounded-2xl p-4 border border-sky-200 text-xs leading-relaxed text-sky-950 flex flex-col gap-2">
          <div class="font-bold text-sm text-sky-900 flex items-center gap-1.5">
            <span>🔬</span> 探究科學發現 (POE 實證總結)
          </div>
          <div>${explanation}</div>
        </div>

        <!-- 下一關按鈕 -->
        <button id="btn-next-action" class="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-98 text-white font-black text-sm shadow-xl transition-transform flex items-center justify-center gap-2">
          <span>${isFinalStage ? '🎓 完成全部探究，領取光影大師證書！' : '解鎖下一關探究挑戰 ➔'}</span>
        </button>
      </div>
    `;

    const nextBtn = this.container.querySelector('#btn-next-action');
    nextBtn.addEventListener('click', () => {
      AudioManager.playClick();
      this.hide();
      if (this.onNext) this.onNext();
    });
  }

  showFailure(title, hint) {
    AudioManager.playFail();
    this.container.innerHTML = `
      <div class="pointer-events-auto max-w-md w-full bg-white rounded-3xl shadow-2xl border-4 border-rose-400 p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center gap-2 border-b pb-3 border-slate-100">
          <span class="text-2xl">💡</span>
          <span class="font-black text-slate-800 text-base">${title}</span>
        </div>

        <div class="bg-rose-50 rounded-2xl p-4 border border-rose-200 text-xs leading-relaxed text-rose-950">
          ${hint}
        </div>

        <button id="btn-retry-action" class="w-full py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-98 text-white font-bold text-sm shadow-lg transition-transform flex items-center justify-center gap-2">
          <span>再試一次 🔄</span>
        </button>
      </div>
    `;

    const retryBtn = this.container.querySelector('#btn-retry-action');
    retryBtn.addEventListener('click', () => {
      AudioManager.playClick();
      this.hide();
    });
  }

  hide() {
    this.container.innerHTML = '';
  }
}
