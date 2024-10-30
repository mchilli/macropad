'use strict';

import * as utils from '../utils.js';

/**
 * Base class for creating macros.
 * @class
 */
class MacroBase {
    constructor() {
        this.DOM = this._initDOM();
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
        const entry = getMacroByValue(this.getValue());
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
                        text: _('Soundfile'),
                        attributes: {
                            value: 'file',
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

        this.value = value;
        this.inputWidth = 40;

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
                text: _('Wait').concat(':'),
            }),
            (this.input = utils.create({
                type: 'input',
                attributes: {
                    title: _('Attention, it blocks the device for given seconds!'),
                    style: `width:${this.inputWidth}px;`,
                    type: 'number',
                    value: this.value,
                    min: 0,
                    step: 0.1,
                },
            })),
            utils.create({
                type: 'span',
                text: _('seconds'),
            }),
        ]);
    }

    /**
     * Get the value of the wait macro.
     * @returns {number|false} The wait time in seconds or `false` if the value is 0.
     */
    getValue() {
        return this.input.value === '0' ? false : parseFloat(Math.abs(this.input.value));
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

        this.value = value;
        this.inputWidth = 270;

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
                text: _('String Input').concat(':'),
            }),
            (this.input = utils.create({
                type: 'input',
                attributes: {
                    style: `width:${this.inputWidth}px;`,
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
    constructor(value = { kc: '' }) {
        super();

        this.value = value;
        this.inputWidth = 180;
        this.uniqueId = utils.uniqueId();

        this.autocompleteList = [
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
            (this.press = utils.create({
                type: 'input',
                attributes: {
                    type: 'radio',
                    name: this.uniqueId,
                    checked: true,
                },
            })),
            utils.create({
                type: 'span',
                text: _('Press'),
            }),
            (this.release = utils.create({
                type: 'input',
                attributes: {
                    type: 'radio',
                    name: this.uniqueId,
                },
            })),
            utils.create({
                type: 'span',
                text: _('Release').concat(':'),
            }),
            (this.input = utils.create({
                type: 'input',
                attributes: {
                    list: 'keycodes',
                    style: `width:${this.inputWidth}px;`,
                    value:
                        this.value.kc.slice(0, 1) === '-' ? this.value.kc.slice(1) : this.value.kc,
                },
            })),
            utils.create({
                type: 'datalist',
                attributes: {
                    id: 'keycodes',
                },
                children: this.autocompleteList.map((value) => {
                    return utils.create({
                        type: 'option',
                        attributes: {
                            value: value,
                        },
                    });
                }),
            }),
        ]);

        this.release.checked = this.value.kc.slice(0, 1) === '-';
    }

    /**
     * Get the value of the keycodes macro.
     * @returns {Object|false} An object representing the keycode value or `false` if no valid keycode is selected.
     */
    getValue() {
        return this.input.value === ''
            ? false
            : { kc: `${this.release.checked ? '-' : ''}${this.input.value}` };
    }

    /**
     * Generates a unique ID for radio buttons in the keycodes macro.
     */
    _makeUnique() {
        this.uniqueId = utils.uniqueId();
        this.press.name = this.uniqueId;
        this.release.name = this.uniqueId;
    }
}

/**
 * Represents a consumer control codes macro.
 * @class
 * @extends MacroBase
 */
class MacroConsumerControlCodes extends MacroBase {
    constructor(value = { ccc: '' }) {
        super();

        this.value = value;
        this.inputWidth = 200;

        this.autocompleteList = [
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
            utils.create({
                type: 'span',
                text: _('Consumer Control Code').concat(':'),
            }),
            (this.input = utils.create({
                type: 'select',
                attributes: {
                    list: 'consumer-control-codes',
                    style: `width:${this.inputWidth}px;`,
                    value: this.value.ccc,
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
        return this.input.value === '' ? false : { ccc: this.input.value };
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

        const defaultTone = { frequency: 0, duration: 0 };
        this.value = {
            tone: { ...defaultTone, ...value.tone },
        };

        this.inputWidth = 46;
        this.frequencyinputWidth = 58;

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
            utils.create({
                type: 'span',
                text: _('Play').concat(':'),
            }),
            (this.chord = utils.create({
                type: 'select',
                attributes: {
                    type: 'select',
                    title: _('Chord of the tone'),
                    style: `width:${this.inputWidth}px;`,
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
                        this.frequency.value = this.chord.value;
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
                    style: `width:${this.frequencyinputWidth}px;`,
                    value: this.value.tone.frequency,
                    min: 0,
                },
                events: {
                    input: (event) => {
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
                text: _('Hz for').concat(' '),
            }),
            (this.duration = utils.create({
                type: 'input',
                attributes: {
                    type: 'number',
                    title: _('Duration of the tone in seconds'),
                    style: `width:${this.inputWidth}px;`,
                    value: this.value.tone.duration,
                    min: 0,
                    step: 0.1,
                },
            })),
            utils.create({
                type: 'span',
                text: _('seconds'),
            }),
        ]);

        for (const option of this.chord.children) {
            if (this.value.tone.frequency === parseInt(option.value)) {
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
        return this.duration.value === '0'
            ? false
            : {
                  tone: {
                      frequency: parseInt(this.frequency.value),
                      duration: parseFloat(this.duration.value),
                  },
              };
    }
}

/**
 * Represents a soundfile macro.
 * @class
 * @extends MacroBase
 */
class MacroSoundfile extends MacroBase {
    constructor(value = { file: '' }) {
        super();

        this.value = value.file;
        this.inputWidth = 270;

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
                text: _('Soundfile').concat(':'),
            }),
            (this.input = utils.create({
                type: 'input',
                attributes: {
                    title: _('Path to the .mp3 or .wav file'),
                    placeholder: 'audio/sound.mp3',
                    style: `width:${this.inputWidth}px;`,
                    value: this.value,
                },
            }))
        ]);
    }

    /**
     * Get the value of the soundfile macro.
     * @returns {string|false} The soundfile path or `false` if the value is empty.
     */
    getValue() {
        return this.input.value === '' ? false : {
            file: `${this.input.value}`
        };
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
                text: _('X').concat(':'),
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
                text: _('Y').concat(':'),
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
                text: _('Whl').concat(':'),
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
                text: _('Btn').concat(':'),
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
        return ['0', ''].includes(this.x.value) &&
            ['0', ''].includes(this.y.value) &&
            ['0', ''].includes(this.w.value) &&
            this.b.value === ''
            ? false
            : {
                  mse: {
                      x: parseInt(this.x.value),
                      y: parseInt(this.y.value),
                      w: parseInt(this.w.value),
                      b: this.b.value,
                  },
              };
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

        this.value = value;
        this.inputWidth = 170;

        this.autocompleteList = [
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
                text: _('Device Function').concat(':'),
            }),
            (this.input = utils.create({
                type: 'select',
                attributes: {
                    list: 'system-functions',
                    style: `width:${this.inputWidth}px;`,
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
            return new MacroSoundfile();
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
                    return new MacroSoundfile(value);
                case value.hasOwnProperty('mse'):
                    return new MacroMouseEvents(value);
                case value.hasOwnProperty('sys'):
                    return new MacroSystemFunctions(value);
            }
        default:
            return new MacroBase().DOM.container;
    }
}
