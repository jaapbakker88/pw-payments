var express = require('express');
var router = express.Router();

var Customer = require('../models/customer');
var Payment = require('../models/payment');

var mongoose  = require('mongoose');
mongoose.Promise = global.Promise;

router.get('/', function(req, res){
  
    Customer.find({})
      .sort({createdAt: -1})
      .limit(10)
      .exec(function(err, results){
      if(err) {
        console.log(err);
        res.redirect('/');
      } else {
        Customer.count({}, function(err, count){
            console.log(count)
            res.render('admin/index', {customers: results, page: '', count: count});
        })
      }
    })

});

router.get('/page/:page', function(req, res){
    var perPage = 10
    , page = Math.max(0, req.params.page)
  
    Customer.find()
      .limit(perPage)
      .skip(perPage * page)
      .sort({createdAt: -1})
      .exec(function(err, results){
        if(err) {
          console.log(err);
          res.redirect('/');
        } else {
          
        }
      });
});

router.get('/:id', function(req, res){
  Customer.findById(req.params.id, function(err, result) {
    Payment.find({"order.customerId": result.customerId}).sort({createdAt: -1}).exec(function(err, payments){
     
      res.render('admin/show', {customer: result, payments: payments});
      
    });
  });
});

module.exports = router;