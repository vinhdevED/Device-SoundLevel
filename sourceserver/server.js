const express = require('express');
const dgram = require('dgram');
const path = require('path');

const app = express();
const udpClient = dgram.createSocket('udp4');
const port = 3000;
const BROADCAST_PORT = 41234; // Cổng để gửi gói tin UDP
const IOT_DEVICE_IP = '192.168.1.69'; // Địa chỉ broadcast để gửi gói tin tới tất cả thiết bị trong mạng cục bộ

// Cấu hình socket để cho phép gửi broadcast
udpClient.bind(() => {
    udpClient.setBroadcast(true);
});

// Serve the HTML file

app.use(express.static(path.join(__dirname, 'template')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'website.html'));
});

// Endpoint to trigger UDP broadcast to IoT devices

app.get('/send-request', (req, res) => {
    const message = Buffer.from('DISCOVER_DEVICES');

    udpClient.send(message, 0, message.length, BROADCAST_PORT, IOT_DEVICE_IP, (err) => {
        if (err) {
            console.error('Error sending message:', err);
            res.status(500).send('Error sending message');
        } else {
            console.log('Broadcast message sent to IoT devices');

            const responses = [];

            const messageHandler = (msg, rinfo) => {
                console.log(`Received message from ${rinfo.address}:${rinfo.port} - ${msg}`);
                responses.push(`Received message from ${rinfo.address}:${rinfo.port} - ${msg}`);
            };

            udpClient.on('message', messageHandler);

            setTimeout(() => {
                udpClient.removeListener('message', messageHandler);
                res.send(responses);
                console.log('No more responses. Waiting period ended.');
            }, 5000); // Đợi 5 giây để nhận phản hồi
        }
    });
});
// app.get('/send-request', (req, res) => {
//     const message = Buffer.from('DISCOVER_DEVICES');
//     udpClient.send(message, 0, message.length, BROADCAST_PORT, IOT_DEVICE_IP, (err) => {
//         if (err) {
//             console.error('Error sending message:', err);
//             res.status(500).send('Error sending message');
//         } else {
//             console.log('Broadcast message sent to IoT devices');
//
//             // Set up listener for responses
//             udpClient.on('message', (msg, rinfo) => {
//                 console.log(`Received message from ${rinfo.address}:${rinfo.port} - ${msg}`);
//                 res.send(`Received message from ${rinfo.address}:${rinfo.port} - ${msg}`);
//             });
//
//             // Set a timeout for waiting for responses
//             setTimeout(() => {
//                 udpClient.close();
//                 console.log('No more responses. Closed the socket.');
//             }, 5000); // Đợi 5 giây để nhận phản hồi
//         }
//     });
// });

// Start the HTTP server
app.listen(port, () => {
    console.log(`HTTP server running at http://localhost:${port}`);
});
