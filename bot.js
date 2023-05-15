import TelegramBot from 'node-telegram-bot-api';
import request from 'request';
import fs from 'fs';

import('dotenv').then((dotenv) => {
    dotenv.config();

    // setup IMAGE_SEARCH_APP_URL and TELEGRAM_BOT_TOKEN in your .env file
    const imageSearchAppUrl = process.env.IMAGE_SEARCH_APP_URL;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const bot = new TelegramBot(token, { polling: true });

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;

        if (msg.photo) {
            const file = await bot.getFile(msg.photo[msg.photo.length - 1].file_id);
            const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

            request({ url: fileUrl, encoding: 'binary' }, (err, response, body) => {
                console.log(body);
                if (body) {
                    fs.writeFileSync('tmp.jpg', body, 'binary');
                    const base64Image = fs.readFileSync('tmp.jpg', { encoding: 'base64' });

                    request.post({
                        url: imageSearchAppUrl,
                        json: {
                            image: base64Image
                        }
                    }, (error, response, body) => {
                        if (error) {
                            console.log(error);
                        } else if (body && body.image) {
                            console.log(body);
                            fs.writeFileSync('result.jpg', body.image, 'base64');
                            bot.sendPhoto(chatId, fs.createReadStream('result.jpg'));
                        } else {
                            console.log('Unexpected response body:', body);
                        }
                    });
                }
                else {
                    console.log('Error downloading image file:', err);
                }
            });
        }
        else {
            bot.sendMessage(chatId, 'Please, paste only photo!');
        }
    })
});