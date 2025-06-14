class DragonStrike {
    constructor() {
        this.socket = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.otherPlayers = new Map();
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            boost: false,
            attack: false,
            paused: false
        };
        this.mouseX = 0;
        this.mouseY = 0;
        this.roomId = this.getRoomIdFromUrl();
        this.playerData = null;
        this.gameStarted = false;
        this.pitchObject = new THREE.Object3D();
        this.yawObject = new THREE.Object3D();
        this.aiEnabled = false;
        this.aiTarget = null;
        this.aiNextAction = 0;
        this.aiRotationInitialized = false;
    }

    getRoomIdFromUrl() {
        const path = window.location.pathname;
        const match = path.match(/\/room\/(.+)/);
        return match ? match[1] : 'lobby';
    }
    
    getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            name: urlParams.get('name'),
            dragon: urlParams.get('dragon'),
            autoJoin: urlParams.has('name') && urlParams.has('dragon')
        };
    }

    init() {
        this.setupScene();
        this.setupLighting();
        this.createEnvironment();
        this.setupControls();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 1000);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 10, 20);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.body.appendChild(this.renderer.domElement);
        
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    createEnvironment() {
        // Sky sphere with gradient
        const skyGeometry = new THREE.SphereGeometry(1500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        // Add clouds
        this.createClouds();

        // Terrain with more variation
        const terrainGeometry = new THREE.PlaneGeometry(3000, 3000, 150, 150);
        
        // Add more complex height variation
        const vertices = terrainGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            vertices[i + 2] = 
                Math.sin(x * 0.008) * Math.cos(y * 0.008) * 25 +
                Math.sin(x * 0.02) * Math.cos(y * 0.02) * 10 +
                Math.sin(x * 0.05) * Math.cos(y * 0.05) * 5;
        }
        terrainGeometry.attributes.position.needsUpdate = true;
        terrainGeometry.computeVertexNormals();
        
        const terrainMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x228B22,
            wireframe: false
        });
        const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrain.rotation.x = -Math.PI / 2;
        terrain.position.y = -100;
        terrain.receiveShadow = true;
        this.scene.add(terrain);
        
        // Add forests
        this.createForests();

        // Add more varied mountains
        for (let i = 0; i < 35; i++) {
            const mountainGeometry = new THREE.ConeGeometry(
                Math.random() * 80 + 30,
                Math.random() * 150 + 80,
                8
            );
            const mountainMaterial = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0.08, 0.4, Math.random() * 0.2 + 0.3)
            });
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            mountain.position.set(
                (Math.random() - 0.5) * 2500,
                -30,
                (Math.random() - 0.5) * 2500
            );
            mountain.rotation.y = Math.random() * Math.PI * 2;
            mountain.castShadow = true;
            this.scene.add(mountain);
        }
    }

    createClouds() {
        // Create distant clouds
        for (let i = 0; i < 25; i++) {
            const cloudGeometry = new THREE.SphereGeometry(
                Math.random() * 30 + 20,
                8, 6
            );
            const cloudMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.6
            });
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            
            cloud.position.set(
                (Math.random() - 0.5) * 2500,
                Math.random() * 200 + 150,
                (Math.random() - 0.5) * 2500
            );
            cloud.scale.set(
                Math.random() * 0.5 + 0.8,
                Math.random() * 0.3 + 0.4,
                Math.random() * 0.5 + 0.8
            );
            
            this.scene.add(cloud);
        }
    }

    createForests() {
        // Create clusters of trees
        for (let cluster = 0; cluster < 15; cluster++) {
            const clusterX = (Math.random() - 0.5) * 2000;
            const clusterZ = (Math.random() - 0.5) * 2000;
            
            // Trees in this cluster
            for (let i = 0; i < 25; i++) {
                const tree = this.createTree();
                tree.position.set(
                    clusterX + (Math.random() - 0.5) * 150,
                    -90,
                    clusterZ + (Math.random() - 0.5) * 150
                );
                this.scene.add(tree);
            }
        }
    }

    createTree() {
        const treeGroup = new THREE.Group();
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(2, 3, 20, 6);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 10;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Tree foliage
        const foliageGeometry = new THREE.SphereGeometry(
            Math.random() * 8 + 12, 6, 6
        );
        const foliageMaterial = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color().setHSL(0.25, 0.6, Math.random() * 0.2 + 0.3)
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 25;
        foliage.scale.y = Math.random() * 0.3 + 0.8;
        foliage.castShadow = true;
        treeGroup.add(foliage);
        
        // Random scale and rotation
        treeGroup.scale.setScalar(Math.random() * 0.5 + 0.8);
        treeGroup.rotation.y = Math.random() * Math.PI * 2;
        
        return treeGroup;
    }

    createDragon(dragonType, playerId) {
        const dragonGroup = new THREE.Group();
        
        // Dragon body (elongated) - oriented forward along Z-axis
        const bodyGeometry = new THREE.CylinderGeometry(2, 4, 12, 8);
        let bodyColor;
        switch(dragonType) {
            case 'fire': bodyColor = 0xFF4500; break;
            case 'ice': bodyColor = 0x00BFFF; break;
            case 'lightning': bodyColor = 0xFFD700; break;
            case 'shadow': bodyColor = 0x483D8B; break;
            default: bodyColor = 0xFF4500;
        }
        
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2; // Point forward along Z-axis
        body.castShadow = true;
        dragonGroup.add(body);
        
        // Wings (positioned for Z-forward orientation)
        const wingGeometry = new THREE.PlaneGeometry(12, 8);
        const wingMaterial = new THREE.MeshLambertMaterial({ 
            color: bodyColor,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-6, -1, 0); // Left side of dragon, lower
        leftWing.rotation.set(0, 0, Math.PI / 8); // Less upward angle
        dragonGroup.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(6, -1, 0); // Right side of dragon, lower
        rightWing.rotation.set(0, 0, -Math.PI / 8); // Less upward angle
        dragonGroup.add(rightWing);
        
        // Head (forward along Z-axis)
        const headGeometry = new THREE.SphereGeometry(3, 8, 6);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 0, 8); // Forward
        head.castShadow = true;
        dragonGroup.add(head);
        
        // Tail (backward along Z-axis)
        const tailGeometry = new THREE.ConeGeometry(1, 8, 6);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(0, 0, -10); // Backward
        tail.rotation.x = -Math.PI / 2; // Point backward
        tail.castShadow = true;
        dragonGroup.add(tail);
        
        // Store dragon type for abilities
        dragonGroup.userData = { dragonType, playerId };
        
        return dragonGroup;
    }

    setupControls() {
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp': 
                    this.controls.forward = true; 
                    break;
                case 'KeyS':
                case 'ArrowDown': 
                    this.controls.backward = true; 
                    break;
                case 'KeyA':
                case 'ArrowLeft': 
                    this.controls.left = true; 
                    break;
                case 'KeyD':
                case 'ArrowRight': 
                    this.controls.right = true; 
                    break;
                case 'Space': 
                    event.preventDefault();
                    this.controls.attack = true; 
                    break;
                case 'ShiftLeft': 
                case 'ShiftRight':
                    this.controls.boost = true; 
                    break;
                case 'KeyP':
                    this.controls.paused = !this.controls.paused;
                    break;
                case 'KeyI':
                    this.aiEnabled = !this.aiEnabled;
                    this.aiRotationInitialized = false; // Reset when toggling
                    console.log('AI', this.aiEnabled ? 'enabled' : 'disabled');
                    
                    // Update visual indicator
                    const aiStatus = document.getElementById('ai-status');
                    if (aiStatus) {
                        aiStatus.style.display = this.aiEnabled ? 'block' : 'none';
                    }
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp': 
                    this.controls.forward = false; 
                    break;
                case 'KeyS':
                case 'ArrowDown': 
                    this.controls.backward = false; 
                    break;
                case 'KeyA':
                case 'ArrowLeft': 
                    this.controls.left = false; 
                    break;
                case 'KeyD':
                case 'ArrowRight': 
                    this.controls.right = false; 
                    break;
                case 'Space': 
                    this.controls.attack = false; 
                    break;
                case 'ShiftLeft': 
                case 'ShiftRight':
                    this.controls.boost = false; 
                    break;
            }
        });
        
        document.addEventListener('mousemove', (event) => {
            this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });
        
        // Pointer lock for better mouse control
        document.addEventListener('click', () => {
            if (this.gameStarted) {
                document.body.requestPointerLock();
            }
        });
        
        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === document.body && this.player && !this.controls.paused && !this.aiEnabled) {
                // Use separate yaw and pitch objects for proper rotation
                this.yawObject.rotation.y -= event.movementX * 0.002;
                this.pitchObject.rotation.x += event.movementY * 0.002;
                
                // Limit pitch to prevent flipping
                this.pitchObject.rotation.x = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.pitchObject.rotation.x));
                
                // Apply rotations to player
                this.player.rotation.set(0, 0, 0);
                this.player.rotateY(this.yawObject.rotation.y);
                this.player.rotateX(this.pitchObject.rotation.x);
            }
        });
    }

    updatePlayer() {
        if (!this.player || !this.gameStarted) return;
        
        // AI Control
        if (this.aiEnabled) {
            this.updateAI();
        }
        
        const speed = this.controls.boost ? 2.0 : 1.0;
        const turnSpeed = 0.03;
        
        // Turn the dragon (keyboard turning) - only if not AI controlled
        if (!this.aiEnabled) {
            if (this.controls.left) {
                this.yawObject.rotation.y += turnSpeed;
                this.player.rotation.set(0, 0, 0);
                this.player.rotateY(this.yawObject.rotation.y);
                this.player.rotateX(this.pitchObject.rotation.x);
            }
            if (this.controls.right) {
                this.yawObject.rotation.y -= turnSpeed;
                this.player.rotation.set(0, 0, 0);
                this.player.rotateY(this.yawObject.rotation.y);
                this.player.rotateX(this.pitchObject.rotation.x);
            }
        }
        
        // Movement based on dragon's current orientation
        const forward = new THREE.Vector3(0, 0, 1); // Forward is positive Z
        forward.applyQuaternion(this.player.quaternion);
        
        if (!this.controls.paused) {
            // Default forward momentum (dragons are always flying)
            const defaultSpeed = 0.3;
            this.player.position.addScaledVector(forward, defaultSpeed);
            
            if (this.controls.forward) {
                this.player.position.addScaledVector(forward, speed);
                // Add slight upward movement when going forward (like flying)
                this.player.position.y += Math.sin(this.pitchObject.rotation.x) * speed * 0.3;
            }
            if (this.controls.backward) {
                // Backward just slows down the dragon (air brakes)
                this.player.position.addScaledVector(forward, -defaultSpeed * 0.7);
            }
        }
        
        // Keep dragon above ground
        this.player.position.y = Math.max(5, this.player.position.y);
        
        // Update camera to follow player (behind the dragon)
        const cameraOffset = new THREE.Vector3(0, 8, -15); // Behind the dragon (negative Z)
        cameraOffset.applyQuaternion(this.player.quaternion);
        this.camera.position.copy(this.player.position).add(cameraOffset);
        this.camera.lookAt(this.player.position);
        
        // Send update to server (always send, whether AI or human controlled)
        if (this.socket) {
            // Occasional debug logging
            // if (Date.now() % 2000 < 50) {
            //     console.log('Sending position update:', this.player.position);
            // }
            
            this.socket.emit('playerUpdate', {
                position: {
                    x: this.player.position.x,
                    y: this.player.position.y,
                    z: this.player.position.z
                },
                rotation: {
                    x: this.player.rotation.x,
                    y: this.player.rotation.y,
                    z: this.player.rotation.z
                }
            });
        }
        
        // Handle attacks
        if (this.controls.attack) {
            this.attack();
            this.controls.attack = false; // Prevent spam
        }
    }

    attack() {
        const attackData = {
            position: this.player.position.clone(),
            rotation: this.player.rotation.clone(),
            dragonType: this.playerData.dragonType
        };
        
        this.socket.emit('attack', attackData);
        this.createAttackEffect(attackData);
    }

    createAttackEffect(attackData) {
        let effect;
        const forward = new THREE.Vector3(0, 0, 1); // Forward direction
        forward.applyEuler(attackData.rotation);
        
        switch(attackData.dragonType) {
            case 'fire':
                effect = this.createFireBreath(attackData.position, forward);
                break;
            case 'ice':
                effect = this.createIceShards(attackData.position, forward);
                break;
            case 'lightning':
                effect = this.createLightningBolt(attackData.position, forward);
                break;
            case 'shadow':
                effect = this.createShadowStrike(attackData.position, forward);
                break;
        }
        
        if (effect) {
            this.scene.add(effect);
            setTimeout(() => {
                this.scene.remove(effect);
            }, 2000);
        }
    }

    createFireBreath(position, direction) {
        const group = new THREE.Group();
        const particles = [];
        
        // Create fire particles that will move forward
        for (let i = 0; i < 30; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(Math.random() * 0.8 + 0.3, 4, 4),
                new THREE.MeshBasicMaterial({ 
                    color: Math.random() > 0.3 ? 0xFF4500 : 0xFF6347,
                    transparent: true,
                    opacity: 0.9
                })
            );
            
            // Start from dragon's mouth area
            particle.position.copy(position);
            particle.position.add(direction.clone().multiplyScalar(5)); // Start ahead of dragon
            
            // Add some spread
            const spread = 3;
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread
            ));
            
            // Store velocity for each particle
            const velocity = direction.clone().multiplyScalar(1.5 + Math.random() * 0.5);
            velocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
            ));
            
            particle.userData = { 
                velocity: velocity,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02
            };
            
            particles.push(particle);
            group.add(particle);
        }
        
        // Animate the fire breath
        const animate = () => {
            let activeParticles = 0;
            
            particles.forEach(particle => {
                if (particle.userData.life > 0) {
                    // Move particle
                    particle.position.add(particle.userData.velocity);
                    
                    // Reduce life and fade out
                    particle.userData.life -= particle.userData.decay;
                    particle.material.opacity = particle.userData.life;
                    
                    // Scale down as it fades
                    const scale = particle.userData.life;
                    particle.scale.setScalar(scale);
                    
                    activeParticles++;
                } else {
                    particle.visible = false;
                }
            });
            
            if (activeParticles > 0) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
        
        return group;
    }

    createIceShards(position, direction) {
        const group = new THREE.Group();
        const shards = [];
        
        // Create multiple ice shards that will fly forward
        for (let i = 0; i < 8; i++) {
            const shard = new THREE.Mesh(
                new THREE.ConeGeometry(0.4, 3, 6),
                new THREE.MeshBasicMaterial({ 
                    color: i % 2 === 0 ? 0x00BFFF : 0x87CEEB,
                    transparent: true,
                    opacity: 0.9
                })
            );
            
            // Start from dragon's mouth area
            shard.position.copy(position);
            shard.position.add(direction.clone().multiplyScalar(5));
            
            // Add some spread
            const spread = 2;
            shard.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread
            ));
            
            // Point in flight direction
            shard.lookAt(shard.position.clone().add(direction));
            
            // Store velocity for each shard
            const velocity = direction.clone().multiplyScalar(2.0 + Math.random() * 0.5);
            velocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            ));
            
            shard.userData = {
                velocity: velocity,
                life: 1.0,
                decay: 0.025,
                rotation: (Math.random() - 0.5) * 0.2
            };
            
            shards.push(shard);
            group.add(shard);
        }
        
        // Animate the ice shards
        const animate = () => {
            let activeShards = 0;
            
            shards.forEach(shard => {
                if (shard.userData.life > 0) {
                    // Move shard
                    shard.position.add(shard.userData.velocity);
                    
                    // Rotate while flying
                    shard.rotation.z += shard.userData.rotation;
                    
                    // Reduce life and fade out
                    shard.userData.life -= shard.userData.decay;
                    shard.material.opacity = shard.userData.life;
                    
                    activeShards++;
                } else {
                    shard.visible = false;
                }
            });
            
            if (activeShards > 0) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
        
        return group;
    }

    createLightningBolt(position, direction) {
        const points = [];
        let currentPos = position.clone();
        
        for (let i = 0; i < 20; i++) {
            points.push(currentPos.clone());
            currentPos.add(direction.clone().multiplyScalar(2));
            currentPos.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xFFD700,
            linewidth: 3
        });
        
        return new THREE.Line(geometry, material);
    }

    createShadowStrike(position, direction) {
        const group = new THREE.Group();
        
        const strike = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 2),
            new THREE.MeshBasicMaterial({ 
                color: 0x483D8B,
                transparent: true,
                opacity: 0.7
            })
        );
        
        strike.position.copy(position);
        strike.position.add(direction.clone().multiplyScalar(10));
        strike.lookAt(position.clone().add(direction.clone().multiplyScalar(50)));
        
        group.add(strike);
        return group;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updatePlayer();
        this.renderer.render(this.scene, this.camera);
    }

    connectToServer() {
        console.log('Attempting to connect to server...');
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server successfully!');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection failed:', error);
        });
        
        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected:', reason);
        });
        
        this.socket.on('joinedRoom', (data) => {
            console.log('Joined room:', data.roomId);
            document.getElementById('lobby').style.display = 'none';
            document.getElementById('ui').style.display = 'block';
            document.getElementById('instructions').style.display = 'block';
            document.getElementById('radar').style.display = 'block';
            this.gameStarted = true;
        });
        
        this.socket.on('roomFull', () => {
            alert('Room is full! Maximum 10 players.');
        });
        
        this.socket.on('playersUpdate', (players) => {
            // Only log occasionally to reduce spam
            if (Date.now() % 3000 < 50) {
                console.log('Received playersUpdate:', players.length, 'players');
            }
            this.updatePlayers(players);
        });
        
        this.socket.on('playerAttack', (attackData) => {
            this.createAttackEffect(attackData);
        });
        
        this.socket.on('playerHit', (hitData) => {
            this.createHitEffect(hitData);
        });
        
        this.socket.on('playerEliminated', (data) => {
            this.showEliminationMessage(data);
        });
        
        this.socket.on('gameEnd', (data) => {
            this.showGameEndScreen(data);
        });
    }

    updatePlayers(players) {
        // Update player list UI
        const playerList = document.getElementById('player-list');
        playerList.innerHTML = '';
        
        players.forEach(player => {
            const div = document.createElement('div');
            div.innerHTML = `${player.name} (${player.dragonType}) - HP: ${player.health}`;
            if (!player.alive) div.style.opacity = '0.5';
            playerList.appendChild(div);
            
            // Create or update dragon models
            if (player.id === this.socket.id) {
                // This is our player
                if (!this.player) {
                    console.log('Creating our player dragon:', player.dragonType);
                    this.player = this.createDragon(player.dragonType, player.id);
                    this.scene.add(this.player);
                }
                this.updateHealthBar(player.health);
            } else {
                // Other players
                if (!this.otherPlayers.has(player.id)) {
                    console.log('Creating other player dragon for:', player.name, player.dragonType);
                    const dragon = this.createDragon(player.dragonType, player.id);
                    this.otherPlayers.set(player.id, dragon);
                    this.scene.add(dragon);
                }
                
                const dragon = this.otherPlayers.get(player.id);
                
                // Debug: Log position changes
                const oldPos = dragon.position.clone();
                dragon.position.set(player.position.x, player.position.y, player.position.z);
                dragon.rotation.set(player.rotation.x, player.rotation.y, player.rotation.z);
                
                // Only log significant movements occasionally
                const distance = oldPos.distanceTo(dragon.position);
                if (distance > 5 && Date.now() % 2000 < 50) {
                    console.log(`${player.name} moved ${distance.toFixed(2)} units`);
                }
            }
        });
        
        // Remove disconnected players
        this.otherPlayers.forEach((dragon, playerId) => {
            const stillExists = players.some(p => p.id === playerId);
            if (!stillExists) {
                this.scene.remove(dragon);
                this.otherPlayers.delete(playerId);
            }
        });
        
        // Update radar
        this.updateRadar(players);
    }

    updateHealthBar(health) {
        const healthFill = document.getElementById('health-fill');
        healthFill.style.width = health + '%';
    }
    
    updateRadar(players) {
        if (!this.player) return;
        
        const radar = document.getElementById('radar');
        if (!radar) return;
        
        // Remove existing dots
        const existingDots = radar.querySelectorAll('.radar-dot');
        existingDots.forEach(dot => dot.remove());
        
        // Add dots for other players
        players.forEach(player => {
            if (player.id === this.socket.id || !player.alive) return;
            
            // Calculate relative position
            const dx = player.position.x - this.player.position.x;
            const dz = player.position.z - this.player.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Scale to radar (max range 300 units)
            const radarRange = 300;
            if (distance > radarRange) return;
            
            const scale = distance / radarRange;
            const radarRadius = 90; // 200px radar, but leave margin
            
            // Calculate angle relative to player's facing direction
            const playerYaw = this.player.rotation.y;
            const angle = Math.atan2(dx, dz) - playerYaw;
            
            // Convert to radar coordinates
            const radarX = Math.sin(angle) * scale * radarRadius + 100; // 100 = center
            const radarY = Math.cos(angle) * scale * radarRadius + 100; // 100 = center
            
            // Create dot
            const dot = document.createElement('div');
            dot.className = `radar-dot ${player.dragonType}`;
            dot.style.left = radarX + 'px';
            dot.style.top = radarY + 'px';
            dot.title = `${player.name} (${distance.toFixed(0)}m)`;
            
            radar.appendChild(dot);
        });
    }
    
    showEliminationMessage(data) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 18px;
            z-index: 1000;
            text-align: center;
        `;
        
        if (data.eliminatedId === this.socket.id) {
            message.innerHTML = `<strong>You were eliminated!</strong><br>Killed by ${data.killerName}`;
        } else {
            message.innerHTML = `<strong>${data.eliminatedName}</strong> was eliminated by <strong>${data.killerName}</strong>`;
        }
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            document.body.removeChild(message);
        }, 3000);
    }
    
    showGameEndScreen(data) {
        const endScreen = document.createElement('div');
        endScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 24px;
            z-index: 1001;
        `;
        
        const isWinner = data.winnerId === this.socket.id;
        const title = isWinner ? 'VICTORY!' : 'GAME OVER';
        const subtitle = isWinner ? 'You are the last dragon standing!' : `${data.winnerName} wins!`;
        
        endScreen.innerHTML = `
            <h1 style="font-size: 48px; margin: 0; color: ${isWinner ? '#FFD700' : '#FF6B6B'};">${title}</h1>
            <p style="font-size: 24px; margin: 20px 0;">${subtitle}</p>
            <button onclick="location.reload()" style="
                font-size: 18px;
                padding: 15px 30px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 20px;
            ">Play Again</button>
        `;
        
        document.body.appendChild(endScreen);
        
        // Disable game controls
        this.gameStarted = false;
    }
    
    createHitEffect(hitData) {
        // Create impact explosion effect
        const group = new THREE.Group();
        
        for (let i = 0; i < 15; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: hitData.dragonType === 'fire' ? 0xFF4500 : 
                           hitData.dragonType === 'ice' ? 0x00BFFF :
                           hitData.dragonType === 'lightning' ? 0xFFD700 : 0x483D8B,
                    transparent: true,
                    opacity: 1.0
                })
            );
            
            particle.position.copy(hitData.hitPosition);
            
            // Random explosion direction
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
            );
            
            particle.userData = {
                velocity: velocity,
                life: 1.0,
                decay: 0.05
            };
            
            group.add(particle);
        }
        
        this.scene.add(group);
        
        // Animate explosion
        const animate = () => {
            let activeParticles = 0;
            
            group.children.forEach(particle => {
                if (particle.userData.life > 0) {
                    particle.position.add(particle.userData.velocity);
                    particle.userData.velocity.multiplyScalar(0.95); // Slow down
                    
                    particle.userData.life -= particle.userData.decay;
                    particle.material.opacity = particle.userData.life;
                    particle.scale.setScalar(particle.userData.life);
                    
                    activeParticles++;
                } else {
                    particle.visible = false;
                }
            });
            
            if (activeParticles > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(group);
            }
        };
        
        animate();
    }
    
    updateAI() {
        const now = Date.now();
        
        // Reset all controls when AI takes over
        this.controls.forward = false;
        this.controls.backward = false;
        this.controls.left = false;
        this.controls.right = false;
        this.controls.boost = false;
        this.controls.attack = false;
        
        // Initialize AI rotation control
        if (!this.aiRotationInitialized) {
            this.pitchObject.rotation.x = 0;
            this.yawObject.rotation.y = this.player.rotation.y;
            this.aiRotationInitialized = true;
        }
        
        // Reset rotation to prevent interference
        this.pitchObject.rotation.x = Math.max(-Math.PI/6, Math.min(Math.PI/6, this.pitchObject.rotation.x));
        
        // Find nearest enemy
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        this.otherPlayers.forEach((dragon, playerId) => {
            const distance = this.player.position.distanceTo(dragon.position);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = { dragon, playerId, distance };
            }
        });
        
        // Reduce spam logging
        if (now % 5000 < 50) {
            console.log('🤖 AI - Other players:', this.otherPlayers.size, nearestEnemy ? `Enemy at ${nearestEnemy.distance.toFixed(1)}` : 'No enemies');
        }
        
        // AI Behavior - increased detection range
        if (nearestEnemy && nearestEnemy.distance < 200) {
            // Combat mode - attack nearby enemies
            this.aiTarget = nearestEnemy;
            
            // Calculate direction to target
            const targetDirection = new THREE.Vector3()
                .subVectors(nearestEnemy.dragon.position, this.player.position)
                .normalize();
            
            // Get current forward direction
            const forward = new THREE.Vector3(0, 0, 1);
            forward.applyQuaternion(this.player.quaternion);
            
            // Calculate turn direction
            const cross = new THREE.Vector3().crossVectors(forward, targetDirection);
            const dot = forward.dot(targetDirection);
            
            // Direct rotation control for AI - turn towards target (more aggressive)
            const turnRate = 0.05;
            console.log('🤖 AI Combat turning - cross.y:', cross.y.toFixed(3), 'dot:', dot.toFixed(3));
            
            // Always turn toward target if not facing it
            if (Math.abs(cross.y) > 0.01) {
                if (cross.y > 0) {
                    this.yawObject.rotation.y += turnRate;
                    console.log('🤖 AI Combat turning LEFT toward target');
                } else {
                    this.yawObject.rotation.y -= turnRate;
                    console.log('🤖 AI Combat turning RIGHT toward target');
                }
            }
            
            // Adjust pitch to face target vertically
            const verticalDiff = nearestEnemy.dragon.position.y - this.player.position.y;
            const pitchRate = 0.015;
            if (Math.abs(verticalDiff) > 5) {
                if (verticalDiff > 0) {
                    // Target is higher, pitch up
                    this.pitchObject.rotation.x = Math.min(this.pitchObject.rotation.x + pitchRate, Math.PI/8);
                } else {
                    // Target is lower, pitch down
                    this.pitchObject.rotation.x = Math.max(this.pitchObject.rotation.x - pitchRate, -Math.PI/8);
                }
            }
            
            // Apply all rotations at once (every frame in combat)
            this.player.rotation.set(0, 0, 0);
            this.player.rotateY(this.yawObject.rotation.y);
            this.player.rotateX(this.pitchObject.rotation.x);
            
            // Move forward aggressively
            this.controls.forward = true;
            
            // Attack if close and facing target
            if (nearestEnemy.distance < 60 && dot > 0.7 && now > this.aiNextAction) {
                this.controls.attack = true;
                this.aiNextAction = now + 1500; // Cooldown
            }
            
            // Use boost in combat
            if (nearestEnemy.distance > 30) {
                this.controls.boost = true;
            }
            
        } else {
            // Patrol mode - fly around randomly
            if (now > this.aiNextAction) {
                // Choose random action - direct rotation control
                const action = Math.random();
                
                if (action < 0.4) {
                    // Turn left (bigger turn)
                    this.yawObject.rotation.y += 0.3;
                    console.log('🤖 AI TURNING LEFT - New yaw:', this.yawObject.rotation.y.toFixed(2));
                } else if (action < 0.8) {
                    // Turn right (bigger turn)
                    this.yawObject.rotation.y -= 0.3;
                    console.log('🤖 AI TURNING RIGHT - New yaw:', this.yawObject.rotation.y.toFixed(2));
                } else {
                    // Change pitch slightly
                    this.pitchObject.rotation.x += (Math.random() - 0.5) * 0.1;
                    this.pitchObject.rotation.x = Math.max(-Math.PI/8, Math.min(Math.PI/8, this.pitchObject.rotation.x));
                    console.log('🤖 AI ADJUSTING PITCH - New pitch:', this.pitchObject.rotation.x.toFixed(2));
                }
                
                // Apply rotation
                this.player.rotation.set(0, 0, 0);
                this.player.rotateY(this.yawObject.rotation.y);
                this.player.rotateX(this.pitchObject.rotation.x);
                
                console.log('🤖 AI ROTATION APPLIED - Final yaw:', this.player.rotation.y.toFixed(2), 'pitch:', this.player.rotation.x.toFixed(2));
                
                // Random action duration (faster)
                this.aiNextAction = now + (500 + Math.random() * 1500);
            }
            
            // Always move forward in patrol mode
            this.controls.forward = true;
        }
        
        // Avoid going too low
        if (this.player.position.y < 15) {
            // Pitch up to climb
            this.pitchObject.rotation.x = Math.min(this.pitchObject.rotation.x + 0.02, Math.PI/6);
            this.player.rotation.set(0, 0, 0);
            this.player.rotateY(this.yawObject.rotation.y);
            this.player.rotateX(this.pitchObject.rotation.x);
        }
        
        // Avoid going too high
        if (this.player.position.y > 80) {
            // Pitch down to descend
            this.pitchObject.rotation.x = Math.max(this.pitchObject.rotation.x - 0.02, -Math.PI/6);
            this.player.rotation.set(0, 0, 0);
            this.player.rotateY(this.yawObject.rotation.y);
            this.player.rotateX(this.pitchObject.rotation.x);
        }
    }
}

