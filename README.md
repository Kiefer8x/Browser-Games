# 🕹️ Cyber Arcade — Open-Source Browser Games Hub

An ultra-sleek, modern, and zero-dependency collection of classic arcade and retro games built entirely with vanilla **HTML5**, **CSS3**, and **JavaScript (ES6)**.

Every game runs 100% offline in any modern browser, features synthesized 8-bit sound effects using the **Web Audio API** (no missing audio assets!), and is fully deployable to **GitHub Pages**, **Cloudflare Pages**, or any static web host.

---

## 🎮 Included Games

| Game | Genre | Mode | Controls | Key Features |
| :--- | :--- | :--- | :--- | :--- |
| **Neon Tetris** | Classic Arcade | 1P | Arrow Keys / Space / `C` to Hold | Ghost piece, SRS rotation wall kicks, level speed progression |
| **Cyber Snake** | Classic Arcade | 1P | Arrow Keys / WASD | Smooth turning, energy orbs, timed golden apple bonuses, particle effects |
| **Space Invaders** | Action / Shooter | 1P | `←` `→` / Space to fire | Destructible bunkers, mystery flying saucers (UFOs), accelerating alien waves |
| **Asteroids Vector** | Action / Shooter | 1P | `←` `→` rotate / `↑` thrust / `Shift` hyperspace | Realistic Newtonian inertia & drift, splitting asteroids, laser blaster |
| **Pac-Man Cyber Maze** | Classic Arcade | 1P | Arrow Keys / WASD | Pellet eating, energized scared ghosts, bonus fruit, ghost AI routines |
| **Cyber Pong** | Arcade Duel | 1P vs AI / 2P Local | Mouse, `W`/`S`, or `↑`/`↓` | 3 AI difficulty settings (Easy, Medium, Master) and 2-Player local mode |
| **Neon Breakout** | Brick Breaker | 1P | Mouse / Arrow Keys | Multi-ball capsules, paddle expander power-ups, brick shattering particles |
| **Cyber Minesweeper** | Puzzle / Logic | 1P | Left Click reveal / Right Click flag | Safe first-click guarantee, digital timer, Beginner / Intermediate / Expert |
| **2048 Neon** | Puzzle / Logic | 1P | Arrow Keys / Touch Swipes / `Z` Undo | Dynamic neon tile progression, move undo history, touch gestures |

---

## ✨ Features

- **Cyberpunk Dark Aesthetic**: Glassmorphism cards, glowing neon palettes, dynamic starfield canvas, and smooth micro-animations.
- **Theatrical Game Launcher**: Play games in an embedded modal player with 1-click **Fullscreen**, **Open in New Tab**, and instant restart.
- **Standalone Game Architecture**: Each game in `games/<game_name>` has its own `index.html` and can be played or shared independently.
- **Local High Score Tracking**: High scores persist across sessions in `localStorage`.
- **Dynamic 8-Bit Web Audio Synthesizer**: Generates lasers, explosions, bounces, and coin sounds directly in the browser with zero external MP3 dependencies.
- **Zero Build Steps**: No `npm run build` or compilation needed—pure static web files.
- **Responsive & Mobile Friendly**: On-screen buttons / D-Pads and touch gesture support for mobile gaming.

---

## 🚀 Quick Start

### Option 1: Run with NPM
```bash
npm start
```
This will launch a local server at `http://localhost:3000`.

### Option 2: Run with Python 3
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

### Option 3: Direct File Opening
Double-click `index.html` in your file explorer to open it directly in Google Chrome, Safari, Firefox, or Edge.

---

## 🗄️ Synology NAS Deployment

Because this repository consists of pure static web assets, it uses virtually zero CPU and less than **15 MB of RAM** on your Synology NAS.

### Method 1: Synology Container Manager (Recommended)

1. **Copy/Upload** this repository to your Synology NAS (e.g. into `/volume1/docker/browser-games`).
2. Open **Container Manager** on DSM.
3. Go to **Project** > **Create**:
   - **Project Name**: `cyber-arcade`
   - **Path**: Select `/docker/browser-games`
   - **Source**: Select *Use existing docker-compose.yml*
4. Click **Next** > **Done**.
5. Once started, access your arcade at:
   ```text
   http://<YOUR-SYNOLOGY-IP>:8085
   ```
   *(e.g., `http://192.168.0.4:8085` or via Tailscale IP)*

> [!TIP]
> Because `docker-compose.yml` mounts the folder directly, any new games you add to the `games/` folder on your NAS will be available instantly without restarting or rebuilding the container!

### Method 2: Synology Web Station (No Docker needed)

1. Open **Package Center** and install **Web Station** if not already installed.
2. In File Station, copy this repository folder into your NAS's `web` shared folder (e.g., `/volume1/web/arcade`).
3. Open **Web Station** > **Web Service** > **Create**:
   - **Service Type**: Static website
   - **Name**: `Cyber Arcade`
   - **Document Root**: `/web/arcade`
4. Under **Web Portal** > **Create**:
   - Select the `Cyber Arcade` service.
   - Choose your preferred port (e.g. `8085`) or assign a subdomain/hostname.
5. Save and open `http://<YOUR-SYNOLOGY-IP>:8085`.

---

## 🌐 Deploy to GitHub Pages (1-Click)

1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "Add Cyber Arcade browser games hub"
   git push origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select branch **`main`** and folder **`/ (root)`**, then click **Save**.
3. Your arcade will be live worldwide in minutes at `https://<your-username>.github.io/<repo-name>/`!

---

## 🧩 Adding More Games to the Hub

Adding open-source games to this repository takes less than a minute:

1. **Add your game folder**:
   Create a new folder inside `games/` (e.g., `games/my-game/`) containing `index.html`, scripts, and styles.
2. **Register it in `js/portal.js`**:
   Add an entry to the `GAMES` array:
   ```javascript
   {
       id: 'my-game',
       title: 'My Game Title',
       category: 'arcade', // 'arcade', 'action', or 'puzzle'
       badge: 'Custom Genre',
       mode: '1 Player',
       icon: '🎮',
       path: 'games/my-game/index.html',
       description: 'Short summary of gameplay and rules.',
       highScoreKey: 'arcade_mygame_hi' // optional
   }
   ```
3. Refresh the page—your game will automatically appear with filtering, search, favorite toggling, and launcher modal support!

---

## 📜 License

This project is licensed under the **MIT License**. Free for personal and commercial use, educational purposes, and modification.
