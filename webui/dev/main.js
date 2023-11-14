let connection = {};
const connectionBtn = document.querySelector('#connection');
const sendBtn = document.querySelector('#send');
const cmdBtns = document.querySelectorAll('.simple-cmd');
const data = document.querySelector('#data');

function payloadHandler(payload) {
    if ('ERR' in payload) {
        console.warn('Error: ' + payload.ERR);
    } else if ('ACK' in payload) {
        switch (payload.ACK) {
            case 'macros':
                data.value = JSON.stringify(payload.CONTENT, null, 2);
                break;
        }
    }
}

function disableBtns(disable) {
    sendBtn.disabled = disable;
    cmdBtns.forEach((element) => {
        element.disabled = disable;
    });
}

connectionBtn.addEventListener('click', async (event) => {
    if (connection.connected) {
        connection.close();
        data.value = '';
        connectionBtn.innerText = 'Connect';
        disableBtns(true);
    } else {
        if ('serial' in navigator) {
            await navigator.serial
                .requestPort()
                .then((port) => {
                    connection = new SerialConnectionHandler({
                        port: port,
                        onReceived: payloadHandler,
                    });
                    connectionBtn.innerText = 'Disonnected';
                    disableBtns(false);
                })
                .catch((e) => {
                    console.warn('Error: No port selected');
                });
        }
    }
});

sendBtn.addEventListener('click', async () => {
    if (data.value != '') {
        try {
            await connection.send({
                command: 'set_macros',
                content: JSON.parse(data.value),
            });
        } catch (e) {
            console.error('can`t parse json string');
        }
    }
});

cmdBtns.forEach((element) => {
    element.addEventListener('click', async () => {
        await connection.send({
            command: element.dataset.cmd,
        });
    });
});

// triggers when the device is unplugged
navigator.serial.addEventListener('disconnect', (event) => {
    connection = {};
    data.value = '';
    connectionBtn.innerText = 'Connect';
});
