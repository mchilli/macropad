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
        retrigger = false,

        toggle = false,
        label2 = '',
        color2 = [255, 255, 255],
        content2 = [],

        encoder = {},
        onButtonPressed = () => {},
    } = {}) {
        this.type = type;
        this.label = label;
        this.color = color;
        this.content = content;
        this.retrigger = retrigger;

        this.toggle = toggle;
        this.label2 = label2;
        this.color2 = color2;
        this.content2 = content2;

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

        DOM.container = utils.create({
            attributes: {
                class: 'key-container',
                style: `background-color: #${utils.validateHex(this.color)}`,
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
                    events: {
                        click: (event) => event.stopPropagation(),
                    },
                })),
                utils.create({
                    attributes: {
                        title: _('Move'),
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
                    events: {
                        click: (event) => event.stopPropagation(),
                    },
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
                                title: _('Delete'),
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
                                title: _('Edit'),
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
            events: {
                click: (event) => this.onButtonPressed(event, this, this.clickEventCommand),
            },
        });

        DOM.container.instance = this;

        return DOM;
    }

    /**
     * Set the click event command based on the element's type and content.
     * If a matching action is found, it sets the corresponding command; otherwise, it sets to false.
     * If the element's type is neither 'group' nor 'macro', it sets the command to false.
     */
    _setClickEventCommand() {
        const actions = {
            close_group: 'close',
            go_to_root: 'root',
        };

        switch (this.type) {
            case 'group':
                this.clickEventCommand = 'open';
                break;
            case 'macro':
                const action = this.content.find((macro) => actions[macro.sys]);

                this.clickEventCommand = action ? actions[action.sys] : false;
                break;
            default:
                this.clickEventCommand = false;
                break;
        }

        this.DOM.container.classList.toggle('clickable', this.clickEventCommand);
    }

    /**
     * Clears the data of the KeyContainer instance.
     */
    clearData() {
        this.setType();
        this.setLabel();
        this.setColor();
        this.setContent();
        this.setRetrigger();

        this.setToggle();
        this.setLabel2();
        this.setColor2();
        this.setContent2();

        this.setEncoder();
    }

    /**
     * Retrieves the data associated with the KeyContainer.
     * Currently only used to save all macros in local storage.
     * @returns {Object} - The data associated with the KeyContainer.
     */
    getData() {
        switch (this.type) {
            case 'blank':
                return {
                    type: this.type,
                };
            case 'macro':
                const result = {
                    type: this.type,
                    label: this.label,
                    color: this.color,
                    content: this.content,
                    retrigger: this.retrigger,
                };

                // add extended fields only when toggle mode is enabled
                if (this.toggle) {
                    result.toggle = true;
                    result.label2 = this.label2;
                    result.color2 = this.color2;
                    result.content2 = this.content2;
                }

                return result;
            case 'group':
                return {
                    type: this.type,
                    label: this.label,
                    color: this.color,
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
            label: this.label,
            color: this.color,
            content: this.content,
            retrigger: this.retrigger,

            toggle: this.toggle,
            label2: this.label2,
            color2: this.color2,
            content2: this.content2,

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

        this._setClickEventCommand();

        this.DOM.type.classList.toggle('invisible', this.type === 'blank');
        this.DOM.type.title = _(utils.capitalize(this.type));
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
            case 'macro':
                return 'fa-solid fa-cubes';
            case 'group':
                return 'fa-solid fa-folder-open';

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
     * @param {string} [color='ffffff'] - The color to set for the KeyContainer.
     */
    setColor(color = 'ffffff') {
        this.color = utils.validateHex(color);
        utils.style(this.DOM.container, {
            'background-color': `#${this.color}`,
        });
    }

    /**
     * Sets the content for the KeyContainer.
     * @param {Array} [content=[]] - The content to set for the KeyContainer.
     */
    setContent(content = []) {
        this.content = content;
        this._setClickEventCommand();
    }

    /**
     * Sets the retrigger flag for the KeyContainer.
     * @param {boolean} [retrigger=false] - The retrigger flag to set for the KeyContainer.
     */
    setRetrigger(retrigger = false) {
        this.retrigger = retrigger;
    }

    /**
     * Sets the toggle flag for the KeyContainer.
     * @param {boolean} [toggle=false] - The toggle flag to set for the KeyContainer.
     */
    setToggle(toggle = false) {
        this.toggle = toggle;
    }

    /**
     * Sets the label2 for the KeyContainer.
     * @param {string} [label=''] - The label2 to set for the KeyContainer.
     */
    setLabel2(label = '') {
        this.label2 = label;
    }

    /**
     * Sets the color2 for the KeyContainer.
     * @param {string} [color='ffffff'] - The color2 to set for the KeyContainer.
     */
    setColor2(color = 'ffffff') {
        this.color2 = utils.validateHex(color);
    }

    /**
     * Sets the content2 for the KeyContainer.
     * @param {Array} [content=[]] - The content2 to set for the KeyContainer.
     */
    setContent2(content = []) {
        this.content2 = content;
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
