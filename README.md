# Portfolio sayt: Telegram botga ulash

## 1. Sozlash (bir marta)
`.env` faylini Bloknot (Notepad) bilan oching va ikki qatorni to'ldiring:

    BOT_TOKEN=BotFather bergan token
    CHAT_ID=@userinfobot bergan raqam

Tokenni hech kimga ko'rsatmang va GitHub'ga yuklamang.

## 2. Ishga tushirish
- Windows: `start.bat` faylini ikki marta bosing.
- Yoki terminalda papka ichida: `node server.js`

Brauzerda http://localhost:3000 ochiladi. Formani to'ldirib yuboring, xabar Telegramingizga keladi.

## 3. Rasm almashtirish
O'z rasmingizni `public/images/` ichiga qo'ying va `public/index.html` da
`images/profile.svg` ni rasm nomiga almashtiring (masalan `images/profile.jpg`).

## Papka tuzilishi
    portfolio-site/
    ├── server.js          (server + Telegram)
    ├── .env               (token va chat ID)
    ├── start.bat          (Windowsda tez ishga tushirish)
    └── public/
        ├── index.html     (sayt)
        ├── style.css      (dizayn)
        ├── script.js      (yulduzlar + forma)
        └── images/profile.svg
