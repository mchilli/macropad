'use strict';

class LineBreakTransformer {
    constructor() {
        // A container for holding stream data until a new line.
        this.chunks = '';
    }

    transform(chunk, controller) {
        // Append new chunks to existing chunks.
        this.chunks += chunk;
        // For each line breaks in chunks, send the parsed lines out.
        const lines = this.chunks.split('\n');
        this.chunks = lines.pop();
        lines.forEach((line) => controller.enqueue(line));
    }

    flush(controller) {
        // When the stream is closed, flush any remaining chunks out.
        controller.enqueue(this.chunks);
    }
}

export default class SerialConnectionHandler {
    constructor({ port, onReceived = () => {}, onConnectionChanged = () => {} } = {}) {
        this.port = port;
        this.onReceived = onReceived;
        this.onConnectionChanged = onConnectionChanged;

        this.connected = false;

        this.writer = null;
        this.writableStreamClosed = null;
        this.reader = null;
        this.readableStreamClosed = null;

        this._init();
    }

    async _init() {
        try {
            await this.port.open({ baudRate: 9600 });
            console.log('Success: Port open');

            this.connected = true;
            this.onConnectionChanged(this.connected);

            const writerTextEncoder = new TextEncoderStream();
            this.writableStreamClosed = writerTextEncoder.readable.pipeTo(this.port.writable);
            this.writer = writerTextEncoder.writable.getWriter();

            const readerTextDecoder = new TextDecoderStream();
            this.readableStreamClosed = this.port.readable.pipeTo(readerTextDecoder.writable);
            this.reader = readerTextDecoder.readable
                .pipeThrough(new TransformStream(new LineBreakTransformer()))
                .getReader();

            await this._listen();
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    async close() {
        try {
            if (this.port.readable) {
                this.writer.close();
                await this.writableStreamClosed;

                this.reader.cancel();
                await this.readableStreamClosed.catch(() => {});

                await this.port.close();
                console.log('Success: Port closed');
                this.connected = false;
                this.onConnectionChanged(this.connected);
            }
        } catch (error) {
            console.error('Error during close:', error);
        }
    }

    async _listen() {
        try {
            while (true) {
                const { value, done } = await this.reader.read();
                if (done) {
                    this.reader.releaseLock();
                    break;
                }

                let payload;
                try {
                    payload = JSON.parse(value);
                    this.onReceived(payload);
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                }
            }
        } catch (error) {
            console.error('Error while listening:', error);
            this.connected = false;
            this.onConnectionChanged(this.connected);
        }
    }

    async send(payload) {
        try {
            if (this.port.writable) {
                await this.writer.write(JSON.stringify(payload) + '\n');
            }
        } catch (error) {
            console.error('Error while sending:', error);
        }
    }
}
