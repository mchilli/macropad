'use strict';

import * as utils from '../utils.js';

export default class KeyContainer {
    constructor({
        type = 'blank',
        label = '',
        color = [255, 255, 255],
        content = [],
        encoder = {},
        onButtonPressed = () => {},
    } = {}) {
        this.type = type;
        this.label = label;
        this.color = color;
        this.content = content;
        this.encoder = encoder;
        this.onButtonPressed = onButtonPressed;

        this.DOM = this._initDOM();

        return this.DOM.container;
    }

    _initDOM() {
        let DOM = {
            controls: {},
        };

        const [r, g, b] = this.color;
        const style = `background-color: rgb(${r},${g},${b})`;

        DOM.container = utils.create({
            attributes: {
                class: `key-container ${this.type}`,
                style: style,
            },
            children: [
                (DOM.label = utils.create({
                    text: this.type === 'blank' ? '' : this.label,
                    attributes: {
                        class: 'key-label',
                    },
                })),
                utils.create({
                    attributes: {
                        class: 'key-controls',
                    },
                    children: [
                        (DOM.controls.edit = utils.create({
                            text: 'edit',
                            attributes: {
                                class: 'button',
                            },
                            events: {
                                click: () => this.onButtonPressed(this, 'edit'),
                            },
                        })),
                        (DOM.controls.open = utils.create({
                            text: 'open',
                            attributes: {
                                class: 'button open',
                            },
                            events: {
                                click: () => this.onButtonPressed(this, 'open'),
                            },
                        })),
                        (DOM.controls.delete = utils.create({
                            text: 'delete',
                            attributes: {
                                class: 'button delete',
                            },
                            events: {
                                click: () => this.onButtonPressed(this, 'delete'),
                            },
                        })),
                    ],
                }),
            ],
        });

        DOM.container.instance = this;

        return DOM;
    }

    hide() {
        this.DOM.container.classList.add('hidden');
    }

    show() {
        this.DOM.container.classList.remove('hidden');
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
    }

    setLabel(label = '') {
        this.label = label;
        this.DOM.label.innerHTML = this.label;
    }

    setColor(color = [0, 0, 0]) {
        this.color = color;
        const [r, g, b] = this.color;
        utils.style(this.DOM.container, {
            'background-color': `rgb(${r},${g},${b})`,
        });
    }

    setContent(content) {
        this.content = content;
    }
}
