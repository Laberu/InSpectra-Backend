const { createTransport } = require("nodemailer");

const createPasswordResetUrl = (id, token) => {
    const baseUrl = process.env.PRODUCTION === "True" 
      ? process.env.CLIENT_URL_PRODUCTION 
      : process.env.CLIENT_URL_LOCAL;
  
    return `https://inspectra.site/reset-password/${id}/${token}`;
  };

const transporter = createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const passwordResetTemplate = (user, url) => {
    const { username, email } = user;
    return {
        to: email,
        subject: `Reset Password`,
        html: `
            <h2>Password Reset Link</h2>
            <p>Reset your password by clicking on the link below:</p>
            <a href=${url}><button>Reset Password</button></a>
            <br />
            <br />
            <small><a style="color: #38A169" href=${url}>${url}</a></small>
            <br />
            <small>The link will expire in 15 mins!</small>
            <small>If you haven't requested password reset, please ignore this email</small>
            <br /><br />
            <p>Thanks,</p>
            <p>InSpectra Team</p>`,
    };
};
  
const passwordResetConfirmationTemplate = (user) => {
    const { email } = user;
    return {
        to: email,
        subject: `Password Reset Successful`,
        html: `
            <h2>Password Reset Successful</h2>
            <p>You've successfully updated your password for your account <${email}>. </p>
            <br /><br />
            <p>Thanks,</p>
            <p>InSpectra Team</p>`,
    };
  };

const projectCompletionTemplate = (email, projectName) => {
    return {
        to: email,
        subject: `🎉 Your Project "${projectName}" is Complete!`,
        html: `
            <h2>Project Completed</h2>
            <p>Hi ${username},</p>
            <p>We're excited to let you know that your project <strong>"${projectName}"</strong> has been successfully completed!</p>
            <p>You can now review the results and take the next steps.</p>
            <br />
            <p>If you have any questions or need further assistance, feel free to contact us.</p>
            <br /><br />
            <p>Thanks,</p>
            <p>InSpectra Team</p>
        `,
    };
};

  
module.exports = {
    transporter,
    createPasswordResetUrl,
    passwordResetTemplate,
    passwordResetConfirmationTemplate,
    projectCompletionTemplate,
};