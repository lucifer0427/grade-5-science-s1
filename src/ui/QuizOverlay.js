// src/ui/QuizOverlay.js
import { AudioManager } from '../core/AudioManager.js';

export class QuizOverlay {
  constructor(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.currentQuestion = null;
  }

  show(question) {
    this.currentQuestion = question;
    this.container.innerHTML = `
      <div class="pointer-events-auto max-w-lg w-full bg-white rounded-3xl shadow-2xl border-4 border-sky-400 p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <!-- 標頭 -->
        <div class="flex items-center justify-between border-b pb-3 border-slate-100">
          <div class="flex items-center gap-2">
            <span class="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full">POE 鷹架探究</span>
            <span class="text-xs text-slate-500 font-bold">${question.misconceptionTarget}</span>
          </div>
          <button id="btn-close-modal" class="text-slate-400 hover:text-slate-600 font-bold text-lg p-1">✕</button>
        </div>

        <!-- 題目題幹 -->
        <div class="text-base font-bold text-slate-800 leading-relaxed">
          ${question.prompt}
        </div>

        <!-- 選項列表 -->
        <div id="options-container" class="flex flex-col gap-2.5 my-2">
          ${question.options.map((opt, idx) => `
            <button data-idx="${idx}" class="opt-btn w-full text-left p-3.5 rounded-2xl border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 active:scale-98 transition-all font-medium text-sm text-slate-700 flex items-center gap-3">
              <span class="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">${String.fromCharCode(65 + idx)}</span>
              <span>${opt}</span>
            </button>
          `).join('')}
        </div>

        <!-- 回饋解釋區 (答題後顯示) -->
        <div id="feedback-panel" class="hidden rounded-2xl p-4 text-xs flex flex-col gap-2">
          <div id="feedback-title" class="font-bold text-sm flex items-center gap-1.5"></div>
          <div id="feedback-desc" class="leading-relaxed"></div>
          <button id="btn-next-stage" class="mt-2 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm shadow">
            前往下一關挑戰 ➔
          </button>
        </div>
      </div>
    `;

    const closeBtn = this.container.querySelector('#btn-close-modal');
    closeBtn.addEventListener('click', () => this.hide());

    const optButtons = this.container.querySelectorAll('.opt-btn');
    optButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedIdx = parseInt(btn.getAttribute('data-idx'), 10);
        this.handleSelect(selectedIdx, btn);
      });
    });
  }

  handleSelect(selectedIdx, clickedButton) {
    const isCorrect = selectedIdx === this.currentQuestion.correctAnswer;
    const feedbackPanel = this.container.querySelector('#feedback-panel');
    const feedbackTitle = this.container.querySelector('#feedback-title');
    const feedbackDesc = this.container.querySelector('#feedback-desc');
    const nextBtn = this.container.querySelector('#btn-next-stage');

    // 禁用所有按鈕
    this.container.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);

    if (isCorrect) {
      AudioManager.playSuccess();
      clickedButton.classList.remove('border-slate-200');
      clickedButton.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-950');

      feedbackPanel.classList.remove('hidden', 'bg-rose-50', 'text-rose-900', 'border-rose-200');
      feedbackPanel.classList.add('bg-emerald-50', 'text-emerald-900', 'border', 'border-emerald-200');

      feedbackTitle.innerHTML = `🎉 恭喜你答對了！心智模型建立成功！`;
      feedbackDesc.textContent = this.currentQuestion.poeFeedback.scientificExplanation;
      nextBtn.textContent = '進入下一關探索 ➔';
      nextBtn.onclick = () => {
        this.hide();
        if (this.onComplete) this.onComplete(true);
      };
    } else {
      AudioManager.playFail();
      clickedButton.classList.remove('border-slate-200');
      clickedButton.classList.add('border-rose-500', 'bg-rose-50', 'text-rose-950');

      feedbackPanel.classList.remove('hidden', 'bg-emerald-50', 'text-emerald-900', 'border-emerald-200');
      feedbackPanel.classList.add('bg-rose-50', 'text-rose-900', 'border', 'border-rose-200');

      feedbackTitle.innerHTML = `💡 認知衝突提示：再想一想！`;
      feedbackDesc.textContent = this.currentQuestion.poeFeedback.predictionFail;
      nextBtn.textContent = '重新觀察並再次嘗試 🔄';
      nextBtn.onclick = () => {
        this.hide();
        if (this.onComplete) this.onComplete(false);
      };
    }
  }

  hide() {
    this.container.innerHTML = '';
  }
}
