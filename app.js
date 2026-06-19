// Games Configuration with Local Port mappings and styling metadata
const GAME_THEMES = {
  "toy-battle": {
    glowStart: "#f43f5e",
    glowEnd: "#ec4899",
    glowShadow: "rgba(244, 63, 94, 0.35)",
    bannerIcon: "🪖",
    bannerGradient: "linear-gradient(135deg, #4c0519, #1c1917)",
    bannerSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:70%;height:70%;opacity:0.75;"><circle cx="30" cy="50" r="10" fill="#f43f5e" /><circle cx="70" cy="50" r="10" fill="#3b82f6" /><path d="M 45 50 L 55 50 M 50 45 L 50 55" stroke="#fff" stroke-width="4" stroke-linecap="round" /><path d="M20 75 C30 65, 70 65, 80 75" stroke="#f43f5e" stroke-width="3" stroke-dasharray="3 3" /></svg>`
  },
  "odyssee": {
    glowStart: "#10b981",
    glowEnd: "#14b8a6",
    glowShadow: "rgba(16, 185, 129, 0.35)",
    bannerIcon: "🐸",
    bannerGradient: "linear-gradient(135deg, #022c22, #111827)",
    bannerSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:70%;height:70%;opacity:0.75;"><rect x="20" y="40" width="15" height="15" rx="4" fill="#10b981" /><rect x="65" y="30" width="15" height="15" rx="4" fill="#10b981" /><circle cx="50" cy="70" r="12" fill="#06b6d4" /><path d="M 27 55 C 27 75, 40 70, 50 70" stroke="#10b981" stroke-width="2" stroke-dasharray="4 4" /></svg>`
  },
  "trio": {
    glowStart: "#fbbf24",
    glowEnd: "#ea580c",
    glowShadow: "rgba(251, 191, 36, 0.35)",
    bannerIcon: "🃏",
    bannerGradient: "linear-gradient(135deg, #451a03, #18181b)",
    bannerSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:70%;height:70%;opacity:0.75;"><rect x="25" y="25" width="20" height="30" rx="3" fill="#fbbf24" stroke="#fff" stroke-width="2" transform="rotate(-10 35 40)" /><rect x="55" y="25" width="20" height="30" rx="3" fill="#ea580c" stroke="#fff" stroke-width="2" transform="rotate(10 65 40)" /><circle cx="50" cy="75" r="10" fill="#ef4444" /></svg>`
  },
  "kalaha": {
    glowStart: "#3b82f6",
    glowEnd: "#6366f1",
    glowShadow: "rgba(59, 130, 246, 0.35)",
    bannerIcon: "🏺",
    bannerGradient: "linear-gradient(135deg, #172554, #0f172a)",
    bannerSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:70%;height:70%;opacity:0.75;"><rect x="15" y="35" width="70" height="30" rx="15" fill="#1e293b" stroke="#3b82f6" stroke-width="3" /><circle cx="30" cy="50" r="8" fill="#fbbf24" /><circle cx="50" cy="50" r="8" fill="#38bdf8" /><circle cx="70" cy="50" r="8" fill="#ec4899" /></svg>`
  },
  "blokus": {
    glowStart: "#8b5cf6",
    glowEnd: "#d946ef",
    glowShadow: "rgba(139, 92, 246, 0.35)",
    bannerIcon: "🧱",
    bannerGradient: "linear-gradient(135deg, #3b0764, #18181b)",
    bannerSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:70%;height:70%;opacity:0.75;"><path d="M 20 50 L 40 30 L 60 50 L 40 70 Z" fill="#8b5cf6" stroke="#fff" stroke-width="2" /><path d="M 45 70 L 65 50 L 85 70 L 65 90 Z" fill="#d946ef" stroke="#fff" stroke-width="2" /><path d="M 45 30 L 65 10 L 85 30 L 65 50 Z" fill="#3b82f6" stroke="#fff" stroke-width="2" /></svg>`
  },
  "puissance4": {
    glowStart: "#eab308",
    glowEnd: "#ef4444",
    glowShadow: "rgba(239, 68, 68, 0.35)",
    bannerIcon: "🔴",
    bannerGradient: "linear-gradient(135deg, #450a0a, #0f172a)",
    bannerSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:70%;height:70%;opacity:0.75;"><circle cx="35" cy="50" r="12" fill="#ef4444" /><circle cx="65" cy="50" r="12" fill="#eab308" /><rect x="15" y="70" width="70" height="8" rx="2" fill="#3b82f6" /></svg>`
  },
  "car_race": {
    glowStart: "#f97316",
    glowEnd: "#ef4444",
    glowShadow: "rgba(249, 115, 22, 0.35)",
    bannerIcon: "🏎️",
    bannerGradient: "linear-gradient(135deg, #431407, #18181b)",
    bannerSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:70%;height:70%;opacity:0.75;"><rect x="25" y="45" width="50" height="20" rx="4" fill="#f97316" /><circle cx="35" cy="65" r="8" fill="#111" stroke="#fff" stroke-width="2" /><circle cx="65" cy="65" r="8" fill="#111" stroke="#fff" stroke-width="2" /><path d="M 20 80 L 80 80" stroke="#9aa0a6" stroke-width="3" stroke-dasharray="8 6" /></svg>`
  },
  "pong": {
    glowStart: "#06b6d4",
    glowEnd: "#3b82f6",
    glowShadow: "rgba(6, 182, 212, 0.35)",
    bannerIcon: "🏓",
    bannerGradient: "linear-gradient(135deg, #083344, #0f172a)",
    bannerSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:70%;height:70%;opacity:0.75;"><rect x="15" y="30" width="6" height="30" rx="2" fill="#fff" /><rect x="79" y="45" width="6" height="30" rx="2" fill="#fff" /><circle cx="48" cy="48" r="4" fill="#6366f1" /><line x1="50" y1="10" x2="50" y2="90" stroke="#334155" stroke-width="2" stroke-dasharray="4 4" /></svg>`
  }
};

