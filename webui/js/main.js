/**!
 * @author	MCHilli   <https://github.com/mchilli>
 */
'use strict';

import KeyContainer from './modules/classes/KeyContainer.js';
import SerialConnectionHandler from './modules/classes/SerialConnectionHandler.js';
import Sortable from './modules/classes/Sortable.js';

import {
    EditDialog,
    ConfirmationDialog,
    SettingsDialog,
    ResetDialog,
    NotificationDialog,
} from './modules/classes/Dialogs.js';

import * as utils from './modules/utils.js';

/**
 * Represents the main application class for managing macros on a Macropad device.
 * @class
 */
class App {
    /**
     * Initializes a new instance of the App class.
     * @constructor
     * @param {Object} options - Configuration options.
     * @param {Element} options.mainContainer - Main Container for the app.
     * @param {Element} options.appControlsContainer - Container for application controls.
     * @param {Element} options.deviceControlsContainer - Container for device controls.
     * @param {Element} options.keyEntriesContainer - Container for key entries.
     * @param {Element} options.keyEntriesControlsContainer - Container for key entry controls.
     */
    constructor({
        mainContainer = undefined,
        notificationContainer = undefined,
        appControlsContainer = undefined,
        deviceControlsContainer = undefined,
        keyEntriesContainer = undefined,
        keyEntriesControlsContainer = undefined,
    } = {}) {
        this.mainContainer = mainContainer;
        this.notificationContainer = notificationContainer;

        this.macroStack = [];
        const savedMacros = localStorage.getItem('macros');
        if (savedMacros !== null) {
            try {
                this.macroStack.push(JSON.parse(savedMacros));
            } catch (e) {
                console.error('appConstructor - can`t parse json string');
            }
        }

        this.appControlsContainer = appControlsContainer;
        this.appControls = this._initAppControls(this.appControlsContainer);

        this.deviceConnected = false;
        this.USBStorageEnabled = false;
        this.serialConnection = null;
        this.deviceControlsContainer = deviceControlsContainer;
        this.deviceControls = this._initDeviceControls(this.deviceControlsContainer);

        this.keyChunkSize = 9;
        this.groupPageStack = [0];

        this.clipboard = {
            copiedKey: null,
        };
        this.keyEntriesContainer = keyEntriesContainer;
        this.keyEntriesSortable = this._initKeyChunkSortable(this.keyEntriesContainer);
        this.keyEntriesControls = this._initKeyChunkControls(keyEntriesControlsContainer);

        this.macroStack.length === 0 ? this._newKeyEntries() : this._initializeKeys();
    }

    /**
     * Initializes the serial connection if available.
     */
    async _initSerialConnection() {
        if ('serial' in navigator) {
            try {
                const port = await navigator.serial.requestPort({
                    filters: [{ usbVendorId: 0x239a }],
                });
                this.serialConnection = new SerialConnectionHandler({
                    port,
                    onReceived: (payload) => this._serialReceivedData(payload),
                    onConnectionChanged: (connected) => this._serialConnectionChanged(connected),
                });
            } catch (e) {
                console.warn('Error: No port selected');
            }
        } else {
            this._notify('error', 'Your browser does not support serial connections');
        }
    }

