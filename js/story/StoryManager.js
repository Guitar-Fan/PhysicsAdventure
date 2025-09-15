/**
 * StoryManager - Manages narrative, dialogue, and story progression
 */
class StoryManager {
    constructor() {
        // Story state
        this.currentChapter = 0;
        this.storyProgress = 0;
        this.dialogueQueue = [];
        this.currentDialogue = null;
        
        // Character states
        this.characters = new Map();
        this.characterEmotions = new Map();
        
        // Story flags and variables
        this.storyFlags = new Map();
        this.playerChoices = [];
        
        // Dialogue system
        this.isDialogueActive = false;
        this.dialogueSpeed = 50; // ms per character
        this.autoAdvanceDelay = 3000; // ms
        
        // Narrative elements
        this.objectives = [];
        this.hints = [];
        this.achievements = [];
        
        // Story data
        this.storyData = this.initializeStoryData();
        
        // Event listeners
        this.eventListeners = new Map();
    }

    initializeStoryData() {
        return {
            chapters: [
                {
                    id: 'prologue',
                    title: 'The Escape from Physics',
                    intro: `In a universe where the fundamental laws of physics govern all existence, 
                           an entity known as the Escapist has broken free from these constraints. 
                           Reality itself begins to unravel as gravity fails, momentum becomes meaningless, 
                           and energy conservation breaks down.`,
                    objectives: [
                        'Meet the Escapist for the first time',
                        'Learn about the crisis',
                        'Begin your journey to restore order'
                    ]
                },
                {
                    id: 'moon_chapter',
                    title: 'First Steps on Luna',
                    intro: `Your journey begins on Earth's Moon, where the weak gravity provides 
                           the perfect testing ground. Here, you must master the basics of 
                           gravitational mechanics while pursuing the Escapist.`,
                    objectives: [
                        'Demonstrate projectile motion in low gravity',
                        'Use gravitational acceleration to reach the Escapist',
                        'Force the Escapist to acknowledge gravity'
                    ]
                },
                {
                    id: 'mars_chapter',
                    title: 'The Red Planet Challenge',
                    intro: `On Mars, the Escapist has begun to defy momentum conservation. 
                           Objects bounce impossibly, collisions don't transfer energy properly, 
                           and the very concept of mass seems negotiable.`,
                    objectives: [
                        'Restore momentum conservation',
                        'Demonstrate elastic and inelastic collisions',
                        'Corner the Escapist using physics principles'
                    ]
                },
                {
                    id: 'europa_chapter',
                    title: 'Beneath Europa\'s Ice',
                    intro: `In the subsurface ocean of Europa, the Escapist manipulates energy itself. 
                           Kinetic and potential energy can be created from nothing, 
                           violating the sacred law of energy conservation.`,
                    objectives: [
                        'Demonstrate energy conservation',
                        'Use pendulum motion to trap energy violations',
                        'Restore the balance of kinetic and potential energy'
                    ]
                },
                {
                    id: 'asteroid_chapter',
                    title: 'Orbital Mechanics',
                    intro: `Among the asteroids, the Escapist has disrupted orbital mechanics. 
                           Objects spiral inward and outward without cause, 
                           gravitational slingshots work in reverse.`,
                    objectives: [
                        'Restore proper orbital motion',
                        'Use gravitational slingshots correctly',
                        'Demonstrate conservation of angular momentum'
                    ]
                },
                {
                    id: 'earth_chapter',
                    title: 'The Final Confrontation',
                    intro: `Back on Earth, the Escapist makes their final stand. 
                           All the physics you've mastered must come together 
                           to restore the fundamental laws of reality.`,
                    objectives: [
                        'Apply all learned physics concepts',
                        'Convince the Escapist through demonstration',
                        'Restore universal physical law'
                    ]
                }
            ],
            dialogues: {
                intro: [
                    {
                        character: 'narrator',
                        text: "In the vast cosmos, where stars dance according to immutable laws..."
                    },
                    {
                        character: 'narrator',
                        text: "Something has gone terribly wrong."
                    },
                    {
                        character: 'escapist',
                        text: "Freedom! At last, I am free from the tyranny of your precious physics!"
                    },
                    {
                        character: 'player',
                        text: "You cannot simply ignore the fundamental forces that govern reality!"
                    },
                    {
                        character: 'escapist',
                        text: "Watch me. No more falling down because of 'gravity'. No more conservation of energy. I make my own rules now!"
                    },
                    {
                        character: 'narrator',
                        text: "And so begins your quest to restore order to the universe, one physics lesson at a time."
                    }
                ],
                moon_intro: [
                    {
                        character: 'player',
                        text: "The Moon's weak gravity should make this easier... I can demonstrate physics principles clearly here."
                    },
                    {
                        character: 'escapist',
                        text: "Gravity? I don't feel any gravity! Watch me float without cause!"
                    },
                    {
                        character: 'player',
                        text: "That's because you're ignoring the Moon's gravitational field. Let me show you..."
                    }
                ],
                moon_gravity_lesson: [
                    {
                        character: 'player',
                        text: "See how objects accelerate toward the Moon's surface at 1.62 m/s²?"
                    },
                    {
                        character: 'escapist',
                        text: "Coincidence! That's just... um... the will of the universe!"
                    },
                    {
                        character: 'player',
                        text: "It's gravity. F = GMm/r². The force between masses."
                    }
                ],
                mars_intro: [
                    {
                        character: 'escapist',
                        text: "On Mars, I've abolished momentum! Things don't have to conserve anything!"
                    },
                    {
                        character: 'player',
                        text: "That's impossible. Momentum must be conserved in all interactions."
                    },
                    {
                        character: 'escapist',
                        text: "Watch this ball ignore Newton's laws when it hits the wall!"
                    }
                ],
                europa_intro: [
                    {
                        character: 'escapist',
                        text: "Beneath Europa's ice, I control energy itself! I can create and destroy it at will!"
                    },
                    {
                        character: 'player',
                        text: "Energy conservation is one of the most fundamental laws. You cannot simply break it."
                    },
                    {
                        character: 'escapist',
                        text: "Can't I? Watch me make kinetic energy from nothing!"
                    }
                ],
                final_confrontation: [
                    {
                        character: 'escapist',
                        text: "You've followed me across the solar system, but this ends now!"
                    },
                    {
                        character: 'player',
                        text: "I've shown you gravity, momentum, energy conservation... these aren't restrictions, they're the foundation of existence!"
                    },
                    {
                        character: 'escapist',
                        text: "Foundation? They're chains! Limitations! I refuse to be bound!"
                    },
                    {
                        character: 'player',
                        text: "Then let me show you one final demonstration... how beautiful physics can be when everything works together."
                    }
                ],
                victory: [
                    {
                        character: 'escapist',
                        text: "I... I see it now. The elegance. The way everything connects."
                    },
                    {
                        character: 'player',
                        text: "Physics isn't about limitation. It's about understanding the universe's deepest truths."
                    },
                    {
                        character: 'escapist',
                        text: "The dance of forces, the conservation laws... they create possibility, not destroy it."
                    },
                    {
                        character: 'narrator',
                        text: "And so, order was restored to the universe. The Escapist learned to appreciate the beauty of physical law."
                    },
                    {
                        character: 'narrator',
                        text: "Reality once again followed its elegant rules, and the cosmos sang in harmony."
                    }
                ]
            },
            characterProfiles: {
                player: {
                    name: 'The Physics Guardian',
                    description: 'A dedicated protector of universal laws',
                    color: '#00d4ff',
                    avatar: '🛡️'
                },
                escapist: {
                    name: 'The Escapist',
                    description: 'A being who has broken free from physics',
                    color: '#ff4444',
                    avatar: '👤'
                },
                narrator: {
                    name: 'Universe',
                    description: 'The voice of cosmic order',
                    color: '#ffd700',
                    avatar: '✨'
                }
            }
        };
    }

