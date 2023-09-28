'use strict';

import KeyContainer from './modules/classes/KeyContainer.js';
import SerialConnectionHandler from './modules/classes/SerialConnectionHandler.js';
import Sortable from './modules/classes/Sortable.js';

import * as utils from './modules/utils.js';

class App {
    /**
     * Constructor for the App class.
     * @param {Object} options - Configuration options.
     * @param {Element} options.appControlsContainer - Container for application controls.
     * @param {Element} options.deviceControlsContainer - Container for device controls.
     * @param {number} options.keyChunkSize - Size of key chunks.
     * @param {Element} options.keyEntriesContainer - Container for key entries.
     * @param {Element} options.keyEntriesControlsContainer - Container for key entry controls.
     */
    constructor({
        appControlsContainer = undefined,
        deviceControlsContainer = undefined,
        keyChunkSize = 9,
        keyEntriesContainer = undefined,
        keyEntriesControlsContainer = undefined,
    } = {}) {
        this.macroStack = [];
        this.appControlsContainer = appControlsContainer;
        this.appControls = this._initAppControls(this.appControlsContainer);

        this.deviceConnected = false;
        this.serialConnection = null;
        this.deviceControlsContainer = deviceControlsContainer;
        this.deviceControls = this._initDeviceControls(this.deviceControlsContainer);

        this.keyChunkSize = keyChunkSize;
        this.keyChunkPage = 0;

        this.keyEntriesContainer = keyEntriesContainer;
        this.keyEntriesSortable = this._initKeyChunkSortable(this.keyEntriesContainer);
        this.keyEntriesControls = this._initKeyChunkControls(keyEntriesControlsContainer);

        this._newEmptyKeyEntries();
    }

    /**
     * Initializes the serial connection if available.
     */
    async _initSerialConnection() {
        if ('serial' in navigator) {
            try {
                const port = await navigator.serial.requestPort();
                this.serialConnection = new SerialConnectionHandler({
                    port,
                    onReceived: (payload) => this._serialReceivedData(payload),
                    onConnectionChanged: (connected) => this._serialConnectionChanged(connected),
                });
            } catch (e) {
                console.warn('Error: No port selected');
            }
        }
    }

    /**
     * Handles received data from the serial connection.
     * @param {Object} payload - The received payload.
     */
    _serialReceivedData(payload) {
        if ('ERR' in payload) {
            console.warn('Error: ' + payload.ERR);
        } else if ('ACK' in payload) {
            let response;

            switch (payload.ACK) {
                case 'macros':
                    this._clearAllKeyEntries();
                    this.macroStack = [];

                    let importedMacros = payload.CONTENT;

                    this.macroStack.push(this._fillUpKeysEntries(importedMacros));

                    this._initializeKeys();

                    response = JSON.stringify(importedMacros);
                    break;
                default:
                    response = payload.ACK;
                    break;
            }
            // console.log('Response: ' + response);
        }
    }

    /**
     * Handles changes in the serial connection status.
     * @param {boolean} connected - Indicates whether the device is connected.
     * @private
     */
    _serialConnectionChanged(connected) {
        this.deviceConnected = connected;
        this.appControls.connection.innerHTML = this.deviceConnected ? 'disconnect' : 'connect';
        this.deviceControlsContainer.classList.toggle('hidden', !this.deviceConnected);
    }

    /**
     * Appends a list of control elements to a specified container.
     * @param {Element} container - The container element to which the controls will be appended.
     * @param {Array} controls - An array of control elements to append.
     */
    _appendControlNodes(container, controls) {
        for (const element of controls) {
            container.appendChild(element);
        }
    }

