const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../client')));

const rooms = new Map();

class GameRoom {
  constructor(roomId) {
    this.id = roomId;
    this.players = new Map();
    this.gameState = 'waiting'; // waiting, playing, ended
    this.maxPlayers = 10;
  }

  addPlayer(socket, playerData) {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }
    
    this.players.set(socket.id, {
      socket: socket,
      id: socket.id,
      name: playerData.name || `Dragon${this.players.size + 1}`,
      dragonType: playerData.dragonType || 'fire',
      position: { x: Math.random() * 100 - 50, y: 20, z: Math.random() * 100 - 50 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      health: 100,
      alive: true
    });
    
    socket.join(this.id);
    this.broadcastPlayerUpdate();
    return true;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    this.broadcastPlayerUpdate();
    
    if (this.players.size === 0) {
      rooms.delete(this.id);
    }
  }

  updatePlayer(socketId, updateData) {
    const player = this.players.get(socketId);
    if (player) {
      Object.assign(player, updateData);
      this.broadcastPlayerUpdate();
    }
  }

  broadcastPlayerUpdate() {
    const playerData = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      dragonType: p.dragonType,
      position: p.position,
      rotation: p.rotation,
      health: p.health,
      alive: p.alive
    }));
    
    io.to(this.id).emit('playersUpdate', playerData);
  }

  startGame() {
    if (this.players.size >= 2) {
      this.gameState = 'playing';
      io.to(this.id).emit('gameStart');
    }
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/room/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('joinRoom', (data) => {
    const { roomId, playerData } = data;
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new GameRoom(roomId));
    }
    
    const room = rooms.get(roomId);
    const joined = room.addPlayer(socket, playerData);
    
    if (joined) {
      socket.emit('joinedRoom', { roomId, playerId: socket.id });
      console.log(`Player ${socket.id} joined room ${roomId}`);
    } else {
      socket.emit('roomFull');
    }
  });

  socket.on('playerUpdate', (updateData) => {
    for (const [roomId, room] of rooms) {
      if (room.players.has(socket.id)) {
        const player = room.players.get(socket.id);
        console.log(`Player ${player.name} position update:`, updateData.position);
        console.log(`Broadcasting to ${room.players.size} players in room ${roomId}`);
        room.updatePlayer(socket.id, updateData);
        break;
      }
    }
  });

  socket.on('attack', (attackData) => {
    for (const [roomId, room] of rooms) {
      if (room.players.has(socket.id)) {
        const attacker = room.players.get(socket.id);
        if (!attacker.alive) return;
        
        console.log(`Attack by ${attacker.name} at position:`, attackData.position);
        
        // Calculate damage to nearby players
        room.players.forEach((target, targetId) => {
          if (targetId !== socket.id && target.alive) {
            const distance = Math.sqrt(
              Math.pow(target.position.x - attackData.position.x, 2) +
              Math.pow(target.position.y - attackData.position.y, 2) +
              Math.pow(target.position.z - attackData.position.z, 2)
            );
            
            console.log(`Distance to ${target.name}: ${distance.toFixed(2)}`);
            
            if (distance < 50) { // Attack range - increased for easier combat
              let damage = 0;
              switch(attackData.dragonType) {
                case 'fire': damage = 25; break;
                case 'ice': damage = 20; break;
                case 'lightning': damage = 30; break;
                case 'shadow': damage = 35; break;
              }
              
              // Apply damage falloff
              damage *= Math.max(0.2, 1 - (distance / 50));
              const finalDamage = Math.floor(damage);
              
              console.log(`Applying ${finalDamage} damage to ${target.name} (health: ${target.health} -> ${Math.max(0, target.health - finalDamage)})`);
              
              target.health = Math.max(0, target.health - finalDamage);
              
              // Send hit effect to all players
              io.to(roomId).emit('playerHit', {
                targetId: targetId,
                attackerId: socket.id,
                hitPosition: target.position,
                damage: finalDamage,
                dragonType: attackData.dragonType
              });
              
              if (target.health <= 0 && target.alive) {
                target.alive = false;
                io.to(roomId).emit('playerEliminated', {
                  eliminatedId: targetId,
                  eliminatedName: target.name,
                  killerId: socket.id,
                  killerName: attacker.name
                });
                
                // Check for victory
                const alivePlayers = Array.from(room.players.values()).filter(p => p.alive);
                if (alivePlayers.length <= 1 && room.players.size > 1) {
                  const winner = alivePlayers[0];
                  io.to(roomId).emit('gameEnd', {
                    winnerId: winner ? winner.id : null,
                    winnerName: winner ? winner.name : 'Draw'
                  });
                  room.gameState = 'ended';
                }
              }
            }
          }
        });
        
        io.to(roomId).emit('playerAttack', {
          playerId: socket.id,
          ...attackData
        });
        
        room.broadcastPlayerUpdate();
        break;
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    for (const [roomId, room] of rooms) {
      if (room.players.has(socket.id)) {
        room.removePlayer(socket.id);
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Dragon Strike server running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
  console.log(`Or try: http://127.0.0.1:${PORT}`);
});