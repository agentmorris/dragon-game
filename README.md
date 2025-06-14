# 🐉 Dragon Strike

A real-time multiplayer 3D dragon combat flight simulator built for the web. Players control powerful dragons in aerial dogfights with unique abilities and medieval fantasy aesthetics.

![Dragon Strike](https://img.shields.io/badge/Game-Multiplayer-blue) ![Tech](https://img.shields.io/badge/Tech-WebGL%20%7C%20Node.js-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎮 Game Features

### Core Gameplay
- **Real-time multiplayer combat** for 2-10 players per room
- **Elimination-based battles** - last dragon standing wins
- **Arcade-style flight physics** optimized for fun over realism
- **No downloads required** - plays directly in web browsers

### Dragon Types & Abilities
Each dragon has unique combat abilities and visual effects:

- **🔥 Fire Dragon** - Fast and agile with devastating fire breath attacks
- **🧊 Ice Dragon** - Tanky with piercing ice shard projectiles  
- **⚡ Lightning Dragon** - Highly maneuverable with lightning bolt strikes
- **🌑 Shadow Dragon** - Stealthy with powerful shadow strike abilities

### Game Systems
- **Dynamic damage calculation** with distance-based falloff
- **Real-time health tracking** with medieval-styled UI
- **Radar system** showing nearby enemies with color-coded indicators
- **AI opponents** for testing and single-player practice
- **Room-based matchmaking** via shareable URLs

## 🎨 Visual Design

### Medieval Fantasy Aesthetic
- **Cinzel & Philosopher fonts** for authentic medieval typography
- **Golden/brown color palette** with wood textures and ornate borders
- **Particle effects** for dragon abilities (fire, ice, lightning, shadow)
- **Hit impact effects** with elemental-themed explosions

### Rich 3D Environment
- **Procedural terrain** with rolling hills and valleys
- **375+ trees** arranged in realistic forest clusters
- **35+ mountains** with varied sizes and rotations
- **25+ floating clouds** at different altitudes
- **Dynamic lighting** with shadows and ambient effects

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start the development server
npm start

# Open browser to http://localhost:3000
```

### Quick Play URLs
Skip the lobby screen with URL parameters:
```
http://localhost:3000?name=YourName&dragon=fire
http://localhost:3000/room/battle?name=Player1&dragon=ice
```

### Multiplayer Testing
1. Open multiple browser tabs
2. Use different names and dragon types
3. Press **'I'** in one tab to enable AI for testing

## 🎯 Controls

| Control | Action |
|---------|--------|
| **WASD** or **Arrow Keys** | Move dragon |
| **Mouse** | Look around (click to lock cursor) |
| **Space** | Attack with dragon's special ability |
| **Shift** | Boost speed |
| **P** | Pause movement (debug) |
| **I** | Toggle AI control (debug) |

## 🏗️ Tech Stack

### Frontend
- **Three.js** - 3D graphics and WebGL rendering
- **Socket.io Client** - Real-time multiplayer communication
- **HTML5 Canvas** - Hardware-accelerated graphics
- **CSS3** - Medieval UI styling with gradients and shadows
- **Google Fonts** - Cinzel and Philosopher typefaces

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web server framework
- **Socket.io** - WebSocket real-time communication
- **Authoritative server** - Server-side game state and hit detection

### Architecture
- **Client-server model** with authoritative game state
- **Real-time synchronization** of player positions and actions
- **Server-side damage calculation** to prevent cheating
- **Room-based multiplayer** supporting up to 10 players per room
- **WebSocket communication** for low-latency gameplay

### Performance Features
- **Efficient 3D rendering** with optimized geometry
- **Client-side prediction** for smooth movement
- **Level-of-detail** systems for distant objects
- **Frustum culling** for better performance

## 🔧 Deployment

### Requirements
- **Node.js 16+**
- **Modern web browser** with WebGL support
- **Linux/Windows/macOS** server

### Production Deployment
```bash
# Install PM2 process manager
npm install -g pm2

# Start with PM2
pm2 start server/server.js --name "dragonstrike"

# Configure auto-start
pm2 startup
pm2 save

# Open firewall ports
sudo ufw allow 3000
sudo ufw allow 80
```

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🎮 Game Mechanics

### Combat System
- **Damage varies by dragon type**: Fire (25), Ice (20), Lightning (30), Shadow (35)
- **Range-based combat** with 50-unit attack radius
- **Damage falloff** based on distance from impact
- **Elimination on 0 health** with victory conditions

### Flight Physics
- **Continuous forward momentum** - dragons always fly forward
- **Turning controls** for direction changes
- **Altitude management** with automatic ground collision prevention
- **Boost mechanic** for increased speed during combat

### AI System
- **Combat mode** - actively hunts and attacks nearby players
- **Patrol mode** - random flight patterns when no enemies detected
- **Smart targeting** - turns toward enemies and adjusts pitch/yaw
- **Collision avoidance** - maintains safe altitude automatically

## 🛠️ Development

### Project Structure
```
dragonstrike/
├── client/           # Frontend assets
│   ├── index.html   # Main game page
│   └── game.js      # Game logic and Three.js rendering
├── server/          # Backend Node.js application
│   └── server.js    # Express server and Socket.io handlers
├── package.json     # Dependencies and scripts
├── deploy.sh        # Automated deployment script
└── README.md        # This file
```

### Key Classes
- **DragonStrike** - Main game class managing scenes, players, and networking
- **GameRoom** - Server-side room management with player state
- **Dragon Models** - Procedural 3D dragon generation with type variations
- **AI Controller** - Autonomous dragon behavior for combat and patrol

### Development Commands
```bash
npm start          # Start development server
npm test           # Run tests (if implemented)
pm2 logs           # View production logs
pm2 restart all    # Restart all PM2 processes
```

## 🌍 Browser Support

- **Chrome 80+** ✅
- **Firefox 75+** ✅  
- **Safari 13+** ✅
- **Edge 80+** ✅
- **Mobile browsers** ⚠️ (limited WebGL support)

## 📈 Performance

### Recommended Specs
- **CPU**: 2+ cores, 2GHz+
- **RAM**: 1GB+ available
- **GPU**: Integrated graphics or better
- **Network**: Broadband connection for multiplayer

### Optimization Features
- **LOD system** for distant objects
- **Texture compression** for faster loading
- **Geometry instancing** for trees and mountains
- **Efficient particle systems** for effects

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Planned Features
- [ ] **Power-ups** - Temporary abilities scattered across the map
- [ ] **Team battles** - 2v2 or 3v3 dragon combat modes  
- [ ] **Spectator mode** - Watch ongoing battles
- [ ] **Leaderboards** - Track wins and kill/death ratios
- [ ] **Custom dragon skins** - Unlockable cosmetic variations
- [ ] **Mobile support** - Touch controls for tablets/phones
- [ ] **Voice chat** - Built-in communication for teams

### Technical Improvements
- [ ] **WebRTC networking** - Peer-to-peer for lower latency
- [ ] **Server clustering** - Support for larger player counts
- [ ] **Anti-cheat systems** - Enhanced security measures
- [ ] **Replay system** - Record and playback epic battles
- [ ] **Performance profiler** - Built-in FPS and network monitoring

## 🏆 Credits

Built with ❤️ using modern web technologies. Special thanks to the Three.js and Socket.io communities for excellent documentation and examples.

---

**Ready to soar into battle? Deploy your server and share the realm with fellow dragon riders!** 🐲⚔️