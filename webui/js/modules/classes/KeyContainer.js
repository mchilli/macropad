'use strict';

import * as utils from '../utils.js';

/**
 * Represents a KeyContainer class for managing keyboard keys.
 * @class KeyContainer
 */
export default class KeyContainer {
    /**
     * Creates an instance of KeyContainer.
     * @constructor
     * @param {Object} options - The options for initializing the KeyContainer.
     * @param {string} [options.type='blank'] - The type of the key container.
     * @param {string} [options.label=''] - The label for the key container.
     * @param {number[]} [options.color=[255, 255, 255]] - The color of the key container.
     * @param {Array} [options.content=[]] - The content of the key container.
     * @param {Object} [options.encoder={}] - The encoder configuration.
     * @param {Function} [options.onButtonPressed=()=>{}] - The callback function for button presses.
     */
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

        const defaultEncoder = {
            switch: [],
            increased: [],
            decreased: [],
        };
        this.encoder = { ...defaultEncoder, ...encoder };

        this.onButtonPressed = onButtonPressed;

        this.DOM = this._initDOM();
        this.setType(this.type);

        return this.DOM.container;
    }

    /**
     * Initializes the DOM elements for the KeyContainer.
     * @returns {Object} - An object containing DOM elements.
     */
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
                    events: {
                        click:
                            this.type === 'close'
                                ? (event) => this.onButtonPressed(event, this, 'close')
                                : undefined,
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
                                click: (event) => this.onButtonPressed(event, this, 'delete'),
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
                                click: (event) => this.onButtonPressed(event, this, 'open'),
                            },
                        }),
                        utils.create({
                            attributes: {
                                title: 'Edit',
                                class: 'button edit',
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
                                click: (event) => this.onButtonPressed(event, this, 'edit'),
                            },
                        }),
                    ],
                }),
            ],
        });

        DOM.container.instance = this;

        return DOM;
    }

    /**
     * Clears the data of the KeyContainer instance.
     */
    clearData() {
        this.setType();
        this.setLabel();
        this.setColor();
        this.setContent();
        this.setEncoder();
    }

    /**
     * Retrieves the data associated with the KeyContainer.
     * @returns {Object} - The data associated with the KeyContainer.
     */
    getData() {
        switch (this.type) {
            case 'blank':
                return {
                    type: this.type,
                };
            case 'close':
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

    /**
     * Retrieves all data associated with the KeyContainer.
     * @returns {Object} - The data associated with the KeyContainer.
     */
    getAllData() {
        return {
            type: this.type,
            color: this.color,
            label: this.label,
            content: this.content,
            encoder: this.encoder,
        };
    }

    /**
     * Sets the type of the KeyContainer.
     * @param {string} [type='blank'] - The type to set for the KeyContainer.
     */
    setType(type = 'blank') {
        this.type = type;
        this.DOM.container.classList.remove('blank', 'macro', 'group');
        this.DOM.container.classList.add(this.type);

        this.DOM.type.classList.toggle('invisible', this.type === 'blank');
        this.DOM.type.title = utils.capitalize(this.type);
        this.DOM.type.children[0].className = this._getTypeIcon();
    }

    /**
     * Returns the CSS class for the type icon based on the KeyContainer's type.
     * @returns {string} - The CSS class for the type icon.
     */
    _getTypeIcon() {
        switch (this.type) {
            case 'blank':
                return '';
            case 'close':
            case 'macro':
                return 'fa-solid fa-gear';
            case 'group':
                return 'fa-solid fa-folder';

            default:
                break;
        }
    }

    /**
     * Sets the label for the KeyContainer.
     * @param {string} [label=''] - The label to set for the KeyContainer.
     */
    setLabel(label = '') {
        this.label = label;
        this.DOM.label.innerText = this.label;
    }

    /**
     * Sets the color for the KeyContainer.
     * @param {number[]} [color=[255, 255, 255]] - The color to set for the KeyContainer.
     */
    setColor(color = [255, 255, 255]) {
        this.color = color;
        const [r, g, b] = this.color;
        utils.style(this.DOM.container, {
            'background-color': `rgb(${r},${g},${b})`,
        });
    }

    /**
     * Sets the content for the KeyContainer.
     * @param {Array} [content=[]] - The content to set for the KeyContainer.
     */
    setContent(content = []) {
        this.content = content;
    }

    /**
     * Sets the encoder configuration for the KeyContainer.
     * @param {Object} [encoder={switch: [], increased: [], decreased: []}] - The encoder configuration to set.
     */
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
