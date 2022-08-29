const ejs = require('ejs');
const nodemailer = require('nodemailer');
module.exports = class Email{
  constructor(user,url){
    this.to = user.email;
    this.firstname = user.name.split(' ')[0];
    this.url = url;
    this.from = `Parth Patel <parthpatel321321@gmail.com>`;
  }
  
  newTransport(){
    return nodemailer.createTransport({
      host: "smtp.mailtrap.io",
    port: 25,
    auth: {
      user: "8b3db60c26b8b5",
      pass: "c09a1831347623"
    }
    })
  }

  async send(template,subject){
    const html = ejs.renderFile(`${__dirname}/../views/email/${template}.pug`,{
      firstname:this.firstname,
      url:this.url,
      subject
    });
  }
}
const sendEmail = async options => {
  // 1) Create a transporter
 

  // 2) Define the email options
  const mailOptions = {
    from: 'Parth Patel <parthpatel321321@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;