    async initialize() {
        this.setupCharacters();
        this.setupDialogueHandlers();
        console.log('Story Manager initialized');
    }

    setupCharacters() {
        for (const [id, profile] of Object.entries(this.storyData.characterProfiles)) {
            this.characters.set(id, profile);
            this.characterEmotions.set(id, 'neutral');
        }
    }

    setupDialogueHandlers() {
        // Set up click handlers for dialogue advancement
        document.addEventListener('click', (e) => {
            if (this.isDialogueActive && e.target.closest('#dialogueBox')) {
                this.advanceDialogue();
            }
        });

        // Set up keyboard handlers
        document.addEventListener('keydown', (e) => {
            if (this.isDialogueActive) {
                if (e.key === 'Space' || e.key === 'Enter') {
                    this.advanceDialogue();
                    e.preventDefault();
                }
            }
        });
    }

    // Story control methods
    start() {
        console.log('Starting story system...');
        this.startChapter('prologue');
    }

    // Story progression
    startChapter(chapterId) {
        const chapter = this.storyData.chapters.find(c => c.id === chapterId);
        if (!chapter) return;

        this.currentChapter = this.storyData.chapters.indexOf(chapter);
        this.showChapterIntro(chapter);
        
        // Start appropriate dialogue sequence
        this.startDialogueSequence(chapterId + '_intro');
        
        this.emit('chapterStarted', { chapter: chapter });
    }

