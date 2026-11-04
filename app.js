const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const numbers = "0123456789".split("");
const letterWords = {
  A: "apple",
  B: "ball",
  C: "cat",
  D: "dog",
  E: "elephant",
  F: "fish",
  G: "goat",
  H: "hat",
  I: "igloo",
  J: "jelly",
  K: "kite",
  L: "lion",
  M: "moon",
  N: "nest",
  O: "orange",
  P: "pizza",
  Q: "queen",
  R: "rainbow",
  S: "sun",
  T: "turtle",
  U: "umbrella",
  V: "violin",
  W: "whale",
  X: "x-ray",
  Y: "yo-yo",
  Z: "zebra",
};
const numberWords = {
  0: "zero",
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
};
const colors = [
  "#ff6b6b",
  "#4ecdc4",
  "#ffd166",
  "#4d96ff",
  "#78c56e",
  "#f47bbd",
  "#ff9f1c",
  "#2ec4b6",
];

const state = {
  mode: "home",
  typedLetters: [],
  previousLetter: "",
  previousFreeLetter: "",
  previousNumber: "",
  lastWarningAt: 0,
  foundLetters: new Set(),
  foundNumbers: new Set(),
  lettersComplete: false,
  numbersComplete: false,
  soundOn: true,
  smallLetters: false,
  ipadKeyboardOn: false,
  lastCaptureLetter: "",
  lastCaptureAt: 0,
};

const screens = {
  home: document.querySelector('[data-screen="home"]'),
  free: document.querySelector('[data-screen="free"]'),
  learn: document.querySelector('[data-screen="learn"]'),
  numbers: document.querySelector('[data-screen="numbers"]'),
};

const typedLettersEl = document.querySelector("#typedLetters");
const typingPlaceholderEl = document.querySelector("#typingPlaceholder");
const typingFeedbackEl = document.querySelector("#typingFeedback");
const freeLetterKeyboardEl = document.querySelector("#freeLetterKeyboard");
const keyboardCaptureEl = document.querySelector("#keyboardCapture");
const letterGridEl = document.querySelector("#letterGrid");
const letterMessageEl = document.querySelector("#letterMessage");
const numberGridEl = document.querySelector("#numberGrid");
const numberMessageEl = document.querySelector("#numberMessage");
const confettiLayerEl = document.querySelector("#confettiLayer");
const soundToggleEls = document.querySelectorAll('[data-action="toggle-sound"]');
const caseToggleEl = document.querySelector('[data-action="toggle-case"]');
const ipadKeyboardToggleEl = document.querySelector(
  '[data-action="toggle-ipad-keyboard"]'
);

function letterColor(letter) {
  const index = letters.indexOf(letter);
  return colors[index % colors.length];
}

function numberColor(number) {
  const index = Number(number);
  return colors[(index + 2) % colors.length];
}

function renderLetterGrid() {
  letterGridEl.innerHTML = "";

  letters.forEach((letter) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "letter-tile";
    tile.textContent = displayLetter(letter);
    tile.setAttribute("aria-label", `Type ${letter}`);
    tile.dataset.letter = letter;
    tile.style.setProperty("--letter-color", letterColor(letter));
    letterGridEl.appendChild(tile);
  });
}

function renderFreeLetterKeyboard() {
  freeLetterKeyboardEl.innerHTML = "";

  letters.forEach((letter) => {
    const key = document.createElement("button");
    key.type = "button";
    key.className = "letter-tile touch-key";
    key.textContent = displayLetter(letter);
    key.setAttribute("aria-label", `Type ${letter}`);
    key.dataset.touchLetter = letter;
    key.style.setProperty("--letter-color", letterColor(letter));
    freeLetterKeyboardEl.appendChild(key);
  });
}

function renderNumberGrid() {
  numberGridEl.innerHTML = "";

  numbers.forEach((number) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "letter-tile number-tile";
    tile.textContent = number;
    tile.setAttribute("aria-label", `Type ${number}`);
    tile.dataset.number = number;
    tile.style.setProperty("--letter-color", numberColor(number));
    numberGridEl.appendChild(tile);
  });
}

function displayLetter(letter) {
  return state.smallLetters ? letter.toLowerCase() : letter;
}

function letterLabel(letter) {
  return `${displayLetter(letter)} - ${letterWords[letter]}`;
}

function numberLabel(number) {
  return `${number} - ${numberWords[number]}`;
}

