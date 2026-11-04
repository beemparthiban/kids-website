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
const letterGridEl = document.querySelector("#letterGrid");
const letterMessageEl = document.querySelector("#letterMessage");
const numberGridEl = document.querySelector("#numberGrid");
const numberMessageEl = document.querySelector("#numberMessage");
const confettiLayerEl = document.querySelector("#confettiLayer");
const soundToggleEls = document.querySelectorAll('[data-action="toggle-sound"]');
const caseToggleEl = document.querySelector('[data-action="toggle-case"]');

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
    const tile = document.createElement("div");
    tile.className = "letter-tile";
    tile.textContent = displayLetter(letter);
    tile.dataset.letter = letter;
    tile.style.setProperty("--letter-color", letterColor(letter));
    letterGridEl.appendChild(tile);
  });
}

function renderNumberGrid() {
  numberGridEl.innerHTML = "";

  numbers.forEach((number) => {
    const tile = document.createElement("div");
    tile.className = "letter-tile number-tile";
    tile.textContent = number;
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

function setMode(mode) {
  if ((state.mode === "learn" || state.mode === "numbers") && mode !== state.mode) {
    stopSpeaking();
  }

  state.mode = mode;
  Object.entries(screens).forEach(([screenName, screen]) => {
    screen.classList.toggle("hidden", screenName !== mode);
  });

  if (mode === "free") {
    state.typedLetters = [];
    state.previousFreeLetter = "";
    typingFeedbackEl.textContent = "Only A-Z keys work here.";
    typingFeedbackEl.classList.remove("warning");
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
  letterMessageEl.textContent = "Press a letter key.";
  letterMessageEl.classList.remove("repeat");

  document.querySelectorAll(".letter-tile").forEach((tile) => {
    tile.classList.remove("is-active", "was-found");
    tile.textContent = displayLetter(tile.dataset.letter);
  });

  stopSpeaking();
}

function resetNumbers() {
  state.previousNumber = "";
  state.foundNumbers.clear();
  state.numbersComplete = false;
  numberMessageEl.textContent = "Press a number key.";
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
  letterMessageEl.textContent = "Try another letter!";
  letterMessageEl.classList.add("repeat");
  restartAnimation(letterMessageEl);
}

function showNumberWarning() {
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

  document.querySelectorAll(".letter-tile").forEach((tile) => {
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

      const number = event.key;
      if (event.repeat || state.previousNumber === number) {
        showRepeatWarning();
        return;
      }

      handleNumber(number);
      return;
    }

    if (!isPlainLetterKey(event)) {
      return;
    }

    const letter = event.key.toUpperCase();
    const previousLetter =
      state.mode === "free" ? state.previousFreeLetter : state.previousLetter;

    if (event.repeat || previousLetter === letter) {
      showRepeatWarning();
      return;
    }

    handleLetter(letter);
  },
  { capture: true }
);

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

    if (action === "clear") {
      state.typedLetters = [];
      state.previousFreeLetter = "";
      typingFeedbackEl.textContent = "Only A-Z keys work here.";
      typingFeedbackEl.classList.remove("warning");
      renderFreeTyping();
      return;
    }

    if (action === "back") {
      state.typedLetters.pop();
      state.previousFreeLetter = state.typedLetters.at(-1) || "";
      typingFeedbackEl.textContent = "Only A-Z keys work here.";
      typingFeedbackEl.classList.remove("warning");
      renderFreeTyping();
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
      renderFreeTyping();
      if (state.mode === "learn") {
        document.querySelectorAll(".letter-tile").forEach((tile) => {
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
renderNumberGrid();
renderToggles();