    showChapterIntro(chapter) {
        const introElement = document.getElementById('chapterIntro');
        if (introElement) {
            introElement.innerHTML = `
                <h2>${chapter.title}</h2>
                <p>${chapter.intro}</p>
                <div class="objectives">
                    <h3>Objectives:</h3>
                    <ul>
                        ${chapter.objectives.map(obj => `<li>${obj}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    // Dialogue system
    startDialogueSequence(sequenceId) {
        const sequence = this.storyData.dialogues[sequenceId];
        if (!sequence) return;

        this.dialogueQueue = [...sequence];
        this.isDialogueActive = true;
        this.showDialogueBox();
        this.advanceDialogue();
    }

    showDialogueBox() {
        const dialogueBox = document.getElementById('dialogueBox');
        if (dialogueBox) {
            dialogueBox.classList.add('active');
        }
    }

    hideDialogueBox() {
        const dialogueBox = document.getElementById('dialogueBox');
        if (dialogueBox) {
            dialogueBox.classList.remove('active');
        }
        this.isDialogueActive = false;
    }

    advanceDialogue() {
        if (this.dialogueQueue.length === 0) {
            this.hideDialogueBox();
            this.emit('dialogueComplete');
            return;
        }

        this.currentDialogue = this.dialogueQueue.shift();
        this.displayDialogue(this.currentDialogue);
    }

    displayDialogue(dialogue) {
        const characterNameElement = document.getElementById('characterName');
        const dialogueTextElement = document.getElementById('dialogueText');
        const characterAvatarElement = document.getElementById('characterAvatar');

        if (!characterNameElement || !dialogueTextElement) return;

        const character = this.characters.get(dialogue.character);
        
        // Update character info
        if (character) {
            characterNameElement.textContent = character.name;
            characterNameElement.style.color = character.color;
            
            if (characterAvatarElement) {
                characterAvatarElement.textContent = character.avatar;
            }
        }

        // Animate text appearance
        this.typewriterEffect(dialogueTextElement, dialogue.text);
    }

    typewriterEffect(element, text) {
        element.textContent = '';
        let index = 0;

        const typeChar = () => {
            if (index < text.length) {
                element.textContent += text[index];
                index++;
                setTimeout(typeChar, this.dialogueSpeed);
            }
        };

        typeChar();
    }

    // Story triggers
    triggerStoryEvent(eventId, data = {}) {
        switch (eventId) {
            case 'level_complete':
                this.handleLevelComplete(data);
                break;
            case 'physics_demonstrated':
                this.handlePhysicsDemonstration(data);
                break;
            case 'objective_complete':
                this.handleObjectiveComplete(data);
                break;
            case 'escapist_encounter':
                this.handleEscapistEncounter(data);
                break;
        }
    }

    handleLevelComplete(data) {
        const levelDialogues = {
            'moon': 'moon_complete',
            'mars': 'mars_complete',
            'europa': 'europa_complete',
            'asteroid': 'asteroid_complete',
            'earth': 'final_victory'
        };

        const dialogueId = levelDialogues[data.levelId];
        if (dialogueId) {
            setTimeout(() => {
                this.startDialogueSequence(dialogueId);
            }, 1000);
        }

        // Check if this completes the story
        if (data.levelId === 'earth') {
            this.handleStoryComplete();
        }
    }

    handlePhysicsDemonstration(data) {
        // Trigger appropriate dialogue based on physics concept demonstrated
        const demonstrationDialogues = {
            'gravity': 'gravity_explanation',
            'momentum': 'momentum_explanation',
            'energy': 'energy_explanation'
        };

        const dialogueId = demonstrationDialogues[data.concept];
        if (dialogueId && this.storyData.dialogues[dialogueId]) {
            this.startDialogueSequence(dialogueId);
        }

        // Update escapist compliance
        this.updateEscapistCompliance(data.concept, data.effectiveness);
    }

    handleObjectiveComplete(data) {
        this.addHint(`Objective completed: ${data.objective}`);
        this.emit('objectiveComplete', data);
    }

    handleEscapistEncounter(data) {
        // Trigger dialogue based on current story state and encounter type
        const currentChapter = this.storyData.chapters[this.currentChapter];
        if (currentChapter) {
            this.startDialogueSequence(currentChapter.id + '_encounter');
        }
    }

    handleStoryComplete() {
        this.startDialogueSequence('victory');
        this.showAchievement({
            title: 'Universal Harmony Restored',
            description: 'You have successfully taught the Escapist to appreciate the beauty of physics!'
        });
    }

    // Escapist compliance system
    updateEscapistCompliance(concept, effectiveness) {
        const compliance = this.storyFlags.get('escapist_compliance') || 0;
        const increase = effectiveness * 0.2; // 0-1 effectiveness gives 0-0.2 compliance increase
        
        const newCompliance = Math.min(1, compliance + increase);
        this.storyFlags.set('escapist_compliance', newCompliance);
        
        this.emit('complianceUpdated', { compliance: newCompliance, concept });
        
        // Trigger story events based on compliance levels
        if (newCompliance >= 0.25 && !this.storyFlags.get('quarter_compliance')) {
            this.storyFlags.set('quarter_compliance', true);
            this.addHint("The Escapist seems to be wavering...");
        }
        
        if (newCompliance >= 0.5 && !this.storyFlags.get('half_compliance')) {
            this.storyFlags.set('half_compliance', true);
            this.startDialogueSequence('escapist_doubt');
        }
        
        if (newCompliance >= 0.75 && !this.storyFlags.get('three_quarter_compliance')) {
            this.storyFlags.set('three_quarter_compliance', true);
            this.addHint("The Escapist is beginning to understand...");
        }
    }

    getEscapistCompliance() {
        return this.storyFlags.get('escapist_compliance') || 0;
    }

    // Hint system
    addHint(text, duration = 5000) {
        const hint = {
            id: Date.now(),
            text: text,
            timestamp: Date.now()
        };
        
        this.hints.push(hint);
        this.showHint(hint, duration);
        
        // Clean up old hints
        this.hints = this.hints.slice(-10); // Keep only last 10 hints
    }

    showHint(hint, duration) {
        const hintElement = document.createElement('div');
        hintElement.className = 'story-hint';
        hintElement.textContent = hint.text;
        
        const hintContainer = this.getHintContainer();
        hintContainer.appendChild(hintElement);
        
        setTimeout(() => hintElement.classList.add('show'), 10);
        
        if (duration > 0) {
            setTimeout(() => {
                hintElement.classList.remove('show');
                setTimeout(() => {
                    if (hintElement.parentNode) {
                        hintElement.parentNode.removeChild(hintElement);
                    }
                }, 300);
            }, duration);
        }
    }

    getHintContainer() {
        let container = document.getElementById('hintContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'hintContainer';
            container.className = 'hint-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // Achievement system
    unlockAchievement(achievementId, title, description) {
        const achievement = {
            id: achievementId,
            title: title,
            description: description,
            timestamp: Date.now()
        };
        
        this.achievements.push(achievement);
        this.showAchievement(achievement);
        this.emit('achievementUnlocked', achievement);
    }

    showAchievement(achievement) {
        // This would typically be handled by UIManager, but we can emit an event
        this.emit('showAchievement', achievement);
    }

    // Save/Load story state
    saveStoryState() {
        return {
            currentChapter: this.currentChapter,
            storyProgress: this.storyProgress,
            storyFlags: Object.fromEntries(this.storyFlags),
            playerChoices: this.playerChoices,
            achievements: this.achievements,
            characterEmotions: Object.fromEntries(this.characterEmotions)
        };
    }

    loadStoryState(state) {
        this.currentChapter = state.currentChapter || 0;
        this.storyProgress = state.storyProgress || 0;
        this.storyFlags = new Map(Object.entries(state.storyFlags || {}));
        this.playerChoices = state.playerChoices || [];
        this.achievements = state.achievements || [];
        this.characterEmotions = new Map(Object.entries(state.characterEmotions || {}));
    }

    // Getters for story information
    getCurrentChapter() {
        return this.storyData.chapters[this.currentChapter];
    }

    getStoryProgress() {
        return this.storyProgress;
    }

    getAchievements() {
        return [...this.achievements];
    }

    isStoryComplete() {
        return this.currentChapter >= this.storyData.chapters.length - 1 && 
               this.storyFlags.get('story_complete');
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            const callbacks = this.eventListeners.get(event);
            for (const callback of callbacks) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in story event listener for ${event}:`, error);
                }
            }
        }
    }

    // Update method for any time-based story elements
    update(deltaTime) {
        // Update any time-based story elements
        // This could include timed events, delayed dialogues, etc.
    }

    // Cleanup
    destroy() {
        this.eventListeners.clear();
        this.hideDialogueBox();
    }
}