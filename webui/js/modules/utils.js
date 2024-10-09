'use strict';

/**
 * Creates an HTML element with specified attributes, text, children, and event listeners.
 * @param {Object} options - An object containing options for creating the element.
 * @param {string} options.type - The type of HTML element to create (default: 'div').
 * @param {string} options.text - The text content for the created element (default: undefined).
 * @param {Object} options.attributes - An object containing attributes to set on the element (default: {}).
 * @param {Array} options.children - An array of child elements to append (default: []).
 * @param {Object} options.events - An object containing event listeners to attach (default: {}).
 * @returns {HTMLElement} - The created HTML element.
 */
export function create({
    type = 'div',
    text = undefined,
    attributes = {},
    children = [],
    events = {},
} = {}) {
    const element = document.createElement(type);
    for (const [attribute, value] of Object.entries(attributes)) {
        element.setAttribute(attribute, value);
    }
    if (text !== undefined) {
        element.innerHTML = text;
    }
    for (const child of children) {
        element.append(child);
    }
    for (const [event, handler] of Object.entries(events)) {
        element.addEventListener(event, handler);
    }
    return element;
}

/**
 * Sets CSS styles on a specified HTML element.
 * @param {HTMLElement} target - The target element to apply the styles to.
 * @param {Object} attributes - An object containing CSS style properties and their values.
 * @throws {Error} - Throws an error if the target is not a valid HTMLElement.
 */
export function style(target = document.documentElement, attributes = {}) {
    if (!(target instanceof HTMLElement)) {
        throw new Error('The target must be a valid HTMLElement.');
    }

    for (const [attribute, value] of Object.entries(attributes)) {
        if (typeof value === 'string' || typeof value === 'number') {
            target.style.setProperty(attribute, String(value));
        } else {
            console.warn(`Invalid value '${value}' for attribute '${attribute}'. Ignored.`);
        }
    }
}

/**
 * Appends a list of elements to a specified container element.
 * @param {Element} container - The container element to which the elements will be appended.
 * @param {Array} elements - An array of elements to append.
 */
export function appendElements(container, elements) {
    for (const element of elements) {
        container.appendChild(element);
    }
}

/**
 * Generates a random unique identifier (ID) consisting of alphanumeric characters.
 * @returns {string} - A random unique identifier.
 */
export function uniqueId() {
    let ID = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 12; i++) {
        ID += characters.charAt(Math.floor(Math.random() * 36));
    }
    return ID;
}

/**
 * Capitalizes the first letter of a given string.
 * @param {string} s - The input string to capitalize.
 * @returns {string} - The input string with the first letter capitalized.
 */
export function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}

/**
 * Converts a hexadecimal color string to an RGB color array.
 * @param {string} hexcolor - The hexadecimal color string (e.g., '#RRGGBB').
 * @returns {Array} - An array representing the RGB color values [R, G, B].
 */
export function hexToRGB(hexcolor) {
    const r = parseInt(hexcolor.substr(1, 2), 16);
    const g = parseInt(hexcolor.substr(3, 2), 16);
    const b = parseInt(hexcolor.substr(5, 2), 16);
    return [r, g, b];
}

/**
 * Converts an RGB color array to a hexadecimal color string.
 * @param {Array} rgb - An array representing the RGB color values [R, G, B].
 * @returns {string} - The hexadecimal color string (e.g., '#RRGGBB').
 */
export function rgbToHex([r, g, b]) {
    const intToHex = (c) => {
        const hex = c.toString(16);
        return hex.length == 1 ? '0' + hex : hex;
    };
    return '#' + intToHex(r) + intToHex(g) + intToHex(b);
}

/**
 * Converts a JavaScript object to a JSON file and offers it for download.
 * @param {Object} obj - The JavaScript object to be converted to JSON.
 * @param {string} [filename="data.json"] - The name of the downloaded JSON file (optional).
 */
export function downloadObjectAsJson(obj, filename = 'data.json') {
    const json = JSON.stringify(obj);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    a.addEventListener('click', () => {
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 40000);
    });

    a.dispatchEvent(
        new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: false,
        })
    );
}

/**
 * Opens a file selection dialog to allow the user to choose a file with the specified file type(s).
 * Reads the selected file's content as text and returns it.
 * @param {string} [accept='*'] - The file type(s) accepted by the file selection dialog
 *                                (e.g., '.txt', 'image/*'). Defaults to accepting all file types.
 * @returns {Promise<string>} A promise that resolves with the text content of the selected file
 *                           or rejects with an error message if no file is selected or an error occurs.
 */
export function openFile(accept = '*') {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = (e) => {
            const file = e.target.files[0];
            input.remove();
            if (!file) {
                reject('No file selected');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                const content = reader.result;
                resolve(content);
            };
            reader.readAsText(file);
        };
        input.click();
    });
}

/**
 * Default key definitions for a component.
 * @property {Object} empty - Represents an empty key.
 * @property {Object} close - Represents a close macro key.
 */
export const defaultKeys = {
    empty: { type: 'blank' },
    close: {
        type: 'macro',
        label: '<-',
        color: [18, 18, 18],
        content: [{ sys: 'close_group' }],
    },
};
