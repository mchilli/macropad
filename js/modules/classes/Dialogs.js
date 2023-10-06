'use strict';

import Sortable from './Sortable.js';

import { getMacroByValue, getMacroByType } from './MacroDict.js';

import * as utils from '../utils.js';

class EditDialog {
    constructor({ keyInstance = null, onButtonPressed = () => {} } = {}) {
        this.keyInstance = keyInstance;
        this.onButtonPressed = onButtonPressed;

        this.DOM = this._initDOM();
        this._setValues();

        return this.DOM.container;
    }

    _initDOM() {
        let DOM = {
            encoder: {},
        };

        DOM.container = utils.create({
            attributes: {
                class: 'dialog-container',
            },
            children: [
                (DOM.dialog = utils.create({
                    attributes: {
                        class: `dialog ${this.keyInstance.type}`,
                    },
                    children: [
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
                                })),
                                utils.create({
                                    type: 'span',
                                    text: 'Color: ',
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
                                                click: () =>
                                                    this._appendSingleMacro(DOM.content, 'wait'),
                                            },
                                        }),
                                    ],
                                }),
                                utils.create({
                                    type: 'span',
                                    text: 'Encoder switch: ',
                                    attributes: {
                                        class: 'dialog-encoder',
                                    },
                                }),
                                utils.create({
                                    attributes: {
                                        class: 'dialog-macros dialog-encoder',
                                    },
                                    children: [
                                        (DOM.encoder.switch = utils.create({
                                            type: 'div',
                                            attributes: {
                                                class: 'dialog-encoder dialog-sortable',
                                            },
                                        })),
                                        utils.create({
                                            type: 'i',
                                            attributes: {
                                                class: 'dialog-button add fa-solid fa-plus',
                                            },
                                            events: {
                                                click: () =>
                                                    this._appendSingleMacro(
                                                        DOM.encoder.switch,
                                                        'wait'
                                                    ),
                                            },
                                        }),
                                    ],
                                }),
                                utils.create({
                                    type: 'span',
                                    text: 'Encoder increase: ',
                                    attributes: {
                                        class: 'dialog-encoder',
                                    },
                                }),
                                utils.create({
                                    attributes: {
                                        class: 'dialog-macros dialog-encoder',
                                    },
                                    children: [
                                        (DOM.encoder.increased = utils.create({
                                            type: 'div',
                                            attributes: {
                                                class: 'dialog-encoder dialog-sortable',
                                            },
                                        })),
                                        utils.create({
                                            type: 'i',
                                            attributes: {
                                                class: 'dialog-button add fa-solid fa-plus',
                                            },
                                            events: {
                                                click: () =>
                                                    this._appendSingleMacro(
                                                        DOM.encoder.increased,
                                                        'wait'
                                                    ),
                                            },
                                        }),
                                    ],
                                }),
                                utils.create({
                                    type: 'span',
                                    text: 'Encoder decrease: ',
                                    attributes: {
                                        class: 'dialog-encoder',
                                    },
                                }),
                                utils.create({
                                    attributes: {
                                        class: 'dialog-macros dialog-encoder',
                                    },
                                    children: [
                                        (DOM.encoder.decreased = utils.create({
                                            type: 'div',
                                            attributes: {
                                                class: 'dialog-encoder dialog-sortable',
                                            },
                                        })),
                                        utils.create({
                                            type: 'i',
                                            attributes: {
                                                class: 'dialog-button add fa-solid fa-plus',
                                            },
                                            events: {
                                                click: () =>
                                                    this._appendSingleMacro(
                                                        DOM.encoder.decreased,
                                                        'wait'
                                                    ),
                                            },
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

    removeDOM() {
        this.DOM.container.parentNode.removeChild(this.DOM.container);
    }

    _onChangeType() {
        const type = this.DOM.type.value;

        this.DOM.dialog.classList.remove('blank', 'macro', 'group');
        this.DOM.dialog.classList.add(type);
    }

    _initSortableMacroLists(container, group) {
        new Sortable(container, {
            group: group,
            handle: '.macro-entry-handle',
            animation: 150,
        });
    }

    _appendSingleMacro(container, type) {
        const entry = getMacroByType(type);
        entry.instance.addAdditionalControls();

        utils.appendElements(container, [entry]);
    }

    _appendMultipleMacros(container, content) {
        const entries = content.map((value) => {
            const entry = getMacroByValue(value);
            entry.instance.addAdditionalControls();
            return entry;
        });
        utils.appendElements(container, entries);
    }

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

export { EditDialog };
