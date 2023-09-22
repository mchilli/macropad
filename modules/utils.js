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

export { create, style };