    /**
     * Initializes the application controls.
     * @param {Element} container - Container for application controls.
     * @returns {Object} - The initialized application control buttons.
     */
    _initAppControls(container) {
        let appControls = {
            connection: utils.create({
                text: 'connect',
                attributes: {
                    class: 'button',
                },
                events: {
                    click: () => this._appControlsHandler('connection'),
                },
            }),
            new: utils.create({
                text: 'new',
                attributes: {
                    class: 'button',
                },
                events: {
                    click: () => this._appControlsHandler('new'),
                },
            }),
        };

        this._appendControlNodes(container, [appControls.new, appControls.connection]);

        return appControls;
    }

    /**
     * Handles button actions for the application controls.
     * @param {string} command - The command associated with the button action.
     */
    _appControlsHandler(command) {
        switch (command) {
            case 'connection':
                this.deviceConnected ? this.serialConnection.close() : this._initSerialConnection();
                break;
            case 'new':
                this._newEmptyKeyEntries();
                break;

            default:
                console.error(`appControlsHandler - unkown button: ${command}`);
                break;
        }
    }

    /**
     * Initializes the device controls.
     * @param {Element} container - Container for device controls.
     * @returns {Object} - The initialized device control buttons.
     */
    _initDeviceControls(container) {
        let deviceControls = {
            download: utils.create({
                text: 'download',
                attributes: {
                    class: 'button',
                },
                events: {
                    click: () => this._deviceControlsHandler('get_macros'),
                },
            }),
            upload: utils.create({
                text: 'upload',
                attributes: {
                    class: 'button',
                },
                events: {
                    click: () => this._deviceControlsHandler('set_macros'),
                },
            }),
            save: utils.create({
                text: 'save',
                attributes: {
                    class: 'button',
                },
                events: {
                    click: () => this._deviceControlsHandler('save_macros'),
                },
            }),
            softreset: utils.create({
                text: 'soft reset',
                attributes: {
                    class: 'button',
                },
                events: {
                    click: () => this._deviceControlsHandler('soft_reset'),
                },
            }),
            hardreset: utils.create({
                text: 'hard reset',
                attributes: {
                    class: 'button',
                },
                events: {
                    click: () => this._deviceControlsHandler('hard_reset'),
                },
            }),
            enableusb: utils.create({
                text: 'enable USB',
                attributes: {
                    class: 'button',
                },
                events: {
                    click: () => this._deviceControlsHandler('enable_usb'),
                },
            }),
        };

        this._appendControlNodes(container, [
            deviceControls.download,
            deviceControls.upload,
            deviceControls.save,
            deviceControls.softreset,
            deviceControls.hardreset,
            deviceControls.enableusb,
        ]);

        return deviceControls;
    }

    /**
     * Handles button actions for the device controls.
     * @param {string} command - The command associated with the button action.
     */
    async _deviceControlsHandler(command) {
        if (!this.deviceConnected) return;
        switch (command) {
            case 'get_macros':
            case 'save_macros':
            case 'soft_reset':
            case 'hard_reset':
            case 'enable_usb':
                await this.serialConnection.send({
                    command: command,
                });
                break;
            case 'set_macros':
                try {
                    // await this.serialConnection.send({
                    //     command: 'set_macros',
                    //     content: this.macroStack[0],
                    // });
                    console.log(this.macroStack[0]);
                } catch (e) {
                    console.error('can`t parse json string');
                }
                // console.log(JSON.stringify(macros));
                break;

            default:
                console.error(`deviceControlsHandler - unkown button: ${command}`);
                break;
        }
    }

    /**
     * Initializes the key chunk controls.
     * @param {Element} container - Container for key chunk controls.
     * @returns {Object} - The initialized key chunk control buttons.
     */
    _initKeyChunkControls(container) {
        let keyChunkControls = {
            next: utils.create({
                text: '>',
                attributes: {
                    class: 'button',
                },
                events: {
                    click: () => this._keyChunkControlsHandler('next'),
                    dragenter: () => this._keyChunkControlsHandler('nextdrag'),
                },
            }),
            back: utils.create({
                text: '<',
                attributes: {
                    class: 'button',
                },
                events: {
                    click: () => this._keyChunkControlsHandler('back'),
                    dragenter: () => this._keyChunkControlsHandler('backdrag'),
                },
            }),
            page: utils.create({
                attributes: {
                    class: 'info',
                },
            }),
        };

        this._appendControlNodes(container, [
            keyChunkControls.back,
            keyChunkControls.page,
            keyChunkControls.next,
        ]);

        return keyChunkControls;
    }

