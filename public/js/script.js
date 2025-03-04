// script.js
// DOM要素の取得
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

// タイマー状態管理オブジェクト
const state = {
  timerInterval: null,
  remainingTime: 0,
  endTime: 0,
  isPaused: false,
};

// ピッカー生成関数
function generatePicker(element, max, defaultSelected = 0) {
  for (let i = 0; i <= max; i++) {
    const item = document.createElement("div");
    item.className = "picker-item";
    item.textContent = i.toString().padStart(2, "0");
    item.dataset.value = i;
    if (i === defaultSelected) item.classList.add("selected");
    element.appendChild(item);
  }
}

// アイテム選択処理
function selectPickerItem(picker, item) {
  // 既存の選択を解除
  picker
    .querySelectorAll(".picker-item")
    .forEach((el) => el.classList.remove("selected"));
  // 新しい項目を選択
  item.classList.add("selected");
  // スクロール位置調整
  const itemHeight = item.offsetHeight;
  const containerHeight = picker.offsetHeight;
  picker.scrollTop = item.offsetTop - (containerHeight / 2 - itemHeight / 2);
}

// タイマー制御オブジェクト
const timerControls = {
  start: () => {
    // 選択値の取得
    const getValue = (picker) =>
      parseInt(picker.querySelector(".selected").dataset.value);
    const totalSeconds =
      getValue(elements.hourPicker) * 3600 +
      getValue(elements.minutePicker) * 60 +
      getValue(elements.secondPicker);

    if (totalSeconds <= 0) return;

    // UI切り替え
    elements.timerSetup.classList.add("hidden");
    elements.timerDisplay.classList.remove("hidden");
    elements.startButton.classList.add("hidden");
    elements.pauseButton.classList.remove("hidden");

    // タイマー設定
    state.endTime = Date.now() + totalSeconds * 1000;
    state.remainingTime = totalSeconds;

    // タイマー起動
    state.timerInterval = setInterval(timerControls.update, 500);
  },

  update: () => {
    if (state.isPaused) return;

    // 残り時間計算
    state.remainingTime = Math.max(
      0,
      Math.round((state.endTime - Date.now()) / 1000)
    );

    // タイマー終了処理
    if (state.remainingTime <= 0) {
      clearInterval(state.timerInterval);
      elements.alarmSound.play();
      elements.timeDisplay.textContent = "00:00";
      setTimeout(timerControls.cancel, 3000);
      return;
    }

    // 時間表示フォーマット
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

  togglePause: () => {
    state.isPaused = !state.isPaused;
    elements.pauseButton.textContent = state.isPaused ? "再開" : "一時停止";
    elements.timeDisplay.classList.toggle("pulse", state.isPaused);

    if (!state.isPaused) {
      state.endTime = Date.now() + state.remainingTime * 1000;
      state.timerInterval = setInterval(timerControls.update, 500);
    } else {
      clearInterval(state.timerInterval);
    }
  },

  cancel: () => {
    clearInterval(state.timerInterval);
    elements.timerSetup.classList.remove("hidden");
    elements.timerDisplay.classList.add("hidden");
    elements.startButton.classList.remove("hidden");
    elements.pauseButton.classList.add("hidden");
    state.isPaused = false;
  },
};

// 初期化処理
function initialize() {
  // ピッカー生成
  generatePicker(elements.hourPicker, 23);
  generatePicker(elements.minutePicker, 59, 15); // デフォルト15分
  generatePicker(elements.secondPicker, 59);

  // イベントリスナー登録
  elements.startButton.addEventListener("click", timerControls.start);
  elements.pauseButton.addEventListener("click", timerControls.togglePause);
  elements.cancelButton.addEventListener("click", timerControls.cancel);

  // タッチイベント処理
  let startY = 0;
  document.addEventListener(
    "touchstart",
    (e) => {
      const picker = e.target.closest(".picker-column");
      if (!picker) return;
      startY = e.touches[0].clientY;
      e.preventDefault();
    },
    { passive: false }
  );
}

// 初期化実行
initialize();
