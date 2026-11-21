
/* =========================================
   SPEC-TRUM STORIES
   REFINED VISUAL NOVEL ENGINE
   WITH STORY PROGRESS TRACKER
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";


    /* =====================================
       01. ELEMENT REFERENCES
    ===================================== */

    const menuScreen = document.getElementById("main-menu");
    const storyScreen = document.getElementById("story-screen");

    const menuVideo = document.getElementById("menu-video");
    const menuMusic = document.getElementById("menu-music");

    const beginButton = document.getElementById("begin-button");
    const continueButton = document.getElementById("continue-button");
    const settingsButton = document.getElementById("settings-button");
    const creditsButton = document.getElementById("credits-button");

    const storyMenuButton = document.getElementById("story-menu-button");

    const sceneHeading = document.getElementById("scene-heading");
    const sceneType = document.getElementById("scene-type");
    const sceneCounter = document.getElementById("scene-counter");

    const sceneVisualImage = document.getElementById("scene-visual-image");
    const sceneVisualContainer = document.querySelector(".scene-visual");

    const characterName = document.getElementById("character-name");
    const dialogueText = document.getElementById("dialogue-text");

    const nextButton = document.getElementById("next-button");
    const choicesContainer = document.getElementById("choices-container");

    const particleLayer = document.getElementById("particle-layer");
    const storyContent = document.querySelector(".story-content");


    /* =====================================
       02. REQUIRED ELEMENT CHECK
    ===================================== */

    const requiredElements = [
        menuScreen,
        storyScreen,
        sceneHeading,
        sceneType,
        sceneCounter,
        characterName,
        dialogueText,
        nextButton,
        choicesContainer
    ];

    if (requiredElements.some(element => !element)) {

        console.error(
            "SPEC-TRUM STORIES: One or more required HTML elements are missing."
        );

        return;
    }


    /* =====================================
       03. STORAGE
    ===================================== */

    const STORAGE_KEYS = {
        video: "spectrum_video_enabled",
        motion: "spectrum_reduced_motion",
        save: "spectrum_save",
        volume: "spectrum_music_volume",
        textSpeed: "spectrum_text_speed",
        textSize: "spectrum_text_size",
        progress: "spectrum_story_progress"
    };


    function getSetting(key, fallback) {

        try {

            const value = localStorage.getItem(key);

            return value === null
                ? fallback
                : value === "true";

        } catch (error) {

            return fallback;

        }
    }


    function saveSetting(key, value) {

        try {

            localStorage.setItem(key, String(value));

        } catch (error) {

            console.warn("Could not save setting:", error);

        }
    }


    function getNumberSetting(key, fallback, min, max) {

        try {

            const value = localStorage.getItem(key);

            if (value === null) return fallback;

            const number = Number(value);

            if (!Number.isFinite(number)) return fallback;

            return Math.min(max, Math.max(min, number));

        } catch (error) {

            return fallback;

        }
    }


    /* =====================================
       04. USER SETTINGS
    ===================================== */

    const TEXT_SPEEDS = {
        slow: 45,
        normal: 24,
        fast: 12
    };


    let musicVolume = getNumberSetting(
        STORAGE_KEYS.volume,
        50,
        0,
        100
    );


    let textSpeed = (() => {

        try {

            const saved = localStorage.getItem(
                STORAGE_KEYS.textSpeed
            );

            return TEXT_SPEEDS[saved]
                ? saved
                : "normal";

        } catch (error) {

            return "normal";

        }

    })();


    let textSize = (() => {

        try {

            const saved = localStorage.getItem(
                STORAGE_KEYS.textSize
            );

            return ["small", "medium", "large"].includes(saved)
                ? saved
                : "medium";

        } catch (error) {

            return "medium";

        }

    })();


    let TYPE_SPEED = TEXT_SPEEDS[textSpeed];


    function updateMusicVolume() {

        if (!menuMusic) return;

        menuMusic.volume = musicVolume / 100;
    }


    function updateTextSize() {

        if (!dialogueText) return;

        dialogueText.classList.remove(
            "text-size-small",
            "text-size-medium",
            "text-size-large"
        );

        dialogueText.classList.add(
            "text-size-" + textSize
        );
    }


    /* =====================================
       05. MENU MUSIC
    ===================================== */

    let musicStarted = false;
    let musicStopped = false;
    let musicPlayPending = false;


    async function startMenuMusic() {

        if (
            !menuMusic ||
            musicStarted ||
            musicStopped ||
            musicPlayPending
        ) {
            return;
        }

        musicPlayPending = true;

        try {

            await menuMusic.play();

            musicStarted = true;

        } catch (error) {

            console.log(
                "Menu music is waiting for user interaction."
            );

        } finally {

            musicPlayPending = false;

        }
    }


    function stopMenuMusic() {

        if (!menuMusic) return;

        musicStopped = true;

        menuMusic.pause();
        menuMusic.currentTime = 0;

        musicStarted = false;
        musicPlayPending = false;
    }


    if (menuMusic) {

        updateMusicVolume();

        menuMusic.loop = true;

        document.addEventListener(
            "pointerdown",
            startMenuMusic,
            true
        );

        document.addEventListener(
            "keydown",
            startMenuMusic,
            true
        );

        menuMusic.addEventListener("error", () => {

            console.warn("Unable to load menu music.");

        });
    }


    /* =====================================
       06. VIDEO BACKGROUND
    ===================================== */

    let videoEnabled = getSetting(
        STORAGE_KEYS.video,
        true
    );


    function updateVideo() {

        if (!menuVideo) return;

        if (videoEnabled && !menuScreen.hidden) {

            menuVideo.style.display = "block";

            const playPromise = menuVideo.play();

            if (playPromise) {

                playPromise.catch(() => {

                    console.log(
                        "Menu video is waiting for playback permission."
                    );

                });

            }

        } else {

            menuVideo.pause();
            menuVideo.style.display = "none";

        }
    }


    /* =====================================
       07. REDUCED MOTION
    ===================================== */

    let reducedMotion = getSetting(
        STORAGE_KEYS.motion,
        false
    );


    function updateMotion() {

        document.body.classList.toggle(
            "reduce-motion",
            reducedMotion
        );
    }


    updateMotion();
    updateTextSize();


    /* =====================================
       08. DIALOG SYSTEM
    ===================================== */

    let activeDialog = null;
    let previousFocus = null;


    function closeDialog() {

        if (!activeDialog) return;

        activeDialog.remove();
        activeDialog = null;

        if (
            previousFocus &&
            document.contains(previousFocus)
        ) {

            previousFocus.focus();

        }

        previousFocus = null;
    }


    function openDialog(title, content) {

        closeDialog();

        previousFocus = document.activeElement;

        const overlay = document.createElement("div");

        overlay.className = "dialog-overlay";

        const dialog = document.createElement("section");

        dialog.className = "dialog-box";

        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute("aria-label", title);

        dialog.innerHTML = `
            <h2 class="dialog-title">${title}</h2>

            <div class="dialog-divider"></div>

            <div class="dialog-content">
                ${content}
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        overlay.addEventListener("click", event => {

            if (event.target === overlay) {
                closeDialog();
            }

        });

        activeDialog = overlay;

        const closeButtons =
            dialog.querySelectorAll(".dialog-close");

        closeButtons.forEach(button => {

            button.addEventListener("click", closeDialog);

        });

        if (closeButtons.length > 0) {

            closeButtons[0].focus();

        } else {

            dialog.setAttribute("tabindex", "-1");
            dialog.focus();

        }
    }


    /* =====================================
       09. STORY DATA
       ORIGINAL STORY AND BRANCHING
    ===================================== */

    const scenes = {

        EXP_01: {
            title: "EXPOSITION",
            type: "OPENING",
            visual: "./assets/visuals/exposition.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Ari is seventeen years old and has always found comfort in art. Drawing is more than a hobby. It is a way to express thoughts and feelings that are sometimes difficult to put into words."
                },
                {
                    speaker: "NARRATOR",
                    text: "But outside the pages of a sketchbook, society often places expectations on how people should dress, speak, and behave. Ari begins to wonder whether there is a place where people can express themselves without being judged."
                },
                {
                    speaker: "NARRATOR",
                    text: "One day, Ari discovers Spectrum, an online creative community where artists share their work, stories, and ideas. For the first time, expressing individuality seems possible."
                },
                {
                    speaker: "ARI",
                    text: "Maybe I can finally share my art here. But how much of myself am I ready to show?"
                }
            ],

            choices: [
                {
                    text: "A. Create an anonymous account and use a username.",
                    next: "RA1_01"
                },
                {
                    text: "B. Use my real name and share my artwork openly.",
                    next: "RA2_01"
                }
            ]
        },


        RA1_01: {
            title: "BEHIND THE SCREEN",
            type: "RISING ACTION",
            visual: "./assets/visuals/behind-the-screen.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Ari creates an anonymous account on Spectrum using the username AFTERTHECOLORS. No real name or personal photographs are included."
                },
                {
                    speaker: "NARRATOR",
                    text: "Ari's first artwork is titled 'The Colors They Never Let Me Wear.' It receives several positive comments from other artists."
                },
                {
                    speaker: "NARRATOR",
                    text: "However, one user leaves a comment asking why Ari hides their identity and whether they are ashamed of who they are."
                },
                {
                    speaker: "ARI",
                    text: "I wanted to share my artwork, not every part of my personal life. But should I explain that to someone?"
                }
            ],

            choices: [
                {
                    text: "A. Respond and explain that privacy is a personal choice.",
                    next: "C1A_01"
                },
                {
                    text: "B. Block the account and protect my peace.",
                    next: "C1B_01"
                }
            ]
        },


        C1A_01: {
            title: "SPEAKING UP",
            type: "CLIMAX",
            visual: "./assets/visuals/speaking-up.png",

            dialogue: [
                {
                    speaker: "ARI",
                    text: "I'm not ashamed of who I am. I simply believe everyone should have the freedom to choose what they share online."
                },
                {
                    speaker: "NARRATOR",
                    text: "Other members of Spectrum support Ari's response. They remind everyone that personal boundaries deserve respect."
                },
                {
                    speaker: "NARRATOR",
                    text: "Soon, another artist invites Ari to participate in The Unfiltered Project, a creative project about identity and self-expression."
                },
                {
                    speaker: "ARI",
                    text: "This could be an opportunity to share something meaningful. But I still want to protect my identity."
                }
            ],

            choices: [
                {
                    text: "A. Join the project anonymously.",
                    next: "END_01"
                },
                {
                    text: "B. Decline and focus on personal growth.",
                    next: "END_02"
                }
            ]
        },


        C1B_01: {
            title: "PROTECTING THEIR PEACE",
            type: "CLIMAX",
            visual: "./assets/visuals/protecting-their-peace.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Ari decides to block the account and continues sharing artwork without engaging in the negative comments."
                },
                {
                    speaker: "NARRATOR",
                    text: "Later, another artist sends Ari a supportive message. They explain that artwork can reach people even when its creator chooses to remain anonymous."
                },
                {
                    speaker: "NARRATOR",
                    text: "Ari also learns about The Unfiltered Project and considers joining."
                },
                {
                    speaker: "ARI",
                    text: "I don't need to answer every negative comment. Maybe I can use my art to support others instead."
                }
            ],

            choices: [
                {
                    text: "A. Join the project and support others through artwork.",
                    next: "END_03"
                },
                {
                    text: "B. Continue creating privately.",
                    next: "END_04"
                }
            ]
        },


        RA2_01: {
            title: "UNDER MY NAME",
            type: "RISING ACTION",
            visual: "./assets/visuals/under-my-name.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Ari creates a Spectrum account using their real name and begins sharing artwork openly."
                },
                {
                    speaker: "NARRATOR",
                    text: "One artwork is titled 'Identity is Not a Costume. It Is a Personal Journey.' It receives positive responses from other members."
                },
                {
                    speaker: "NARRATOR",
                    text: "However, a classmate recognizes the artwork and sends Ari a negative private message. At the same time, another artist sends a supportive message."
                },
                {
                    speaker: "ARI",
                    text: "I wanted to be open about my work. But now that someone I know has seen it, I'm not sure what to do."
                }
            ],

            choices: [
                {
                    text: "A. Keep the artwork visible and respond confidently.",
                    next: "C2A_01"
                },
                {
                    text: "B. Change my privacy settings and step away.",
                    next: "C2B_01"
                }
            ]
        },


        C2A_01: {
            title: "STANDING BY MY WORDS",
            type: "CLIMAX",
            visual: "./assets/visuals/standing-by-my-words.png",

            dialogue: [
                {
                    speaker: "ARI",
                    text: "Everyone deserves the freedom to express themselves. I hope you can respect that, even if you don't understand everything."
                },
                {
                    speaker: "NARRATOR",
                    text: "Ari keeps the artwork visible. The supportive artist appreciates the response and invites Ari to join The Unfiltered Project."
                },
                {
                    speaker: "NARRATOR",
                    text: "The project offers an opportunity to present artwork and discuss acceptance with a wider audience."
                },
                {
                    speaker: "ARI",
                    text: "I want to share my message. I just need to decide how publicly I want to do it."
                }
            ],

            choices: [
                {
                    text: "A. Join and present the artwork publicly.",
                    next: "END_05"
                },
                {
                    text: "B. Continue sharing on Spectrum but decline public presentation.",
                    next: "END_06"
                }
            ]
        },


        C2B_01: {
            title: "A STEP BACK",
            type: "CLIMAX",
            visual: "./assets/visuals/a-step-back.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Ari changes the account's privacy settings and takes a step back from sharing personal artwork."
                },
                {
                    speaker: "NARRATOR",
                    text: "Later, another artist named Sol sends a supportive message. Sol explains that Ari's artwork has helped other people and that sharing everything is never required."
                },
                {
                    speaker: "SOL",
                    text: "Your artwork matters, Ari. You don't have to share everything about yourself to make a difference."
                },
                {
                    speaker: "ARI",
                    text: "Maybe I can still participate while keeping some things private. I just need to decide what feels right."
                }
            ],

            choices: [
                {
                    text: "A. Return to Spectrum and join the project while keeping personal information private.",
                    next: "END_07"
                },
                {
                    text: "B. Focus on personal growth and keep my artwork private.",
                    next: "END_08"
                }
            ]
        },


        END_01: {
            title: "THE QUIET CANVAS",
            type: "ENDING 01",
            visual: "./assets/visuals/the-quiet-canvas.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Ari joins The Unfiltered Project using the anonymous name AFTERTHECOLORS."
                },
                {
                    speaker: "NARRATOR",
                    text: "The submitted artwork carries a message about accepting differences and respecting personal choices. Even without revealing an identity, the artwork reaches and encourages others."
                },
                {
                    speaker: "NARRATOR",
                    text: "Ari continues creating and supporting other artists while keeping personal information private."
                },
                {
                    speaker: "ARI",
                    text: "I can share my voice through art while still choosing what remains private."
                }
            ],

            next: "REF_01"
        },


        END_02: {
            title: "THE ART OF BEING",
            type: "ENDING 02",
            visual: "./assets/visuals/the-art-of-being.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Ari decides not to join The Unfiltered Project and continues creating artwork for personal enjoyment."
                },
                {
                    speaker: "NARRATOR",
                    text: "Ari occasionally shares artwork on Spectrum but no longer feels pressured to participate in every opportunity."
                },
                {
                    speaker: "NARRATOR",
                    text: "Through this experience, Ari learns that personal growth takes time and that self-expression does not require sharing everything."
                },
                {
                    speaker: "ARI",
                    text: "I don't have to rush my journey. I can express myself in my own way."
                }
            ],

            next: "REF_01"
        },


        END_03: {
            title: "A SPECTRUM OF VOICES",
            type: "ENDING 03",
            visual: "./assets/visuals/a-spectrum-of-voices.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Ari joins The Unfiltered Project and submits an illustration showing different people expressing themselves in their own ways."
                },
                {
                    speaker: "NARRATOR",
                    text: "The community responds positively. Ari feels proud that the artwork has helped others feel accepted."
                },
                {
                    speaker: "NARRATOR",
                    text: "Instead of focusing on the negative comment, Ari chooses to continue creating art with confidence."
                },
                {
                    speaker: "ARI",
                    text: "My artwork can speak for itself. I don't need to respond to every person who disagrees."
                }
            ],

            next: "REF_01"
        },


        END_04: {
            title: "FINDING PEACE",
            type: "ENDING 04",
            visual: "./assets/visuals/finding-peace.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Ari decides not to join the project and takes a break from sharing personal artwork."
                },
                {
                    speaker: "NARRATOR",
                    text: "Instead, Ari draws for personal enjoyment without worrying about comments, reactions, or expectations."
                },
                {
                    speaker: "NARRATOR",
                    text: "Ari realizes there is no need to prove anything to others. Choosing privacy is also a valid form of self-expression."
                },
                {
                    speaker: "ARI",
                    text: "Sometimes, creating something just for myself is enough."
                }
            ],

            next: "REF_01"
        },


        END_05: {
            title: "THE VOICE THAT INSPIRES",
            type: "ENDING 05",
            visual: "./assets/visuals/the-voice-that-inspires.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Ari accepts the invitation and presents the artwork publicly during The Unfiltered Project."
                },
                {
                    speaker: "NARRATOR",
                    text: "During the presentation, Ari explains the importance of acceptance and allowing people to express themselves freely."
                },
                {
                    speaker: "NARRATOR",
                    text: "The audience appreciates the message. Ari learns that speaking openly can help others understand different experiences."
                },
                {
                    speaker: "ARI",
                    text: "I never expected my words to reach others. Maybe sharing my story can help someone feel understood."
                }
            ],

            next: "REF_01"
        },


        END_06: {
            title: "THE ART OF SELF-EXPRESSION",
            type: "ENDING 06",
            visual: "./assets/visuals/the-art-of-self-expression.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Ari decides not to present the artwork publicly but continues sharing creations on Spectrum."
                },
                {
                    speaker: "NARRATOR",
                    text: "Ari becomes more confident while maintaining boundaries around personal life."
                },
                {
                    speaker: "NARRATOR",
                    text: "Ari understands that confidence does not require proving oneself to a crowd. Personal growth can happen at a comfortable pace."
                },
                {
                    speaker: "ARI",
                    text: "I can be confident without sharing everything. My choices are still my own."
                }
            ],

            next: "REF_01"
        },


        END_07: {
            title: "THE UNFINISHED CONVERSATION",
            type: "ENDING 07",
            visual: "./assets/visuals/the-unfinished-conversation.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Ari returns to Spectrum and joins The Unfiltered Project while keeping personal information private."
                },
                {
                    speaker: "NARRATOR",
                    text: "The submitted artwork focuses on respecting differences and allowing everyone to express themselves."
                },
                {
                    speaker: "NARRATOR",
                    text: "Although the classmate still does not understand Ari's perspective, Ari realizes that agreement cannot be forced and not every conversation ends with understanding."
                },
                {
                    speaker: "ARI",
                    text: "I cannot control what everyone thinks. I can only choose how I express myself and how I treat others."
                }
            ],

            next: "REF_01"
        },


        END_08: {
            title: "A THOUSAND WAYS TO BE",
            type: "ENDING 08",
            visual: "./assets/visuals/a-thousand-ways-to-be.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Ari decides to keep the artwork private and continues drawing for personal enjoyment."
                },
                {
                    speaker: "NARRATOR",
                    text: "Without seeking approval from others, Ari slowly becomes more comfortable with personal choices and individuality."
                },
                {
                    speaker: "NARRATOR",
                    text: "Ari learns that self-discovery takes time and that everyone deserves the freedom to find their own way."
                },
                {
                    speaker: "ARI",
                    text: "I don't need everyone to understand me. I just need the freedom to become who I am."
                }
            ],

            next: "REF_01"
        },


        REF_01: {
            title: "FINAL REFLECTION",
            type: "CLOSING",
            visual: "./assets/visuals/final-reflection.png",

            dialogue: [
                {
                    speaker: "NARRATOR",
                    text: "Maybe we spend so much time trying to fit into the world that we forget the world is made up of different people."
                },
                {
                    speaker: "NARRATOR",
                    text: "Each person has their own experiences, thoughts, identities, and ways of expressing themselves. There is no single way to be yourself."
                },
                {
                    speaker: "NARRATOR",
                    text: "Ari's journey reminds us that self-expression is a personal choice. Whether someone chooses to speak openly, share through art, or keep parts of their life private, their choices deserve respect."
                },
                {
                    speaker: "NARRATOR",
                    text: "We are stories still being written.\n\nAnd every story deserves to be heard, understood, and respected.\n\nYou are not a label. You are not an expectation. You are a thousand ways to be."
                }
            ],

            next: "FINISH"
        }

    };


    /* =====================================
       10. STORY STATE
    ===================================== */

    let currentScene = "EXP_01";
    let currentDialogueIndex = 0;
    let currentSceneCount = 1;

    let storyFinished = false;
    let choicePending = false;

    let currentEnding = null;

    let typingTimer = null;
    let isTyping = false;
    let typingCharacters = [];
    let typingPosition = 0;


    /* =====================================
       11. TYPEWRITER SYSTEM
    ===================================== */

    function stopTyping() {

        if (typingTimer !== null) {

            clearInterval(typingTimer);
            typingTimer = null;

        }

        isTyping = false;
    }


    function finishTyping() {

        if (!isTyping) return;

        stopTyping();

        dialogueText.textContent =
            typingCharacters.join("");

        saveGame();
    }


    function startTyping(text) {

        stopTyping();

        typingCharacters = Array.from(text);
        typingPosition = 0;

        dialogueText.textContent = "";

        if (
            reducedMotion ||
            TYPE_SPEED <= 0
        ) {

            dialogueText.textContent = text;

            return;

        }

        isTyping = true;

        typingTimer = setInterval(() => {

            if (typingPosition >= typingCharacters.length) {

                stopTyping();
                saveGame();

                return;

            }

            dialogueText.textContent +=
                typingCharacters[typingPosition];

            typingPosition++;

        }, TYPE_SPEED);
    }


    /* =====================================
       12. SAVE SYSTEM
    ===================================== */

    function saveGame() {

        try {

            const saveData = {

                scene: currentScene,

                dialogueIndex: currentDialogueIndex,

                sceneCount: currentSceneCount,

                currentEnding: currentEnding,

                mode: choicePending
                    ? "choices"
                    : "dialogue"

            };

            localStorage.setItem(
                STORAGE_KEYS.save,
                JSON.stringify(saveData)
            );

        } catch (error) {

            console.warn(
                "Unable to save game:",
                error
            );

        }
    }


    function loadGame() {

        try {

            const saved = localStorage.getItem(
                STORAGE_KEYS.save
            );

            if (!saved) return false;

            const data = JSON.parse(saved);

            const scene = data && scenes[data.scene];

            if (
                !data ||
                !scene ||
                !Array.isArray(scene.dialogue) ||
                !Number.isInteger(data.dialogueIndex) ||
                data.dialogueIndex < 0 ||
                data.dialogueIndex >= scene.dialogue.length
            ) {

                return false;

            }

            if (
                data.mode === "choices" &&
                !Array.isArray(scene.choices)
            ) {

                return false;

            }

            if (
                data.mode !== "choices" &&
                data.mode !== "dialogue"
            ) {

                return false;

            }

            currentScene = data.scene;

            currentDialogueIndex = data.dialogueIndex;

            currentSceneCount =
                Number.isInteger(data.sceneCount) &&
                data.sceneCount > 0
                    ? data.sceneCount
                    : 1;

            currentEnding =
                ENDING_IDS.includes(data.currentEnding)
                    ? data.currentEnding
                    : null;

            choicePending = data.mode === "choices";

            return true;

        } catch (error) {

            console.warn(
                "Unable to load saved game:",
                error
            );

            return false;

        }
    }


    function clearSave() {

        try {

            localStorage.removeItem(
                STORAGE_KEYS.save
            );

        } catch (error) {

            console.warn(
                "Unable to clear save:",
                error
            );

        }
    }


    /* =====================================
       12.1 STORY PROGRESS TRACKER
    ===================================== */

    const ENDING_IDS = [
        "END_01",
        "END_02",
        "END_03",
        "END_04",
        "END_05",
        "END_06",
        "END_07",
        "END_08"
    ];

    const TOTAL_SCENES = Object.keys(scenes).length;


    function getProgress() {

        const emptyProgress = {
            visitedScenes: [],
            completedScenes: [],
            discoveredEndings: []
        };

        try {

            const saved = localStorage.getItem(
                STORAGE_KEYS.progress
            );

            if (!saved) return emptyProgress;

            const data = JSON.parse(saved);

            if (!data || typeof data !== "object") {
                return emptyProgress;
            }

            return {

                visitedScenes: Array.isArray(data.visitedScenes)
                    ? [...new Set(
                        data.visitedScenes.filter(id => scenes[id])
                    )]
                    : [],

                completedScenes: Array.isArray(data.completedScenes)
                    ? [...new Set(
                        data.completedScenes.filter(id => scenes[id])
                    )]
                    : [],

                discoveredEndings: Array.isArray(data.discoveredEndings)
                    ? [...new Set(
                        data.discoveredEndings.filter(
                            id => ENDING_IDS.includes(id)
                        )
                    )]
                    : []

            };

        } catch (error) {

            console.warn(
                "Unable to read story progress:",
                error
            );

            return emptyProgress;

        }
    }


    function saveProgress(progress) {

        try {

            localStorage.setItem(
                STORAGE_KEYS.progress,
                JSON.stringify(progress)
            );

        } catch (error) {

            console.warn(
                "Unable to save story progress:",
                error
            );

        }
    }


    function recordSceneVisit(sceneID) {

        if (!scenes[sceneID]) return;

        const progress = getProgress();

        if (!progress.visitedScenes.includes(sceneID)) {

            progress.visitedScenes.push(sceneID);

            saveProgress(progress);

        }
    }


    function markSceneCompleted(sceneID) {

        if (!scenes[sceneID]) return;

        const progress = getProgress();

        if (!progress.completedScenes.includes(sceneID)) {

            progress.completedScenes.push(sceneID);

            saveProgress(progress);

        }
    }


    function recordEnding(endingID) {

        if (!ENDING_IDS.includes(endingID)) return;

        const progress = getProgress();

        if (!progress.discoveredEndings.includes(endingID)) {

            progress.discoveredEndings.push(endingID);

            saveProgress(progress);

        }
    }


    function getCompletionPercentage(progress) {

        const completed = progress.completedScenes.length;

        return Math.round(
            (completed / TOTAL_SCENES) * 100
        );
    }


    /* =====================================
       12.2 PROGRESS TRACKER DISPLAY
    ===================================== */

    function openProgressTracker() {

        const progress = getProgress();

        const completedCount =
            progress.completedScenes.length;

        const endingCount =
            progress.discoveredEndings.length;

        const percentage =
            getCompletionPercentage(progress);


        const endingCards = ENDING_IDS.map((id, index) => {

            const discovered =
                progress.discoveredEndings.includes(id);

            const endingTitle = scenes[id].title;

            return `
                <div class="progress-ending-card ${
                    discovered
                        ? "ending-discovered"
                        : "ending-locked"
                }">

                    <span class="progress-ending-icon">
                        ${discovered ? "✦" : "🔒"}
                    </span>

                    <span class="progress-ending-number">
                        ENDING ${index + 1}
                    </span>

                    <strong>
                        ${discovered
                            ? endingTitle
                            : "UNDISCOVERED"}
                    </strong>

                    <span class="progress-ending-status">
                        ${discovered
                            ? "DISCOVERED"
                            : "NOT YET FOUND"}
                    </span>

                </div>
            `;

        }).join("");


        openDialog(
            "STORY PROGRESS",

            `
                <div class="progress-content">

                    <p class="progress-subtitle">
                        A THOUSAND WAYS TO BE
                    </p>

                    <div class="progress-overview">

                        <div class="progress-heading-row">

                            <strong>OVERALL COMPLETION</strong>

                            <strong class="progress-percentage">
                                ${percentage}%
                            </strong>

                        </div>

                        <div
                            class="progress-bar"
                            role="progressbar"
                            aria-valuemin="0"
                            aria-valuemax="100"
                            aria-valuenow="${percentage}"
                            aria-label="Overall story completion"
                        >

                            <div
                                class="progress-bar-fill"
                                style="width: ${percentage}%"
                            ></div>

                        </div>

                    </div>


                    <div class="progress-stat-grid">

                        <div class="progress-stat">

                            <strong>
                                ${completedCount}/${TOTAL_SCENES}
                            </strong>

                            <span>SCENES COMPLETED</span>

                        </div>


                        <div class="progress-stat">

                            <strong>
                                ${endingCount}/8
                            </strong>

                            <span>ENDINGS DISCOVERED</span>

                        </div>

                    </div>


                    <div class="progress-section">

                        <h3>ENDING COLLECTION</h3>

                        <p>
                            Discover all eight possible endings
                            to complete the story.
                        </p>

                        <div class="progress-ending-grid">

                            ${endingCards}

                        </div>

                    </div>


                    <div class="progress-section">

                        <h3>SCENE RECORD</h3>

                        <p>
                            ${progress.visitedScenes.length}
                            of ${TOTAL_SCENES} scenes visited.
                        </p>

                    </div>


                    <p class="progress-note">
                        Your story progress is saved automatically
                        on this device.
                    </p>

                </div>


                <button
                    type="button"
                    class="dialog-close"
                >
                    Return to Menu
                </button>
            `
        );
    }


    /* =====================================
       13. PARTICLE GENERATOR
    ===================================== */

    function createParticles() {

        if (!particleLayer) return;

        particleLayer.innerHTML = "";

        if (reducedMotion) return;

        const particleCount = 28;

        for (let i = 0; i < particleCount; i++) {

            const particle = document.createElement("span");

            particle.className = "particle";

            particle.style.left =
                Math.random() * 100 + "%";

            particle.style.animationDuration =
                (8 + Math.random() * 12) + "s";

            particle.style.animationDelay =
                (Math.random() * 12) + "s";

            const size = 2 + Math.random() * 3;

            particle.style.width = size + "px";
            particle.style.height = size + "px";

            particleLayer.appendChild(particle);

        }
    }


    /* =====================================
       14. SCENE VISUAL DISPLAY
    ===================================== */

    let visualLoadID = 0;


    function displaySceneVisual(scene) {

        if (!sceneVisualImage || !sceneVisualContainer) {
            return;
        }

        const visualPath = scene.visual;

        visualLoadID++;

        const currentLoadID = visualLoadID;

        sceneVisualImage.onerror = null;
        sceneVisualImage.onload = null;

        if (!visualPath) {

            sceneVisualContainer.hidden = true;

            return;

        }

        sceneVisualContainer.hidden = false;
        sceneVisualImage.hidden = false;

        sceneVisualImage.alt =
            scene.title + " illustration";

        sceneVisualImage.onload = () => {

            if (currentLoadID !== visualLoadID) return;

            sceneVisualImage.hidden = false;
            sceneVisualContainer.hidden = false;

        };

        sceneVisualImage.onerror = () => {

            if (currentLoadID !== visualLoadID) return;

            console.warn(
                "Unable to load scene illustration:",
                visualPath
            );

            sceneVisualImage.hidden = true;
            sceneVisualContainer.hidden = true;

        };

        sceneVisualImage.src = visualPath;
    }


    /* =====================================
       15. DIALOGUE DISPLAY
    ===================================== */

    function updateDialogue() {

        const scene = scenes[currentScene];

        if (!scene) return;

        const dialogue =
            scene.dialogue[currentDialogueIndex];

        if (!dialogue) return;

        stopTyping();

        characterName.textContent = dialogue.speaker;

        sceneCounter.textContent =
            "SCENE " +
            String(currentSceneCount).padStart(2, "0");

        choicesContainer.hidden = true;
        nextButton.hidden = false;

        choicePending = false;

        nextButton.textContent = "NEXT ›";

        updateTextSize();

        startTyping(dialogue.text);

        saveGame();
    }


    /* =====================================
       16. SCENE DISPLAY
    ===================================== */

    function displayScene(sceneID) {

        const scene = scenes[sceneID];

        if (!scene) {

            console.error(
                "Scene not found:",
                sceneID
            );

            return;

        }

        stopTyping();

        currentScene = sceneID;
        currentDialogueIndex = 0;

        storyFinished = false;
        choicePending = false;

        recordSceneVisit(sceneID);

        if (ENDING_IDS.includes(sceneID)) {

            currentEnding = sceneID;

        }

        sceneHeading.textContent = scene.title;
        sceneType.textContent = scene.type;

        sceneCounter.textContent =
            "SCENE " +
            String(currentSceneCount).padStart(2, "0");

        displaySceneVisual(scene);

        choicesContainer.hidden = true;
        choicesContainer.innerHTML = "";

        nextButton.hidden = false;
        nextButton.textContent = "NEXT ›";

        updateDialogue();

        if (storyContent && !reducedMotion) {

            storyContent.classList.remove("scene-changing");

            void storyContent.offsetWidth;

            storyContent.classList.add("scene-changing");

        }

        saveGame();
    }


    /* =====================================
       17. CHOICE DISPLAY
    ===================================== */

    function displayChoices(choices) {

        stopTyping();

        choicesContainer.innerHTML = "";
        choicesContainer.hidden = false;

        nextButton.hidden = true;

        choicePending = true;

        choices.forEach(choice => {

            const button = document.createElement("button");

            button.type = "button";
            button.className = "choice-button";

            button.textContent = choice.text;

            button.addEventListener("click", () => {

                if (storyFinished) return;

                if (!scenes[choice.next]) {

                    console.error(
                        "Invalid destination:",
                        choice.next
                    );

                    return;

                }

                markSceneCompleted(currentScene);

                choicesContainer.hidden = true;
                choicePending = false;

                currentSceneCount++;

                displayScene(choice.next);

            });

            choicesContainer.appendChild(button);

        });

        saveGame();

        const firstChoice =
            choicesContainer.querySelector(".choice-button");

        if (firstChoice) {
            firstChoice.focus();
        }
    }


    /* =====================================
       18. NEXT DIALOGUE
    ===================================== */

    function nextDialogue() {

        if (storyFinished) {

            returnToMenu();

            return;

        }

        if (isTyping) {

            finishTyping();

            return;

        }

        const scene = scenes[currentScene];

        if (!scene) return;

        if (
            currentDialogueIndex <
            scene.dialogue.length - 1
        ) {

            currentDialogueIndex++;

            updateDialogue();

            return;

        }

        nextButton.hidden = true;

        if (scene.choices) {

            displayChoices(scene.choices);

            return;

        }

        if (scene.next) {

            if (scene.next === "FINISH") {

                finishStory();

            } else if (scenes[scene.next]) {

                markSceneCompleted(currentScene);

                currentSceneCount++;

                displayScene(scene.next);

            } else {

                console.error(
                    "Invalid next scene:",
                    scene.next
                );

            }
        }
    }


    /* =====================================
       19. START STORY
    ===================================== */

    function startStory() {

        closeDialog();

        stopTyping();
        stopMenuMusic();

        if (menuVideo) {
            menuVideo.pause();
        }

        menuScreen.hidden = true;
        storyScreen.hidden = false;

        currentSceneCount = 1;
        storyFinished = false;
        choicePending = false;

        currentEnding = null;

        displayScene("EXP_01");

        createParticles();

        if (storyContent) {
            storyContent.scrollTop = 0;
        }
    }


    /* =====================================
       20. CONTINUE STORY
    ===================================== */

    function continueStory() {

        if (!loadGame()) {

            openDialog(
                "NO SAVED GAME",

                `
                    <p class="dialog-text">
                        You don't have any saved progress yet.

                        <br><br>

                        Begin your story to start your journey.
                    </p>

                    <button
                        type="button"
                        class="dialog-close"
                    >
                        Return to Menu
                    </button>
                `
            );

            return;
        }

        closeDialog();

        stopTyping();
        stopMenuMusic();

        if (menuVideo) {
            menuVideo.pause();
        }

        menuScreen.hidden = true;
        storyScreen.hidden = false;

        storyFinished = false;

        const scene = scenes[currentScene];

        sceneHeading.textContent = scene.title;
        sceneType.textContent = scene.type;

        sceneCounter.textContent =
            "SCENE " +
            String(currentSceneCount).padStart(2, "0");

        displaySceneVisual(scene);

        updateTextSize();

        if (choicePending && scene.choices) {

            characterName.textContent =
                scene.dialogue[currentDialogueIndex].speaker;

            dialogueText.textContent =
                scene.dialogue[currentDialogueIndex].text;

            nextButton.hidden = true;

            displayChoices(scene.choices);

        } else {

            updateDialogue();

        }

        createParticles();

        if (storyContent) {
            storyContent.scrollTop = 0;
        }
    }


    /* =====================================
       21. FINISH STORY
    ===================================== */

    function finishStory() {

        stopTyping();

        storyFinished = true;
        choicePending = false;

        markSceneCompleted(currentScene);

        if (currentEnding) {

            recordEnding(currentEnding);

        }

        clearSave();

        sceneHeading.textContent = "THE END";
        sceneType.textContent = "THANK YOU FOR PLAYING";

        characterName.textContent = "NARRATOR";

        dialogueText.textContent =
            "Thank you for experiencing SPEC-TRUM STORIES: A Thousand Ways to Be.";

        updateTextSize();

        nextButton.textContent = "RETURN TO MENU";
        nextButton.hidden = false;

        choicesContainer.hidden = true;
        choicesContainer.innerHTML = "";

        if (sceneVisualContainer) {
            sceneVisualContainer.hidden = true;
        }
    }


    /* =====================================
       22. RETURN TO MENU
    ===================================== */

    function returnToMenu() {

        stopTyping();
        closeDialog();

        storyScreen.hidden = true;
        menuScreen.hidden = false;

        nextButton.textContent = "NEXT ›";
        nextButton.hidden = false;

        choicesContainer.hidden = true;
        choicesContainer.innerHTML = "";

        musicStopped = false;
        musicStarted = false;
        musicPlayPending = false;

        updateVideo();

        startMenuMusic();
    }


    /* =====================================
       23. STORY MENU BUTTON
    ===================================== */

    if (storyMenuButton) {

        storyMenuButton.addEventListener("click", () => {

            saveGame();

            openDialog(
                "RETURN TO MENU",

                `
                    <p class="dialog-text">
                        Do you want to return to the main menu?

                        <br><br>

                        Your current progress will be saved.
                    </p>

                    <button
                        type="button"
                        class="dialog-close"
                        id="return-menu-confirm"
                    >
                        Stay in Story
                    </button>

                    <button
                        type="button"
                        class="dialog-close"
                        id="return-menu-action"
                    >
                        Return to Menu
                    </button>
                `
            );

            const returnButton =
                document.getElementById("return-menu-action");

            if (returnButton) {

                returnButton.addEventListener("click", () => {

                    returnToMenu();

                });

            }
        });
    }


    /* =====================================
       24. NEXT BUTTON
    ===================================== */

    nextButton.addEventListener("click", nextDialogue);


    /* =====================================
       25. MAIN MENU BUTTONS
    ===================================== */

    if (beginButton) {

        beginButton.addEventListener("click", () => {

            openDialog(
                "BEGIN STORY",

                `
                    <p class="dialog-text">
                        Welcome to SPEC-TRUM STORIES.

                        <br><br>

                        Your journey is about to begin.

                        <br><br>

                        Every choice will lead to a different experience.
                    </p>

                    <button
                        type="button"
                        class="dialog-close"
                        id="start-story-confirm"
                    >
                        Begin Journey
                    </button>
                `
            );

            const startButton =
                document.getElementById("start-story-confirm");

            if (startButton) {

                startButton.addEventListener("click", () => {

                    startStory();

                });

            }
        });
    }


    if (continueButton) {

        continueButton.addEventListener(
            "click",
            continueStory
        );

    }


    /* =====================================
       25.1 STORY PROGRESS MENU BUTTON
    ===================================== */

    let progressButton = null;

    if (creditsButton) {

        progressButton = document.createElement("button");

        progressButton.type = "button";
        progressButton.id = "progress-button";
        progressButton.textContent = "STORY PROGRESS";

        progressButton.className =
            creditsButton.className || "menu-button";

        creditsButton.insertAdjacentElement(
            "beforebegin",
            progressButton
        );

        progressButton.addEventListener(
            "click",
            openProgressTracker
        );

    }


    /* =====================================
       26. SETTINGS MENU
    ===================================== */

    if (settingsButton) {

        settingsButton.addEventListener("click", () => {

            openDialog(
                "SETTINGS",

                `
                    <div class="settings-list">

                        <div class="setting-group">

                            <div class="setting-heading">

                                <label for="volume-setting">
                                    Music Volume
                                </label>

                                <span id="volume-value">
                                    ${musicVolume}%
                                </span>

                            </div>

                            <input
                                type="range"
                                id="volume-setting"
                                class="setting-range"
                                min="0"
                                max="100"
                                step="5"
                                value="${musicVolume}"
                            >

                        </div>


                        <label class="setting-item">

                            <span>Background Video</span>

                            <input
                                type="checkbox"
                                id="video-setting"
                                ${videoEnabled ? "checked" : ""}
                            >

                        </label>


                        <label class="setting-item">

                            <span>Reduced Motion</span>

                            <input
                                type="checkbox"
                                id="motion-setting"
                                ${reducedMotion ? "checked" : ""}
                            >

                        </label>


                        <div class="setting-group">

                            <label for="text-speed-setting">
                                Text Speed
                            </label>

                            <select
                                id="text-speed-setting"
                                class="setting-select"
                            >

                                <option
                                    value="slow"
                                    ${textSpeed === "slow" ? "selected" : ""}
                                >
                                    Slow
                                </option>

                                <option
                                    value="normal"
                                    ${textSpeed === "normal" ? "selected" : ""}
                                >
                                    Normal
                                </option>

                                <option
                                    value="fast"
                                    ${textSpeed === "fast" ? "selected" : ""}
                                >
                                    Fast
                                </option>

                            </select>

                        </div>


                        <div class="setting-group">

                            <label for="text-size-setting">
                                Dialogue Text Size
                            </label>

                            <select
                                id="text-size-setting"
                                class="setting-select"
                            >

                                <option
                                    value="small"
                                    ${textSize === "small" ? "selected" : ""}
                                >
                                    Small
                                </option>

                                <option
                                    value="medium"
                                    ${textSize === "medium" ? "selected" : ""}
                                >
                                    Medium
                                </option>

                                <option
                                    value="large"
                                    ${textSize === "large" ? "selected" : ""}
                                >
                                    Large
                                </option>

                            </select>

                        </div>

                    </div>

                    <p class="settings-note">
                        Your settings are saved automatically.
                    </p>

                    <button
                        type="button"
                        class="dialog-close"
                    >
                        Save and Return
                    </button>
                `
            );


            /* MUSIC VOLUME */

            const volumeSetting =
                document.getElementById("volume-setting");

            const volumeValue =
                document.getElementById("volume-value");

            if (volumeSetting) {

                volumeSetting.addEventListener("input", () => {

                    musicVolume = Number(volumeSetting.value);

                    updateMusicVolume();

                    saveSetting(
                        STORAGE_KEYS.volume,
                        musicVolume
                    );

                    if (volumeValue) {

                        volumeValue.textContent =
                            musicVolume + "%";

                    }

                });
            }


            /* BACKGROUND VIDEO */

            const videoSetting =
                document.getElementById("video-setting");

            if (videoSetting) {

                videoSetting.addEventListener("change", () => {

                    videoEnabled = videoSetting.checked;

                    saveSetting(
                        STORAGE_KEYS.video,
                        videoEnabled
                    );

                    updateVideo();

                });
            }


            /* REDUCED MOTION */

            const motionSetting =
                document.getElementById("motion-setting");

            if (motionSetting) {

                motionSetting.addEventListener("change", () => {

                    reducedMotion = motionSetting.checked;

                    saveSetting(
                        STORAGE_KEYS.motion,
                        reducedMotion
                    );

                    updateMotion();
                    createParticles();

                });
            }


            /* TEXT SPEED */

            const textSpeedSetting =
                document.getElementById("text-speed-setting");

            if (textSpeedSetting) {

                textSpeedSetting.addEventListener("change", () => {

                    textSpeed = textSpeedSetting.value;

                    TYPE_SPEED = TEXT_SPEEDS[textSpeed];

                    saveSetting(
                        STORAGE_KEYS.textSpeed,
                        textSpeed
                    );

                });
            }


            /* TEXT SIZE */

            const textSizeSetting =
                document.getElementById("text-size-setting");

            if (textSizeSetting) {

                textSizeSetting.addEventListener("change", () => {

                    textSize = textSizeSetting.value;

                    saveSetting(
                        STORAGE_KEYS.textSize,
                        textSize
                    );

                    updateTextSize();

                });
            }

        });
    }


    /* =====================================
       27. CREDITS MENU
    ===================================== */

    if (creditsButton) {

        creditsButton.addEventListener("click", () => {

            openDialog(
                "CREDITS",

                `
                    <div class="credits-content">

                        <h3 class="credits-project-title">
                            SPEC-TRUM STORIES
                        </h3>

                        <p class="credits-subtitle">
                            A Thousand Ways to Be
                        </p>

                        <p class="credits-tagline">
                            An Interactive Story About Identity,
                            Courage, and Self-Expression
                        </p>


                        <div class="credits-divider"></div>


                        <h4>ABOUT THE PROJECT</h4>

                        <p>
                            SPEC-TRUM STORIES: A Thousand Ways to Be
                            is an interactive visual novel that
                            explores identity, individuality,
                            privacy, and self-expression.
                        </p>

                        <p>
                            Through the journey of Ari, a
                            seventeen-year-old aspiring digital
                            artist, players experience how personal
                            choices can shape one's understanding
                            of identity and self-acceptance.
                        </p>

                        <p>
                            With different decisions and possible
                            endings, the story encourages players
                            to reflect on acceptance, personal
                            boundaries, courage, and respect for
                            individual differences.
                        </p>


                        <div class="credits-divider"></div>


                        <h4>PROJECT TEAM</h4>

                        <p>
                            <strong>Project Manager</strong>
                            <br>
                            Trinity Mea Barrun
                        </p>

                        <p>
                            <strong>Coder / Programmer</strong>
                            <br>
                            Aaron G. Cardaño
                        </p>

                        <p>
                            <strong>Project Members</strong>
                            <br>
                            Mark Jhon Termulo
                            <br>
                            Merry Cadiz
                            <br>
                            Jasmine Ailes De Torres
                            <br>
                            Jhieanne Miles Alladin
                            <br>
                            Arjay Ariola
                        </p>


                        <div class="credits-divider"></div>


                        <h4>FINAL MESSAGE</h4>

                        <p class="credits-final-message">
                            There is no single way to be yourself.
                        </p>

                        <p>
                            Every person has a story, an identity,
                            and a voice worth respecting.
                        </p>

                        <p class="credits-closing">
                            WE ARE STORIES STILL BEING WRITTEN.
                        </p>

                        <p>
                            Thank you for experiencing
                            <strong>
                                SPEC-TRUM STORIES:
                                A Thousand Ways to Be.
                            </strong>
                        </p>


                        <p class="credits-copyright">
                            © 2026 GROUP 5 — TWINKLER BELLS.
                            <br>
                            ALL RIGHTS RESERVED.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="dialog-close"
                    >
                        Return to Menu
                    </button>
                `
            );

        });
    }


    /* =====================================
       28. KEYBOARD CONTROLS
    ===================================== */

    document.addEventListener("keydown", event => {

        if (
            event.key === "Escape" &&
            activeDialog
        ) {

            closeDialog();

            return;
        }

        if (
            !activeDialog &&
            !storyScreen.hidden &&
            !nextButton.hidden &&
            (
                event.key === "Enter" ||
                event.key === " "
            ) &&
            document.activeElement !== nextButton
        ) {

            event.preventDefault();

            nextDialogue();

        }

    });


    /* =====================================
       29. VIDEO ERROR HANDLING
    ===================================== */

    if (menuVideo) {

        menuVideo.addEventListener("error", () => {

            console.warn(
                "Unable to load menu video."
            );

            menuVideo.style.display = "none";

        });
    }


    /* =====================================
       30. INITIALIZATION
    ===================================== */

    updateVideo();
    updateMotion();
    updateMusicVolume();
    updateTextSize();
    createParticles();

    console.log(
        "SPEC-TRUM STORIES visual novel with Story Progress Tracker initialized successfully."
    );

});
