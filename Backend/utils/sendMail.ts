import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
  email: string; // recipient
  subject: string;
  template: string; // ejs template filename
  data: { [key: string]: any };
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // ✅ Setup transport using cPanel SMTP settings
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,        // e.g. 0xmintyn.com
      port: Number(process.env.SMTP_PORT) || 465, // usually 465 for SSL
      secure: true,                       // SSL = true (465), false for 587 (TLS)
      auth: {
        user: process.env.SMTP_EMAIL,     // full email address
        pass: process.env.SMTP_PASSWORD,  // email account password
      },
      tls: {
        rejectUnauthorized: false, // helps with self-signed certificates
      },
    });

    // ✅ Verify connection (debug)
    await transport.verify().then(() => {
      console.log("✅ SMTP Server is ready to take messages");
      
    }).catch(err => {
      console.error("❌ SMTP Verify Error:", err.message);
    });

    // ✅ Render EJS template
    const emailTemplatePath = path.join(__dirname, "../mails", options.template);
    const html: string = await ejs.renderFile(emailTemplatePath, options.data);

    // ✅ Mail options
    const mailOptions = {
      from: `"Support" <${process.env.SMTP_EMAIL}>`, // Sender name + email
      to: options.email, 
      subject: options.subject,
      html,
    };

    // ✅ Send mail
    const info = await transport.sendMail(mailOptions);

    console.log("📨 Email Sent:", info.messageId);
    console.log("📬 Preview URL (for dev/test):", nodemailer.getTestMessageUrl(info));
  } catch (error: any) {
    console.error("❌ Error sending email:", error.message);
    throw new Error(error.message);
  }
};

export default sendEmail;