const STATIC_GAMES = [
  {
    id: "toy-battle",
    name: "Toy Battle",
    url: "./games/toy-battle/public/index.html",
    theme: "from-rose-600 to-pink-500",
    desc: "Tactical war game with toy soldiers, pathfinding, and decision guidance.",
    online: true
  },
  {
    id: "odyssee",
    name: "Odyssée des grenouilles",
    url: "./games/odyssee/index.html",
    theme: "from-emerald-600 to-teal-500",
    desc: "Navigate frogs through dangerous lily pads and water flows in this logic game.",
    online: true
  },
  {
    id: "trio",
    name: "Trio",
    url: "./games/trio/index.html",
    theme: "from-amber-500 to-orange-600",
    desc: "A clever grid-based board game focused on three-in-a-row tactical alignments.",
    online: true
  },
  {
    id: "kalaha",
    name: "Kalaha",
    url: "./games/kalaha/index.html",
    theme: "from-blue-600 to-indigo-500",
    desc: "Traditional Mancala-style game with a gorgeous circular board and smart AI.",
    online: true
  },
  {
    id: "blokus",
    name: "Blokus",
    url: "./games/blokus/index.html",
    theme: "from-violet-600 to-purple-500",
    desc: "Classic block placement strategy game. Block your opponents and occupy the board.",
    online: true
  },
  {
    id: "puissance4",
    name: "Puissance 4",
    url: "./games/puissance4/index.html",
    theme: "from-yellow-500 to-red-600",
    desc: "Alignez 4 jetons de votre couleur horizontalement, verticalement ou en diagonale pour gagner.",
    online: true
  },
  {
    id: "car_race",
    name: "Car Racing",
    url: "./games/car_race/index.html",
    theme: "from-orange-500 to-red-600",
    desc: "Un jeu de course de voitures frénétique pour 2 joueurs sur un même écran. Prenez le contrôle et gagnez la course !",
    online: true
  },
  {
    id: "pong",
    name: "Pong",
    url: "./games/pong/index.html",
    theme: "from-cyan-500 to-blue-600",
    desc: "Le jeu de tennis de table rétro légendaire. Simple, rapide et captivant pour deux joueurs.",
    online: true
  }
];

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  renderGamesGrid(STATIC_GAMES);
  updateQuickSwitcher(STATIC_GAMES);
  
  // Set up event listeners
  setupListeners();
});

// Setup global event listeners
function setupListeners() {
  const btnBack = document.getElementById("btn-back");
  const btnRefresh = document.getElementById("btn-refresh");
  const btnNewTab = document.getElementById("btn-new-tab");
  const quickSwitcher = document.getElementById("quick-switcher");
  const gameFrame = document.getElementById("game-frame");
  const iframeLoading = document.getElementById("iframe-loading");
  
  btnBack.addEventListener("click", exitToHub);
  btnRefresh.addEventListener("click", reloadActiveGame);
  btnNewTab.addEventListener("click", openActiveGameInNewTab);
  
  quickSwitcher.addEventListener("change", (e) => {
    const gameId = e.target.value;
    if (gameId) {
      launchGame(gameId);
      // Reset select index so they can select again
      quickSwitcher.value = "";
    }
  });

  gameFrame.addEventListener("load", () => {
    // Hide the loader once iframe finishes loading
    if (gameFrame.src !== "about:blank") {
      iframeLoading.style.opacity = "0";
      setTimeout(() => {
        iframeLoading.style.display = "none";
      }, 300);
    }
  });
}

