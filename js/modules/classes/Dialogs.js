'use strict';

import Sortable from './Sortable.js';

import { getMacroEntry } from './MacroDict.js';

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
                                class: 'dialog-inputs',
                            },
                            children: [
                                utils.create({
                                    type: 'span',
                                    text: 'Select type: ',
                                    attributes: {
                                        class: 'type',
                                    },
                                }),
                                (DOM.type = utils.create({
                                    type: 'select',
                                    attributes: {
                                        class: 'type',
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
                                        class: 'label',
                                    },
                                }),
                                (DOM.label = utils.create({
                                    type: 'input',
                                    attributes: {
                                        class: 'label',
                                        title: 'The label cannot be longer than 6 characters',
                                        maxlength: 6,
                                    },
                                })),
                                utils.create({
                                    type: 'span',
                                    text: 'Color: ',
                                    attributes: {
                                        class: 'color',
                                    },
                                }),
                                (DOM.color = utils.create({
                                    type: 'input',
                                    attributes: {
                                        type: 'color',
                                        class: 'color',
                                    },
                                })),
                                utils.create({
                                    type: 'span',
                                    text: 'Content: ',
                                    attributes: {
                                        class: 'content',
                                    },
                                }),
                                (DOM.content = utils.create({
                                    type: 'div',
                                    attributes: {
                                        class: 'content dialog-sortable',
                                    },
                                })),
                                utils.create({
                                    type: 'span',
                                    text: 'Encoder switch: ',
                                    attributes: {
                                        class: 'encoder',
                                    },
                                }),
                                (DOM.encoder.switch = utils.create({
                                    type: 'div',
                                    attributes: {
                                        class: 'encoder dialog-sortable',
                                    },
                                })),
                                utils.create({
                                    type: 'span',
                                    text: 'Encoder increase: ',
                                    attributes: {
                                        class: 'encoder',
                                    },
                                }),
                                (DOM.encoder.increased = utils.create({
                                    type: 'div',
                                    attributes: {
                                        class: 'encoder dialog-sortable',
                                    },
                                })),
                                utils.create({
                                    type: 'span',
                                    text: 'Encoder decrease: ',
                                    attributes: {
                                        class: 'encoder',
                                    },
                                }),
                                (DOM.encoder.decreased = utils.create({
                                    type: 'div',
                                    attributes: {
                                        class: 'encoder dialog-sortable',
                                    },
                                })),
                                (DOM.macroList = utils.create({
                                    attributes: {
                                        class: 'macro-list',
                                    },
                                })),
                            ],
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

    _appendMacroEntries(container, content, group) {
        utils.appendElements(
            container,
            content.map((value) => {
                const entry = getMacroEntry(value);
                entry.instance.addAdditionalControls();
                return entry;
            })
        );
        new Sortable(container, {
            group: group,
            handle: '.macro-entry-handle',
            animation: 150,
        });
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

        switch (key.type) {
            case 'macro':
                this._appendMacroEntries(DOM.content, key.content, 'content');
                break;
            case 'group':
                this._appendMacroEntries(DOM.encoder.switch, key.encoder.switch, 'encoder');
                this._appendMacroEntries(DOM.encoder.decreased, key.encoder.decreased, 'encoder');
                this._appendMacroEntries(DOM.encoder.increased, key.encoder.increased, 'encoder');
                break;

            default:
                break;
        }
    }
}

export { EditDialog };
