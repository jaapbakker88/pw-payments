var mongoose  = require('mongoose');
mongoose.Promise = global.Promise;

var paymentSchema = new mongoose.Schema({
  orderId: String,
  order: Object
},
{
  timestamps: true
});


module.exports = mongoose.model('Payment', paymentSchema);