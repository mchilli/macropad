'use strict';

import KeyContainer from './modules/classes/KeyContainer.js';
import SerialConnectionHandler from './modules/classes/SerialConnectionHandler.js';
import Sortable from './modules/classes/Sortable.js';

import * as utils from './modules/utils.js';

class App {
    constructor({
        appControlsContainer = undefined,
        deviceControlsContainer = undefined,
        chunkSize: chunkSize = 9,
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

        this.keyChunkSize = chunkSize;
        this.keyChunkPage = 0;

        this.keyEntriesContainer = keyEntriesContainer;
        this.keyEntriesSortable = this._initKeyChunkSortable(this.keyEntriesContainer);
        this.keyEntriesControls = this._initKeyChunkControls(keyEntriesControlsContainer);

        this._createEmptyKeyEntries();
    }

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

    _serialReceivedData(payload) {
        if ('ERR' in payload) {
            console.warn('Error: ' + payload.ERR);
        } else if ('ACK' in payload) {
            let response;

            switch (payload.ACK) {
                case 'macros':
                    this._clearAllKeyEntries();

                    let importedMacros = payload.CONTENT;

                    // if importedMacros not a multiple of nine, push blank macros
                    const modDiff = importedMacros.length % this.keyChunkSize;
                    if (modDiff !== 0) {
                        let difference = this.keyChunkSize - modDiff;
                        for (let i = 0; i < difference; i++) {
                            importedMacros.push({ type: 'blank' });
                        }
                    }

                    this.macroStack.push(importedMacros);

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

    _serialConnectionChanged(connected) {
        this.deviceConnected = connected;
        this.appControls.connection.innerHTML = this.deviceConnected ? 'disconnect' : 'connect';
        this.deviceControlsContainer.classList.toggle('hidden', !this.deviceConnected);
    }

    _appendControlNodes(container, controls) {
        controls.forEach((element) => container.appendChild(element));
    }

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

    _appControlsHandler(command) {
        switch (command) {
            case 'connection':
                this.deviceConnected ? this.serialConnection.close() : this._initSerialConnection();
                break;
            case 'new':
                this._createEmptyKeyEntries();
                break;

            default:
                console.error(`appControlsHandler - unkown button: ${command}`);
                break;
        }
    }

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
                    let macros = [];
                    this.keyEntriesContainer.childNodes.forEach((key) => {
                        macros.push(key.instance.getData());
                    });

                    await this.serialConnection.send({
                        command: 'set_macros',
                        content: macros,
                    });
                    console.log(macros);
                } catch (e) {
                    console.error('can`t parse json string');
                }
                // console.log(JSON.stringify(macros));
                break;

            default:
                console.error(`deviceControlsHandler - unkown button: ${button}`);
                break;
        }
    }

    _initKeyChunkControls(container) {
        let keyChunkControls = {
            next: utils.create({
                text: '>',
                attributes: {
                    class: 'button',
                },
                events: {
                    click: () => this._keyChunkControlsHandler('next'),
                },
            }),
            back: utils.create({
                text: '<',
                attributes: {
                    class: 'button',
                },
                events: {
                    click: () => this._keyChunkControlsHandler('back'),
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

    _keyChunkControlsHandler(button) {
        switch (button) {
            case 'next':
                this.keyChunkPage++;
                this.keyChunkPage >
                this.keyEntriesContainer.childNodes.length / this.keyChunkSize - 1
                    ? this._appendEmptyKeyEntries()
                    : this._updateKeyChunkPage();

                break;

            case 'back':
                if (this.keyChunkPage > 0) {
                    this.keyChunkPage--;
                    this._removeLastEmptyKeyChunk();
                }
                break;

            default:
                console.error(`keyChunkControlsHandler - unkown button: ${button}`);
                break;
        }
        this._updateKeyChunkPage();
    }

    _initKeyChunkSortable(container) {
        return new Sortable(container, {
            onStart: (event) => {},
            onEnd: (event) => {
                // let macros = [];
                // this.keyEntriesContainer.childNodes.forEach((key) => {
                //     macros.push(key.instance.getData());
                // });
                // console.log(JSON.stringify(macros));
            },
        });
    }

    keyControlHandler(keyInstance, button) {
        for (const key of this.keyEntriesContainer.childNodes) {
            if (key === keyInstance.DOM.container) {
                console.log(key);
                break;
            }
        }
    }

    _initializeKeys() {
        const currentMacroStack = this.macroStack[this.macroStack.length - 1];

        currentMacroStack.forEach((key) => {
            this._appendKeysToContainer(key);
        });

        this._updateKeyChunkPage();
    }

    _emptyKeyEntry() {
        return { type: 'blank' };
    }

    _createEmptyKeyEntries() {
        this._clearAllKeyEntries();

        const emptyKeys = Array(this.keyChunkSize)
            .fill()
            .map(() => this._emptyKeyEntry());

        this.macroStack.push(emptyKeys);

        this._initializeKeys();
    }

    _appendEmptyKeyEntries() {
        const currentMacroStack = this.macroStack[this.macroStack.length - 1];
        const emptyKeys = Array(this.keyChunkSize)
            .fill()
            .map(() => this._emptyKeyEntry());

        currentMacroStack.push(...emptyKeys);

        emptyKeys.forEach((key) => {
            this._appendKeysToContainer(key);
        });

        this._updateKeyChunkPage();
    }

    _appendKeysToContainer(key) {
        this.keyEntriesContainer.appendChild(
            new KeyContainer({
                ...key,
                onButtonPressed: this.keyControlHandler.bind(this),
            })
        );
    }

    _updateKeyChunkPage() {
        for (let i = 0; i < this.keyEntriesContainer.childNodes.length; i++) {
            const key = this.keyEntriesContainer.childNodes[i];
            if (
                i < this.keyChunkSize * this.keyChunkPage ||
                i >= this.keyChunkSize * (this.keyChunkPage + 1)
            ) {
                key.instance.hide();
            } else {
                key.instance.show();
            }
        }

        const pageCount = this.keyEntriesContainer.childNodes.length / this.keyChunkSize;
        this.keyEntriesControls.page.innerHTML = `${this.keyChunkPage + 1} / ${pageCount}`;
    }

    _removeLastEmptyKeyChunk() {
        const keyChunks = Array.from(this.keyEntriesContainer.childNodes);

        if (keyChunks.length <= this.keyChunkSize) {
            return;
        }

        const lastKeyChunk = keyChunks.slice(-this.keyChunkSize);
        if (lastKeyChunk.every((key) => key.instance.type === 'blank')) {
            lastKeyChunk.forEach((key) => this.keyEntriesContainer.removeChild(key));

            const lastMacros = this.macroStack[this.macroStack.length - 1];
            this.macroStack[this.macroStack.length - 1] = lastMacros.slice(
                0,
                lastMacros.length - this.keyChunkSize
            );
        }
    }

    _clearAllKeyEntries() {
        this.macroStack = [];
        this.keyEntriesContainer.innerHTML = '';
        this.keyChunkPage = 0;
    }
}

const app = new App({
    appControlsContainer: document.querySelector('.app-controls-container'),
    deviceControlsContainer: document.querySelector('.device-controls-container'),
    chunkSize: 9,
    keyEntriesContainer: document.querySelector('.key-entries-container'),
    keyEntriesControlsContainer: document.querySelector('.key-entries-controls-container'),
});

window.app = app;
