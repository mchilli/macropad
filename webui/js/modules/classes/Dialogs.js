'use strict';

import Sortable from './Sortable.js';

import { getMacroByValue, getMacroByType } from './MacroDict.js';

import * as utils from '../utils.js';

class BaseDialog {
    /**
     * Removes the Notification's DOM element by fading it out and then removing it from its parent.
     */
    removeDOM() {
        this.DOM.container.style.opacity = 0;

        setTimeout(() => {
            this.DOM.container.parentNode.removeChild(this.DOM.container);
        }, this.fadeOutTime);
    }
}

/**
 * Represents a dialog for editing key settings.
 * @class
 */
export class EditDialog extends BaseDialog {
    /**
     * Initializes a new instance of the EditDialog class.
     * @constructor
     * @param {Object} options - The options for configuring the dialog.
     * @param {Object} options.keyInstance - The key instance to be edited.
     * @param {Function} options.onButtonPressed - The callback function for button presses.
     * @returns {HTMLElement} - The container DOM element for the dialog.
     */
    constructor({ keyInstance = null, onButtonPressed = () => {} } = {}) {
        super();
        this.keyInstance = keyInstance;
        this.onButtonPressed = onButtonPressed;

        this.fadeOutTime = 250;

        this.DOM = this._initDOM();
        this._setValues();

        return this.DOM.container;
    }

