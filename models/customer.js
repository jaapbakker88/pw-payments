var mongoose  = require('mongoose');
mongoose.Promise = global.Promise;

var customerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  userId: String,
  customerId: String,
  customerType: String,
  subscription: Object,
  payments: Array
},
{
  timestamps: true
});


module.exports = mongoose.model('Customer', customerSchema);