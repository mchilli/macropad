'use strict';

function create({
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
        element.innerText = text;
    }
    for (const child of children) {
        element.append(child);
    }
    for (const [event, handler] of Object.entries(events)) {
        element.addEventListener(event, handler);
    }
    return element;
}

function style(target = document.documentElement, attributes = {}) {
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
 * Appends a list of elements to a specified container.
 * @param {Element} container - The container element to which the elements will be appended.
 * @param {Array} elements - An array of elements to append.
 */
function appendElements(container, elements) {
    for (const element of elements) {
        container.appendChild(element);
    }
}

function uniqueId() {
    let ID = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 12; i++) {
        ID += characters.charAt(Math.floor(Math.random() * 36));
    }
    return ID;
}

function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}

function hexToRGB(hexcolor) {
    const r = parseInt(hexcolor.substr(1, 2), 16);
    const g = parseInt(hexcolor.substr(3, 2), 16);
    const b = parseInt(hexcolor.substr(5, 2), 16);
    return [r, g, b];
}

function rgbToHex([r, g, b]) {
    const intToHex = (c) => {
        const hex = c.toString(16);
        return hex.length == 1 ? '0' + hex : hex;
    };
    return '#' + intToHex(r) + intToHex(g) + intToHex(b);
}

export { create, style, appendElements, uniqueId, capitalize, hexToRGB, rgbToHex };