    /**
     * Initializes the DOM structure for the dialog.
     * @returns {Object} - An object containing the DOM elements.
     */
    _initDOM() {
        let DOM = {
            encoder: {},
        };

        DOM.container = utils.create({
            attributes: {
                class: 'dialog-container',
                style: `transition: opacity ${this.fadeOutTime / 1000}s ease`,
            },
            children: [
                (DOM.dialog = utils.create({
                    attributes: {
                        class: `dialog ${this.keyInstance.type}`,
                    },
                    children: [
                        (DOM.header = utils.create({
                            text: this.keyInstance.label,
                            attributes: {
                                class: 'dialog-header',
                            },
                            events: {
                                mousedown: this._onDragDialog.bind(this),
                            },
                        })),
                        utils.create({
                            attributes: {
                                class: 'dialog-inputs',
                            },
                            children: [
                                utils.create({
                                    type: 'span',
                                    text: 'Type: ',
                                    attributes: {
                                        class: 'dialog-type',
                                    },
                                }),
                                (DOM.type = utils.create({
                                    type: 'select',
                                    attributes: {
                                        class: 'dialog-type dialog-type-input',
                                    },
                                    children: [
                                        utils.create({
                                            type: 'option',
                                            text: 'Blank',
                                            attributes: {
                                                value: 'blank',
                                            },
                                        }),
                                        utils.create({
                                            type: 'option',
                                            text: 'Macro',
                                            attributes: {
                                                value: 'macro',
                                            },
                                        }),
                                        utils.create({
                                            type: 'option',
                                            text: 'Group',
                                            attributes: {
                                                value: 'group',
                                            },
                                        }),
                                    ],
                                    events: {
                                        change: () => this._onChangeType(),
                                    },
                                })),
                                utils.create({
                                    type: 'span',
                                    text: 'Label: ',
                                    attributes: {
                                        class: 'dialog-label',
                                    },
                                }),
                                (DOM.label = utils.create({
                                    type: 'input',
                                    attributes: {
                                        class: 'dialog-label dialog-label-input',
                                        title: 'The label cannot be longer than 6 characters',
                                        maxlength: 6,
                                    },
                                    events: {
                                        input: this._onLabelInput.bind(this),
                                    },
                                })),
                                utils.create({
                                    type: 'span',
                                    text: 'LED Color: ',
                                    attributes: {
                                        class: 'dialog-color',
                                    },
                                }),
                                (DOM.color = utils.create({
                                    type: 'input',
                                    attributes: {
                                        type: 'color',
                                        class: 'dialog-color',
                                    },
                                })),
                                utils.create({
                                    type: 'span',
                                    text: 'Content: ',
                                    attributes: {
                                        class: 'dialog-content',
                                    },
                                }),
                                utils.create({
                                    attributes: {
                                        class: 'dialog-macros dialog-content',
                                    },
                                    children: [
                                        (DOM.content = utils.create({
                                            type: 'div',
                                            attributes: {
                                                class: 'dialog-content dialog-sortable',
                                            },
                                        })),
                                        utils.create({
                                            type: 'i',
                                            attributes: {
                                                class: 'dialog-button add fa-solid fa-plus',
                                            },
                                            events: {
                                                click: () => this._appendMacroSelector(DOM.content),
                                            },
                                        }),
                                    ],
                                }),
                                utils.create({
                                    type: 'details',
                                    attributes: {
                                        class: 'dialog-encoder',
                                        open: true,
                                    },
                                    children: [
                                        utils.create({
                                            type: 'summary',
                                            text: 'Encoder switch: ',
                                        }),
                                        utils.create({
                                            attributes: {
                                                class: 'dialog-macros',
                                            },
                                            children: [
                                                (DOM.encoder.switch = utils.create({
                                                    type: 'div',
                                                    attributes: {
                                                        class: 'dialog-sortable',
                                                    },
                                                })),
                                                utils.create({
                                                    type: 'i',
                                                    attributes: {
                                                        class: 'dialog-button add fa-solid fa-plus',
                                                    },
                                                    events: {
                                                        click: () =>
                                                            this._appendMacroSelector(
                                                                DOM.encoder.switch
                                                            ),
                                                    },
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                                utils.create({
                                    type: 'details',
                                    attributes: {
                                        class: 'dialog-encoder',
                                        open: true,
                                    },
                                    children: [
                                        utils.create({
                                            type: 'summary',
                                            text: 'Encoder increase: ',
                                        }),
                                        utils.create({
                                            attributes: {
                                                class: 'dialog-macros',
                                            },
                                            children: [
                                                (DOM.encoder.increased = utils.create({
                                                    type: 'div',
                                                    attributes: {
                                                        class: 'dialog-sortable',
                                                    },
                                                })),
                                                utils.create({
                                                    type: 'i',
                                                    attributes: {
                                                        class: 'dialog-button add fa-solid fa-plus',
                                                    },
                                                    events: {
                                                        click: () =>
                                                            this._appendMacroSelector(
                                                                DOM.encoder.increased
                                                            ),
                                                    },
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                                utils.create({
                                    type: 'details',
                                    attributes: {
                                        class: 'dialog-encoder',
                                        open: true,
                                    },
                                    children: [
                                        utils.create({
                                            type: 'summary',
                                            text: 'Encoder decrease: ',
                                        }),
                                        utils.create({
                                            attributes: {
                                                class: 'dialog-macros',
                                            },
                                            children: [
                                                (DOM.encoder.decreased = utils.create({
                                                    type: 'div',
                                                    attributes: {
                                                        class: 'dialog-sortable',
                                                    },
                                                })),
                                                utils.create({
                                                    type: 'i',
                                                    attributes: {
                                                        class: 'dialog-button add fa-solid fa-plus',
                                                    },
                                                    events: {
                                                        click: () =>
                                                            this._appendMacroSelector(
                                                                DOM.encoder.decreased
                                                            ),
                                                    },
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        utils.create({
                            attributes: {
                                class: 'dialog-button close',
                            },
                            children: [
                                utils.create({
                                    type: 'i',
                                    attributes: {
                                        class: 'fa-solid fa-xmark',
                                    },
                                }),
                            ],
                            events: {
                                click: () =>
                                    this.onButtonPressed({
                                        dialogInstance: this,
                                        command: 'close',
                                    }),
                            },
                        }),
                        utils.create({
                            attributes: {
                                class: 'dialog-button ok',
                            },
                            children: [
                                utils.create({
                                    type: 'i',
                                    attributes: {
                                        class: 'fa-solid fa-check',
                                    },
                                }),
                            ],
                            events: {
                                click: () =>
                                    this.onButtonPressed({
                                        dialogInstance: this,
                                        keyInstance: this.keyInstance,
                                        command: 'ok',
                                    }),
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
     * Drags a dialog element based on mouse movements.
     * @param {MouseEvent} event - The mouse event that triggered the drag.
     */
    _onDragDialog(event) {
        event.preventDefault();

        let pos1 = 0;
        let pos2 = 0;
        let pos3 = event.clientX;
        let pos4 = event.clientY;

        document.onmouseup = () => _endDragDialog();
        document.onmousemove = (e) => _dragDialog(e);

        const _dragDialog = (event) => {
            event.preventDefault();

            pos1 = pos3 - event.clientX;
            pos2 = pos4 - event.clientY;
            pos3 = event.clientX;
            pos4 = event.clientY;

            const offsetTop = Math.max(this.DOM.dialog.offsetTop - pos2, 0);
            const offsetLeft = Math.max(
                Math.min(
                    this.DOM.dialog.offsetLeft - pos1,
                    window.innerWidth - this.DOM.dialog.offsetWidth
                ),
                0
            );

            utils.style(this.DOM.dialog, {
                top: `${offsetTop}px`,
                left: `${offsetLeft}px`,
            });
        };

        const _endDragDialog = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };
    }

    /**
     * Updates the header text with the label input value.
     * @param {Event} event - The input event triggering this function.
     */
    _onLabelInput(event) {
        this.DOM.header.innerText = this.DOM.label.value;
    }

    /**
     * Handles the change event of the dialog type select input.
     * Updates the dialog's visual style based on the selected type.
     */
    _onChangeType() {
        const type = this.DOM.type.value;

        this.DOM.dialog.classList.remove('blank', 'macro', 'group');
        this.DOM.dialog.classList.add(type);
    }

    /**
     * Initializes a sortable macro list for a given container.
     * @param {HTMLElement} container - The container element for the macro list.
     * @param {string} group - The grouping identifier for the Sortable instance.
     */
    _initSortableMacroLists(container, group) {
        new Sortable(container, {
            group: group,
            handle: '.macro-entry-handle',
            animation: 150,
        });
    }

    /**
     * Appends a macro selector to the specified container.
     * @param {HTMLElement} container - The container element to which the macro selector will be added.
     */
    _appendMacroSelector(container) {
        const entry = getMacroByType('selector');
        entry.instance.addAdditionalControls();

        utils.appendElements(container, [entry]);
    }

    /**
     * Appends multiple macros to the specified container based on their values.
     * @param {HTMLElement} container - The container element to which macros will be added.
     * @param {Array<string>} content - An array of macro values to append.
     */
    _appendMultipleMacros(container, content) {
        const entries = content.map((value) => {
            const entry = getMacroByValue(value);
            entry.instance.addAdditionalControls();
            return entry;
        });
        utils.appendElements(container, entries);
    }

    /**
     * Sets the initial values and configuration of the dialog.
     */
    _setValues() {
        const key = this.keyInstance;
        const DOM = this.DOM;

        for (const option of DOM.type.children) {
            if (key.type === option.value) {
                option.selected = true;
                break;
            }
        }
        DOM.label.value = key.label;
        DOM.color.value = utils.rgbToHex(key.color);

        this._initSortableMacroLists(DOM.content, 'content');
        this._initSortableMacroLists(DOM.encoder.switch, 'encoder');
        this._initSortableMacroLists(DOM.encoder.decreased, 'encoder');
        this._initSortableMacroLists(DOM.encoder.increased, 'encoder');

        switch (key.type) {
            case 'macro':
                this._appendMultipleMacros(DOM.content, key.content);
                break;
            case 'group':
                this._appendMultipleMacros(DOM.encoder.switch, key.encoder.switch);
                this._appendMultipleMacros(DOM.encoder.decreased, key.encoder.decreased);
                this._appendMultipleMacros(DOM.encoder.increased, key.encoder.increased);
                break;

            default:
                break;
        }
    }
}

/**
 * Represents a notification.
 * @class
 */
export class NotificationDialog extends BaseDialog {
    /**
     * Initializes a new instance of the NotificationDialog class.
     * @constructor
     * @param {Object} options - The options for configuring the dialog.
     * @param {HTMLElement} [options.parent=document.body] - The parent element to which the Notification will be appended.
     * @param {string} [options.message=''] - The message to be displayed in the Notification.
     * @param {number} [options.timeout=1000] - The duration (in milliseconds) for which the Notification will be displayed before automatically fading out.
     * @param {boolean} [options.permanent=false] - Whether the Notification should remain visible until manually closed.
     */
    constructor({ parent = document.body, message = '', timeout = 2000, permanent = false } = {}) {
        super();
        this.parent = parent;
        this.message = message;
        this.timeout = timeout;
        this.permanent = permanent;

        this.fadeOutTime = 250;

        this.DOM = this._initDOM();

        this.parent.appendChild(this.DOM.container);

        if (!this.permanent) {
            setTimeout(() => {
                this.removeDOM();
            }, this.timeout);
        }
    }

    /**
     * Initializes the DOM structure for the dialog.
     * @returns {Object} - An object containing the DOM elements.
     */
    _initDOM() {
        let DOM = {};

        DOM.container = utils.create({
            attributes: {
                class: 'notification',
                style: `transition: opacity ${this.fadeOutTime / 1000}s ease`,
            },
            children: [
                utils.create({
                    text: this.message,
                    attributes: {
                        class: 'notification-message',
                    },
                }),
            ],
        });

        if (this.permanent) {
            utils.appendElements(DOM.container, [
                utils.create({
                    attributes: {
                        class: 'dialog-button close',
                    },
                    children: [
                        utils.create({
                            type: 'i',
                            attributes: {
                                class: 'fa-solid fa-xmark',
                            },
                        }),
                    ],
                    events: {
                        click: () => this.removeDOM(),
                    },
                }),
            ]);
        }

        DOM.container.instance = this;

        return DOM;
    }
}
