'use strict';

import * as utils from '../utils.js';

/**
 * Base class for creating macros.
 * @class
 */
class MacroBase {
    constructor() {
        this.DOM = this._initDOM();

        this.type = '';
    }

    /**
     * Initializes the DOM elements for the macro.
     * @returns {Object} An object representing the DOM elements.
     */
    _initDOM() {
        let DOM = {};

        DOM.container = utils.create({
            attributes: {
                class: 'macro-entry-container',
            },
            children: [
                utils.create({
                    type: 'i',
                    attributes: {
                        title: _('Move'),
                        class: 'macro-entry-handle fa-solid fa-bars',
                    },
                }),
                (DOM.content = utils.create({
                    attributes: {
                        class: 'macro-entry-content',
                    },
                })),
                (DOM.controls = utils.create({
                    attributes: {
                        class: 'macro-entry-controls',
                    },
                    children: [
                        utils.create({
                            type: 'i',
                            attributes: {
                                title: _('Duplicate'),
                                class: 'macro-entry-additionals fa-solid fa-clone',
                            },
                            events: {
                                click: () => this._duplicateMacro(),
                            },
                        }),
                        utils.create({
                            type: 'i',
                            attributes: {
                                title: _('Delete'),
                                class: 'macro-entry-additionals fa-solid fa-trash',
                            },
                            events: {
                                click: () => this._removeDOM(),
                            },
                        }),
                    ],
                })),
            ],
        });

        DOM.container.instance = this;

        return DOM;
    }

    /**
     * Duplicates the current macro element and inserts it after the original.
     */
    _duplicateMacro() {
        const value = this.getValue();
        const entry = value ? getMacroByValue(value) : getMacroByType(this.type);

        this.DOM.container.parentNode.insertBefore(entry, this.DOM.container.nextSibling);
    }

    /**
     * Removes the DOM elements associated with the macro.
     */
    _removeDOM() {
        this.DOM.container.parentNode.removeChild(this.DOM.container);
    }

    /**
     * Adds additional controls to the macro entry.
     */
    _toggleControls(visible) {
        this.DOM.controls.style.display = visible ? 'block' : 'none';
    }

    /**
     * Get the value of the macro.
     * @returns {any} The value of the macro.
     */
    getValue() {
        return false;
    }
}

/**
 * Represents a selector macro.
 * @class
 * @extends MacroBase
 */
class MacroSelector extends MacroBase {
    constructor() {
        super();

        this.type = 'selector';
        this.inputWidth = 180;

        this._setContent();

        return this.DOM.container;
    }

