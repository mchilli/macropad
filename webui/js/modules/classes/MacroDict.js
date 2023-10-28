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
                        title: 'Move',
                        class: 'macro-entry-handle fa-solid fa-bars',
                    },
                }),
            ],
        });

        DOM.container.instance = this;

        return DOM;
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
    addAdditionalControls() {
        utils.appendElements(this.DOM.container, [
            utils.create({
                type: 'i',
                attributes: {
                    title: 'Delete',
                    class: 'macro-entry-additionals fa-solid fa-trash',
                },
                events: {
                    click: () => this._removeDOM(),
                },
            }),
        ]);
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

        this._extendDOM();

        return this.DOM.container;
    }

    /**
     * Extends the DOM elements for the selector macro.
     */
    _extendDOM() {
        utils.appendElements(this.DOM.container, [
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
                        text: 'Select a macro type',
                        attributes: {
                            disabled: true,
                            selected: true,
                            style: 'display: none;',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: 'Wait',
                        attributes: {
                            value: 'wait',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: 'String',
                        attributes: {
                            value: 'string',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: 'Keycode',
                        attributes: {
                            value: 'kc',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: 'Consumer Control Code',
                        attributes: {
                            value: 'ccc',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: 'Mouse Event',
                        attributes: {
                            value: 'mse',
                        },
                    }),
                    utils.create({
                        type: 'option',
                        text: 'Device Function',
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
        entry.instance.addAdditionalControls();
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

        this._extendDOM();

        return this.DOM.container;
    }

    /**
     * Extends the DOM elements for the wait macro.
     */
    _extendDOM() {
        utils.appendElements(this.DOM.container, [
            utils.create({
                type: 'span',
                text: 'Wait:',
            }),
            (this.input = utils.create({
                type: 'input',
                attributes: {
                    title: 'Attention, it blocks the device for given seconds!',
                    style: `width:${this.inputWidth}px;`,
                    type: 'number',
                    value: this.value,
                    min: 0,
                    step: 0.1,
                },
            })),
            utils.create({
                type: 'span',
                text: 'seconds',
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

        this._extendDOM();

        return this.DOM.container;
    }

    /**
     * Extends the DOM elements for the string macro.
     */
    _extendDOM() {
        utils.appendElements(this.DOM.container, [
            utils.create({
                type: 'span',
                text: 'String Input:',
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

        this._extendDOM();

        return this.DOM.container;
    }

    /**
     * Extends the DOM elements for the keycodes macro.
     */
    _extendDOM() {
        utils.appendElements(this.DOM.container, [
            (this.press = utils.create({
                type: 'input',
                attributes: {
                    title: 'press',
                    type: 'radio',
                    name: this.uniqueId,
                    checked: true,
                },
            })),
            utils.create({
                type: 'span',
                text: 'Press',
            }),
            (this.release = utils.create({
                type: 'input',
                attributes: {
                    title: 'release',
                    type: 'radio',
                    name: this.uniqueId,
                },
            })),
            utils.create({
                type: 'span',
                text: 'Release:',
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

        this._extendDOM();

        return this.DOM.container;
    }

    /**
     * Extends the DOM elements for the consumer control codes macro.
     */
    _extendDOM() {
        utils.appendElements(this.DOM.container, [
            utils.create({
                type: 'span',
                text: 'Consumer Control Code:',
            }),
            (this.input = utils.create({
                type: 'input',
                attributes: {
                    list: 'consumer-control-codes',
                    style: `width:${this.inputWidth}px;`,
                    value: this.value.ccc,
                },
            })),
            utils.create({
                type: 'datalist',
                attributes: {
                    id: 'consumer-control-codes',
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

        this.autocompleteList = ['LEFT', 'MIDDLE', 'RIGHT'];

        this._extendDOM();

        return this.DOM.container;
    }

    /**
     * Extends the DOM elements for the mouse events macro.
     */
    _extendDOM() {
        utils.appendElements(this.DOM.container, [
            utils.create({
                type: 'span',
                text: 'X:',
            }),
            (this.x = utils.create({
                type: 'input',
                attributes: {
                    type: 'number',
                    title: 'Horizontally Mouse movement (e.g. 10 | -10)',
                    style: `width:${this.numberInputWidth}px;`,
                    value: this.value.mse.x,
                },
            })),
            utils.create({
                type: 'span',
                text: 'Y:',
            }),
            (this.y = utils.create({
                type: 'input',
                attributes: {
                    type: 'number',
                    title: 'Vertically Mouse movement (e.g. 10 | -10)',
                    style: `width:${this.numberInputWidth}px;`,
                    value: this.value.mse.y,
                },
            })),
            utils.create({
                type: 'span',
                text: 'Whl:',
            }),
            (this.w = utils.create({
                type: 'input',
                attributes: {
                    type: 'number',
                    title: 'Mousewheel movement (e.g. 1 | -1)',
                    style: `width:${this.numberInputWidth}px;`,
                    value: this.value.mse.w,
                },
            })),
            utils.create({
                type: 'span',
                text: 'Btn:',
            }),
            (this.b = utils.create({
                type: 'input',
                attributes: {
                    title: 'Mouse Button',
                    list: 'mouse-button-events',
                    style: `width:${this.buttonInputWidth}px;`,
                    value: this.value.mse.b,
                },
            })),
            utils.create({
                type: 'datalist',
                attributes: {
                    id: 'mouse-button-events',
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

        this._extendDOM();

        return this.DOM.container;
    }

    /**
     * Extends the DOM elements for the system functions macro.
     */
    _extendDOM() {
        utils.appendElements(this.DOM.container, [
            utils.create({
                type: 'span',
                text: 'Device Function:',
            }),
            (this.input = utils.create({
                type: 'input',
                attributes: {
                    list: 'system-functions',
                    style: `width:${this.inputWidth}px;`,
                    value: this.value.sys,
                },
            })),
            utils.create({
                type: 'datalist',
                attributes: {
                    id: 'system-functions',
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
                case value.hasOwnProperty('mse'):
                    return new MacroMouseEvents(value);
                case value.hasOwnProperty('sys'):
                    return new MacroSystemFunctions(value);
            }
        default:
            return new MacroBase().DOM.container;
    }
}
