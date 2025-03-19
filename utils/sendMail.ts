import nodemailer , {Transport} from 'nodemailer';
require('dotenv').config();
import ejs from 'ejs';
import path from 'path';

interface EmailOptions {
    email: string;
    subject: string;
    template: string;
    data : {[key:string]:any }

}


const sendEmail = async (options: EmailOptions):Promise <void> => {
    const transport = nodemailer.createTransport({
        host : process.env.SMTP_HOST,
        port : parseInt(process.env.SMTP_PORT || '465'),
        service : process.env.SMTP_SERVICE,
        auth : {
            user : process.env.SMTP_EMAIL,
            pass : process.env.SMTP_PASSWORD
        }

});

    const {email, subject, template, data} = options;

    // get the path to the mail template file
    const emailTemplate = path.join(__dirname, `../mails`, template);

    // Render the mail template with EJS
    const html:string  = await ejs.renderFile(emailTemplate, data);

    // Define the mail options
    const mailOptions = {
        from : process.env.SMTP_EMAIL,
        to : email,
        subject,
        html
    }

    // Send the email
    await transport.sendMail(mailOptions);

}

export default sendEmail;