    /**
     * Handles received data from the serial connection.
     * @param {Object} payload - The received payload.
     */
    _serialReceivedData(payload) {
        if ('ERR' in payload) {
            this._notify('error', payload.ERR);

            console.warn('Error: ' + payload.ERR);
        } else if ('ACK' in payload) {
            let response = payload.ACK;

            switch (payload.ACK) {
                case 'macros':
                    const importedMacros = payload.CONTENT;
                    this._newKeyEntries(importedMacros);

                    this._notify('info', 'Received from macropad');
                    response = JSON.stringify(importedMacros);
                    break;
                case 'settings':
                    const importedSettings = payload.CONTENT;
                    new SettingsDialog({
                        position: {
                            anchor: 'center',
                            top: window.innerHeight / 3,
                            left: window.innerWidth / 2,
                        },
                        settings: importedSettings,
                        readonly: this.USBStorageEnabled,
                    })
                        .then(async (response) => {
                            await this.serialConnection.send({
                                command: 'set_settings',
                                content: response.settings,
                            });

                            if (!this.USBStorageEnabled) {
                                this._notify(
                                    'info',
                                    'Changed settings only take effect after a soft reset',
                                    true
                                );
                            }
                        })
                        .catch((error) => {});
                    response = JSON.stringify(importedSettings);
                    break;
                case 'usbenabled':
                    const usbenabled = payload.CONTENT;
                    this.USBStorageEnabled = usbenabled;

                    this._notify('success', 'Connected to macropad');
                    break;
                case 'Macros received':
                    this._notify('success', 'Sended to macropad');
                    break;
                case 'Macros stored':
                    this._notify('success', 'Stored on macropad');
                    break;
                case 'Settings are set':
                    this._notify('success', 'Settings set on macropad');
                    break;
                default:
                    this._notify('info', response);
                    break;
            }

            console.log(`serialReceivedData - response: ${response}`);
        }
    }

