'use strict';

import Sortable from './Sortable.js';

import { getMacroByValue, getMacroByType } from './MacroDict.js';

import * as utils from '../utils.js';

/**
 * Represents a base dialog class to be extended.
 * @class
 */
class BaseDialog {
    /**
     * Initializes the BaseDialog class.
     * @constructor
     */
    constructor() {
        this.fadeOutTime = 250;

        this.DOM = this._initDOM();

        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    /**
     * Initializes the Document Object Model (DOM) elements for a dialog, including
     * its container, header, buttons, and content. Event handlers for various actions
     * like dragging, copying, pasting, closing, and OK are also set up.
     */
    _initDOM() {
        let DOM = {
            header: {},
            buttons: {},
        };

        DOM.container = utils.create({
            attributes: {
                class: 'dialog-container',
                style: `transition: opacity ${this.fadeOutTime / 1000}s ease`,
            },
            children: [
                (DOM.dialog = utils.create({
                    attributes: {
                        class: 'dialog',
                    },
                    children: [
                        utils.create({
                            attributes: {
                                class: 'dialog-header',
                            },
                            children: [
                                (DOM.header.label = utils.create({
                                    attributes: {
                                        class: 'dialog-header-label',
                                    },
                                    events: {
                                        mousedown: (event) =>
                                            this._onDragDialog(this.DOM.dialog, event),
                                    },
                                })),
                                (DOM.buttons.copy = utils.create({
                                    attributes: {
                                        title: 'Copy configuration',
                                        class: 'dialog-button copy',
                                    },
                                    children: [
                                        utils.create({
                                            type: 'i',
                                            attributes: {
                                                class: 'fa-solid fa-copy',
                                            },
                                        }),
                                        utils.create({
                                            text: 'copied',
                                            attributes: {
                                                class: 'dialog-button-label',
                                                style: `transition: opacity ${
                                                    this.fadeOutTime / 1000
                                                }s ease`,
                                            },
                                        }),
                                    ],
                                    events: {
                                        click: (event) => {
                                            const button = this.DOM.buttons.copy;
                                            button.children[1].style.opacity = 1;
                                            button.children[0].style.display = 'none';
                                            setTimeout(() => {
                                                button.children[1].style.opacity = 0;
                                                button.children[0].style.display = 'block';
                                            }, this.fadeOutTime);
                                            this._onCopy(event);
                                        },
                                    },
                                })),
                                (DOM.buttons.paste = utils.create({
                                    attributes: {
                                        title: 'Paste configuration',
                                        class: 'dialog-button paste',
                                    },
                                    children: [
                                        utils.create({
                                            type: 'i',
                                            attributes: {
                                                class: 'fa-solid fa-paste',
                                            },
                                        }),
                                        utils.create({
                                            text: 'pasted',
                                            attributes: {
                                                class: 'dialog-button-label',
                                                style: `transition: opacity ${
                                                    this.fadeOutTime / 1000
                                                }s ease`,
                                            },
                                        }),
                                    ],
                                    events: {
                                        click: (event) => {
                                            const button = this.DOM.buttons.paste;
                                            button.children[1].style.opacity = 1;
                                            button.children[0].style.display = 'none';
                                            setTimeout(() => {
                                                button.children[1].style.opacity = 0;
                                                button.children[0].style.display = 'block';
                                            }, this.fadeOutTime);
                                            this._onPaste(event);
                                        },
                                    },
                                })),
                            ],
                        }),
                        (DOM.content = utils.create({
                            attributes: {
                                class: 'dialog-content',
                            },
                        })),
                        (DOM.buttons.close = utils.create({
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
                                click: (event) => this._onClose(event),
                            },
                        })),
                        (DOM.buttons.ok = utils.create({
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
                                click: (event) => this._onOK(event),
                            },
                        })),
                    ],
                })),
            ],
        });

        DOM.container.instance = this;

