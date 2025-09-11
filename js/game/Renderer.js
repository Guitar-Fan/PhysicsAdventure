/**
 * Renderer - Handles all game rendering and visual effects
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        
        // Rendering settings
        this.pixelRatio = window.devicePixelRatio || 1;
        this.smoothing = true;
        this.showDebug = false;
        
        // Camera system
        this.camera = {
            position: Vector2D.zero(),
            zoom: 1.0,
            rotation: 0,
            bounds: null
        };
        
        // Particle system
        this.particles = [];
        this.maxParticles = 500;
        
        // Visual effects
        this.trails = [];
        this.explosions = [];
        
        // Color schemes and themes
        this.colors = {
            background: '#0c0c1e',
            foreground: '#ffffff',
            accent: '#00d4ff',
            warning: '#ffaa00',
            danger: '#ff4444',
            success: '#00ff88',
            physics: {
                velocity: '#ffaa00',
                acceleration: '#ff6600',
                force: '#00d4ff',
                trajectory: '#ffffff80'
            }
        };
        
        // Text rendering settings
        this.fonts = {
            ui: '16px Arial, sans-serif',
            title: 'bold 24px Arial, sans-serif',
            debug: '12px monospace'
        };
    }

    async initialize() {
        this.setupCanvas();
        this.setupRenderingContext();
        
        console.log('Renderer initialized');
    }

    setupCanvas() {
        // Set up high DPI rendering
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * this.pixelRatio;
        this.canvas.height = rect.height * this.pixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.context.scale(this.pixelRatio, this.pixelRatio);
    }

    setupRenderingContext() {
        this.context.imageSmoothingEnabled = this.smoothing;
        this.context.imageSmoothingQuality = 'high';
        this.context.textAlign = 'left';
        this.context.textBaseline = 'top';
    }

    // Canvas management
    resize() {
        this.setupCanvas();
        this.setupRenderingContext();
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width / this.pixelRatio, this.canvas.height / this.pixelRatio);
        
        // Optional: fill with background color
        this.context.fillStyle = this.colors.background;
        this.context.fillRect(0, 0, this.canvas.width / this.pixelRatio, this.canvas.height / this.pixelRatio);
    }

    // Camera transformations
    save() {
        this.context.save();
    }

    restore() {
        this.context.restore();
    }

    applyCamera() {
        this.context.translate(-this.camera.position.x, -this.camera.position.y);
        this.context.scale(this.camera.zoom, this.camera.zoom);
        this.context.rotate(this.camera.rotation);
    }

    resetCamera() {
        this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    }

    // Coordinate conversion
    worldToScreen(worldPos) {
        return worldPos.subtract(this.camera.position).multiply(this.camera.zoom);
    }

    screenToWorld(screenPos) {
        return screenPos.divide(this.camera.zoom).add(this.camera.position);
    }

    // Basic shape rendering
    renderCircle(position, radius, options = {}) {
        const {
            fillColor = this.colors.foreground,
            strokeColor = null,
            strokeWidth = 1,
            alpha = 1
        } = options;

        this.context.globalAlpha = alpha;
        this.context.beginPath();
        this.context.arc(position.x, position.y, radius, 0, Math.PI * 2);
        
        if (fillColor) {
            this.context.fillStyle = fillColor;
            this.context.fill();
        }
        
        if (strokeColor) {
            this.context.strokeStyle = strokeColor;
            this.context.lineWidth = strokeWidth;
            this.context.stroke();
        }
        
        this.context.globalAlpha = 1;
    }

    renderRectangle(position, width, height, options = {}) {
        const {
            fillColor = this.colors.foreground,
            strokeColor = null,
            strokeWidth = 1,
            alpha = 1,
            rotation = 0
        } = options;

        this.save();
        this.context.globalAlpha = alpha;
        this.context.translate(position.x, position.y);
        this.context.rotate(rotation);
        
        if (fillColor) {
            this.context.fillStyle = fillColor;
            this.context.fillRect(-width / 2, -height / 2, width, height);
        }
        
        if (strokeColor) {
            this.context.strokeStyle = strokeColor;
            this.context.lineWidth = strokeWidth;
            this.context.strokeRect(-width / 2, -height / 2, width, height);
        }
        
        this.restore();
    }

    renderLine(start, end, options = {}) {
        const {
            color = this.colors.foreground,
            width = 1,
            alpha = 1,
            dash = null
        } = options;

        this.context.globalAlpha = alpha;
        this.context.strokeStyle = color;
        this.context.lineWidth = width;
        
        if (dash) {
            this.context.setLineDash(dash);
        }
        
        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(end.x, end.y);
        this.context.stroke();
        
        if (dash) {
            this.context.setLineDash([]);
        }
        
        this.context.globalAlpha = 1;
    }

    // Physics visualization
    renderVector(origin, vector, color = this.colors.physics.velocity, label = '') {
        const end = origin.add(vector);
        const length = vector.magnitude();
        
        if (length < 1) return; // Don't render tiny vectors
        
        // Draw vector line
        this.renderLine(origin, end, {
            color: color,
            width: 2
        });
        
        // Draw arrowhead
        const arrowSize = Math.min(length * 0.2, 10);
        const angle = vector.angle();
        
        const arrowPoint1 = end.add(Vector2D.fromAngle(angle + Math.PI - 0.3, arrowSize));
        const arrowPoint2 = end.add(Vector2D.fromAngle(angle + Math.PI + 0.3, arrowSize));
        
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.moveTo(end.x, end.y);
        this.context.lineTo(arrowPoint1.x, arrowPoint1.y);
        this.context.lineTo(arrowPoint2.x, arrowPoint2.y);
        this.context.closePath();
        this.context.fill();
        
        // Draw label
        if (label) {
            this.renderText(label, end.add(new Vector2D(10, -10)), {
                color: color,
                font: this.fonts.debug
            });
        }
    }

    renderTrajectory(points, color = this.colors.physics.trajectory) {
        if (points.length < 2) return;
        
        this.context.strokeStyle = color;
        this.context.lineWidth = 1;
        this.context.setLineDash([5, 5]);
        
        this.context.beginPath();
        this.context.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.context.lineTo(points[i].x, points[i].y);
        }
        
        this.context.stroke();
        this.context.setLineDash([]);
    }

    // Rigid body rendering
    renderRigidBody(body) {
        const options = {
            fillColor: body.color || this.colors.foreground,
            strokeColor: body.strokeColor,
            strokeWidth: body.strokeWidth || 1,
            alpha: body.alpha || 1
        };
        
        switch (body.shape) {
            case 'circle':
                this.renderCircle(body.position, body.radius, options);
                break;
            case 'rectangle':
                this.renderRectangle(body.position, body.width, body.height, {
                    ...options,
                    rotation: body.angle
                });
                break;
        }
        
        // Render collision indicator
        if (body.colliding) {
            this.renderCircle(body.position, body.radius + 5, {
                fillColor: null,
                strokeColor: this.colors.danger,
                strokeWidth: 3,
                alpha: 0.8
            });
        }
        
        // Render debug info
        if (this.showDebug) {
            this.renderBodyDebug(body);
        }
    }

    renderBodyDebug(body) {
        const pos = body.position;
        
        // Center point
        this.renderCircle(pos, 2, { fillColor: this.colors.accent });
        
        // Velocity vector
        if (body.velocity.magnitude() > 0.1) {
            this.renderVector(pos, body.velocity.multiply(0.1), this.colors.physics.velocity, 'v');
        }
        
        // Acceleration vector
        if (body.acceleration.magnitude() > 0.1) {
            this.renderVector(pos, body.acceleration.multiply(10), this.colors.physics.acceleration, 'a');
        }
        
        // Body info text
        const info = [
            `ID: ${body.id.substr(0, 6)}`,
            `Mass: ${body.mass.toFixed(2)}`,
            `Vel: ${body.velocity.magnitude().toFixed(2)}`,
            `KE: ${body.getKineticEnergy().toFixed(2)}`
        ];
        
        this.renderText(info.join('\n'), pos.add(new Vector2D(body.radius + 10, -30)), {
            color: this.colors.accent,
            font: this.fonts.debug
        });
    }

    // Entity rendering
    renderEntity(entity) {
        if (entity.render) {
            entity.render(this);
        } else {
            // Default entity rendering
            this.renderCircle(entity.position, entity.radius || 10, {
                fillColor: entity.color || this.colors.accent
            });
        }
    }

    // UI rendering
    renderText(text, position, options = {}) {
        const {
            color = this.colors.foreground,
            font = this.fonts.ui,
            alpha = 1,
            align = 'left',
            baseline = 'top',
            maxWidth = null
        } = options;

        this.context.globalAlpha = alpha;
        this.context.fillStyle = color;
        this.context.font = font;
        this.context.textAlign = align;
        this.context.textBaseline = baseline;
        
        if (text.includes('\n')) {
            const lines = text.split('\n');
            const lineHeight = parseInt(font) * 1.2;
            
            lines.forEach((line, index) => {
                const y = position.y + (index * lineHeight);
                if (maxWidth) {
                    this.context.fillText(line, position.x, y, maxWidth);
                } else {
                    this.context.fillText(line, position.x, y);
                }
            });
        } else {
            if (maxWidth) {
                this.context.fillText(text, position.x, position.y, maxWidth);
            } else {
                this.context.fillText(text, position.x, position.y);
            }
        }
        
        this.context.globalAlpha = 1;
    }

    renderButton(position, width, height, text, options = {}) {
        const {
            fillColor = this.colors.accent,
            textColor = this.colors.background,
            strokeColor = null,
            strokeWidth = 1,
            borderRadius = 5,
            font = this.fonts.ui,
            alpha = 1
        } = options;

        // Draw button background
        this.context.globalAlpha = alpha;
        
        if (borderRadius > 0) {
            this.renderRoundedRect(position, width, height, borderRadius, {
                fillColor: fillColor,
                strokeColor: strokeColor,
                strokeWidth: strokeWidth
            });
        } else {
            this.renderRectangle(position, width, height, {
                fillColor: fillColor,
                strokeColor: strokeColor,
                strokeWidth: strokeWidth
            });
        }
        
        // Draw button text
        this.renderText(text, position, {
            color: textColor,
            font: font,
            align: 'center',
            baseline: 'middle',
            alpha: alpha
        });
    }

    renderRoundedRect(position, width, height, radius, options = {}) {
        const {
            fillColor = null,
            strokeColor = null,
            strokeWidth = 1,
            alpha = 1
        } = options;

        const x = position.x - width / 2;
        const y = position.y - height / 2;

        this.context.globalAlpha = alpha;
        this.context.beginPath();
        this.context.moveTo(x + radius, y);
        this.context.lineTo(x + width - radius, y);
        this.context.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.context.lineTo(x + width, y + height - radius);
        this.context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.context.lineTo(x + radius, y + height);
        this.context.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.context.lineTo(x, y + radius);
        this.context.quadraticCurveTo(x, y, x + radius, y);
        this.context.closePath();

        if (fillColor) {
            this.context.fillStyle = fillColor;
            this.context.fill();
        }

        if (strokeColor) {
            this.context.strokeStyle = strokeColor;
            this.context.lineWidth = strokeWidth;
            this.context.stroke();
        }

        this.context.globalAlpha = 1;
    }

    // Special game elements
    renderCaptureZone(zone) {
        // Animated capture zone
        const time = Date.now() * 0.005;
        const alpha = 0.3 + Math.sin(time) * 0.2;
        
        this.renderRectangle(
            new Vector2D(zone.x + zone.width / 2, zone.y + zone.height / 2),
            zone.width,
            zone.height,
            {
                fillColor: zone.color,
                alpha: alpha,
                strokeColor: zone.color,
                strokeWidth: 3
            }
        );
        
        // Zone label
        this.renderText('CAPTURE ZONE', new Vector2D(zone.x, zone.y - 20), {
            color: zone.color,
            font: this.fonts.ui,
            alpha: 0.8
        });
    }

    // Particle system
    createParticle(position, velocity, options = {}) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift(); // Remove oldest particle
        }
        
        const particle = {
            position: position.copy(),
            velocity: velocity.copy(),
            life: options.life || 1.0,
            maxLife: options.life || 1.0,
            size: options.size || 3,
            color: options.color || this.colors.accent,
            gravity: options.gravity || new Vector2D(0, 100),
            friction: options.friction || 0.98,
            ...options
        };
        
        this.particles.push(particle);
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update physics
            particle.velocity.addMut(particle.gravity.multiply(deltaTime));
            particle.velocity.multiplyMut(particle.friction);
            particle.position.addMut(particle.velocity.multiply(deltaTime));
            
            // Update life
            particle.life -= deltaTime;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    renderParticles() {
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            const size = particle.size * alpha;
            
            this.renderCircle(particle.position, size, {
                fillColor: particle.color,
                alpha: alpha
            });
        }
    }

    // Visual effects
    createExplosion(position, intensity = 1) {
        const particleCount = Math.floor(20 * intensity);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 100 + Math.random() * 200;
            const velocity = Vector2D.fromAngle(angle, speed * intensity);
            
            this.createParticle(position, velocity, {
                life: 0.5 + Math.random() * 0.5,
                size: 2 + Math.random() * 4,
                color: `hsl(${Math.random() * 60 + 15}, 100%, ${50 + Math.random() * 50}%)`,
                gravity: new Vector2D(0, 200),
                friction: 0.95
            });
        }
    }

    createCollisionSparks(position, normal, intensity = 1) {
        const sparkCount = Math.floor(10 * intensity);
        
        for (let i = 0; i < sparkCount; i++) {
            const spreadAngle = Math.PI / 3; // 60 degree spread
            const baseAngle = normal.angle() + Math.PI;
            const angle = baseAngle + (Math.random() - 0.5) * spreadAngle;
            const speed = 50 + Math.random() * 100;
            const velocity = Vector2D.fromAngle(angle, speed * intensity);
            
            this.createParticle(position, velocity, {
                life: 0.3 + Math.random() * 0.3,
                size: 1 + Math.random() * 2,
                color: '#ffaa00',
                gravity: new Vector2D(0, 300),
                friction: 0.9
            });
        }
    }

    // Performance monitoring
    renderFPS(fps) {
        if (this.showDebug) {
            this.renderText(`FPS: ${fps}`, new Vector2D(10, 10), {
                color: this.colors.accent,
                font: this.fonts.debug
            });
        }
    }

    renderDebugInfo(info) {
        if (this.showDebug) {
            const lines = [
                `Game State: ${info.gameState}`,
                `Bodies: ${info.totalBodies}`,
                `Active: ${info.activeBodies}`,
                `Particles: ${this.particles.length}`
            ];
            
            this.renderText(lines.join('\n'), new Vector2D(10, 30), {
                color: this.colors.accent,
                font: this.fonts.debug
            });
        }
    }

    // Settings
    setShowDebug(show) {
        this.showDebug = show;
    }

    toggleDebug() {
        this.showDebug = !this.showDebug;
    }

    setCamera(position, zoom = null, rotation = null) {
        this.camera.position = position.copy();
        if (zoom !== null) this.camera.zoom = zoom;
        if (rotation !== null) this.camera.rotation = rotation;
    }
}