    /**
     * Handles changes in the serial connection status.
     * @param {boolean} connected - Indicates whether the device is connected.
     * @private
     */
    _serialConnectionChanged(connected) {
        this.deviceConnected = connected;
        this.appControls.connection.title = this.deviceConnected ? 'Disconnect' : 'Connect';
        this.appControls.connection.childNodes[0].className = this.deviceConnected
            ? 'fa-solid fa-link-slash'
            : 'fa-solid fa-link';
        this.appControls.connection.childNodes[1].innerText = this.deviceConnected
            ? 'Disconnect'
            : 'Connect';

        this.deviceControlsContainer.classList.toggle('hidden', !this.deviceConnected);

        if (!this.deviceConnected) {
            this._notify('info', 'Disconnected from macropad');
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
                attributes: {
                    title: 'Connect',
                    class: 'button',
                },
                children: [
                    utils.create({
                        type: 'i',
                        attributes: {
                            class: 'fa-solid fa-link',
                        },
                    }),
                    utils.create({
                        text: 'Connect',
                    }),
                ],
                events: {
                    click: (event) => this._appControlsHandler(event, 'connection'),
                },
            }),
            new: utils.create({
                attributes: {
                    title: 'New',
                    class: 'button',
                },
                children: [
                    utils.create({
                        type: 'i',
                        attributes: {
                            class: 'fa-solid fa-file',
                        },
                    }),
                    utils.create({
                        text: 'New',
                    }),
                ],
                events: {
                    click: (event) => this._appControlsHandler(event, 'new'),
                },
            }),
            save: utils.create({
                attributes: {
                    title: 'Save',
                    class: 'button',
                },
                children: [
                    utils.create({
                        type: 'i',
                        attributes: {
                            class: 'fa-solid fa-floppy-disk',
                        },
                    }),
                    utils.create({
                        text: 'Save',
                    }),
                ],
                events: {
                    click: (event) => this._appControlsHandler(event, 'save'),
                },
            }),
            open: utils.create({
                attributes: {
                    title: 'Open',
                    class: 'button',
                },
                children: [
                    utils.create({
                        type: 'i',
                        attributes: {
                            class: 'fa-solid fa-folder-open',
                        },
                    }),
                    utils.create({
                        text: 'Open',
                    }),
                ],
                events: {
                    click: (event) => this._appControlsHandler(event, 'open'),
                },
            }),
        };

        utils.appendElements(container, [
            appControls.new,
            appControls.open,
            appControls.save,
            appControls.connection,
        ]);

        return appControls;
    }

    /**
     * Handles button actions for the application controls.
     * @param {MouseEvent} event - The mouse event that triggered.
     * @param {string} command - The command associated with the button action.
     */
    _appControlsHandler(event, command) {
        const openFile = async () => {
            try {
                const content = await utils.openFile('.json');
                const importedMacros = JSON.parse(content);
                const macros = Array.isArray(importedMacros)
                    ? {
                          label: 'Macros',
                          content: importedMacros,
                      }
                    : importedMacros;

                this._newKeyEntries(macros);

                this._notify('success', 'Macros loaded from file');
            } catch (error) {
                console.error("appControlsHandler - can't parse JSON string:");
            }
        };

        switch (command) {
            case 'connection':
                if (this.deviceConnected) {
                    new ConfirmationDialog({
                        position: {
                            anchor: 'center',
                            top: event.y,
                            left: event.x,
                        },
                        title: 'Warning',
                        prompt: 'Do you really want to disconnect?',
                    })
                        .then(async (response) => {
                            this.serialConnection.close();
                        })
                        .catch((error) => {});
                } else {
                    this._initSerialConnection();
                }
                break;
            case 'new':
                if (this._allKeyEntriesEmpty()) {
                    this._notify('info', 'No macros configured');
                } else {
                    new ConfirmationDialog({
                        position: {
                            anchor: 'center',
                            top: event.y,
                            left: event.x,
                        },
                        title: 'Warning',
                        prompt: 'Do you really want to delete the current macros?',
                    })
                        .then((response) => {
                            this._newKeyEntries();
                        })
                        .catch((error) => {});
                }
                break;
            case 'save':
                if (this._allKeyEntriesEmpty()) {
                    this._notify('info', 'No macros configured');
                } else {
                    utils.downloadObjectAsJson(this.macroStack[0], 'macros.json');
                }
                break;
            case 'open':
                if (this._allKeyEntriesEmpty()) {
                    openFile();
                } else {
                    new ConfirmationDialog({
                        position: {
                            anchor: 'center',
                            top: event.y,
                            left: event.x,
                        },
                        title: 'Warning',
                        prompt: 'Do you really want to replace the current macros?',
                    })
                        .then((response) => {
                            openFile();
                        })
                        .catch((error) => {});
                }
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
                attributes: {
                    title: 'Download from Macropad',
                    class: 'button',
                },
                children: [
                    utils.create({
                        type: 'i',
                        attributes: {
                            class: 'fa-solid fa-download',
                        },
                    }),
                    utils.create({
                        text: 'Download',
                    }),
                ],
                events: {
                    click: (event) => this._deviceControlsHandler(event, 'getMacros'),
                },
            }),
            upload: utils.create({
                attributes: {
                    title: 'Upload to Macropad',
                    class: 'button',
                },
                children: [
                    utils.create({
                        type: 'i',
                        attributes: {
                            class: 'fa-solid fa-upload',
                        },
                    }),
                    utils.create({
                        text: 'Upload',
                    }),
                ],
                events: {
                    click: (event) => this._deviceControlsHandler(event, 'setMacros'),
                },
            }),
            save: utils.create({
                attributes: {
                    title: 'Store on Macropad (only stored macros are available after reset)',
                    class: 'button',
                },
                children: [
                    utils.create({
                        type: 'i',
                        attributes: {
                            class: 'fa-solid fa-hard-drive',
                        },
                    }),
                    utils.create({
                        text: 'Store',
                    }),
                ],
                events: {
                    click: (event) => this._deviceControlsHandler(event, 'saveMacros'),
                },
            }),
            settings: utils.create({
                attributes: {
                    title: 'Open the dialog with device settings',
                    class: 'button',
                },
                children: [
                    utils.create({
                        type: 'i',
                        attributes: {
                            class: 'fa-solid fa-screwdriver-wrench',
                        },
                    }),
                    utils.create({
                        text: 'Settings',
                    }),
                ],
                events: {
                    click: (event) => this._deviceControlsHandler(event, 'getSettings'),
                },
            }),
            reboot: utils.create({
                attributes: {
                    title: 'Open the dialog with reboot options',
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
                        text: 'Reboot',
                    }),
                ],
                events: {
                    click: (event) => this._deviceControlsHandler(event, 'reboot'),
                },
            }),
        };

        utils.appendElements(container, [
            deviceControls.download,
            deviceControls.upload,
            deviceControls.save,
            deviceControls.settings,
            deviceControls.reboot,
        ]);

        return deviceControls;
    }

    /**
     * Handles button actions for the device controls.
     * @param {MouseEvent} event - The mouse event that triggered.
     * @param {string} command - The command associated with the button action.
     */
    async _deviceControlsHandler(event, command) {
        if (!this.deviceConnected) return;
        const COMMANDS = {
            getMacros: 'get_macros',
            setMacros: 'set_macros',
            saveMacros: 'save_macros',
            softReset: 'soft_reset',
            hardReset: 'hard_reset',
            enableUSB: 'enable_usb',
            getSettings: 'get_settings',
            setSettings: 'set_settings',
        };

        switch (command) {
            case 'getMacros':
                if (this._allKeyEntriesEmpty()) {
                    await this.serialConnection.send({
                        command: COMMANDS[command],
                    });
                } else {
                    new ConfirmationDialog({
                        position: {
                            anchor: 'center',
                            top: event.y,
                            left: event.x,
                        },
                        title: 'Warning',
                        prompt: 'Do you really want to replace the current macros and load it from the macropad?',
                    })
                        .then(async (response) => {
                            await this.serialConnection.send({
                                command: COMMANDS[command],
                            });
                        })
                        .catch((error) => {});
                }
                break;

            case 'getSettings':
            case 'saveMacros':
            case 'softReset':
                await this.serialConnection.send({
                    command: COMMANDS[command],
                });
                break;

            case 'hardReset':
            case 'enableUSB':
                await this.serialConnection.send({
                    command: COMMANDS[command],
                });

                this.serialConnection.close();
                break;

            case 'setMacros':
                new ConfirmationDialog({
                    position: {
                        anchor: 'center',
                        top: event.y,
                        left: event.x,
                    },
                    title: 'Warning',
                    prompt: 'Do you really want to send the current macros to the macropad?',
                })
                    .then(async (response) => {
                        await this.serialConnection.send({
                            command: COMMANDS[command],
                            content: this.macroStack[0],
                        });
                    })
                    .catch((error) => {});
                break;

            case 'reboot':
                new ResetDialog({
                    position: {
                        anchor: 'center',
                        top: window.innerHeight / 3,
                        left: window.innerWidth / 2,
                    },
                })
                    .then(async (response) => {
                        this._deviceControlsHandler(response.event, response.command);
                    })
                    .catch((error) => {});
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
                attributes: {
                    class: 'button',
                },
                children: [
                    utils.create({
                        type: 'i',
                        attributes: {
                            class: 'fa-solid fa-arrow-right',
                        },
                    }),
                    utils.create({
                        text: 'Next',
                    }),
                ],
                events: {
                    click: () => this._keyChunkControlsHandler('next'),
                    dragenter: () => this._keyChunkControlsHandler('nextdrag'),
                },
            }),
            back: utils.create({
                attributes: {
                    class: 'button',
                },
                children: [
                    utils.create({
                        type: 'i',
                        attributes: {
                            class: 'fa-solid fa-arrow-left',
                        },
                    }),
                    utils.create({
                        text: 'Previous',
                    }),
                ],
                events: {
                    click: () => this._keyChunkControlsHandler('back'),
                    dragenter: () => this._keyChunkControlsHandler('backdrag'),
                },
            }),
            page: utils.create({
                attributes: {
                    class: 'info',
                },
                children: [utils.create(), utils.create()],
            }),
        };

        utils.appendElements(container, [
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
                this.groupPageStack[this.groupPageStack.length - 1]++;
                if (
                    this.groupPageStack[this.groupPageStack.length - 1] >
                    this.keyEntriesContainer.childNodes.length / this.keyChunkSize - 1
                ) {
                    this._appendEmptyKeyEntries();
                } else {
                    this._updateKeyChunkPage();
                }
                break;
            case 'back':
                if (this.groupPageStack[this.groupPageStack.length - 1] > 0) {
                    this.groupPageStack[this.groupPageStack.length - 1]--;

                    this._removeLastEmptyKeyChunk();
                    this._updateKeyChunkPage();
                } else if (
                    this.groupPageStack[this.groupPageStack.length - 1] === 0 &&
                    this.macroStack.length > 1
                ) {
                    this.macroStack.pop();
                    this.groupPageStack.pop();

                    this._clearAllKeyEntries();
                    this._initializeKeys();
                }
                break;
            case 'backdrag':
                if (this.groupPageStack[this.groupPageStack.length - 1] > 0) {
                    this.groupPageStack[this.groupPageStack.length - 1]--;
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
                const pagesToRemove =
                    pageCount - this.groupPageStack[this.groupPageStack.length - 1] - 1;

                for (let i = 0; i < pagesToRemove; i++) {
                    this._removeLastEmptyKeyChunk();
                }

                this._updateKeyChunkPage();
            },
        });
    }

    /**
     * Handles button actions for individual key entries.
     * @param {MouseEvent} event - The mouse event that triggered.
     * @param {KeyContainer} keyInstance - The KeyContainer instance associated with the button.
     * @param {string} command - The command associated with the button action.
     */
    keyControlsHandler(event, keyInstance, command) {
        switch (command) {
            case 'edit':
                new EditDialog({
                    position: {
                        anchor: 'center',
                        top: event.y,
                        left: event.x,
                    },
                    keyInstance: keyInstance,
                    clipboard: this.clipboard,
                })
                    .then((response) => {
                        this.editDialogHandler(response);
                    })
                    .catch((error) => {});
                break;
            case 'open':
                for (const [i, key] of this.keyEntriesContainer.childNodes.entries()) {
                    if (key === keyInstance.DOM.container) {
                        let macros = this.macroStack[this.macroStack.length - 1].content[i];
                        this.macroStack.push(this._fillUpKeysEntries(macros));
                        break;
                    }
                }

                this.groupPageStack.push(0);

                this._clearAllKeyEntries();
                this._initializeKeys();
                break;
            case 'delete':
                new ConfirmationDialog({
                    position: {
                        anchor: 'center',
                        top: event.y,
                        left: event.x,
                    },
                    title: 'Warning',
                    prompt: 'Do you really want to delete this key configuration?',
                })
                    .then((response) => {
                        keyInstance.clearData();
                        this._reReadKeyEntries();
                    })
                    .catch((error) => {});
                break;

            default:
                console.error(`keyControlsHandler - unkown button: ${command}`);
                break;
        }
    }

    /**
     * Handles editing a dialog's response and updates a key instance accordingly.
     * @param {Object} options - An object containing response and keyInstance properties.
     * @param {Object} options.response - The response object to be edited.
     * @param {KeyInstance} options.keyInstance - The key instance to update.
     */
    editDialogHandler({ response, keyInstance } = {}) {
        if (response.type === 'blank') {
            keyInstance.clearData();
        } else {
            for (const property in response) {
                if (Object.hasOwnProperty.call(response, property)) {
                    const value = response[property];
                    switch (property) {
                        case 'type':
                            keyInstance.setType(value);
                            break;
                        case 'label':
                            keyInstance.setLabel(value);
                            break;
                        case 'color':
                            keyInstance.setColor(value);
                            break;
                        case 'content':
                            keyInstance.setContent(value);
                            break;
                        case 'encoder':
                            keyInstance.setEncoder(value);
                            break;
                    }
                }
            }
        }
        this._reReadKeyEntries();
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
        this.macroStack[lastIndex].content.splice(
            0,
            this.macroStack[lastIndex].content.length,
            ...macros
        );

        localStorage.setItem('macros', JSON.stringify(this.macroStack[0]));
    }

    /**
     * Initializes the keys and appends them to the key entries container.
     */
    _initializeKeys() {
        const currentMacroStack = this._fillUpKeysEntries(
            this.macroStack[this.macroStack.length - 1].content
        );

        for (const key of currentMacroStack) {
            this._appendKeysToContainer(key);
        }

        this._reReadKeyEntries();
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
     * Checks if all entries in the first element of the 'macroStack' array are of type 'blank'.
     * @returns {boolean} True if all entries are of type 'blank', otherwise false.
     */
    _allKeyEntriesEmpty() {
        return this.macroStack[0].content.every((key) => key.type === 'blank');
    }

    /**
     * Clear all macros and creates complete new key entries.
     */
    _newKeyEntries(
        entries = {
            label: 'Macros',
            content: [],
        }
    ) {
        this._clearAllKeyEntries();

        this.macroStack = [entries];

        this._initializeKeys();
    }

    /**
     * Appends empty key entries to the current macro stack.
     */
    _appendEmptyKeyEntries() {
        const currentMacroStack = this.macroStack[this.macroStack.length - 1].content;
        const emptyKeys = this._fillUpKeysEntries([]);

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
        const modDiff = macros.length % this.keyChunkSize;
        if (modDiff !== 0 || macros.length === 0) {
            let difference = this.keyChunkSize - modDiff;
            for (let i = 0; i < difference; i++) {
                macros.push(this._emptyKeyEntry());
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
        const firstChunkItemIndex =
            this.groupPageStack[this.groupPageStack.length - 1] * this.keyChunkSize + 1;
        const firstChunkItemOffset =
            this.keyEntriesContainer.childNodes[firstChunkItemIndex].offsetTop;

        this.keyEntriesContainer.scrollTop = firstChunkItemOffset - keyContainerOffset;

        this.keyEntriesControls.page.children[0].innerHTML = `${
            this.macroStack[this.macroStack.length - 1].label
        }`;

        const pageCount = this.keyEntriesContainer.childNodes.length / this.keyChunkSize;
        this.keyEntriesControls.page.children[1].innerHTML = `${
            this.groupPageStack[this.groupPageStack.length - 1] + 1
        } / ${pageCount}`;

        const firstPageOfGroup =
            this.macroStack.length > 1 && this.groupPageStack[this.groupPageStack.length - 1] === 0;
        this.keyEntriesControls.back.childNodes[0].className = firstPageOfGroup
            ? 'fa-solid fa-arrow-turn-up fa-flip-horizontal'
            : 'fa-solid fa-arrow-left';
        this.keyEntriesControls.back.childNodes[1].innerText = firstPageOfGroup
            ? 'Close'
            : 'Previous';
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

            this.macroStack[this.macroStack.length - 1].content.splice(
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
    }

    /**
     * Display a notification message.
     * @param {string} type - The type of the the notification (info, success, warning, error)
     * @param {string} prompt - The message to display in the notification.
     * @param {boolean} permanent - Whether the notification should be permanent (optional).
     */
    _notify(type, prompt, permanent = false) {
        new NotificationDialog({
            parent: this.notificationContainer,
            type: type,
            message: prompt,
            timeout: 3000,
            permanent: permanent,
        });
    }
}

// Initialize the App instance.
const app = new App({
    mainContainer: document.querySelector('.main-container'),
    notificationContainer: document.querySelector('.notification-container'),
    appControlsContainer: document.querySelector('.app-controls'),
    deviceControlsContainer: document.querySelector('.device-controls'),
    keyEntriesContainer: document.querySelector('.key-entries'),
    keyEntriesControlsContainer: document.querySelector('.key-entries-controls'),
});