    /**
     * Set the content for the selector macro.
     */
    _setContent() {
        utils.appendElements(this.DOM.content, [
            (this.input = utils.create({
                type: 'select',
                attributes: {
                    style: `width:${this.inputWidth}px;`,
                },
                events: {
                    change: (e) => this._macroSelected(e.target.value),
                },
                children: [
                    utils.create({
                        type: 'option',
                        text: _('Select a macro type'),
                        attributes: {
                            disabled: true,
                            selected: true,
                            style: 'display: none;',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: _('Wait'),
                        attributes: {
                            value: 'wait',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: _('String'),
                        attributes: {
                            value: 'string',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: _('Keycode'),
                        attributes: {
                            value: 'kc',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: _('Consumer Control Code'),
                        attributes: {
                            value: 'ccc',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: _('Mouse Event'),
                        attributes: {
                            value: 'mse',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: _('Tone'),
                        attributes: {
                            value: 'tone',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: _('Audio file'),
                        attributes: {
                            value: 'file',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: _('MIDI'),
                        attributes: {
                            value: 'midi',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: _('Device Function'),
                        attributes: {
                            value: 'sys',
                        },
                    }),
                ],
            })),
        ]);
    }

    /**
     * Handles the selection of a macro type.
     * @param {string} type - The selected macro type.
     */
    _macroSelected(type) {
        const entry = getMacroByType(type);
        this.DOM.container.parentNode.insertBefore(entry, this.DOM.container);

        this._removeDOM();
    }
}

/**
 * Represents a wait macro.
 * @class
 * @extends MacroBase
 */
class MacroWait extends MacroBase {
    constructor(value = 0) {
        super();

        this.type = 'wait';
        this.value = value;
        this.inputWidth = 45;

        this._setContent();

        return this.DOM.container;
    }

    /**
     * Set the content for the wait macro.
     */
    _setContent() {
        utils.appendElements(this.DOM.content, [
            utils.create({
                type: 'span',
                text: `${_('Wait')}`,
            }),
            utils.create({
                attributes: {
                    class: 'macro-entry-content-flex-container',
                },
                children: [
                    (this.input = utils.create({
                        type: 'input',
                        attributes: {
                            title: _(
                                'The time the macro should wait before executing the next macro'
                            ),
                            style: `width:${this.inputWidth}px;`,
                            type: 'number',
                            value: Math.abs(this.value),
                            min: 0,
                            step: 0.1,
                        },
                        events: {
                            input: (event) => {
                                if (event.target.value < 0) event.target.value = '';
                            },
                        },
                    })),
                    (this.nonblocking = utils.create({
                        type: 'input',
                        attributes: {
                            title: _('Select for non-blocking behavior'),
                            type: 'checkbox',
                        },
                    })),
                ],
            }),
            utils.create({
                type: 'span',
                text: _('s'),
            }),
        ]);

        if (this.value < 0) this.nonblocking.checked = true;
    }

    /**
     * Get the value of the wait macro.
     * @returns {number|false} The wait time in seconds or `false` if the value is 0.
     */
    getValue() {
        if (this.input.value === '0') return false;

        if (this.nonblocking.checked) {
            return parseFloat(-Math.abs(this.input.value));
        }
        return parseFloat(Math.abs(this.input.value));
    }
}

/**
 * Represents a string macro.
 * @class
 * @extends MacroBase
 */
class MacroString extends MacroBase {
    constructor(value = '') {
        super();

        this.type = 'string';
        this.value = value;

        this._setContent();

        return this.DOM.container;
    }

    /**
     * Set the content for the string macro.
     */
    _setContent() {
        utils.appendElements(this.DOM.content, [
            utils.create({
                type: 'span',
                text: `${_('String Input')}`,
            }),
            (this.input = utils.create({
                type: 'input',
                attributes: {
                    style: 'flex-grow:1;',
                    value: this.value,
                },
            })),
        ]);
    }

    /**
     * Get the value of the string macro.
     * @returns {string|false} The string value or `false` if the value is an empty string.
     */
    getValue() {
        return this.input.value === '' ? false : `${this.input.value}`;
    }
}

/**
 * Represents a keycodes macro.
 * @class
 * @extends MacroBase
 */
class MacroKeycodes extends MacroBase {
    constructor(value = { kc: '+' }) {
        super();

        this.type = 'kc';
        this.value = value;

        this.selectWidth = 80;
        this.behaviourList = [
            [_('Tap'), 'tap'],
            [_('Press'), 'press'],
            [_('Release'), 'release'],
            [_('Release all'), 'release_all'],
        ];

        this.keyCodeListWidth = 18;
        this.keyCodeList = [
            'A',
            'B',
            'C',
            'D',
            'E',
            'F',
            'G',
            'H',
            'I',
            'J',
            'K',
            'L',
            'M',
            'N',
            'O',
            'P',
            'Q',
            'R',
            'S',
            'T',
            'U',
            'V',
            'W',
            'X',
            'Y',
            'Z',
            'ZERO',
            'ONE',
            'TWO',
            'THREE',
            'FOUR',
            'FIVE',
            'SIX',
            'SEVEN',
            'EIGHT',
            'NINE',
            'ENTER',
            'RETURN',
            'ESCAPE',
            'BACKSPACE',
            'TAB',
            'SPACEBAR',
            'SPACE',
            'MINUS',
            'EQUALS',
            'LEFT_BRACKET',
            'RIGHT_BRACKET',
            'BACKSLASH',
            'POUND',
            'SEMICOLON',
            'QUOTE',
            'GRAVE_ACCENT',
            'COMMA',
            'PERIOD',
            'FORWARD_SLASH',
            'CAPS_LOCK',
            'F1',
            'F2',
            'F3',
            'F4',
            'F5',
            'F6',
            'F7',
            'F8',
            'F9',
            'F10',
            'F11',
            'F12',
            'F13',
            'F14',
            'F15',
            'F16',
            'F17',
            'F18',
            'F19',
            'F20',
            'F21',
            'F22',
            'F23',
            'F24',
            'PRINT_SCREEN',
            'SCROLL_LOCK',
            'PAUSE',
            'INSERT',
            'HOME',
            'PAGE_UP',
            'DELETE',
            'END',
            'PAGE_DOWN',
            'RIGHT_ARROW',
            'LEFT_ARROW',
            'DOWN_ARROW',
            'UP_ARROW',
            'KEYPAD_NUMLOCK',
            'KEYPAD_FORWARD_SLASH',
            'KEYPAD_ASTERISK',
            'KEYPAD_MINUS',
            'KEYPAD_PLUS',
            'KEYPAD_ENTER',
            'KEYPAD_ONE',
            'KEYPAD_TWO',
            'KEYPAD_THREE',
            'KEYPAD_FOUR',
            'KEYPAD_FIVE',
            'KEYPAD_SIX',
            'KEYPAD_SEVEN',
            'KEYPAD_EIGHT',
            'KEYPAD_NINE',
            'KEYPAD_ZERO',
            'KEYPAD_PERIOD',
            'KEYPAD_BACKSLASH',
            'APPLICATION',
            'POWER',
            'KEYPAD_EQUALS',
            'LEFT_CONTROL',
            'CONTROL',
            'LEFT_SHIFT',
            'SHIFT',
            'LEFT_ALT',
            'ALT',
            'OPTION',
            'LEFT_GUI',
            'GUI',
            'WINDOWS',
            'COMMAND',
            'RIGHT_CONTROL',
            'RIGHT_SHIFT',
            'RIGHT_ALT',
            'RIGHT_GUI',
        ];

        this._setContent();

        return this.DOM.container;
    }

    /**
     * Set the content for the keycodes macro.
     */
    _setContent() {
        utils.appendElements(this.DOM.content, [
            (this.behaviour = utils.create({
                type: 'select',
                attributes: {
                    style: `width:${this.selectWidth}px;`,
                },
                children: this.behaviourList.map((value) => {
                    return utils.create({
                        type: 'option',
                        text: value[0],
                        attributes: {
                            value: value[1],
                        },
                    });
                }),
                events: {
                    change: (event) => {
                        this._updateVisibility();
                    },
                },
            })),
            (this.additions = utils.create({
                attributes: {
                    class: 'macro-entry-content-flex-container flex-growed',
                },
                children: [
                    (this.input = utils.create({
                        type: 'input',
                        attributes: {
                            style: 'flex-grow:1;',
                            placeholder: 'e.g. CONTROL,ALT,F1',
                        },
                    })),
                    utils.create({
                        type: 'select',
                        attributes: {
                            style: `width:${this.keyCodeListWidth}px;`,
                        },
                        children: [
                            utils.create({
                                type: 'option',
                                text: '',
                                attributes: {
                                    disabled: true,
                                    selected: true,
                                },
                            }),
                            ...this.keyCodeList.map((value) => {
                                return utils.create({
                                    type: 'option',
                                    text: value,
                                });
                            }),
                        ],
                        events: {
                            change: (event) => {
                                let list = this.input.value.split(',').filter(Boolean);
                                list.push(event.target.value);
                                event.target.selectedIndex = 0;
                                this.input.value = list.join(',');
                            },
                        },
                    }),
                ],
            })),
        ]);

        if (this.value.kc === 'RELALL') {
            this.behaviour.value = 'release_all';
            this.input.value = '';
        } else {
            const prefix = this.value.kc.charAt(0);
            switch (prefix) {
                case '+':
                    this.behaviour.value = 'tap';
                    break;
                case '-':
                    this.behaviour.value = 'release';
                    break;
                default:
                    this.behaviour.value = 'press';
                    break;
            }

            this.input.value = this.value.kc.replace(/^[+-]/, '');
        }

        this._updateVisibility();
    }

    /**
     * Updates the visibility of the additions based on the current behavior.
     */
    _updateVisibility() {
        this.additions.classList.toggle('hidden', ['release_all'].includes(this.behaviour.value));
    }

    /**
     * Get the value of the keycodes macro.
     * @returns {Object|false} An object representing the keycodes or `false` if no keycodes are entered.
     */
    getValue() {
        if (!this.input.value.trim()) {
            return false;
        }

        const prefix =
            {
                tap: '+',
                release: '-',
                press: '',
            }[this.behaviour.value] || '';

        if (this.behaviour.value === 'release_all') {
            return { kc: 'RELALL' };
        }

        const formattedInput = this.input.value
            .replace(/\s+/g, '') // Remove whitespace
            .toUpperCase() // Convert to uppercase
            .split(',') // Split by comma
            .filter(Boolean) // Remove empty entries
            .join(','); // Join with commas

        return { kc: `${prefix}${formattedInput}` };
    }
}

/**
 * Represents a consumer control codes macro.
 * @class
 * @extends MacroBase
 */
class MacroConsumerControlCodes extends MacroBase {
    constructor(value = { ccc: '+' }) {
        super();

        this.type = 'ccc';
        this.value = value;
        this.selectWidth = 80;
        this.inputWidth = 200;

        this.behaviourList = [
            [_('Tap'), 'tap'],
            [_('Press'), 'press'],
            [_('Release'), 'release'],
        ];

        this.autocompleteList = [
            '',
            'MUTE',
            'VOLUME_INCREMENT',
            'VOLUME_DECREMENT',
            'RECORD',
            'FAST_FORWARD',
            'REWIND',
            'SCAN_NEXT_TRACK',
            'SCAN_PREVIOUS_TRACK',
            'STOP',
            'EJECT',
            'PLAY_PAUSE',
            'BRIGHTNESS_DECREMENT',
            'BRIGHTNESS_INCREMENT',
        ];

        this._setContent();

        return this.DOM.container;
    }

    /**
     * Set the content for the consumer control codes macro.
     */
    _setContent() {
        utils.appendElements(this.DOM.content, [
            (this.behaviour = utils.create({
                type: 'select',
                attributes: {
                    style: `width:${this.selectWidth}px;`,
                },
                children: this.behaviourList.map((value) => {
                    return utils.create({
                        type: 'option',
                        text: value[0],
                        attributes: {
                            value: value[1],
                        },
                    });
                }),
            })),
            (this.input = utils.create({
                type: 'select',
                attributes: {
                    list: 'consumer-control-codes',
                    style: `width:${this.inputWidth}px; flex-grow:1;`,
                },
                children: this.autocompleteList.sort().map((value) => {
                    return utils.create({
                        type: 'option',
                        text: value,
                        attributes: {
                            value: value,
                        },
                    });
                }),
            })),
        ]);

        const prefix = this.value.ccc.charAt(0);
        switch (prefix) {
            case '+':
                this.behaviour.value = 'tap';
                break;
            case '-':
                this.behaviour.value = 'release';
                break;
            default:
                this.behaviour.value = 'press';
                break;
        }

        this.input.value = this.value.ccc.replace(/^[+-]/, '');

        for (const option of this.input.children) {
            if (this.value.ccc === option.value) {
                option.selected = true;
                break;
            }
        }
    }

    /**
     * Get the value of the consumer control codes macro.
     * @returns {Object|false} An object representing the consumer control code value or `false` if no valid code is selected.
     */
    getValue() {
        if (this.input.value === '') {
            return false;
        }

        const prefix =
            {
                tap: '+',
                release: '-',
                press: '',
            }[this.behaviour.value] || '';

        return { ccc: `${prefix}${this.input.value}` };
    }
}

/**
 * Represents a tone macro.
 * @class
 * @extends MacroBase
 */
class MacroTone extends MacroBase {
    constructor(value = { tone: {} }) {
        super();

        this.type = 'tone';
        const defaultTone = { frequency: undefined, duration: 0 };
        this.value = {
            tone: { ...defaultTone, ...value.tone },
        };

        this.toneCommandsList = [
            [_('Tone On'), 'toneon'],
            [_('Tone Off'), 'toneoff'],
        ];

        this.selectWidth = 80;
        this.chordWidth = 45;
        this.durationWidth = 45;
        this.frequencyWidth = 58;

        this.autocompleteList = {
            '': 0,
            C: 261,
            D: 293,
            E: 329,
            G: 392,
            A: 440,
            B: 494,
            Cm: 277,
            Dm: 311,
            Em: 349,
            Fm: 370,
            Gm: 415,
            Am: 466,
        };

        this._setContent();

        return this.DOM.container;
    }

    /**
     * Set the content for the mouse events macro.
     */
    _setContent() {
        utils.appendElements(this.DOM.content, [
            (this.toneCommandSelect = utils.create({
                type: 'select',
                children: this.toneCommandsList.map((value) => {
                    return utils.create({
                        type: 'option',
                        text: value[0],
                        attributes: {
                            value: value[1],
                        },
                    });
                }),
                attributes: {
                    style: `width:${this.selectWidth}px;`,
                },
                events: {
                    change: (event) => {
                        this._updateVisibility();
                    },
                },
            })),
            (this.containerToneOn = utils.create({
                attributes: {
                    class: 'macro-entry-content-flex-container gapped',
                },
                children: [
                    (this.chord = utils.create({
                        type: 'select',
                        attributes: {
                            type: 'select',
                            title: _('Chord of the tone'),
                            style: `width:${this.chordWidth}px;`,
                            value: this.value.tone.frequency,
                        },
                        children: Object.keys(this.autocompleteList).map((value) => {
                            return utils.create({
                                type: 'option',
                                text: value,
                                attributes: {
                                    value: this.autocompleteList[value],
                                },
                            });
                        }),
                        events: {
                            change: (event) => {
                                this.frequency.value = event.target.value;
                            },
                        },
                    })),
                    utils.create({
                        type: 'span',
                        text: '/',
                    }),
                    (this.frequency = utils.create({
                        type: 'input',
                        attributes: {
                            type: 'number',
                            title: _('Frequency of the tone in Hz'),
                            style: `width:${this.frequencyWidth}px;`,
                            value: this.value.tone.frequency,
                            min: 0,
                        },
                        events: {
                            input: (event) => {
                                if (event.target.value < 0) event.target.value = '';

                                for (const option of this.chord.children) {
                                    this.chord.children[0].selected = true;
                                    if (parseInt(this.frequency.value) === parseInt(option.value)) {
                                        option.selected = true;
                                        break;
                                    }
                                }
                            },
                        },
                    })),
                    utils.create({
                        type: 'span',
                        text: `${_('Hz')} ${_('for')}`,
                    }),
                    utils.create({
                        attributes: {
                            class: 'macro-entry-content-flex-container',
                        },
                        children: [
                            (this.duration = utils.create({
                                type: 'input',
                                attributes: {
                                    type: 'number',
                                    title: _(
                                        'Duration of the tone in seconds. Set to 0 for continuous playback'
                                    ),
                                    style: `width:${this.durationWidth}px;`,
                                    value: Math.abs(this.value.tone.duration),
                                    min: 0,
                                    step: 0.1,
                                },
                                events: {
                                    input: (event) => {
                                        if (event.target.value < 0) event.target.value = '';
                                    },
                                },
                            })),
                            (this.nonblocking = utils.create({
                                type: 'input',
                                attributes: {
                                    title: _('Select for non-blocking behavior'),
                                    type: 'checkbox',
                                },
                            })),
                        ],
                    }),
                    utils.create({
                        type: 'span',
                        text: _('s'),
                    }),
                ],
            })),
        ]);

        if (this.value.tone.duration < 0) this.nonblocking.checked = true;

        if (this.value.tone.frequency === 0) this.toneCommandSelect.value = 'toneoff';
        this._updateVisibility();

        for (const option of this.chord.children) {
            if (this.value.tone.frequency === parseInt(option.value)) {
                option.selected = true;
                break;
            }
        }
    }

    /**
     * Updates the visibility of the additions based on the current tone command.
     */
    _updateVisibility() {
        this.containerToneOn.classList.toggle(
            'hidden',
            !['toneon'].includes(this.toneCommandSelect.value)
        );
    }

    /**
     * Get the value of the tone events macro.
     * @returns {Object|false} An object representing the tone event value or `false` if no valid event is specified.
     */
    getValue() {
        const freq = parseInt(this.frequency.value);
        if (this.toneCommandSelect.value === 'toneon' && (!Number.isFinite(freq) || freq === 0)) {
            return false;
        }

        if (this.toneCommandSelect.value === 'toneoff') {
            return { tone: { frequency: 0 } };
        }

        let duration;
        if (this.nonblocking.checked) {
            duration = parseFloat(-Math.abs(this.duration.value));
        } else {
            duration = parseFloat(Math.abs(this.duration.value));
        }

        return {
            tone: {
                frequency: parseInt(this.frequency.value),
                duration: duration,
            },
        };
    }
}

/**
 * Represents a soundfile macro.
 * @class
 * @extends MacroBase
 */
class MacroAudioFile extends MacroBase {
    constructor(value = { file: '' }) {
        super();

        this.type = 'file';
        this.value = value.file;

        this._setContent();

        return this.DOM.container;
    }

    /**
     * Set the content for the soundfile macro.
     */
    _setContent() {
        utils.appendElements(this.DOM.content, [
            utils.create({
                type: 'span',
                text: `${_('Audio file')}`,
            }),
            (this.input = utils.create({
                type: 'input',
                attributes: {
                    title: _('Path to the .mp3 or .wav file'),
                    placeholder: 'audio/sound.mp3',
                    style: 'flex-grow:1;',
                    value: this.value,
                    list: 'audiofiles',
                },
            })),
            utils.create({
                type: 'datalist',
                attributes: {
                    id: 'audiofiles',
                },
                children: audioFiles.map((value) => {
                    return utils.create({
                        type: 'option',
                        attributes: {
                            value: value,
                        },
                    });
                }),
            }),
        ]);
    }

    /**
     * Get the value of the soundfile macro.
     * @returns {string|false} The soundfile path or `false` if the value is empty.
     */
    getValue() {
        return this.input.value === ''
            ? false
            : {
                  file: `${this.input.value}`,
              };
    }
}

/**
 * Represents a midi macro.
 * @class
 * @extends MacroBase
 */
class MacroMidi extends MacroBase {
    constructor(value = { midi: {} }) {
        super();

        this.type = 'midi';
        const defaultConfig = {
            ntson: '',
            vlcty: 127,
            durtn: 0,

            ntoff: '',

            ptchb: 'set',
            pbval: 8192,
            pbstp: 100,

            ctrch: undefined,
            ccval: undefined,

            prgch: undefined,
        };
        this.value = {
            midi: { ...defaultConfig, ...value.midi },
        };

        this.midiCommandsList = [
            [_('Note On'), 'ntson'],
            [_('Note Off'), 'ntoff'],
            [_('Pitch Bend'), 'ptchb'],
            [_('Control Change'), 'ctrch'],
            [_('Program Change'), 'prgch'],
        ];
        // Find and assign the matching MIDI command from the provided value
        this.midiCommand = Object.keys(value.midi).find((key) =>
            this.midiCommandsList.some(([_, cmd]) => cmd === key)
        );

        this.pitchBendCommandsList = [
            ['', ''],
            [_('Set'), 'set'],
            [_('Increase'), 'incr'],
            [_('Decrease'), 'decr'],
        ];

        this.selectWidth = 80;
        this.noteWidth = 100;
        this.int127Width = 42;
        this.noteOnDurationWidth = 45;
        this.pitchBendValueWidth = 60;

        this._setContent();

        return this.DOM.container;
    }

    /**
     * Set the content for the mouse events macro.
     */
    _setContent() {
        utils.appendElements(this.DOM.content, [
            (this.midiCommandSelect = utils.create({
                type: 'select',
                children: this.midiCommandsList.map((value) => {
                    return utils.create({
                        type: 'option',
                        text: value[0],
                        attributes: {
                            value: value[1],
                        },
                    });
                }),
                attributes: {
                    style: `width:${this.selectWidth}px;`,
                },
                events: {
                    change: (event) => {
                        this._updateVisibility();
                    },
                },
            })),
            (this.containerNoteOn = utils.create({
                attributes: {
                    class: 'macro-entry-content-flex-container gapped',
                },
                children: [
                    (this.noteOn = utils.create({
                        type: 'input',
                        attributes: {
                            type: 'text',
                            title: _('The Note as 0-127 or A4, G#2, ...'),
                            placeholder: 'e.g. A4,C5,60',
                            style: `width:${this.noteWidth}px;`,
                            value: this.value.midi.ntson,
                        },
                    })),
                    utils.create({
                        type: 'span',
                        text: `${_('Vel')}`,
                    }),
                    (this.noteOnVelocity = utils.create({
                        type: 'input',
                        attributes: {
                            type: 'number',
                            title: _('The strike velocity, 0-127, 0 is equivalent to a Note Off'),
                            style: `width:${this.int127Width}px;`,
                            value: this.value.midi.vlcty,
                            min: 0,
                            max: 127,
                        },
                        events: {
                            input: (event) => {
                                event.target.value = Math.max(0, Math.min(127, event.target.value));
                            },
                        },
                    })),
                    utils.create({
                        type: 'span',
                        text: _('for'),
                    }),
                    utils.create({
                        attributes: {
                            class: 'macro-entry-content-flex-container',
                        },
                        children: [
                            (this.noteOnDuration = utils.create({
                                type: 'input',
                                attributes: {
                                    type: 'number',
                                    title: _(
                                        'Duration of the tone in seconds. Set to 0 for continuous playback'
                                    ),
                                    style: `width:${this.noteOnDurationWidth}px;`,
                                    value: Math.abs(this.value.midi.durtn),
                                    min: 0,
                                    step: 0.1,
                                },
                            })),
                            (this.nonblocking = utils.create({
                                type: 'input',
                                attributes: {
                                    title: _('Select for non-blocking behavior'),
                                    type: 'checkbox',
                                },
                            })),
                        ],
                    }),
                    utils.create({
                        type: 'span',
                        text: _('s'),
                    }),
                ],
            })),
            (this.containerNoteOff = utils.create({
                attributes: {
                    class: 'macro-entry-content-flex-container gapped',
                },
                children: [
                    (this.noteOff = utils.create({
                        type: 'input',
                        attributes: {
                            type: 'text',
                            title: _('The Note as 0-127 or A4, G#2, ...'),
                            placeholder: 'e.g. A4,C5,60',
                            style: `width:${this.noteWidth}px;`,
                            value: this.value.midi.ntoff,
                        },
                    })),
                ],
            })),
            (this.containerPitchBend = utils.create({
                attributes: {
                    class: 'macro-entry-content-flex-container gapped',
                },
                children: [
                    (this.pitchBendCommand = utils.create({
                        type: 'select',
                        children: this.pitchBendCommandsList.map((value) => {
                            return utils.create({
                                type: 'option',
                                text: value[0],
                                attributes: {
                                    value: value[1],
                                },
                            });
                        }),
                        attributes: {
                            style: `width:${this.selectWidth}px;`,
                        },
                        events: {
                            change: (event) => {
                                this._updatePitchBendVisibility();
                            },
                        },
                    })),
                    (this.containerPitchBendValue = utils.create({
                        attributes: {
                            class: 'macro-entry-content-flex-container gapped',
                        },
                        children: [
                            utils.create({
                                type: 'span',
                                text: `${_('Value')}`,
                            }),
                            (this.pitchBendValue = utils.create({
                                type: 'input',
                                attributes: {
                                    type: 'number',
                                    title: _(
                                        'The degree of bend from 0 through 8192 (no bend) to 16383'
                                    ),
                                    style: `width:${this.pitchBendValueWidth}px;`,
                                    value: this.value.midi.pbval,
                                    min: 0,
                                    max: 16383,
                                },
                                events: {
                                    input: (event) => {
                                        event.target.value = Math.max(
                                            0,
                                            Math.min(16383, event.target.value)
                                        );
                                    },
                                },
                            })),
                        ],
                    })),
                    (this.containerPitchBendStep = utils.create({
                        attributes: {
                            class: 'macro-entry-content-flex-container gapped',
                        },
                        children: [
                            utils.create({
                                type: 'span',
                                text: `${_('Step')}`,
                            }),
                            (this.pitchBendStep = utils.create({
                                type: 'input',
                                attributes: {
                                    type: 'number',
                                    title: _(
                                        'The step size for increasing or decreasing the pitch bend'
                                    ),
                                    style: `width:${this.pitchBendValueWidth}px;`,
                                    value: this.value.midi.pbstp,
                                    min: 1,
                                    max: 16383,
                                },
                                events: {
                                    input: (event) => {
                                        event.target.value = Math.max(
                                            1,
                                            Math.min(16383, event.target.value)
                                        );
                                    },
                                },
                            })),
                        ],
                    })),
                    // (this.pitchBendValue = utils.create({
                    //     type: 'input',
                    //     attributes: {
                    //         type: 'range',
                    //         title: _('The degree of bend from 0 through 8192 (no bend) to 16383'),
                    //         value: this.value.midi.pbval,
                    //         min: 0,
                    //         max: 16383,
                    //         list: 'pitch-bend-values',
                    //     },
                    // })),
                    // utils.create({
                    //     type: 'datalist',
                    //     attributes: {
                    //         id: 'pitch-bend-values',
                    //     },
                    //     children: [
                    //         utils.create({
                    //             type: 'option',
                    //             attributes: {
                    //                 value: 8192,
                    //             },
                    //         }),
                    //     ],
                    // }),
                ],
            })),
            (this.containerControlChange = utils.create({
                attributes: {
                    class: 'macro-entry-content-flex-container gapped',
                },
                children: [
                    utils.create({
                        type: 'span',
                        text: ` ${_('Control')}`,
                    }),
                    (this.controlChangeControl = utils.create({
                        type: 'input',
                        attributes: {
                            type: 'number',
                            title: _('The control number, 0-127'),
                            style: `width:${this.int127Width}px;`,
                            min: 0,
                            max: 127,
                            value: this.value.midi.ctrch,
                        },
                        events: {
                            input: (event) => {
                                event.target.value = Math.max(0, Math.min(127, event.target.value));
                            },
                        },
                    })),
                    utils.create({
                        type: 'span',
                        text: ` ${_('Value')}`,
                    }),
                    (this.controlChangeValue = utils.create({
                        type: 'input',
                        attributes: {
                            type: 'number',
                            title: _('The 7bit value of the control, 0-127'),
                            style: `width:${this.int127Width}px;`,
                            min: 0,
                            max: 127,
                            value: this.value.midi.ccval,
                        },
                        events: {
                            input: (event) => {
                                event.target.value = Math.max(0, Math.min(127, event.target.value));
                            },
                        },
                    })),
                ],
            })),
            (this.containerProgrammChange = utils.create({
                attributes: {
                    class: 'macro-entry-content-flex-container gapped',
                },
                children: [
                    utils.create({
                        type: 'span',
                        text: `${_('Program')}`,
                    }),
                    (this.programmChangeProgramm = utils.create({
                        type: 'input',
                        attributes: {
                            type: 'number',
                            title: _('The new program number to use, 0-127'),
                            style: `width:${this.int127Width}px;`,
                            min: 0,
                            max: 127,
                            value: this.value.midi.prgch,
                        },
                        events: {
                            input: (event) => {
                                event.target.value = Math.max(0, Math.min(127, event.target.value));
                            },
                        },
                    })),
                ],
            })),
        ]);

        if (this.value.midi.durtn < 0) this.nonblocking.checked = true;

        if (this.midiCommand) this.midiCommandSelect.value = this.midiCommand;
        this._updateVisibility();

        if (this.midiCommand === 'ptchb') this.pitchBendCommand.value = this.value.midi.ptchb;
        this._updatePitchBendVisibility();
    }

    /**
     * Updates the visibility of the additions based on the current midi command.
     */
    _updateVisibility() {
        this.containerNoteOn.classList.toggle(
            'hidden',
            !['ntson'].includes(this.midiCommandSelect.value)
        );
        this.containerNoteOff.classList.toggle(
            'hidden',
            !['ntoff'].includes(this.midiCommandSelect.value)
        );
        this.containerPitchBend.classList.toggle(
            'hidden',
            !['ptchb'].includes(this.midiCommandSelect.value)
        );
        this.containerControlChange.classList.toggle(
            'hidden',
            !['ctrch'].includes(this.midiCommandSelect.value)
        );
        this.containerProgrammChange.classList.toggle(
            'hidden',
            !['prgch'].includes(this.midiCommandSelect.value)
        );
    }

    /**
     * Updates the visibility of the pitch bend additions based on the current pitch bend command.
     */
    _updatePitchBendVisibility() {
        this.containerPitchBendValue.classList.toggle(
            'hidden',
            !['set'].includes(this.pitchBendCommand.value)
        );
        this.containerPitchBendStep.classList.toggle(
            'hidden',
            !['incr', 'decr'].includes(this.pitchBendCommand.value)
        );
    }

    /**
     * Formats the input string by normalizing, trimming, removing empty entries.
     * @param {string} input - The input string to format.
     * @returns {string} The formatted and cleaned string.
     */
    _formateInput(input) {
        return input
            .replace(/\s+/g, '') // Remove whitespace
            .toUpperCase() // Convert to uppercase
            .split(',') // Split by comma
            .filter(Boolean) // Remove empty entries
            .join(','); // Join with commas
    }

    /**
     * Get the value of the midi events macro.
     * @returns {Object|false} An object representing the midi event value or `false` if no valid event is specified.
     */
    getValue() {
        switch (this.midiCommandSelect.value) {
            case 'ntson':
                // Handle Note On command
                if (!this.noteOn.value) return false;

                let duration;
                if (this.nonblocking.checked) {
                    duration = parseFloat(-Math.abs(this.noteOnDuration.value));
                } else {
                    duration = parseFloat(Math.abs(this.noteOnDuration.value));
                }

                return {
                    midi: {
                        ntson: this._formateInput(this.noteOn.value),
                        vlcty: parseInt(this.noteOnVelocity.value),
                        durtn: duration,
                    },
                };
            case 'ntoff':
                // Handle Note Off command
                if (!this.noteOff.value) return false;
                return {
                    midi: {
                        ntoff: this._formateInput(this.noteOff.value),
                    },
                };
            case 'ptchb':
                // Handle Pitch Bend command
                if (!this.pitchBendCommand.value) return false;
                const ret = {
                    midi: {
                        ptchb: this.pitchBendCommand.value,
                    },
                };
                if (['set'].includes(this.pitchBendCommand.value)) {
                    if (!this.pitchBendValue.value) return false;
                    ret.midi.pbval = parseInt(this.pitchBendValue.value);
                }
                if (['incr', 'decr'].includes(this.pitchBendCommand.value)) {
                    if (!this.pitchBendStep.value) return false;
                    ret.midi.pbstp = parseInt(this.pitchBendStep.value);
                }
                return ret;
            case 'ctrch':
                // Handle Control Change command
                if (!this.controlChangeControl.value || !this.controlChangeValue.value)
                    return false;
                return {
                    midi: {
                        ctrch: parseInt(this.controlChangeControl.value),
                        ccval: parseInt(this.controlChangeValue.value),
                    },
                };
            case 'prgch':
                // Handle Program Change command
                if (!this.programmChangeProgramm.value) return false;
                return {
                    midi: {
                        prgch: parseInt(this.programmChangeProgramm.value),
                    },
                };
            default:
                return false;
        }
    }
}

/**
 * Represents a mouse events macro.
 * @class
 * @extends MacroBase
 */
class MacroMouseEvents extends MacroBase {
    constructor(value = { mse: {} }) {
        super();

        this.type = 'mse';
        const defaultMouseEvent = { x: 0, y: 0, w: 0, b: '' };
        this.value = {
            mse: { ...defaultMouseEvent, ...value.mse },
        };

        this.numberInputWidth = 46;
        this.buttonInputWidth = 80;

        this.autocompleteList = ['', 'LEFT', 'MIDDLE', 'RIGHT'];

        this._setContent();

        return this.DOM.container;
    }

    /**
     * Set the content for the mouse events macro.
     */
    _setContent() {
        utils.appendElements(this.DOM.content, [
            utils.create({
                type: 'span',
                text: `${_('X')}`,
            }),
            (this.x = utils.create({
                type: 'input',
                attributes: {
                    type: 'number',
                    title: _('Horizontally Mouse movement (e.g. 10 | -10)'),
                    style: `width:${this.numberInputWidth}px;`,
                    value: this.value.mse.x,
                },
            })),
            utils.create({
                type: 'span',
                text: `${_('Y')}`,
            }),
            (this.y = utils.create({
                type: 'input',
                attributes: {
                    type: 'number',
                    title: _('Vertically Mouse movement (e.g. 10 | -10)'),
                    style: `width:${this.numberInputWidth}px;`,
                    value: this.value.mse.y,
                },
            })),
            utils.create({
                type: 'span',
                text: `${_('Wheel')}`,
            }),
            (this.w = utils.create({
                type: 'input',
                attributes: {
                    type: 'number',
                    title: _('Mousewheel movement (e.g. 1 | -1)'),
                    style: `width:${this.numberInputWidth}px;`,
                    value: this.value.mse.w,
                },
            })),
            utils.create({
                type: 'span',
                text: `${_('Button')}`,
            }),
            (this.b = utils.create({
                type: 'select',
                attributes: {
                    title: _('Mouse Button'),
                    list: 'mouse-button-events',
                    style: `width:${this.buttonInputWidth}px;`,
                    value: this.value.mse.b,
                },
                children: this.autocompleteList.map((value) => {
                    return utils.create({
                        type: 'option',
                        text: value,
                        attributes: {
                            value: value,
                        },
                    });
                }),
            })),
        ]);

        for (const option of this.b.children) {
            if (this.value.mse.b === option.value) {
                option.selected = true;
                break;
            }
        }
    }

    /**
     * Get the value of the mouse events macro.
     * @returns {Object|false} An object representing the mouse event value or `false` if no valid event is specified.
     */
    getValue() {
        const fields = [this.x.value, this.y.value, this.w.value, this.b.value];
        if (fields.every((value) => value === '0' || value === '')) return false;

        const values = {};
        ['x', 'y', 'w'].forEach((field) => {
            if (this[field].value && this[field].value !== '0') {
                values[field] = parseInt(this[field].value);
            }
        });
        if (this.b.value) values.b = this.b.value;

        return { mse: values };
    }
}

/**
 * Represents a system functions macro.
 * @class
 * @extends MacroBase
 */
class MacroSystemFunctions extends MacroBase {
    constructor(value = { sys: '' }) {
        super();

        this.type = 'sys';
        this.value = value;
        this.inputWidth = 170;

        this.autocompleteList = [
            '',
            'soft_reset',
            'hard_reset',
            'enable_usb',
            'close_group',
            'go_to_root',
            'increase_brightness',
            'decrease_brightness',
        ];

        this._setContent();

        return this.DOM.container;
    }

    /**
     * Set the content for the system functions macro.
     */
    _setContent() {
        utils.appendElements(this.DOM.content, [
            utils.create({
                type: 'span',
                text: `${_('Device Function')}`,
            }),
            (this.input = utils.create({
                type: 'select',
                attributes: {
                    list: 'system-functions',
                    style: `width:${this.inputWidth}px; flex-grow:1;`,
                    value: this.value.sys,
                },
                children: this.autocompleteList.map((value) => {
                    return utils.create({
                        type: 'option',
                        text: value,
                        attributes: {
                            value: value,
                        },
                    });
                }),
            })),
        ]);

        for (const option of this.input.children) {
            if (this.value.sys === option.value) {
                option.selected = true;
                break;
            }
        }
    }

    /**
     * Get the value of the system functions macro.
     * @returns {Object|false} An object representing the system function value or `false` if no valid function is specified.
     */
    getValue() {
        return this.input.value === '' ? false : { sys: this.input.value };
    }
}

/**
 * Get a macro instance by type.
 * @param {string} type - The type of the macro.
 * @returns {MacroBase} A new instance of the specified macro type.
 */
export function getMacroByType(type) {
    switch (type) {
        case 'selector':
            return new MacroSelector();
        case 'wait':
            return new MacroWait();
        case 'string':
            return new MacroString();
        case 'kc':
            return new MacroKeycodes();
        case 'ccc':
            return new MacroConsumerControlCodes();
        case 'tone':
            return new MacroTone();
        case 'file':
            return new MacroAudioFile();
        case 'midi':
            return new MacroMidi();
        case 'mse':
            return new MacroMouseEvents();
        case 'sys':
            return new MacroSystemFunctions();
        default:
            return new MacroBase().DOM.container;
    }
}

/**
 * Get a macro instance based on its value.
 * @param {any} value - The value of the macro.
 * @returns {MacroBase} A new instance of the appropriate macro type based on the value.
 */
export function getMacroByValue(value) {
    switch (typeof value) {
        case 'number':
            return new MacroWait(value);
        case 'string':
            return new MacroString(value);
        case 'object':
            switch (true) {
                case value.hasOwnProperty('kc'):
                    return new MacroKeycodes(value);
                case value.hasOwnProperty('ccc'):
                    return new MacroConsumerControlCodes(value);
                case value.hasOwnProperty('tone'):
                    return new MacroTone(value);
                case value.hasOwnProperty('file'):
                    return new MacroAudioFile(value);
                case value.hasOwnProperty('midi'):
                    return new MacroMidi(value);
                case value.hasOwnProperty('mse'):
                    return new MacroMouseEvents(value);
                case value.hasOwnProperty('sys'):
                    return new MacroSystemFunctions(value);
            }
        default:
            return new MacroSelector();
    }
}

/**
 * Sets the audioFiles array to a new list of audio files for the audio file macro.
 * @param {Array} newAudioFiles - An array of new audio file paths.
 */
let audioFiles = [];
export function setAudioFiles(newAudioFiles) {
    audioFiles = newAudioFiles;
}
