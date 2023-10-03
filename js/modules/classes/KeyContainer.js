'use strict';

import * as utils from '../utils.js';

export default class KeyContainer {
    constructor({
        type = 'blank',
        label = '',
        color = [255, 255, 255],
        content = [],
        encoder = {
            switch: [],
            increased: [],
            decreased: [],
        },
        onButtonPressed = () => {},
    } = {}) {
        this.type = type;
        this.label = label;
        this.color = color;
        this.content = content;
        this.encoder = encoder;
        this.onButtonPressed = onButtonPressed;

        this.DOM = this._initDOM();
        this.setType(this.type);

        return this.DOM.container;
    }

    _initDOM() {
        let DOM = {};

        const [r, g, b] = this.color;
        const style = `background-color: rgb(${r},${g},${b})`;

        DOM.container = utils.create({
            attributes: {
                class: 'key-container',
                style: style,
            },
            children: [
                (DOM.type = utils.create({
                    attributes: {
                        title: utils.capitalize(this.type),
                        class: 'key-type-icon',
                    },
                    children: [
                        utils.create({
                            type: 'i',
                            attributes: {
                                class: this._getTypeIcon(),
                            },
                        }),
                    ],
                })),
                utils.create({
                    attributes: {
                        title: 'Move',
                        class: 'key-handle button',
                    },
                    children: [
                        utils.create({
                            type: 'i',
                            attributes: {
                                class: 'fa-solid fa-up-down-left-right',
                            },
                        }),
                    ],
                }),
                (DOM.label = utils.create({
                    text: this.label,
                    attributes: {
                        class: 'key-label',
                    },
                })),
                utils.create({
                    attributes: {
                        class: 'key-controls',
                    },
                    children: [
                        utils.create({
                            attributes: {
                                title: 'Delete',
                                class: 'button delete',
                            },
                            children: [
                                utils.create({
                                    type: 'i',
                                    attributes: {
                                        class: 'fa-solid fa-trash',
                                    },
                                }),
                            ],
                            events: {
                                click: () => this.onButtonPressed(this, 'delete'),
                            },
                        }),
                        utils.create({
                            attributes: {
                                title: 'Open group',
                                class: 'button open',
                            },
                            children: [
                                utils.create({
                                    type: 'i',
                                    attributes: {
                                        class: 'fa-solid fa-folder-open',
                                    },
                                }),
                            ],
                            events: {
                                click: () => this.onButtonPressed(this, 'open'),
                            },
                        }),
                        utils.create({
                            attributes: {
                                title: 'Edit',
                                class: 'button',
                            },
                            children: [
                                utils.create({
                                    type: 'i',
                                    attributes: {
                                        class: 'fa-solid fa-pen',
                                    },
                                }),
                            ],
                            events: {
                                click: () => this.onButtonPressed(this, 'edit'),
                            },
                        }),
                    ],
                }),
            ],
        });

        DOM.container.instance = this;

        return DOM;
    }

    clearData() {
        this.setType();
        this.setLabel();
        this.setColor();
        this.setContent();
        this.setEncoder();
    }

    getData() {
        switch (this.type) {
            case 'blank':
                return {
                    type: this.type,
                };
            case 'macro':
                return {
                    type: this.type,
                    color: this.color,
                    label: this.label,
                    content: this.content,
                };
            case 'group':
                return {
                    type: this.type,
                    color: this.color,
                    label: this.label,
                    content: this.content,
                    encoder: this.encoder,
                };
        }
    }

    setType(type = 'blank') {
        this.type = type;
        this.DOM.container.classList.remove('blank', 'macro', 'group');
        this.DOM.container.classList.add(this.type);

        this.DOM.type.classList.toggle('invisible', this.type === 'blank');
        this.DOM.type.title = utils.capitalize(this.type);
        this.DOM.type.children[0].className = this._getTypeIcon();
    }

    _getTypeIcon() {
        switch (this.type) {
            case 'blank':
                return '';
            case 'macro':
                return 'fa-solid fa-gear';
            case 'group':
                return 'fa-solid fa-folder';

            default:
                break;
        }
    }

    setLabel(label = '') {
        this.label = label;
        this.DOM.label.innerText = this.label;
    }

    setColor(color = [255, 255, 255]) {
        this.color = color;
        const [r, g, b] = this.color;
        utils.style(this.DOM.container, {
            'background-color': `rgb(${r},${g},${b})`,
        });
    }

    setContent(content = []) {
        this.content = content;
    }

    setEncoder(
        encoder = {
            switch: [],
            increased: [],
            decreased: [],
        }
    ) {
        this.encoder = encoder;
    }
}
