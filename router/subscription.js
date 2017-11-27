var express = require('express');
var router = express.Router();
var Customer = require('../models/customer');
var Payment = require('../models/payment');
var Order = require('../models/order');
var paymentControl = require('../controllers/paymentControl');
var Mollie = require("mollie-api-node");
var nodemailer = require('nodemailer');
var request = require('request');
var transporter = nodemailer.createTransport('smtps://'+process.env.SMTP_LOGIN+':'+process.env.SMTP_PASSW+'@smtp.mailgun.org');
var mollie = new Mollie.API.Client;
mollie.setApiKey(process.env.MOLLIE_API_KEY);

var mongoose  = require('mongoose');
mongoose.Promise = global.Promise;

router.get('/', function(req, res) {
  res.render('subscription/index', {userId: req.query.id});
});

router.all('/create', function(req, res) {
  var type, amount, description, subscription;
  if(req.body.identifier === '001') {
    type = "Lifetime Champion";
    amount = 50;
    description = "Lifetime Champion Payment";
  } else if(req.body.identifier === '002') {
    type = "Yearly Champion";
    subscription = true;
    amount = 20;
    description = "Yearly Champion Payment";
  } else if(req.body.identifier === '003') {
    type = "Yearly Verified";
    subscription = true;
    amount = 5;
    description = "Yearly Verified Payment";
  } else if(req.body.identifier === '004') {
    type = "3 Month Starter";
    amount = 30;
    description = "12 Month Starter";
  } else if(req.body.identifier === '005') {
    type = "6 Month Starter";
    amount = 50;
    description = "12 Month Starter";
  } else if(req.body.identifier === '006') {
    type = "12 Month Starter";
    amount = 80;
    description = "12 Month Starter";
  } else {
    return res.redirect('/');
  }
  
  mollie.customers.create({
    name:  `${req.body.firstName} ${req.body.lastName}`,
    email: `${req.body.email}`
  },  function (customer) {
      var newCustomer = {firstName: req.body.firstName, lastName: req.body.lastName, customerType: type, email: req.body.email, userId: req.body.userId, customerId: customer.id};
      Customer.create(newCustomer, function(err, createdCustomer){
        req.session.customerId = customer.id;
        if (err) {
          console.log(err);
        } else {
          console.log('Customer ' + createdCustomer.firstName + ' ' + createdCustomer.lastName + ' saved to database!')
          mollie.payments.create({
                amount:        !subscription ? amount : 0.01,                // if subscription, then 1 cent
                customerId:    createdCustomer.customerId,
                recurringType: subscription ? 'first' : '',                  // important
                description:   description + ' ' + req.body.identifier,
                redirectUrl:   process.env.BASEURL + '/subscription/endpoint',
                webhookUrl:    process.env.BASEURL + '/subscription/webhook' // optional
          },  function (payment) {
              console.log('Payment ' + payment.id + ' created in Mollie!')
              
              // CREATE PAYMENT IN DATABASE
              paymentControl.createPayment(payment.id, payment);
              

              req.session.paymentId = payment.id;
              createdCustomer.payments.push(payment.id);
              createdCustomer.save();
              res.writeHead(302, { Location: payment.getPaymentUrl() })
              res.end();
          });
        }
      });
  });
});

