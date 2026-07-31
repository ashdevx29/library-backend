import tls from 'tls';

export const sendEmail = async ({ to, subject, html, text }) => {
  const user = process.env.EMAIL_USER;
  const rawPass = process.env.EMAIL_PASS || '';
  const pass = rawPass.replace(/\s+/g, '');

  if (!user || !pass) {
    console.warn('[EMAIL] EMAIL_USER or EMAIL_PASS not configured.');
    return false;
  }

  return new Promise((resolve) => {
    let resolved = false;

    const finish = (result) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };
    //  gdg

    const socket = tls.connect(465, 'smtp.gmail.com', { rejectUnauthorized: false }, () => {
      // Connected via SSL/TLS
    });

    let step = 0;
    const authString = Buffer.from(`\0${user}\0${pass}`).toString('base64');

    const send = (cmd) => {
      try {
        socket.write(cmd + '\r\n');
      } catch (err) {
        console.error('[SMTP Write Error]', err.message);
        finish(false);
      }
    };

    socket.on('data', (data) => {
      const response = data.toString();
      const code = parseInt(response.substring(0, 3), 10);

      if (code >= 400) {
        console.error('[SMTP Auth/Send Error]', response.trim());
        socket.end();
        finish(false);
        return;
      }

      if (step === 0 && code === 220) {
        step = 1;
        send(`EHLO localhost`);
      } else if (step === 1 && code === 250) {
        step = 2;
        send(`AUTH PLAIN ${authString}`);
      } else if (step === 2 && code === 235) {
        step = 3;
        send(`MAIL FROM:<${user}>`);
      } else if (step === 3 && code === 250) {
        step = 4;
        send(`RCPT TO:<${to}>`);
      } else if (step === 4 && code === 250) {
        step = 5;
        send(`DATA`);
      } else if (step === 5 && code === 354) {
        step = 6;
        const message = [
          `From: "Saahityik Library" <${user}>`,
          `To: <${to}>`,
          `Subject: ${subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=utf-8`,
          ``,
          html || text || '',
          `.`
        ].join('\r\n');
        send(message);
      } else if (step === 6 && code === 250) {
        step = 7;
        send(`QUIT`);
        finish(true);
      }
    });

    socket.on('error', (err) => {
      console.error('[SMTP Socket Error]', err.message);
      finish(false);
    });

    socket.setTimeout(12000, () => {
      console.error('[SMTP Timeout]');
      try { socket.destroy(); } catch (_) {}
      finish(false);
    });
  });
};