// Global functions
function joinGame() {
    try {
        console.log('Join button clicked!');
        
        const name = document.getElementById('playerName').value.trim() || 'Anonymous';
        const dragonType = document.getElementById('dragonSelect').value;
        
        console.log('Starting game...', { name, dragonType });
        
        window.game = new DragonStrike();
        window.game.playerData = { name, dragonType };
        
        console.log('Room ID:', window.game.roomId);
        
        console.log('Initializing game...');
        window.game.init();
        
        console.log('Connecting to server...');
        window.game.connectToServer();
        
        // Wait a moment for connection, then join room
        setTimeout(() => {
            console.log('Emitting joinRoom event...');
            window.game.socket.emit('joinRoom', {
                roomId: window.game.roomId,
                playerData: window.game.playerData
            });
        }, 1000);
        
    } catch (error) {
        console.error('Error in joinGame:', error);
        alert('Error starting game: ' + error.message);
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('Dragon Strike initialized');
    
    // Check for URL parameters to auto-join
    const game = new DragonStrike();
    const params = game.getUrlParams();
    
    if (params.autoJoin) {
        // Auto-join with URL parameters
        console.log('Auto-joining with params:', params);
        
        // Validate dragon type
        const validDragons = ['fire', 'ice', 'lightning', 'shadow'];
        const dragonType = validDragons.includes(params.dragon) ? params.dragon : 'fire';
        
        // Set up game
        window.game = game;
        window.game.playerData = { 
            name: params.name || 'Player', 
            dragonType: dragonType 
        };
        
        // Hide lobby and start game
        document.getElementById('lobby').style.display = 'none';
        document.getElementById('ui').style.display = 'block';
        document.getElementById('instructions').style.display = 'block';
        document.getElementById('radar').style.display = 'block';
        
        window.game.init();
        window.game.connectToServer();
        
        // Join room after connection
        setTimeout(() => {
            window.game.socket.emit('joinRoom', {
                roomId: window.game.roomId,
                playerData: window.game.playerData
            });
        }, 500);
    }
});