const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
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
  foundLetters: new Set(),
  soundOn: true,
  smallLetters: false,
};

const screens = {
  home: document.querySelector('[data-screen="home"]'),
  free: document.querySelector('[data-screen="free"]'),
  learn: document.querySelector('[data-screen="learn"]'),
};

const typedLettersEl = document.querySelector("#typedLetters");
const typingPlaceholderEl = document.querySelector("#typingPlaceholder");
const letterGridEl = document.querySelector("#letterGrid");
const letterMessageEl = document.querySelector("#letterMessage");
const soundToggleEl = document.querySelector('[data-action="toggle-sound"]');
const caseToggleEl = document.querySelector('[data-action="toggle-case"]');

function letterColor(letter) {
  const index = letters.indexOf(letter);
  return colors[index % colors.length];
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

function displayLetter(letter) {
  return state.smallLetters ? letter.toLowerCase() : letter;
}

function letterLabel(letter) {
  return `${displayLetter(letter)} - ${letterWords[letter]}`;
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
  soundToggleEl.textContent = state.soundOn ? "Sound On" : "Sound Off";
  soundToggleEl.classList.toggle("is-on", state.soundOn);
  soundToggleEl.setAttribute("aria-pressed", String(state.soundOn));

  caseToggleEl.textContent = state.smallLetters ? "Big Letters" : "Small Letters";
  caseToggleEl.classList.toggle("is-on", state.smallLetters);
  caseToggleEl.setAttribute("aria-pressed", String(state.smallLetters));
}

function setMode(mode) {
  if (state.mode === "learn" && mode !== "learn") {
    stopSpeaking();
  }

  state.mode = mode;
  Object.entries(screens).forEach(([screenName, screen]) => {
    screen.classList.toggle("hidden", screenName !== mode);
  });

  if (mode === "free") {
    state.typedLetters = [];
    renderFreeTyping();
  }

  if (mode === "learn") {
    resetLearning();
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
  letterMessageEl.textContent = "Press a letter key.";
  letterMessageEl.classList.remove("repeat");

  document.querySelectorAll(".letter-tile").forEach((tile) => {
    tile.classList.remove("is-active", "was-found");
    tile.textContent = displayLetter(tile.dataset.letter);
  });

  stopSpeaking();
}

function showLetter(letter) {
  const repeatedLetter = state.previousLetter === letter;
  state.previousLetter = letter;
  const word = letterWords[letter];

  letterMessageEl.classList.toggle("repeat", repeatedLetter);
  letterMessageEl.textContent = repeatedLetter ? "Try another letter!" : letterLabel(letter);
  speak(repeatedLetter ? "Try another letter." : word);

  document.querySelectorAll(".letter-tile").forEach((tile) => {
    const isTarget = tile.dataset.letter === letter;
    tile.classList.toggle("is-active", isTarget);
    tile.textContent = displayLetter(tile.dataset.letter);

    if (isTarget) {
      state.foundLetters.add(letter);
      tile.classList.remove("was-found");
      tile.style.animation = "none";
      tile.offsetHeight;
      tile.style.animation = "";
    } else {
      tile.classList.toggle("was-found", state.foundLetters.has(tile.dataset.letter));
    }
  });

  if (repeatedLetter) {
    letterMessageEl.style.animation = "none";
    letterMessageEl.offsetHeight;
    letterMessageEl.style.animation = "";
  }
}

function handleLetter(letter) {
  if (state.mode === "free") {
    state.typedLetters.push(letter);
    renderFreeTyping();
    return;
  }

  if (state.mode === "learn") {
    showLetter(letter);
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

window.addEventListener(
  "keydown",
  (event) => {
    if (state.mode === "home") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (!isPlainLetterKey(event)) {
      return;
    }

    handleLetter(event.key.toUpperCase());
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
      renderFreeTyping();
      return;
    }

    if (action === "back") {
      state.typedLetters.pop();
      renderFreeTyping();
      return;
    }

    if (action === "reset") {
      resetLearning();
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
renderToggles();