router.all('/webhook', function(req, res) {
  var paymentId = req.body.id;
  console.log('Notice: webhook has been hit by Mollie. ID: ' + paymentId);
  
  // Get Payment with attached paymentId
  mollie.payments.get(paymentId, function(payment) {
    if (payment.error || payment.status === "expired" || payment.status === "cancelled" || payment.status === "refunded") {   
      res.send('Something went wrong!');
      // If payment is found and either expired, canceled or refunded save updated version to DB
      paymentControl.updatePayment(payment.id, payment);

    } else {
      // Else payment is found and paid, save updated version to DB
      paymentControl.updatePayment(payment.id, payment);
      
      // If payment has no subscription yet, create subscription and add to customer
      if (payment.recurringType === 'first') {
        console.log('payment description includes first')
        var type, amount, description, subscription, interval;
          if(payment.description.includes('001')) {
            type = "Lifetime Champion";
            amount = 50;
            description = "Lifetime Champion Payment";
          } else if(payment.description.includes('002')) {
            type = "Yearly Champion";
            subscription = true;
            amount = 20;
            description = "Yearly Champion Payment";
            interval = "12 months"
          } else if(payment.description.includes('003')) {
            type = "Yearly Verified";
            subscription = true;
            amount = 5;
            description = "Yearly Verified Payment";
            interval = "12 months"
          } else if(payment.description.includes('004')) {
            type = "3 Month Starter";
            amount = 30;
            description = "3 Month Starter";
            interval = "3 months"
          } else if(payment.description.includes('005')) {
            type = "6 Month Starter";
            amount = 50;
            description = "6 Month Starter";
            interval = "6 months"
          } else if(payment.description.includes('006')) {
            type = "12 Month Starter";
            amount = 80;
            description = "12 Month Starter";
            interval = "12 months"
          } else {
            return res.redirect('/');
          }
        // CREATE SUBSCRIPTION
          mollie.customers_mandates.withParentId(payment.customerId).all(function (mandates) {
            var mandate = mandates[0]
            if(mandate.status === 'valid' || mandate.status === 'pending') {
              mollie.customers_subscriptions.withParentId(mandate.customerId).create({
                  amount:      amount,
                  interval:    interval,
                  description: description,
                  webhookUrl:    process.env.BASEURL + '/subscription/webhook' // optional
              }, function(subscription) {
                  console.log('subscription created')
                  Customer.findOne({customerId: payment.customerId}, function(err, foundCustomer){
                    if(err || !foundCustomer) {
                      console.log(err);
                    } else {
                      console.log('subscription saved')
                      foundCustomer.subscription = subscription;
                      foundCustomer.save();
                    }
                  });
                  res.status(200).send('Success!!');
                  res.end();
              });
            } 
          });        
      } else {
        
        // Find customer and add payment to payments array
        
        Customer.findOne({customerId: payment.customerId}, function(err, customer){
          if(err) {
            console.log(err)
          } else {
            customer.payments.push(payment.id);
            customer.save();
          }
          res.status(200).send('Success!!');
          res.end();
        });
        
      }
    }
  });
});

router.get('/i/:customer', function(req, res){
  Customer.findOne({customerId: req.params.customer}, function(err, customer){
      if(err ){
        console.log(err);
      } else {
                    
        res.render('subscription/subscription', {customer: customer})
      }
  });
  
});

router.get('/endpoint', function(req, res){
  
  Payment.findOne({orderId: req.session.paymentId}, function(err, payment){
    if(payment.order.status === 'cancelled') {
      console.log('Notice: payment with ' + req.session.paymentId + ' was canceled.')
      res.redirect('/subscription');
    } else {
      if (payment.order.recurringType === 'first') {
        res.redirect('/subscription/i/' + req.session.customerId)
      } else {
        res.redirect(`/order/${payment.order.id}`);
      }
    }
  })

});

// router.get('/cancel/:customerId/:subscriptionId', function(req, res){
//   var customerId = req.params.customerId;
//   var subscriptionId = req.params.customerId;
//   var apiKey = process.env.MOLLIE_API_KEY_LIVE;
//   var url = 'https://api.mollie.nl/v1/customers/'+ customerId +'/subscriptions/' + subscriptionId;
//   request.delete(url, {
//     'auth': {
//       'bearer': apiKey,
//     }
//   }, function optionalCallback(err, httpResponse, body) {
//     if (err) {
//       return console.error('canceling subscription failed:', err);
//     }
//     console.log('Upload successful!  Server responded with:', body);
//   });
    
// })

module.exports = router;