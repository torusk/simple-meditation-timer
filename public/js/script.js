// 要素の取得
const elements = {
  timerSetup: document.getElementById("timerSetup"),
  timerDisplay: document.getElementById("timerDisplay"),
  timeDisplay: document.getElementById("timeDisplay"),
  hourPicker: document.getElementById("hourPicker"),
  minutePicker: document.getElementById("minutePicker"),
  secondPicker: document.getElementById("secondPicker"),
  startButton: document.getElementById("startButton"),
  pauseButton: document.getElementById("pauseButton"),
  cancelButton: document.getElementById("cancelButton"),
  alarmSound: document.getElementById("alarmSound"),
};

// タイマー状態管理
const state = {
  timerInterval: null,
  remainingTime: 0,
  endTime: 0,
  isPaused: false,
};

// ピッカー生成関数
function generatePicker(element, max, defaultSelected = 0) {
  for (let i = 0; i <= max; i++) {
    const item = document.createElement("li");
    item.className = "picker-item";
    item.textContent = i.toString().padStart(2, "0");
    item.dataset.value = i;
    if (i === defaultSelected) item.classList.add("selected");
    item.addEventListener("click", () => selectPickerItem(element, item));
    element.appendChild(item);
  }
}

// アイテム選択処理
function selectPickerItem(picker, item) {
  picker
    .querySelectorAll(".picker-item")
    .forEach((el) => el.classList.remove("selected"));
  item.classList.add("selected");
  adjustScrollPosition(picker, item);
}

// スクロール位置調整
function adjustScrollPosition(picker, item) {
  const itemHeight = item.offsetHeight;
  const containerHeight = picker.offsetHeight;
  picker.scrollTop = item.offsetTop - (containerHeight / 2 - itemHeight / 2);
}

// タイマー制御関数
const timerControls = {
  start: () => {
    const getSelectedValue = (picker) =>
      parseInt(picker.querySelector(".selected").dataset.value);

    const hours = getSelectedValue(elements.hourPicker);
    const minutes = getSelectedValue(elements.minutePicker);
    const seconds = getSelectedValue(elements.secondPicker);

    state.remainingTime = hours * 3600 + minutes * 60 + seconds;

    if (state.remainingTime <= 0) return;

    elements.timerSetup.classList.add("hidden");
    elements.timerDisplay.classList.remove("hidden");
    elements.startButton.classList.add("hidden");
    elements.pauseButton.classList.remove("hidden");

    state.endTime = Date.now() + state.remainingTime * 1000;
    timerControls.updateDisplay();
    state.timerInterval = setInterval(timerControls.updateDisplay, 500);
  },

  togglePause: () => {
    if (state.isPaused) {
      state.isPaused = false;
      state.endTime = Date.now() + state.remainingTime * 1000;
      state.timerInterval = setInterval(timerControls.updateDisplay, 500);
      elements.pauseButton.textContent = "一時停止";
      elements.timeDisplay.classList.remove("pulse");
    } else {
      state.isPaused = true;
      clearInterval(state.timerInterval);
      elements.pauseButton.textContent = "再開";
      elements.timeDisplay.classList.add("pulse");
    }
  },

  cancel: () => {
    clearInterval(state.timerInterval);
    elements.timerSetup.classList.remove("hidden");
    elements.timerDisplay.classList.add("hidden");
    elements.startButton.classList.remove("hidden");
    elements.pauseButton.classList.add("hidden");
    elements.pauseButton.textContent = "一時停止";
    elements.timeDisplay.classList.remove("pulse");
    state.isPaused = false;
  },

  updateDisplay: () => {
    if (state.isPaused) return;

    const now = Date.now();
    state.remainingTime = Math.max(0, Math.round((state.endTime - now) / 1000));

    if (state.remainingTime <= 0) {
      clearInterval(state.timerInterval);
      elements.timeDisplay.textContent = "00:00";
      elements.alarmSound.play();
      setTimeout(timerControls.cancel, 3000);
      return;
    }

    const hours = Math.floor(state.remainingTime / 3600);
    const minutes = Math.floor((state.remainingTime % 3600) / 60);
    const seconds = state.remainingTime % 60;

    elements.timeDisplay.textContent =
      hours > 0
        ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
            2,
            "0"
          )}:${String(seconds).padStart(2, "0")}`
        : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
            2,
            "0"
          )}`;
  },
};

// 初期化
function initialize() {
  // ピッカー生成
  generatePicker(elements.hourPicker, 23);
  generatePicker(elements.minutePicker, 59, 15);
  generatePicker(elements.secondPicker, 59);

  // イベントリスナー
  elements.startButton.addEventListener("click", timerControls.start);
  elements.pauseButton.addEventListener("click", timerControls.togglePause);
  elements.cancelButton.addEventListener("click", timerControls.cancel);

  // タッチイベント
  let startY = 0;
  let currentPicker = null;

  document.addEventListener(
    "touchstart",
    (e) => {
      const target = e.target.closest(".picker-column");
      if (!target) return;
      startY = e.touches[0].clientY;
      currentPicker = target.querySelector(".picker-items");
      e.preventDefault();
    },
    { passive: false }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (!currentPicker) return;
      const deltaY = e.touches[0].clientY - startY;
      const items = currentPicker.querySelectorAll(".picker-item");
      const itemHeight = items[0].offsetHeight;

      if (Math.abs(deltaY) > itemHeight / 2) {
        const direction = deltaY > 0 ? -1 : 1;
        const selected = currentPicker.querySelector(".selected");
        const currentIndex = Array.from(items).indexOf(selected);
        const newIndex = Math.max(
          0,
          Math.min(items.length - 1, currentIndex + direction)
        );

        if (newIndex !== currentIndex) {
          selectPickerItem(currentPicker, items[newIndex]);
          startY = e.touches[0].clientY;
        }
      }
      e.preventDefault();
    },
    { passive: false }
  );

  document.addEventListener("touchend", () => (currentPicker = null));
}

// 初期化実行
initialize();