function speak(text) {
  if (!state.soundOn || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.86;
  utterance.pitch = 1.18;
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function renderToggles() {
  soundToggleEls.forEach((soundToggleEl) => {
    soundToggleEl.textContent = state.soundOn ? "Sound On" : "Sound Off";
    soundToggleEl.classList.toggle("is-on", state.soundOn);
    soundToggleEl.setAttribute("aria-pressed", String(state.soundOn));
  });

  caseToggleEl.textContent = state.smallLetters ? "Big Letters" : "Small Letters";
  caseToggleEl.classList.toggle("is-on", state.smallLetters);
  caseToggleEl.setAttribute("aria-pressed", String(state.smallLetters));
}

function renderIpadKeyboardToggle() {
  ipadKeyboardToggleEl.textContent = state.ipadKeyboardOn
    ? "Hide Keyboard"
    : "iPad Keyboard";
  ipadKeyboardToggleEl.classList.toggle("is-on", state.ipadKeyboardOn);
  ipadKeyboardToggleEl.setAttribute("aria-pressed", String(state.ipadKeyboardOn));
}

function showIpadKeyboard() {
  state.ipadKeyboardOn = true;
  keyboardCaptureEl.value = "";
  renderIpadKeyboardToggle();
  keyboardCaptureEl.focus({ preventScroll: true });
}

function hideIpadKeyboard() {
  state.ipadKeyboardOn = false;
  keyboardCaptureEl.value = "";
  renderIpadKeyboardToggle();
  keyboardCaptureEl.blur();
}

function refocusIpadKeyboardIfNeeded() {
  if (state.mode !== "free" || !state.ipadKeyboardOn) {
    return;
  }

  window.setTimeout(() => {
    if (state.mode === "free" && state.ipadKeyboardOn) {
      keyboardCaptureEl.focus({ preventScroll: true });
    }
  }, 0);
}

function setMode(mode) {
  if ((state.mode === "learn" || state.mode === "numbers") && mode !== state.mode) {
    stopSpeaking();
  }

  if (state.mode === "free" && mode !== "free") {
    hideIpadKeyboard();
  }

  state.mode = mode;
  Object.entries(screens).forEach(([screenName, screen]) => {
    screen.classList.toggle("hidden", screenName !== mode);
  });

  if (mode === "free") {
    state.typedLetters = [];
    state.previousFreeLetter = "";
    state.ipadKeyboardOn = false;
    state.lastCaptureLetter = "";
    state.lastCaptureAt = 0;
    typingFeedbackEl.textContent = "Tap letters or use A-Z keys.";
    typingFeedbackEl.classList.remove("warning");
    renderIpadKeyboardToggle();
    renderFreeTyping();
  }

  if (mode === "learn") {
    resetLearning();
  }

  if (mode === "numbers") {
    resetNumbers();
  }

  document.body.dataset.mode = mode;
  document.querySelector("#app").focus({ preventScroll: true });
}

function renderFreeTyping() {
  typedLettersEl.innerHTML = "";
  typingPlaceholderEl.classList.toggle("hidden", state.typedLetters.length > 0);

  state.typedLetters.forEach((letter) => {
    const item = document.createElement("span");
    item.className = "typed-letter";
    item.textContent = displayLetter(letter);
    item.style.setProperty("--letter-color", letterColor(letter));
    typedLettersEl.appendChild(item);
  });
}

function resetLearning() {
  state.previousLetter = "";
  state.foundLetters.clear();
  state.lettersComplete = false;
  letterMessageEl.textContent = "Tap or type a letter.";
  letterMessageEl.classList.remove("repeat");

  letterGridEl.querySelectorAll(".letter-tile").forEach((tile) => {
    tile.classList.remove("is-active", "was-found");
    tile.textContent = displayLetter(tile.dataset.letter);
  });

  stopSpeaking();
}

function resetNumbers() {
  state.previousNumber = "";
  state.foundNumbers.clear();
  state.numbersComplete = false;
  numberMessageEl.textContent = "Tap or type a number.";
  numberMessageEl.classList.remove("repeat");

  document.querySelectorAll(".number-tile").forEach((tile) => {
    tile.classList.remove("is-active", "was-found");
  });

  stopSpeaking();
}

function restartAnimation(element) {
  element.style.animation = "none";
  element.offsetHeight;
  element.style.animation = "";
}

function showFreeWarning() {
  typingFeedbackEl.textContent = "Try a different letter!";
  typingFeedbackEl.classList.add("warning");
  restartAnimation(typingFeedbackEl);
}

function showLearnWarning() {
  stopSpeaking();
  letterMessageEl.textContent = "Try another letter!";
  letterMessageEl.classList.add("repeat");
  restartAnimation(letterMessageEl);
}

function showNumberWarning() {
  stopSpeaking();
  numberMessageEl.textContent = "Try another number!";
  numberMessageEl.classList.add("repeat");
  restartAnimation(numberMessageEl);
}

function launchConfetti() {
  confettiLayerEl.innerHTML = "";
  const confettiColors = ["#ff6b6b", "#4ecdc4", "#ffd166", "#4d96ff", "#78c56e", "#f47bbd"];

  for (let index = 0; index < 80; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--confetti-left", `${Math.random() * 100}%`);
    piece.style.setProperty(
      "--confetti-color",
      confettiColors[index % confettiColors.length]
    );
    piece.style.setProperty("--confetti-delay", `${Math.random() * 0.35}s`);
    piece.style.setProperty("--confetti-sway", `${Math.random() * 220 - 110}px`);
    confettiLayerEl.appendChild(piece);
  }

  window.setTimeout(() => {
    confettiLayerEl.innerHTML = "";
  }, 2400);
}

function celebrateLettersIfComplete() {
  if (state.lettersComplete || state.foundLetters.size !== letters.length) {
    return;
  }

  state.lettersComplete = true;
  letterMessageEl.classList.remove("repeat");
  letterMessageEl.textContent = "You typed every letter!";
  launchConfetti();
}

function celebrateNumbersIfComplete() {
  if (state.numbersComplete || state.foundNumbers.size !== numbers.length) {
    return;
  }

  state.numbersComplete = true;
  numberMessageEl.classList.remove("repeat");
  numberMessageEl.textContent = "You typed every number!";
  launchConfetti();
}

function showRepeatWarning() {
  const now = Date.now();
  if (now - state.lastWarningAt < 700) {
    return;
  }

  state.lastWarningAt = now;

  if (state.mode === "free") {
    showFreeWarning();
    return;
  }

  if (state.mode === "learn") {
    showLearnWarning();
    return;
  }

  if (state.mode === "numbers") {
    showNumberWarning();
  }
}

function showLetter(letter) {
  state.previousLetter = letter;
  const word = letterWords[letter];

  letterMessageEl.classList.remove("repeat");
  letterMessageEl.textContent = letterLabel(letter);
  speak(word);

  letterGridEl.querySelectorAll(".letter-tile").forEach((tile) => {
    const isTarget = tile.dataset.letter === letter;
    tile.classList.toggle("is-active", isTarget);
    tile.textContent = displayLetter(tile.dataset.letter);

    if (isTarget) {
      state.foundLetters.add(letter);
      tile.classList.remove("was-found");
      restartAnimation(tile);
    } else {
      tile.classList.toggle("was-found", state.foundLetters.has(tile.dataset.letter));
    }
  });

  celebrateLettersIfComplete();
}

function showNumber(number) {
  state.previousNumber = number;
  const word = numberWords[number];

  numberMessageEl.classList.remove("repeat");
  numberMessageEl.textContent = numberLabel(number);
  speak(word);

  document.querySelectorAll(".number-tile").forEach((tile) => {
    const isTarget = tile.dataset.number === number;
    tile.classList.toggle("is-active", isTarget);

    if (isTarget) {
      state.foundNumbers.add(number);
      tile.classList.remove("was-found");
      restartAnimation(tile);
    } else {
      tile.classList.toggle("was-found", state.foundNumbers.has(tile.dataset.number));
    }
  });

  celebrateNumbersIfComplete();
}

function handleLetter(letter) {
  if (state.mode === "free") {
    state.typedLetters.push(letter);
    state.previousFreeLetter = letter;
    typingFeedbackEl.textContent = "Nice. Pick a new letter next.";
    typingFeedbackEl.classList.remove("warning");
    renderFreeTyping();
    return;
  }

  if (state.mode === "learn") {
    showLetter(letter);
  }
}

function handleNumber(number) {
  if (state.mode === "numbers") {
    showNumber(number);
  }
}

function processLetterInput(letter, isRepeat = false) {
  const previousLetter =
    state.mode === "free" ? state.previousFreeLetter : state.previousLetter;

  if (isRepeat || previousLetter === letter) {
    showRepeatWarning();
    return;
  }

  handleLetter(letter);
}

function processNumberInput(number, isRepeat = false) {
  if (isRepeat || state.previousNumber === number) {
    showRepeatWarning();
    return;
  }

  handleNumber(number);
}

function processKeyboardCaptureValue() {
  if (state.mode !== "free") {
    keyboardCaptureEl.value = "";
    return;
  }

  const capturedLetters = keyboardCaptureEl.value.toUpperCase().match(/[A-Z]/g) || [];
  const now = Date.now();
  keyboardCaptureEl.value = "";

  capturedLetters.forEach((letter) => {
    const alreadyHandled =
      letter === state.lastCaptureLetter && now - state.lastCaptureAt < 250;

    if (!alreadyHandled) {
      processLetterInput(letter);
    }
  });
}

function isPlainLetterKey(event) {
  return (
    event.key.length === 1 &&
    /^[a-z]$/i.test(event.key) &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey
  );
}

function isPlainNumberKey(event) {
  return (
    event.key.length === 1 &&
    /^[0-9]$/.test(event.key) &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey
  );
}

window.addEventListener(
  "keydown",
  (event) => {
    if (state.mode === "home") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (state.mode === "numbers") {
      if (!isPlainNumberKey(event)) {
        return;
      }

      processNumberInput(event.key, event.repeat);
      return;
    }

    if (!isPlainLetterKey(event)) {
      return;
    }

    const letter = event.key.toUpperCase();
    processLetterInput(letter, event.repeat);

    if (event.target === keyboardCaptureEl) {
      state.lastCaptureLetter = letter;
      state.lastCaptureAt = Date.now();
    }
  },
  { capture: true }
);

keyboardCaptureEl.addEventListener("beforeinput", (event) => {
  if (state.mode !== "free") {
    event.preventDefault();
    return;
  }

  if (event.inputType !== "insertText" || !/^[a-z]$/i.test(event.data || "")) {
    event.preventDefault();
  }
});

keyboardCaptureEl.addEventListener("input", processKeyboardCaptureValue);

keyboardCaptureEl.addEventListener("blur", () => {
  window.setTimeout(() => {
    if (!state.ipadKeyboardOn || document.activeElement === keyboardCaptureEl) {
      return;
    }

    state.ipadKeyboardOn = false;
    renderIpadKeyboardToggle();
  }, 120);
});

freeLetterKeyboardEl.addEventListener("click", (event) => {
  const key = event.target.closest("[data-touch-letter]");
  if (!key || state.mode !== "free") {
    return;
  }

  processLetterInput(key.dataset.touchLetter);
  refocusIpadKeyboardIfNeeded();
});

letterGridEl.addEventListener("click", (event) => {
  const key = event.target.closest("[data-letter]");
  if (!key || state.mode !== "learn") {
    return;
  }

  processLetterInput(key.dataset.letter);
});

numberGridEl.addEventListener("click", (event) => {
  const key = event.target.closest("[data-number]");
  if (!key || state.mode !== "numbers") {
    return;
  }

  processNumberInput(key.dataset.number);
});

document.addEventListener("contextmenu", (event) => {
  if (state.mode !== "home" && event.target.closest(".letter-tile")) {
    event.preventDefault();
  }
});

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    setMode(button.dataset.mode);
  });
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;

    if (action === "home") {
      setMode("home");
      return;
    }

    if (action === "toggle-ipad-keyboard") {
      if (state.ipadKeyboardOn) {
        hideIpadKeyboard();
        typingFeedbackEl.textContent = "Tap letters or use A-Z keys.";
      } else {
        showIpadKeyboard();
        typingFeedbackEl.textContent = "iPad keyboard is on. Only letters work.";
      }

      typingFeedbackEl.classList.remove("warning");
      return;
    }

    if (action === "clear") {
      state.typedLetters = [];
      state.previousFreeLetter = "";
      typingFeedbackEl.textContent = "Tap letters or use A-Z keys.";
      typingFeedbackEl.classList.remove("warning");
      renderFreeTyping();
      refocusIpadKeyboardIfNeeded();
      return;
    }

    if (action === "back") {
      state.typedLetters.pop();
      state.previousFreeLetter = state.typedLetters.at(-1) || "";
      typingFeedbackEl.textContent = "Tap letters or use A-Z keys.";
      typingFeedbackEl.classList.remove("warning");
      renderFreeTyping();
      refocusIpadKeyboardIfNeeded();
      return;
    }

    if (action === "reset") {
      if (state.mode === "numbers") {
        resetNumbers();
      } else {
        resetLearning();
      }
      return;
    }

    if (action === "toggle-sound") {
      state.soundOn = !state.soundOn;
      if (!state.soundOn) {
        stopSpeaking();
      }
      renderToggles();
      return;
    }

    if (action === "toggle-case") {
      state.smallLetters = !state.smallLetters;
      renderToggles();
      renderFreeLetterKeyboard();
      renderFreeTyping();
      if (state.mode === "learn") {
        letterGridEl.querySelectorAll(".letter-tile").forEach((tile) => {
          tile.textContent = displayLetter(tile.dataset.letter);
        });

        if (state.previousLetter) {
          letterMessageEl.textContent = letterLabel(state.previousLetter);
        }
      }
    }
  });
});

renderLetterGrid();
renderFreeLetterKeyboard();
renderNumberGrid();
renderToggles();
renderIpadKeyboardToggle();

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js", { scope: "./" }).catch(() => {});
  });
}
