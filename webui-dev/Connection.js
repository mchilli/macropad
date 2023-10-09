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

class SerialConnectionHandler {
    constructor({
        port = port,
        onReceived = this.onReceived,
        onConnectionChanged = this.onConnectionChanged,
    } = {}) {
        this.port = port;
        this.onReceived = onReceived;
        this.onConnectionChanged = onConnectionChanged;

        this.connected = false;

        this._open();
    }

    async _init() {
        const writerTextEncoder = new TextEncoderStream();
        this.writableStreamClosed = writerTextEncoder.readable.pipeTo(this.port.writable);
        this.writer = writerTextEncoder.writable.getWriter();

        const readerTextDecoder = new TextDecoderStream();
        this.readableStreamClosed = this.port.readable.pipeTo(readerTextDecoder.writable);
        this.reader = readerTextDecoder.readable
            .pipeThrough(new TransformStream(new LineBreakTransformer()))
            .getReader();

        await this._listen();
    }

    async _open() {
        await this.port
            .open({ baudRate: 9600 })
            .then(async () => {
                console.log('Success: Port open');

                this.connected = true;
                this.onConnectionChanged(this.connected);

                await this._init();
            })
            .catch((e) => {
                console.error('Error: Can`t open Port');
            });
    }

    async close() {
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
    }

    async _listen() {
        try {
            // Listen to data coming from the serial device.
            while (true) {
                const { value, done } = await this.reader.read();
                if (done) {
                    // Allow the serial port to be closed later.
                    this.reader.releaseLock();
                    break;
                }

                let payload = JSON.parse(value);
                this.onReceived(payload);
            }
        } catch (e) {}
    }

    async send(payload) {
        if (this.port.writable) {
            await this.writer.write(JSON.stringify(payload) + '\n');
        }
    }

    onReceived() {}
    onConnectionChanged() {}
}