    /**
     * Handles button actions for key chunk controls.
     * @param {string} command - The command associated with the button action.
     */
    _keyChunkControlsHandler(command) {
        switch (command) {
            case 'next':
            case 'nextdrag':
                this.keyChunkPage++;
                if (
                    this.keyChunkPage >
                    this.keyEntriesContainer.childNodes.length / this.keyChunkSize - 1
                ) {
                    this._appendEmptyKeyEntries();
                } else {
                    this._updateKeyChunkPage();
                }
                break;
            case 'back':
                if (this.keyChunkPage > 0) {
                    this.keyChunkPage--;
                    this._removeLastEmptyKeyChunk();
                    this._updateKeyChunkPage();
                } else if (this.keyChunkPage === 0 && this.macroStack.length > 1) {
                    this.macroStack.pop();
                    this._clearAllKeyEntries();
                    this._initializeKeys();
                }
                break;
            case 'backdrag':
                if (this.keyChunkPage > 0) {
                    this.keyChunkPage--;
                    this._updateKeyChunkPage();
                }
                break;

            default:
                console.error(`keyChunkControlsHandler - unkown button: ${command}`);
                break;
        }
    }

    /**
     * Initializes the sortable key entries container.
     * @param {Element} container - Container for sortable key entries.
     * @returns {Sortable} - The initialized Sortable instance.
     */
    _initKeyChunkSortable(container) {
        return new Sortable(container, {
            handle: '.key-handle',
            animation: 150,
            onStart: (event) => {},
            onEnd: (event) => {
                this._reReadKeyEntries();

                const pageCount = this.keyEntriesContainer.childNodes.length / this.keyChunkSize;
                const pagesToRemove = pageCount - this.keyChunkPage - 1;

                for (let i = 0; i < pagesToRemove; i++) {
                    this._removeLastEmptyKeyChunk();
                }

                this._updateKeyChunkPage();
            },
        });
    }

    /**
     * Handles button actions for individual key entries.
     * @param {KeyContainer} keyInstance - The KeyContainer instance associated with the button.
     * @param {string} command - The command associated with the button action.
     */
    keyControlsHandler(keyInstance, command) {
        switch (command) {
            case 'edit':
                break;
            case 'open':
                for (const [i, key] of this.keyEntriesContainer.childNodes.entries()) {
                    if (key === keyInstance.DOM.container) {
                        let macros = this.macroStack[this.macroStack.length - 1][i].content;
                        this.macroStack.push(this._fillUpKeysEntries(macros));
                        break;
                    }
                }
                this._clearAllKeyEntries();
                this._initializeKeys();
                break;
            case 'delete':
                keyInstance.clear();
                this._reReadKeyEntries();
                break;

            default:
                console.error(`keyControlsHandler - unkown button: ${command}`);
                break;
        }
    }

    /**
     * Updates the content of the `macroStack` array based on data extracted from keyEntriesContainer
     */
    _reReadKeyEntries() {
        let macros = [];
        for (const key of this.keyEntriesContainer.childNodes) {
            macros.push(key.instance.getData());
        }

        const lastIndex = this.macroStack.length - 1;
        this.macroStack[lastIndex].splice(0, this.macroStack[lastIndex].length, ...macros);
    }

    /**
     * Initializes the keys and appends them to the key entries container.
     */
    _initializeKeys() {
        const currentMacroStack = this.macroStack[this.macroStack.length - 1];

        for (const key of currentMacroStack) {
            this._appendKeysToContainer(key);
        }

        this._updateKeyChunkPage();
    }

