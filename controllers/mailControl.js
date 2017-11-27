var mongoose  = require('mongoose');
mongoose.Promise = global.Promise;

var Customer = require('../models/customer');
var Payment = require('../models/payment');

var mailControl = require('../controllers/mailControl');
var paymentControl = require('../controllers/paymentControl');
var customerControl = require('../controllers/customerControl');

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport('smtps://'+process.env.SMTP_LOGIN+':'+process.env.SMTP_PASSW+'@smtp.mailgun.org');

const Email = require('email-templates');



var mailControl = {
  paymentConfirmation: function(paymentId){

  },
  sendMail: function(template, email, payment, customer){    
    var mailOptions = {
      from: '"'+ "Dan @ PartyWith" +'" <'+process.env.TEST_SENDER+'>', // sender address
      to: email, // list of receivers
      subject: 'You’re ' + payment.description, // Subject line
      text: ``, // plaintext body
        html: `
          <div id="header">
            <p>Dear ${customer.firstName},</p>
            <p>You've made the following payment: ${payment.description}, You're now a verified member of the PartyWith app. Your support means so much to us. And welcome to the PartyWith family!!</p>
            <p>Check your current status <a href="${process.env.BASEURL}/subscription/i/${customer.customerId}">here.</a></p>
          </div>
          <div id="body">
            <p>Your perks:
              <ul>
                <li><strong>A shiny badge:</strong> Your badge will be proudly displayed on your profile starting 28 Nov 2017, for one year.</li>
                <li><strong>A direct line of communication</strong> with the PartyWith team: Feel free to reach out to me anytime about the app, and I’ll keep you in the loop on the app’s latest updates as well.</li>
                <li><strong>Party points</strong>: Will be launched once we reach 100 champions on the app. Stay tuned.</li>
              </ul>
            </p>
            <p>Cheers,<br>
            Dan</p>
          </div>
          <div id="footer"><p><small>This is an automatically generated email</small></p></div>
        `
    };
    if(payment.amount > 0.01){
      transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message (user) sent: ' + info.response);
    });
    } else {
      console.log('Message (user) skipped: amount to low');
    }
  },
  sendAdminMail: function(template, email, payment, customer){    
    var mailOptions = {
      from: '"'+ "Dan @ PartyWith" +'" <'+process.env.TEST_SENDER+'>', // sender address
      to: email, // list of receivers
      subject: payment.description, // Subject line
      text: ``, // plaintext body
        html: `
          <div id="header"><strong>There's a new 🏆 Champion 🏆 order that requires action</strong></div>
            <div id="body">
              <p>
                <strong>name:</strong> ${customer.firstName} ${customer.lastName} <br>
                <strong>email:</strong> ${customer.email} <br>
                <strong>userId:</strong> ${customer.userId} <br>
                <strong>type:</strong> ${payment.description}
              </p> 
            </div>
          <div id="footer"><p><small>This is an automatically generated email</small></p></div>
        `
    };
    if(payment.amount > 0.01){
      transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message (admin) sent: ' + info.response);
    });
    } else {
      console.log('Message (admin) skipped: amount to low');
    }
  },
  
  
  
  newMailer: function(address, template, customer, payment){
 
    const email = new Email({
      message: {
        from: '"'+ "Dan @ PartyWith" +'" <'+process.env.TEST_SENDER+'>'
      },
      // uncomment below to send emails in development/test env:
      send: true,
      transport: transporter
    });

    email.send({
      template: template,
      message: {
        to: address
      },
      locals: {
        customer: customer,
        payment: payment
        
      }
    }).then(console.log('Message sent!')).catch(console.error);
  }
}

module.exports = mailControl;