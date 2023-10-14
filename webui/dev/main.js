var connection;
var connectionStatus = document.querySelector('#connection-status');
var inputData = document.querySelector('#data');

function payloadHandler(payload) {
    let response;

    if ('ERR' in payload) {
        console.warn('Error: ' + payload.ERR);
    } else if ('ACK' in payload) {
        switch (payload.ACK) {
            case 'macros':
                inputData.value = JSON.stringify(payload.CONTENT, null, 2);
                response = JSON.stringify(payload.CONTENT);
                break;
            default:
                response = payload.ACK;
                break;
        }
        console.log('Response: ' + response);
    }
}

function connectionChanged(connected) {
    if (connected) {
        connectionStatus.innerHTML = 'Connected';
    } else {
        connectionStatus.innerHTML = 'Disonnected';
    }
}

document.querySelector('#connect').addEventListener('click', async () => {
    if ('serial' in navigator) {
        await navigator.serial
            .requestPort()
            .then((port) => {
                connection = new SerialConnectionHandler({
                    port: port,
                    onReceived: payloadHandler,
                    onConnectionChanged: connectionChanged,
                });
            })
            .catch((e) => {
                console.warn('Error: No port selected');
            });
    }
});

document.querySelector('#disconnect').addEventListener('click', () => {
    if (connection.connected) {
        connection.close();
    }
    inputData.value = '';
});

document.querySelector('#send').addEventListener('click', async () => {
    if (connection.connected && inputData.value != '') {
        try {
            await connection.send({
                command: 'set_macros',
                content: JSON.parse(inputData.value),
            });
        } catch (e) {
            console.error('can`t parse json string');
        }
    }
});

document.querySelectorAll('.simple-cmd').forEach((element) => {
    element.addEventListener('click', async () => {
        await connection.send({
            command: element.dataset.cmd,
        });
    });
});

// triggers when the device is unplugged
navigator.serial.addEventListener('disconnect', (event) => {
    inputData.value = '';
});
