/**
 * InputManager - Handles all user input (mouse, keyboard, touch)
 */
class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.eventListeners = new Map();
        
        // Mouse state
        this.mousePosition = Vector2D.zero();
        this.mouseDown = false;
        this.mouseDragging = false;
        this.dragStart = Vector2D.zero();
        this.dragCurrent = Vector2D.zero();
        
        // Keyboard state
        this.keysPressed = new Set();
        this.keysDown = new Set();
        
        // Touch state
        this.touches = new Map();
        this.touchDragging = false;
        
        // Input settings
        this.dragThreshold = 5; // pixels
        this.doubleClickTime = 300; // ms
        this.lastClickTime = 0;
        this.clickCount = 0;
        
        // Prevent context menu on right-click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    async initialize() {
        this.setupMouseEvents();
        this.setupKeyboardEvents();
        this.setupTouchEvents();
        this.setupWindowEvents();
        
        console.log('Input Manager initialized');
    }

    // Mouse event setup
    setupMouseEvents() {
        // Mouse move
        this.canvas.addEventListener('mousemove', (e) => {
            this.updateMousePosition(e);
            this.handleMouseMove(e);
        });

        // Mouse down
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.mouseDown = true;
            this.dragStart = this.mousePosition.copy();
            this.dragCurrent = this.mousePosition.copy();
            this.handleMouseDown(e);
        });

        // Mouse up
        this.canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            
            if (this.mouseDragging) {
                this.handleDragEnd(e);
            } else {
                this.handleClick(e);
            }
            
            this.mouseDown = false;
            this.mouseDragging = false;
        });

        // Mouse wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleWheel(e);
        });

        // Mouse enter/leave
        this.canvas.addEventListener('mouseenter', (e) => this.handleMouseEnter(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
    }

    // Keyboard event setup
    setupKeyboardEvents() {
        // Key down
        window.addEventListener('keydown', (e) => {
            if (!this.keysDown.has(e.code)) {
                this.keysPressed.add(e.code);
                this.keysDown.add(e.code);
                this.handleKeyDown(e);
            }
        });

        // Key up
        window.addEventListener('keyup', (e) => {
            this.keysDown.delete(e.code);
            this.handleKeyUp(e);
        });
    }

    // Touch event setup
    setupTouchEvents() {
        // Touch start
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        });

        // Touch move
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        });

        // Touch end
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        });

        // Touch cancel
        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handleTouchCancel(e);
        });
    }

    // Window event setup
    setupWindowEvents() {
        // Focus/blur to reset input state
        window.addEventListener('blur', () => {
            this.resetInputState();
        });

        // Prevent default behavior for certain keys
        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }

    // Update mouse position relative to canvas
    updateMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.mousePosition.x = (e.clientX - rect.left) * scaleX;
        this.mousePosition.y = (e.clientY - rect.top) * scaleY;
    }

    // Mouse event handlers
    handleMouseMove(e) {
        if (this.mouseDown) {
            this.dragCurrent = this.mousePosition.copy();
            const dragDistance = this.dragStart.distance(this.dragCurrent);
            
            if (dragDistance > this.dragThreshold && !this.mouseDragging) {
                this.mouseDragging = true;
                this.emit('dragStart', {
                    start: this.dragStart.copy(),
                    current: this.dragCurrent.copy(),
                    button: e.button,
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey
                });
            }
            
            if (this.mouseDragging) {
                this.emit('drag', {
                    start: this.dragStart.copy(),
                    current: this.dragCurrent.copy(),
                    delta: this.dragCurrent.subtract(this.dragStart),
                    button: e.button,
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey
                });
            }
        }

        this.emit('mouseMove', {
            position: this.mousePosition.copy(),
            deltaX: e.movementX,
            deltaY: e.movementY,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey
        });
    }

    handleMouseDown(e) {
        this.emit('mouseDown', {
            position: this.mousePosition.copy(),
            button: e.button,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey
        });
    }

    handleClick(e) {
        const currentTime = Date.now();
        
        // Handle double-click detection
        if (currentTime - this.lastClickTime < this.doubleClickTime) {
            this.clickCount++;
        } else {
            this.clickCount = 1;
        }
        
        this.lastClickTime = currentTime;
        
        if (this.clickCount === 2) {
            this.emit('doubleClick', {
                position: this.mousePosition.copy(),
                button: e.button,
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey
            });
            this.clickCount = 0;
        } else {
            setTimeout(() => {
                if (this.clickCount === 1) {
                    this.emit('click', {
                        position: this.mousePosition.copy(),
                        button: e.button,
                        shiftKey: e.shiftKey,
                        ctrlKey: e.ctrlKey,
                        altKey: e.altKey
                    });
                }
                this.clickCount = 0;
            }, this.doubleClickTime);
        }
    }

    handleDragEnd(e) {
        this.emit('dragEnd', {
            start: this.dragStart.copy(),
            end: this.dragCurrent.copy(),
            delta: this.dragCurrent.subtract(this.dragStart),
            button: e.button,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey
        });
    }

    handleWheel(e) {
        this.emit('wheel', {
            position: this.mousePosition.copy(),
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            deltaZ: e.deltaZ,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey
        });
    }

    handleMouseEnter(e) {
        this.emit('mouseEnter', {
            position: this.mousePosition.copy()
        });
    }

    handleMouseLeave(e) {
        this.resetInputState();
        this.emit('mouseLeave', {
            position: this.mousePosition.copy()
        });
    }

    // Keyboard event handlers
    handleKeyDown(e) {
        this.emit('keyDown', {
            key: e.key,
            code: e.code,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            metaKey: e.metaKey
        });

        // Special key handling
        this.handleSpecialKeys(e);
    }

    handleKeyUp(e) {
        this.emit('keyUp', {
            key: e.key,
            code: e.code,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            metaKey: e.metaKey
        });
    }

    handleSpecialKeys(e) {
        // Emit specific events for common game keys
        switch (e.code) {
            case 'Space':
                this.emit('keypress', { key: ' ' });
                break;
            case 'Escape':
                this.emit('keypress', { key: 'Escape' });
                break;
            case 'Enter':
                this.emit('keypress', { key: 'Enter' });
                break;
            case 'KeyR':
                this.emit('keypress', { key: 'r' });
                break;
            case 'KeyP':
                this.emit('keypress', { key: 'p' });
                break;
        }
    }

    // Touch event handlers
    handleTouchStart(e) {
        for (const touch of e.changedTouches) {
            const position = this.getTouchPosition(touch);
            this.touches.set(touch.identifier, {
                id: touch.identifier,
                startPosition: position.copy(),
                currentPosition: position.copy(),
                startTime: Date.now()
            });

            // Treat first touch as mouse down
            if (e.touches.length === 1) {
                this.mousePosition = position;
                this.mouseDown = true;
                this.dragStart = position.copy();
                this.dragCurrent = position.copy();
            }
        }

        this.emit('touchStart', {
            touches: Array.from(this.touches.values()),
            changedTouches: Array.from(e.changedTouches).map(t => ({
                id: t.identifier,
                position: this.getTouchPosition(t)
            }))
        });
    }

    handleTouchMove(e) {
        for (const touch of e.changedTouches) {
            const touchData = this.touches.get(touch.identifier);
            if (touchData) {
                const position = this.getTouchPosition(touch);
                touchData.currentPosition = position;

                // Treat first touch as mouse move
                if (touch.identifier === Array.from(this.touches.keys())[0]) {
                    this.mousePosition = position;
                    this.dragCurrent = position.copy();

                    const dragDistance = this.dragStart.distance(this.dragCurrent);
                    if (dragDistance > this.dragThreshold && !this.touchDragging) {
                        this.touchDragging = true;
                        this.mouseDragging = true;
                    }
                }
            }
        }

        this.emit('touchMove', {
            touches: Array.from(this.touches.values()),
            changedTouches: Array.from(e.changedTouches).map(t => ({
                id: t.identifier,
                position: this.getTouchPosition(t)
            }))
        });
    }

    handleTouchEnd(e) {
        for (const touch of e.changedTouches) {
            const touchData = this.touches.get(touch.identifier);
            if (touchData) {
                const endPosition = this.getTouchPosition(touch);
                const duration = Date.now() - touchData.startTime;
                const distance = touchData.startPosition.distance(endPosition);

                // Treat as tap if short duration and small movement
                if (duration < 200 && distance < this.dragThreshold) {
                    this.emit('tap', {
                        position: endPosition,
                        duration: duration
                    });
                }

                this.touches.delete(touch.identifier);
            }
        }

        // Reset mouse state when all touches end
        if (e.touches.length === 0) {
            this.mouseDown = false;
            this.mouseDragging = false;
            this.touchDragging = false;
        }

        this.emit('touchEnd', {
            touches: Array.from(this.touches.values()),
            changedTouches: Array.from(e.changedTouches).map(t => ({
                id: t.identifier,
                position: this.getTouchPosition(t)
            }))
        });
    }

    handleTouchCancel(e) {
        for (const touch of e.changedTouches) {
            this.touches.delete(touch.identifier);
        }

        this.resetInputState();

        this.emit('touchCancel', {
            touches: Array.from(this.touches.values())
        });
    }

    // Get touch position relative to canvas
    getTouchPosition(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return new Vector2D(
            (touch.clientX - rect.left) * scaleX,
            (touch.clientY - rect.top) * scaleY
        );
    }

    // Input state management
    resetInputState() {
        this.mouseDown = false;
        this.mouseDragging = false;
        this.touchDragging = false;
        this.keysPressed.clear();
        this.keysDown.clear();
        this.touches.clear();
    }

    // Query methods
    isKeyDown(code) {
        return this.keysDown.has(code);
    }

    wasKeyPressed(code) {
        return this.keysPressed.has(code);
    }

    isMouseDown() {
        return this.mouseDown;
    }

    isMouseDragging() {
        return this.mouseDragging;
    }

    getMousePosition() {
        return this.mousePosition.copy();
    }

    getTouches() {
        return Array.from(this.touches.values());
    }

    // Update method to be called each frame
    update() {
        // Clear frame-specific state
        this.keysPressed.clear();
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const callbacks = this.eventListeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            const callbacks = this.eventListeners.get(event);
            for (const callback of callbacks) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in input event listener for ${event}:`, error);
                }
            }
        }
    }

    // Cleanup
    destroy() {
        this.resetInputState();
        this.eventListeners.clear();
        
        // Remove event listeners would require storing references
        // For now, just clear the maps
    }
}