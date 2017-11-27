var mailControl = require('../controllers/mailControl');
var paymentControl = require('../controllers/paymentControl');
var customerControl = require('../controllers/customerControl');
var Payment = require('../models/payment');
var Customer = require('../models/customer');
var mongoose  = require('mongoose');
mongoose.Promise = global.Promise;

var Mollie = require("mollie-api-node");
var mollie = new Mollie.API.Client;
mollie.setApiKey(process.env.MOLLIE_API_KEY);


exports.createPayment = function(paymentId, newPaymentObj){
  Payment.create({orderId: paymentId, order: newPaymentObj}, function(err, savedPayment){
    if(err) {
      console.log(err)
    } else {
      console.log('Payment saved with id: ' + paymentId + '!')
      if (newPaymentObj.status === 'paid') {
        if (newPaymentObj.status === 'paid') {
          Customer.findOne({customerId: newPaymentObj.customerId}, function(err, customer){
            if (err || !customer) {
              console.log('Error in paymentControl.updatePayment | 2');
            } else {
              if (newPaymentObj.amount > 0.01){
                mailControl.newMailer(customer.email, 'champion', customer, newPaymentObj);
                mailControl.newMailer(process.env.TEST_RECIPIENT, 'admin', customer, newPaymentObj);
              }
            }
          });
        }
      }
    }
  });
}

exports.updatePayment = function(paymentId, newPaymentObj){
  Payment.findOneAndUpdate({orderId: paymentId}, {$set:{order: newPaymentObj }}, {new: true}, function(err, savedPayment) {
    if(err) {
      console.log(err);
    } else if (!savedPayment) {
       paymentControl.createPayment(paymentId, newPaymentObj)        
    } else {
      console.log('Payment updated with id: ' + paymentId + '!') 
      if (newPaymentObj.status === 'paid') {
        Customer.findOne({customerId: newPaymentObj.customerId}, function(err, customer){
          if (err || !customer) {
            console.log('Error in paymentControl.updatePayment | 2');
          } else {
            if (newPaymentObj.amount > 0.01){
              mailControl.newMailer(customer.email, 'champion', customer, newPaymentObj);
              mailControl.newMailer(process.env.TEST_RECIPIENT, 'admin', newPaymentObj, customer);
            }
          }
        });
        
      }
    }
  });
}

// exports.findPayment =  function(paymentId, data){
//   var result = {};
//   Payment.findOne({orderId: paymentId}, function(err, payment){
//     if(err || !payment){
//       console.log('Error in paymentControl.findPayment | 1');
//     } else {
//       result = payment;
//     }
//     return result;
//   });
//   data = result;
//   return data;
// }


