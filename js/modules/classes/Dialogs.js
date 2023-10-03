'use strict';

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
                                class: 'button close',
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
                                class: 'inputs',
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
                                    type: 'textarea',
                                    attributes: {
                                        class: 'content',
                                        rows: 8,
                                        cols: 50,
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
                                    type: 'textarea',
                                    attributes: {
                                        class: 'encoder',
                                        rows: 4,
                                        cols: 50,
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
                                    type: 'textarea',
                                    attributes: {
                                        class: 'encoder',
                                        rows: 4,
                                        cols: 50,
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
                                    type: 'textarea',
                                    attributes: {
                                        class: 'encoder',
                                        rows: 4,
                                        cols: 50,
                                    },
                                })),
                            ],
                        }),
                        utils.create({
                            attributes: {
                                class: 'button ok',
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

    remove() {
        this.DOM.container.parentNode.removeChild(this.DOM.container);
    }

    _onChangeType() {
        const type = this.DOM.type.value;

        this.DOM.dialog.classList.remove('blank', 'macro', 'group');
        this.DOM.dialog.classList.add(type);
    }

    _setValues() {
        for (const option of this.DOM.type.children) {
            if (this.keyInstance.type === option.value) {
                option.selected = true;
                break;
            }
        }
        this.DOM.label.value = this.keyInstance.label;
        this.DOM.color.value = utils.rgbToHex(this.keyInstance.color);
        this.DOM.content.value = JSON.stringify(this.keyInstance.content);
        this.DOM.encoder.switch.value = JSON.stringify(this.keyInstance.encoder.switch);
        this.DOM.encoder.decreased.value = JSON.stringify(this.keyInstance.encoder.decreased);
        this.DOM.encoder.increased.value = JSON.stringify(this.keyInstance.encoder.increased);
    }
}

export { EditDialog };
