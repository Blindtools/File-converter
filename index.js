const { Client, LocalAuth, Buttons } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Initialize the client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one helps in low memory environments like Render free tier
            '--disable-gpu'
        ],
    }
});

// Generate QR Code for connection
client.on('qr', (qr) => {
    console.log('QR RECEIVED. Scan this code with your WhatsApp app:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

// Listen for a specific message to trigger the button response
client.on('message', async (msg) => {
    if (msg.body === '!testbuttons') {
        /**
         * IMPORTANT NOTE ON BUTTONS:
         * As of late 2023/2024, WhatsApp has restricted "Interactive Buttons" 
         * (Buttons class) primarily to Official API users. 
         * While this library includes the Buttons class, they may not display 
         * on all mobile devices or might appear as plain text.
         */
        
        const buttons = [
            { id: 'btn1', body: 'Visit Website' }, // Redirect logic usually handled by bot response
            { id: 'btn2', body: 'Call Support' }
        ];

        let buttonMsg = new Buttons(
            'Hello! This is an interactive message test.',
            buttons,
            'Test Title',
            'Test Footer'
        );

        try {
            await client.sendMessage(msg.from, buttonMsg);
            console.log('Button message sent successfully to:', msg.from);
        } catch (err) {
            console.error('Error sending buttons:', err);
            // Fallback to text message if buttons fail
            await client.sendMessage(msg.from, 
                "*Interactive Test*\n\n1. Visit Website: https://example.com\n2. Call: +123456789\n\n_Note: If buttons didn't appear, your WhatsApp version may not support them via Web protocol._"
            );
        }
    }

    // Handle button clicks (Button responses come as regular messages with the button body)
    if (msg.type === 'buttons_response') {
        const selectedButtonId = msg.selectedButtonId;
        if (selectedButtonId === 'btn1') {
            await client.sendMessage(msg.from, 'Redirecting you to: https://example.com');
        } else if (selectedButtonId === 'btn2') {
            await client.sendMessage(msg.from, 'You can call us at: tel:+123456789');
        }
    }
});

client.initialize();
