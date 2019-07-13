const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const ProductDetails = new Schema({
    amount: {
        type: Number,
    },
    paid_amount: {
        type: Number,
    },
    user_id: {
        // type: Number,
        type: Schema.ObjectId,
        ref: 'users'
    },
    cashback_deduction_percentage: { //ex. 10%
        type: Number
    },
    cashback_add_to_wallet_percentage: {   //ex. 50%
        type: Number
    },
    cashback_amount: {
        type: Number,    
    },
    created_by: {
        type: String
    },
    created_date: {
        type: Date,
        default: Date.now
    },
    updated_by: {
        type: String
    },
    updated_date: {
        type: Date,
        default: Date.now
    }
});

module.exports = City = mongoose.model('product_details', ProductDetails);