    /**
     * Generates an empty key entry.
     * @returns {Object} - The empty key entry.
     */
    _emptyKeyEntry() {
        return { type: 'blank' };
    }

    /**
     * Clear all macros and creates complete new empty key entries.
     */
    _newEmptyKeyEntries() {
        this._clearAllKeyEntries();
        this.macroStack = [];

        const emptyKeys = Array(this.keyChunkSize)
            .fill()
            .map(() => this._emptyKeyEntry());

        this.macroStack.push(emptyKeys);

        this._initializeKeys();
    }

    /**
     * Appends empty key entries to the current macro stack.
     */
    _appendEmptyKeyEntries() {
        const currentMacroStack = this.macroStack[this.macroStack.length - 1];
        const emptyKeys = Array(this.keyChunkSize)
            .fill()
            .map(() => this._emptyKeyEntry());

        currentMacroStack.push(...emptyKeys);

        for (const key of emptyKeys) {
            this._appendKeysToContainer(key);
        }

        this._updateKeyChunkPage();
    }

    /**
     * Fills up the macro stack with blank macros if needed.
     * @param {Array} macros - The macros to be filled up.
     * @returns {Array} - The filled-up macros.
     */
    _fillUpKeysEntries(macros) {
        // if macros not a multiple of nine, push blank macros
        const modDiff = macros.length % this.keyChunkSize;
        if (modDiff !== 0) {
            let difference = this.keyChunkSize - modDiff;
            for (let i = 0; i < difference; i++) {
                macros.push({ type: 'blank' });
            }
        }

        return macros;
    }

    /**
     * Appends key containers to the key entries container.
     * @param {Object} key - The key data to create a KeyContainer instance.
     */
    _appendKeysToContainer(key) {
        this.keyEntriesContainer.appendChild(
            new KeyContainer({
                ...key,
                onButtonPressed: this.keyControlsHandler.bind(this),
            })
        );
    }

    /**
     * Updates the current key chunk page and visibility.
     */
    _updateKeyChunkPage() {
        const keyContainerOffset = this.keyEntriesContainer.offsetTop;
        const firstChunkItemIndex = this.keyChunkPage * this.keyChunkSize + 1;
        const firstChunkItemOffset =
            this.keyEntriesContainer.childNodes[firstChunkItemIndex].offsetTop;

        this.keyEntriesContainer.scrollTop = firstChunkItemOffset - keyContainerOffset;

        const pageCount = this.keyEntriesContainer.childNodes.length / this.keyChunkSize;
        this.keyEntriesControls.page.innerHTML = `${this.keyChunkPage + 1} / ${pageCount}`;
    }

    /**
     * Removes the last empty key chunk if possible.
     */
    _removeLastEmptyKeyChunk() {
        const keyChunks = Array.from(this.keyEntriesContainer.childNodes);

        if (keyChunks.length <= this.keyChunkSize) {
            return;
        }

        const lastKeyChunk = keyChunks.slice(-this.keyChunkSize);
        if (lastKeyChunk.every((key) => key.instance.type === 'blank')) {
            for (const key of lastKeyChunk) {
                this.keyEntriesContainer.removeChild(key);
            }

            this.macroStack[this.macroStack.length - 1].splice(
                -this.keyChunkSize,
                this.keyChunkSize
            );
        }
    }

    /**
     * Clears all key entries from the key entries container.
     */
    _clearAllKeyEntries() {
        this.keyEntriesContainer.innerHTML = '';
        this.keyChunkPage = 0;
    }
}

// Initialize the App instance.
const app = new App({
    appControlsContainer: document.querySelector('.app-controls'),
    deviceControlsContainer: document.querySelector('.device-controls'),
    keyChunkSize: 9,
    keyEntriesContainer: document.querySelector('.key-entries'),
    keyEntriesControlsContainer: document.querySelector('.key-entries-controls'),
});

window.app = app;
