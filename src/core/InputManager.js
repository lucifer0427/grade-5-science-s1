// src/core/InputManager.js
import { bus } from './EventBus.js';

export class InputManager {
  constructor() {
    this.vector = { x: 0, y: 0 };
    this.keys = new Set();
    this.touchVector = { x: 0, y: 0 };

    this.initKeyboard();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      this.updateFromKeyboard();

      if (e.code === 'Space') {
        bus.emit('cmd:action_pressed');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.updateFromKeyboard();
    });
  }

  updateFromKeyboard() {
    let x = 0;
    let y = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;

    // 歸一化斜向移動速度
    const len = Math.hypot(x, y);
    if (len > 0) {
      this.vector.x = x / len;
      this.vector.y = y / len;
    } else {
      // 若無實體鍵盤輸入，則採用虛擬搖桿輸入
      this.vector.x = this.touchVector.x;
      this.vector.y = this.touchVector.y;
    }

    bus.emit('input:vector_changed', this.vector);
  }

  setTouchVector(vx, vy) {
    this.touchVector.x = vx;
    this.touchVector.y = vy;
    // 如果鍵盤沒在按，直接由搖桿接管
    if (this.keys.size === 0) {
      this.vector.x = vx;
      this.vector.y = vy;
      bus.emit('input:vector_changed', this.vector);
    }
  }

  getVector() {
    return this.vector;
  }
}
