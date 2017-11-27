var express = require('express');
var router = express.Router();

var Customer = require('../models/customer');
var Payment = require('../models/payment');

var mongoose  = require('mongoose');
mongoose.Promise = global.Promise;

router.get('/', function(req, res){
  Customer.find({}).sort({createdAt: -1}).exec(function(err, results){
    if(err) {
      console.log(err);
      res.redirect('/');
    } else {
      res.render('admin/index', {customers: results});
    }
  })
  
});

router.get('/:id', function(req, res){
  Customer.findById(req.params.id, function(err, result) {
    Payment.find({"order.customerId": result.customerId}).sort({createdAt: -1}).exec(function(err, payments){
     
      res.render('admin/show', {customer: result, payments: payments});
      
    });
  });
});

module.exports = router;