// Render the grid of available games
function renderGamesGrid(games) {
  const grid = document.getElementById("games-grid");
  grid.innerHTML = ""; // Clear loader or previous entries
  
  games.forEach(game => {
    const theme = GAME_THEMES[game.id] || {
      glowStart: "#6366f1",
      glowEnd: "#a855f7",
      glowShadow: "rgba(99, 102, 241, 0.2)",
      bannerIcon: "🎮",
      bannerGradient: "linear-gradient(135deg, #1e293b, #0f172a)",
      bannerSvg: `<svg viewBox="0 0 100 100" fill="none" style="width:60%;height:60%;opacity:0.5;"><circle cx="50" cy="50" r="30" fill="#fff" /></svg>`
    };
    
    const card = document.createElement("div");
    card.className = "game-card";
    
    // Set custom CSS variables for color styling
    card.style.setProperty("--glow-start", theme.glowStart);
    card.style.setProperty("--glow-end", theme.glowEnd);
    card.style.setProperty("--glow-shadow", theme.glowShadow);
    
    const statusText = "Prêt";
    const statusClass = "online";
    
    card.innerHTML = `
      <div class="card-artwork" style="background: ${theme.bannerGradient}">
        <img src="assets/${game.id}.png" class="artwork-img" alt="${game.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="artwork-fallback" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
          ${theme.bannerSvg}
        </div>
        <div class="card-badges">
          <span class="badge status ${statusClass}">
            <span class="badge-dot"></span>
            ${statusText}
          </span>
        </div>
      </div>
      <div class="card-details">
        <h2 class="game-title">${theme.bannerIcon} ${game.name}</h2>
        <p class="game-desc">${game.desc}</p>
        <button class="btn btn-primary" onclick="launchGame('${game.id}')">
          Lancer la Partie
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </button>
      </div>
    `;
    
    grid.appendChild(card);
  });
}

// Populate the quick game switcher dropdown
function updateQuickSwitcher(games) {
  const switcher = document.getElementById("quick-switcher");
  
  // Clear extra options, keep the disabled placeholder
  switcher.innerHTML = `<option value="" disabled selected>Changer de jeu rapidement...</option>`;
  
  games.forEach(game => {
    const option = document.createElement("option");
    option.value = game.id;
    option.textContent = game.name;
    switcher.appendChild(option);
  });
}

// Launch selected game into the iframe
function launchGame(gameId) {
  const game = STATIC_GAMES.find(g => g.id === gameId);
  if (!game) return;
  
  const dashboard = document.getElementById("dashboard");
  const gameView = document.getElementById("game-view");
  const gameFrame = document.getElementById("game-frame");
  const iframeLoading = document.getElementById("iframe-loading");
  const iframeLoadingText = document.getElementById("iframe-loading-text");
  const activeGameTitle = document.getElementById("active-game-title");
  
  // Set details and show loader
  activeGameTitle.textContent = game.name;
  iframeLoadingText.textContent = `Chargement de ${game.name}...`;
  iframeLoading.style.display = "flex";
  iframeLoading.style.opacity = "1";
  
  // Switch Views
  dashboard.classList.remove("active");
  gameView.classList.add("active");
  
  // Load iframe
  gameFrame.src = game.url;
}

// Exit the game view and return to main dashboard
function exitToHub() {
  const dashboard = document.getElementById("dashboard");
  const gameView = document.getElementById("game-view");
  const gameFrame = document.getElementById("game-frame");
  
  // Unload iframe
  gameFrame.src = "about:blank";
  
  // Switch Views
  gameView.classList.remove("active");
  dashboard.classList.add("active");
}

// Reload the active game iframe
function reloadActiveGame() {
  const gameFrame = document.getElementById("game-frame");
  const iframeLoading = document.getElementById("iframe-loading");
  
  if (gameFrame.src !== "about:blank") {
    iframeLoading.style.display = "flex";
    iframeLoading.style.opacity = "1";
    gameFrame.src = gameFrame.src; // Reload
  }
}

// Open active game in a new browser tab
function openActiveGameInNewTab() {
  const gameFrame = document.getElementById("game-frame");
  if (gameFrame.src !== "about:blank") {
    window.open(gameFrame.src, "_blank");
  }
}

// Expose launchGame globally so inline onclick handlers work
window.launchGame = launchGame;
