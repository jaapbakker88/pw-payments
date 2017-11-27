var Customer = require('../models/customer');

var mailControl = require('../controllers/mailControl');
var paymentControl = require('../controllers/paymentControl');
var customerControl = require('../controllers/customerControl');

var customerControl = {
  findCustomer: function(customerId){
    Customer.findOne({customerId: customerId}, function(err, customer){
      if (err || !customer) {
        console.log('Error in customerControl.findCustomer | 2');
      } else {
        return customer;
      }
    });
  }
}



module.exports = customerControl;