        return DOM;
    }

    /**
     * Append the given element to a parent element.
     * @param {HTMLElement} parent - The parent element to which the element will be appended.
     * @param {HTMLElement} element - The element to append to the parent.
     */
    _appendToParent(parent, element) {
        parent.appendChild(element);
    }

    /**
     * Removes the element by fading it out and then removing it from its parent.
     * @param {HTMLElement} element - The element to remove.
     */
    _removeFromParent(element) {
        element.style.opacity = 0;

        setTimeout(() => {
            element.parentNode.removeChild(element);
        }, this.fadeOutTime);
    }

    /**
     * Toggles the visibility of the 'OK' button in the dialog.
     * @param {boolean} visible - Whether to display the button (true) or hide it (false).
     */
    _toggleOKButton(visible) {
        this.DOM.buttons.ok.style.display = visible ? 'block' : 'none';
    }

    /**
     * Toggles the visibility of the 'Copy' and 'Paste' buttons in the dialog.
     * @param {boolean} visible - Whether to display the buttons (true) or hide them (false).
     */
    _toggleCopyPasteButtons(visible) {
        this.DOM.buttons.copy.style.display = visible ? 'block' : 'none';
        this.DOM.buttons.paste.style.display = visible ? 'block' : 'none';
    }

    /**
     * Positions an element within the viewport based on specified anchor points and offsets.
     * @param {HTMLElement} element - The element to be positioned.
     * @param {Object} [options] - An object with positioning options.
     * @param {string} [options.anchor='top left'] - The anchor point for positioning.
     * @param {number} [options.top=0] - The vertical offset from the anchor.
     * @param {number} [options.left=0] - The horizontal offset from the anchor.
     */
    _setPosition(element, { anchor = 'top left', top = 0, left = 0 } = {}) {
        const [anchorTop, anchorLeft = anchorTop] = anchor.split(' ');
        const elementWidth = element.offsetWidth;
        const elementHeight = element.offsetHeight;

        const getPosition = (anchor, elementSize, position) => {
            switch (anchor) {
                default:
                case 'top':
                case 'left':
                case 'start':
                    return Math.max(Math.min(position, window.innerWidth - elementWidth), 0);
                case 'center':
                    return Math.max(
                        Math.min(position - elementSize / 2, window.innerWidth - elementWidth),
                        0
                    );
                case 'bottom':
                case 'right':
                case 'end':
                    return Math.max(
                        Math.min(position - elementSize, window.innerWidth - elementWidth),
                        0
                    );
            }
        };

        utils.style(element, {
            top: `${getPosition(anchorTop, elementHeight, top)}px`,
            left: `${getPosition(anchorLeft, elementWidth, left)}px`,
        });
    }

    /**
     * Sets the label text for the header of the dialog.
     * @param {string} label - The text to display in the header label.
     */
    _setHeaderLabel(label = '') {
        this.DOM.header.label.innerText = label;
    }

    /**
     * Drags a dialog element based on mouse movements.
     * @param {HTMLElement} element - The element to drag.
     * @param {MouseEvent} event - The mouse event that triggered the drag.
     */
    _onDragDialog(element, event) {
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

            const offsetTop = Math.max(element.offsetTop - pos2, 0);
            const offsetLeft = Math.max(
                Math.min(element.offsetLeft - pos1, window.innerWidth - element.offsetWidth),
                0
            );

            utils.style(element, {
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
     * Handle the close action for the dialog. Rejecting the associated promise.
     * @param {MouseEvent} event - The mouse event that triggered.
     */
    _onClose(event) {
        this.reject(this);
        this._removeFromParent(this.DOM.container);
    }

    /**
     * Handle the OK action for the dialog. Resolves the associated promise.
     * @param {MouseEvent} event - The mouse event that triggered.
     */
    _onOK(event) {
        this.resolve(this);
        this._removeFromParent(this.DOM.container);
    }

    /**
     * Placeholder function for handling the 'Copy' button click event.
     * This function should be overridden with specific functionality.
     * @param {Event} event - The event triggering the copy action.
     */
    _onCopy(event) {}

    /**
     * Placeholder function for handling the 'Paste' button click event.
     * This function should be overridden with specific functionality.
     * @param {Event} event - The event triggering the copy action.
     */
    _onPaste(event) {}
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
     * @param {HTMLElement} [options.parent=document.body] - The parent element to which the dialog will be appended.
     * @param {Object} [options.position={}] - Positioning options for the dialog.
     * @param {Object} options.keyInstance - The key instance to be edited.
     * @param {Object} [options.clipboard={}] - An object representing clipboard data.
     * @returns {HTMLElement} - The container DOM element for the dialog.
     */
    constructor({
        parent = document.body,
        position = {},
        keyInstance = null,
        clipboard = {},
    } = {}) {
        super();

        this.parent = parent;
        this.keyInstance = keyInstance;
        this.initType = keyInstance.type;
        this.clipboard = clipboard;
        this.pasted = false;

        this._setContent();
        this._setHeaderLabel(this.keyInstance.label || 'New');
        this._appendToParent(this.parent, this.DOM.container);
        this._setInitialValues(this.keyInstance.getAllData());
        this._setPosition(this.DOM.dialog, position);

        return this.promise;
    }

    /**
     * Populates the content of a dialog.
     */
    _setContent() {
        this.inputs = {};

        utils.appendElements(this.DOM.content, [
            (this.inputs.container = utils.create({
                attributes: {
                    class: 'dialog-inputs',
                },
                children: [
                    utils.create({
                        attributes: {
                            class: 'dialog-input dialog-input-shorten input-type',
                        },
                        children: [
                            utils.create({
                                text: 'Type: ',
                            }),
                            (this.inputs.type = utils.create({
                                type: 'select',
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
                                    change: (event) => this._onChangeType(event),
                                },
                            })),
                        ],
                    }),
                    utils.create({
                        attributes: {
                            class: 'dialog-input dialog-input-shorten input-label',
                        },
                        children: [
                            utils.create({
                                text: 'Label: ',
                            }),
                            (this.inputs.label = utils.create({
                                type: 'input',
                                attributes: {
                                    title: 'The label cannot be longer than 6 characters',
                                    maxlength: 6,
                                },
                                events: {
                                    input: (event) => this._onInputLabel(event),
                                },
                            })),
                        ],
                    }),
                    utils.create({
                        attributes: {
                            class: 'dialog-input dialog-input-shorten input-color',
                        },
                        children: [
                            utils.create({
                                text: 'LED Color: ',
                            }),
                            utils.create({
                                children: [
                                    (this.inputs.colorPicker = utils.create({
                                        type: 'input',
                                        attributes: {
                                            type: 'color',
                                        },
                                        events: {
                                            input: (event) => this._onChangeColor(event),
                                        },
                                    })),
                                    (this.inputs.colorText = utils.create({
                                        type: 'input',
                                        events: {
                                            input: (event) => this._onChangeColor(event),
                                        },
                                    })),
                                ],
                            }),
                        ],
                    }),
                    utils.create({
                        attributes: {
                            class: 'dialog-input input-content',
                        },
                        children: [
                            utils.create({
                                text: 'Content: ',
                            }),
                            utils.create({
                                attributes: {
                                    class: 'input-macros',
                                },
                                children: [
                                    (this.inputs.content = utils.create({
                                        type: 'div',
                                        attributes: {
                                            class: 'input-sortable',
                                        },
                                    })),
                                    utils.create({
                                        type: 'i',
                                        attributes: {
                                            class: 'dialog-button add fa-solid fa-plus',
                                        },
                                        events: {
                                            click: (event) =>
                                                this._appendMacroSelector(this.inputs.content),
                                        },
                                    }),
                                ],
                            }),
                        ],
                    }),
                    utils.create({
                        attributes: {
                            class: 'dialog-input input-encoder',
                        },
                        children: [
                            utils.create({
                                type: 'details',
                                attributes: {
                                    open: true,
                                },
                                children: [
                                    utils.create({
                                        type: 'summary',
                                        text: 'Encoder switch: ',
                                    }),
                                    utils.create({
                                        attributes: {
                                            class: 'input-macros',
                                        },
                                        children: [
                                            (this.inputs.switch = utils.create({
                                                type: 'div',
                                                attributes: {
                                                    class: 'input-sortable',
                                                },
                                            })),
                                            utils.create({
                                                type: 'i',
                                                attributes: {
                                                    class: 'dialog-button add fa-solid fa-plus',
                                                },
                                                events: {
                                                    click: (event) =>
                                                        this._appendMacroSelector(
                                                            this.inputs.switch
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
                                    open: true,
                                },
                                children: [
                                    utils.create({
                                        type: 'summary',
                                        text: 'Encoder increase: ',
                                    }),
                                    utils.create({
                                        attributes: {
                                            class: 'input-macros',
                                        },
                                        children: [
                                            (this.inputs.increased = utils.create({
                                                type: 'div',
                                                attributes: {
                                                    class: 'input-sortable',
                                                },
                                            })),
                                            utils.create({
                                                type: 'i',
                                                attributes: {
                                                    class: 'dialog-button add fa-solid fa-plus',
                                                },
                                                events: {
                                                    click: (event) =>
                                                        this._appendMacroSelector(
                                                            this.inputs.increased
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
                                    open: true,
                                },
                                children: [
                                    utils.create({
                                        type: 'summary',
                                        text: 'Encoder decrease: ',
                                    }),
                                    utils.create({
                                        attributes: {
                                            class: 'input-macros',
                                        },
                                        children: [
                                            (this.inputs.decreased = utils.create({
                                                type: 'div',
                                                attributes: {
                                                    class: 'input-sortable',
                                                },
                                            })),
                                            utils.create({
                                                type: 'i',
                                                attributes: {
                                                    class: 'dialog-button add fa-solid fa-plus',
                                                },
                                                events: {
                                                    click: (event) =>
                                                        this._appendMacroSelector(
                                                            this.inputs.decreased
                                                        ),
                                                },
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            })),
        ]);

        this._initSortableMacroLists(this.inputs.content, 'content');
        this._initSortableMacroLists(this.inputs.switch, 'encoder');
        this._initSortableMacroLists(this.inputs.decreased, 'encoder');
        this._initSortableMacroLists(this.inputs.increased, 'encoder');
    }

    /**
     * Updates the header text with the label input value.
     * @param {Event} event - The input event triggering this function.
     */
    _onInputLabel(event) {
        this._setHeaderLabel(this.inputs.label.value || 'New');
    }

    /**
     * Handles the change event of the dialog type select input.
     * Updates the dialog's visual style based on the selected type.
     */
    _onChangeType(event) {
        this.inputs.container.classList.remove('blank', 'macro', 'group');
        this.inputs.container.classList.add(this.inputs.type.value);
    }

    /**
     * Updates the selected color in the DOM elements.
     * @param {Event} event - The input event that triggered the color change.
     */
    _onChangeColor(event) {
        const color = event.target.value;
        const isColorHexRegex = /^#[0-9A-Fa-f]{6}$/;

        if (isColorHexRegex.test(color)) {
            this.inputs.colorPicker.value = color;
            this.inputs.colorText.value = color.toUpperCase();
        }
    }

    /**
     * Handle the OK action for the dialog. Resolves the associated promise with data if valid, or shows an error message.
     * @param {MouseEvent} event - The mouse event that triggered.
     */
    _onOK(event) {
        if (this.inputs.type.value !== 'blank' && this.inputs.label.value === '') {
            this.inputs.label.placeholder = 'You have to enter a label!';
            return;
        }

        const resolveAndRemove = () => {
            this.resolve({ response: this._prepareResponse(), keyInstance: this.keyInstance });
            this._removeFromParent(this.DOM.container);
        };

        if (this.inputs.type.value !== this.initType && this.initType !== 'blank') {
            new ConfirmationDialog({
                position: {
                    anchor: 'center',
                    top: event.y,
                    left: event.x,
                },
                title: 'Warning',
                prompt: 'Do you really want to change the type and lost your configuration?',
            })
                .then((response) => {
                    resolveAndRemove();
                })
                .catch((error) => {});
        } else {
            resolveAndRemove();
        }
    }

    /**
     * Handles copying key configuration.
     * @param {Event} event - The event triggering the copy action.
     */
    _onCopy(event) {
        if (this.inputs.type.value !== 'blank') {
            this.clipboard.key = this.keyInstance.getAllData();
        }
    }

    /**
     * Handles pasting key configuration.
     * @param {Event} event - The event triggering the paste action.
     */
    _onPaste(event) {
        const pasteConfiguration = () => {
            this._setInitialValues(this.clipboard.key);
            this._onChangeType();
            this._onInputLabel();

            this.initType = this.clipboard.key.type;
            this.pasted = true;
        };
        if (this.clipboard.key !== null) {
            if (this.inputs.type.value !== 'blank') {
                new ConfirmationDialog({
                    position: {
                        anchor: 'center',
                        top: event.y,
                        left: event.x,
                    },
                    title: 'Warning',
                    prompt: 'Do you really want to replace this configuration?',
                })
                    .then((response) => {
                        pasteConfiguration();
                    })
                    .catch((error) => {});
            } else {
                pasteConfiguration();
            }
        }
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
        container.innerHTML = '';
        const entries = content.map((value) => {
            const entry = getMacroByValue(value);
            entry.instance.addAdditionalControls();
            return entry;
        });
        utils.appendElements(container, entries);
    }

    /**
     * Extracts and returns values from a container of macro entries.
     * @param {HTMLElement} container - The container element containing macro entries.
     * @returns {Array} An array of extracted values.
     */
    _getMacroEntryValues(container) {
        return Array.from(container.children)
            .map((entry) => entry.instance.getValue() || undefined)
            .filter((value) => value !== undefined);
    }

    /**
     * Prepares a response object based on the current state of the input elements.
     * @returns {Object} The response object containing relevant data.
     */
    _prepareResponse() {
        const values = { type: this.inputs.type.value };

        if (values.type !== 'blank') {
            values.label = this.inputs.label.value;
            values.color = utils.hexToRGB(this.inputs.colorPicker.value);
        }

        if (this.pasted && values.type === 'group' && this.initType === 'group') {
            values.content = JSON.parse(JSON.stringify(this.clipboard.key.content));
        } else if (!this.pasted && values.type === 'group' && this.initType === 'blank') {
            values.content = undefined;
        } else if (values.type === 'macro') {
            values.content = this._getMacroEntryValues(this.inputs.content);
        }

        if (values.type === 'group') {
            values.encoder = {
                switch: this._getMacroEntryValues(this.inputs.switch),
                increased: this._getMacroEntryValues(this.inputs.increased),
                decreased: this._getMacroEntryValues(this.inputs.decreased),
            };
        }

        return values;
    }

    /**
     * Sets the initial values and configuration of the dialog.
     */
    _setInitialValues(key) {
        const DOM = this.DOM;

        for (const option of this.inputs.type.children) {
            if (key.type === option.value) {
                option.selected = true;
                break;
            }
        }

        this.inputs.container.classList.add(key.type);

        this.inputs.label.value = key.label;

        this.inputs.colorPicker.value = utils.rgbToHex(key.color);
        this.inputs.colorText.value = utils.rgbToHex(key.color).toUpperCase();

        switch (key.type) {
            case 'macro':
                this._appendMultipleMacros(this.inputs.content, key.content);
                break;
            case 'group':
                this._appendMultipleMacros(this.inputs.switch, key.encoder.switch);
                this._appendMultipleMacros(this.inputs.decreased, key.encoder.decreased);
                this._appendMultipleMacros(this.inputs.increased, key.encoder.increased);
                break;

            default:
                break;
        }
    }
}

/**
 * Represents a dialog for editing the group encoder configuration.
 * @class
 */
export class EncoderDialog extends BaseDialog {
    /**
     * Initializes a new instance of the EncoderDialog class.
     * @constructor
     * @param {Object} options - The options for configuring the dialog.
     * @param {HTMLElement} [options.parent=document.body] - The parent element to which the dialog will be appended.
     * @param {Object} [options.position={}] - Positioning options for the dialog.
     * @param {Object} options.groupObject - The group object to be edited.
     * @param {Object} [options.clipboard={}] - An object representing clipboard data.
     * @returns {HTMLElement} - The container DOM element for the dialog.
     */
    constructor({
        parent = document.body,
        position = {},
        groupObject = null,
        clipboard = {},
    } = {}) {
        super();

        this.parent = parent;
        this.groupObject = groupObject;

        this.clipboard = clipboard;
        this.pasted = false;

        this._setContent();
        this._setHeaderLabel(this.groupObject.label);
        this._appendToParent(this.parent, this.DOM.container);
        this._setInitialValues(this.groupObject);
        this._setPosition(this.DOM.dialog, position);

        return this.promise;
    }

    /**
     * Populates the content of a dialog.
     */
    _setContent() {
        this.inputs = {};

        utils.appendElements(this.DOM.content, [
            utils.create({
                attributes: {
                    class: 'dialog-inputs',
                },
                children: [
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
                                    class: 'input-macros',
                                },
                                children: [
                                    (this.inputs.switch = utils.create({
                                        type: 'div',
                                        attributes: {
                                            class: 'input-sortable',
                                        },
                                    })),
                                    utils.create({
                                        type: 'i',
                                        attributes: {
                                            class: 'dialog-button add fa-solid fa-plus',
                                        },
                                        events: {
                                            click: () =>
                                                this._appendMacroSelector(this.inputs.switch),
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
                                    class: 'input-macros',
                                },
                                children: [
                                    (this.inputs.increased = utils.create({
                                        type: 'div',
                                        attributes: {
                                            class: 'input-sortable',
                                        },
                                    })),
                                    utils.create({
                                        type: 'i',
                                        attributes: {
                                            class: 'dialog-button add fa-solid fa-plus',
                                        },
                                        events: {
                                            click: () =>
                                                this._appendMacroSelector(this.inputs.increased),
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
                                    class: 'input-macros',
                                },
                                children: [
                                    (this.inputs.decreased = utils.create({
                                        type: 'div',
                                        attributes: {
                                            class: 'input-sortable',
                                        },
                                    })),
                                    utils.create({
                                        type: 'i',
                                        attributes: {
                                            class: 'dialog-button add fa-solid fa-plus',
                                        },
                                        events: {
                                            click: () =>
                                                this._appendMacroSelector(this.inputs.decreased),
                                        },
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ]);

        this._initSortableMacroLists(this.inputs.switch, 'encoder');
        this._initSortableMacroLists(this.inputs.decreased, 'encoder');
        this._initSortableMacroLists(this.inputs.increased, 'encoder');
    }

    /**
     * Handle the OK action for the dialog. Resolves the associated promise with data.
     * @param {MouseEvent} event - The mouse event that triggered.
     */
    _onOK(event) {
        this.resolve({ response: this._prepareResponse(), groupObject: this.groupObject });
        this._removeFromParent(this.DOM.container);
    }

    /**
     * Checks if all encoder macros are empty.
     * @returns {boolean} Returns true if all encoder macros are empty, false otherwise.
     */
    _allEncoderMacrosEmpty() {
        return [this.inputs.switch, this.inputs.increased, this.inputs.decreased]
            .map((container) => this._getMacroEntryValues(container))
            .every((content) => !content.length);
    }

    /**
     * Handles copying key configuration.
     * @param {Event} event - The event triggering the copy action.
     */
    _onCopy(event) {
        if (!this._allEncoderMacrosEmpty()) {
            this.clipboard.encoderConfig = this.groupObject;
        }
    }

    /**
     * Handles pasting key configuration.
     * @param {Event} event - The event triggering the paste action.
     */
    _onPaste(event) {
        const pasteConfiguration = () => {
            this._setInitialValues(this.clipboard.encoderConfig);
            this.pasted = true;
        };
        if (this.clipboard.encoderConfig !== null) {
            if (!this._allEncoderMacrosEmpty()) {
                new ConfirmationDialog({
                    position: {
                        anchor: 'center',
                        top: event.y,
                        left: event.x,
                    },
                    title: 'Warning',
                    prompt: 'Do you really want to replace this configuration?',
                })
                    .then((response) => {
                        pasteConfiguration();
                    })
                    .catch((error) => {});
            } else {
                pasteConfiguration();
            }
        }
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
        container.innerHTML = '';
        const entries = content.map((value) => {
            const entry = getMacroByValue(value);
            entry.instance.addAdditionalControls();
            return entry;
        });
        utils.appendElements(container, entries);
    }

    /**
     * Extracts and returns values from a container of macro entries.
     * @param {HTMLElement} container - The container element containing macro entries.
     * @returns {Array} An array of extracted values.
     */
    _getMacroEntryValues(container) {
        return Array.from(container.children)
            .map((entry) => entry.instance.getValue() || undefined)
            .filter((value) => value !== undefined);
    }

    /**
     * Prepares a response object based on the current state of the input elements.
     * @returns {Object} The response object containing relevant data.
     */
    _prepareResponse() {
        return {
            encoder: {
                switch: this._getMacroEntryValues(this.inputs.switch),
                increased: this._getMacroEntryValues(this.inputs.increased),
                decreased: this._getMacroEntryValues(this.inputs.decreased),
            },
        };
    }

    /**
     * Sets the initial values and configuration of the dialog.
     */
    _setInitialValues(key) {
        if ('encoder' in key) {
            this._appendMultipleMacros(this.inputs.switch, key.encoder.switch);
            this._appendMultipleMacros(this.inputs.decreased, key.encoder.decreased);
            this._appendMultipleMacros(this.inputs.increased, key.encoder.increased);
        }
    }
}

/**
 * Represents a confirmation dialog.
 * @class
 */
export class ConfirmationDialog extends BaseDialog {
    /**
     * Initializes a new instance of the ConfirmationDialog class.
     * @constructor
     * @param {Object} options - Options for configuring the dialog:
     * @param {HTMLElement} [options.parent=document.body] - The parent element to which the dialog will be appended.
     * @param {Object} [options.position={}] - Positioning options for the dialog.
     */
    constructor({ parent = document.body, position = {}, title = '', prompt = '' } = {}) {
        super();

        this.parent = parent;
        this.title = title;
        this.prompt = prompt;

        this._setContent();
        this._toggleCopyPasteButtons(false);
        this._setHeaderLabel(this.title);
        this._appendToParent(this.parent, this.DOM.container);
        this._setPosition(this.DOM.dialog, position);

        return this.promise;
    }

    /**
     * Populates the content of a dialog.
     */
    _setContent() {
        utils.appendElements(this.DOM.content, [
            utils.create({
                text: this.prompt,
                attributes: {
                    class: 'dialog-prompt',
                },
            }),
        ]);
    }
}

/**
 * Represents a settings dialog.
 * @class
 */
export class SettingsDialog extends BaseDialog {
    /**
     * Initializes a new instance of the SettingsDialog class.
     * @constructor
     * @param {Object} options - Options for configuring the dialog:
     * @param {HTMLElement} [options.parent=document.body] - The parent element to which the dialog will be appended.
     * @param {Object} [options.position={}] - Positioning options for the dialog.
     * @param {Object} [options.settings={}] - Device settings for the dialog.
     * @param {Object} [options.readonly=false] - If settings are readonly.
     */
    constructor({ parent = document.body, position = {}, settings = {}, readonly = false } = {}) {
        super();

        this.parent = parent;
        this.settings = settings;
        this.readonly = readonly;
        this.keyboardlayouts = [
            ['Portuguese (Brazil)', 'br'],
            ['Czech', 'cz'],
            ['Danish', 'da'],
            ['German', 'de'],
            ['Spanish', 'es'],
            ['French', 'fr'],
            ['Hungarian', 'hu'],
            ['Italian', 'it'],
            ['Polish', 'po'],
            ['Swedish', 'sw'],
            ['Turkish', 'tr'],
            ['English UK', 'uk'],
            ['English US', 'us'],
        ];

        this._setContent();
        this._toggleCopyPasteButtons(false);
        this._setHeaderLabel('Settings');
        this._appendToParent(this.parent, this.DOM.container);
        this._setInitialValues();
        this._setPosition(this.DOM.dialog, position);

        return this.promise;
    }

    /**
     * Populates the content of a dialog.
     */
    _setContent() {
        this.inputs = {};

        utils.appendElements(this.DOM.content, [
            utils.create({
                attributes: {
                    class: 'dialog-inputs',
                },
                children: [
                    utils.create({
                        text: 'The settings can only be changed if the USB storage is disabled',
                        attributes: {
                            class: 'dialog-input-shorten',
                            style: this.readonly ? '' : 'display: none;',
                        },
                    }),
                    utils.create({
                        text: 'Keyboard Layout: ',
                    }),
                    (this.inputs.keyboardlayout = utils.create({
                        type: 'select',
                        attributes: {
                            class: 'dialog-input-shorten',
                        },
                        children: this.keyboardlayouts.map((value) => {
                            return utils.create({
                                type: 'option',
                                text: value[0],
                                attributes: {
                                    value: value[1],
                                },
                            });
                        }),
                    })),
                    utils.create({
                        text: 'Display Timeout: ',
                    }),
                    (this.inputs.sleeptime = utils.create({
                        type: 'input',
                        attributes: {
                            type: 'number',
                            title: 'The display timeout in seconds',
                            class: 'dialog-input-shorten',
                            min: 1,
                        },
                    })),
                    utils.create({
                        attributes: {
                            class: 'dialog-input-shorten',
                        },
                        children: [
                            utils.create({
                                text: 'Unicode Font: ',
                            }),
                            (this.inputs.useunicodefont = utils.create({
                                type: 'input',
                                attributes: {
                                    type: 'checkbox',
                                    title: 'This slightly increases the initial loading time!',
                                },
                            })),
                        ],
                    }),
                    utils.create({
                        attributes: {
                            class: 'dialog-input-shorten',
                        },
                        children: [
                            utils.create({
                                text: 'Flip Rotation: ',
                            }),
                            (this.inputs.fliprotation = utils.create({
                                type: 'input',
                                attributes: {
                                    type: 'checkbox',
                                },
                            })),
                        ],
                    }),
                    utils.create({
                        attributes: {
                            class: 'dialog-input-shorten',
                        },
                        children: [
                            utils.create({
                                text: 'LCD/LED Brightness: ',
                            }),
                            (this.inputs.brightness = utils.create({
                                type: 'input',
                                attributes: {
                                    type: 'range',
                                    min: 0,
                                    max: 1,
                                    step: 0.1,
                                },
                                events: {
                                    input: (event) => {
                                        event.target.title = event.target.value;
                                    },
                                },
                            })),
                        ],
                    }),
                ],
            }),
        ]);

        for (const input in this.inputs) {
            const element = this.inputs[input];
            element.disabled = this.readonly;
        }
    }

    /**
     * Sets the initial values and configuration of the dialog.
     */
    _setInitialValues() {
        for (const option of this.inputs.keyboardlayout.children) {
            if (this.settings.keyboardlayout === option.value) {
                option.selected = true;
                break;
            }
        }

        this.inputs.sleeptime.value = this.settings.sleeptime;
        this.inputs.useunicodefont.checked = this.settings.useunicodefont;
        this.inputs.fliprotation.checked = this.settings.fliprotation;
        this.inputs.brightness.value = this.settings.brightness;
        this.inputs.brightness.title = this.settings.brightness;
    }

    /**
     * Handle the OK action for the dialog. Resolves the associated promise.
     */
    _onOK() {
        this.settings.keyboardlayout = this.inputs.keyboardlayout.value;
        this.settings.sleeptime = parseInt(this.inputs.sleeptime.value);
        this.settings.useunicodefont = this.inputs.useunicodefont.checked;
        this.settings.fliprotation = this.inputs.fliprotation.checked;
        this.settings.brightness = parseFloat(this.inputs.brightness.value);

        this.resolve({ dialogInstance: this, settings: this.settings });
        this._removeFromParent(this.DOM.container);
    }
}

/**
 * Represents a reset dialog.
 * @class
 */
export class ResetDialog extends BaseDialog {
    /**
     * Initializes a new instance of the ResetDialog class.
     * @constructor
     * @param {Object} options - Options for configuring the dialog:
     * @param {HTMLElement} [options.parent=document.body] - The parent element to which the dialog will be appended.
     * @param {Object} [options.position={}] - Positioning options for the dialog.
     */
    constructor({ parent = document.body, position = {} } = {}) {
        super();

        this.parent = parent;

        this._setContent();
        this._toggleOKButton(false);
        this._toggleCopyPasteButtons(false);
        this._setHeaderLabel('Reboot');
        this._appendToParent(this.parent, this.DOM.container);
        this._setPosition(this.DOM.dialog, position);

        return this.promise;
    }

    /**
     * Populates the content of a dialog.
     */
    _setContent() {
        utils.appendElements(this.DOM.content, [
            utils.create({
                attributes: {
                    class: 'dialog-reboot-buttons',
                },
                children: [
                    utils.create({
                        attributes: {
                            title: 'Restart the script',
                            class: 'button',
                        },
                        children: [
                            utils.create({
                                type: 'i',
                                attributes: {
                                    class: 'fa-solid fa-power-off',
                                },
                            }),
                            utils.create({
                                text: 'Soft Reboot',
                            }),
                        ],
                        events: {
                            click: (event) => this._onButton(event, 'softReset'),
                        },
                    }),
                    utils.create({
                        attributes: {
                            title: 'Reboot the device (Disable USB storage)',
                            class: 'button',
                        },
                        children: [
                            utils.create({
                                type: 'i',
                                attributes: {
                                    class: 'fa-solid fa-power-off',
                                },
                            }),
                            utils.create({
                                text: 'Hard Reboot',
                            }),
                        ],
                        events: {
                            click: (event) => this._onButton(event, 'hardReset'),
                        },
                    }),
                    utils.create({
                        attributes: {
                            title: 'Enable USB storage (you cannot store on the device when USB is enabled)',
                            class: 'button',
                        },
                        children: [
                            utils.create({
                                type: 'i',
                                attributes: {
                                    class: 'fa-solid fa-power-off',
                                },
                            }),
                            utils.create({
                                text: 'Enable USB',
                            }),
                        ],
                        events: {
                            click: (event) => this._onButton(event, 'enableUSB'),
                        },
                    }),
                ],
            }),
        ]);
    }

    /**
     * Handle the button action for the dialog. Resolves the associated promise.
     */
    _onButton(event, command) {
        const PROMPTS = {
            softReset: 'Do you really want to reset the script?',
            hardReset: 'Do you really want to reboot the macropad?',
            enableUSB: 'Do you really want to reboot the macropad to enable USB storage?',
        };

        new ConfirmationDialog({
            position: {
                anchor: 'center',
                top: event.y,
                left: event.x,
            },
            title: 'Warning',
            prompt: PROMPTS[command],
        })
            .then((response) => {
                this.resolve({ dialogInstance: this, event: event, command: command });
                this._removeFromParent(this.DOM.container);
            })
            .catch((error) => {});
    }
}

/**
 * Represents a notification.
 * @class
 */
export class NotificationDialog {
    /**
     * Initializes a new instance of the NotificationDialog class.
     * @constructor
     * @param {Object} options - The options for configuring the dialog.
     * @param {HTMLElement} [options.parent=document.body] - The parent element to which the Notification will be appended.
     * @param {string} [options.type='info'] - The type of the the Notification (info, success, warning, error).
     * @param {string} [options.message=''] - The message to be displayed in the Notification.
     * @param {number} [options.timeout=2000] - The duration (in milliseconds) for which the Notification will be displayed before automatically fading out.
     * @param {boolean} [options.permanent=false] - Whether the Notification should remain visible until manually closed.
     */
    constructor({
        parent = document.body,
        type = 'info',
        message = '',
        timeout = 2000,
        permanent = false,
    } = {}) {
        this.parent = parent;
        this.type = type;
        this.message = message;
        this.timeout = timeout;
        this.permanent = permanent;

        this.fadeOutTime = 250;

        this.DOM = this._initDOM();

        this.parent.appendChild(this.DOM.container);

        if (!this.permanent) {
            setTimeout(() => {
                this._removeFromParent(this.DOM.container);
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
                class: `notification ${this.type}`,
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
                        click: () => this._removeFromParent(this.DOM.container),
                    },
                }),
            ]);
        }

        return DOM;
    }

    /**
     * Removes the element by fading it out and then removing it from its parent.
     * @param {HTMLElement} element - The element to remove.
     */
    _removeFromParent(element) {
        element.style.opacity = 0;

        setTimeout(() => {
            element.parentNode.removeChild(element);
        }, this.fadeOutTime);
    }
}
