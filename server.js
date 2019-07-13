const express = require('express');
global.mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

const ProductModel = require('./product_details');
const WalletModel = require('./walletModel');

// process.env.NODE_ENV = "production";
process.env.NODE_ENV = "staging";
// process.env.NODE_ENV = "dev";

// Add headers
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, x-access-token, x-origin, Authorization');
	res.setHeader('Access-Control-Allow-Credentials', true);
	res.setHeader('Access-Control-Expose-Headers', 'totalRecords');
	next();
});

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

//this line write because of GridFS file upload need mongoose.connection.
global.connection = mongoose.connection;

// Body parser middleware
app.use(bodyParser.json({
	limit: '50mb'
}));
app.use(bodyParser.urlencoded({
	extended: true,
	limit: '50mb'
}));

// public upload folder path for image store


// DB Config
const db = "mongoURL";
// Connect to MongoDB
mongoose.connect(db, {
	useNewUrlParser: true,
	 autoIndex: false 
}).then(() => console.log('MongoDB Connected')).catch((err) => console.log(err));



app.post('/save', function(req,res){
	let data = req.body;	
	getWallet(data.user_id).then(function(resp){
		//main amount minus wallet amout
			let wallet_minus_amount = (Math.round(resp.wallet_total_amount * data.cashback_add_to_wallet_percentage) / 100);
			let obj = {
				"amount" : data.amount,
				"user_id" : data.user_id,
				"cashback_deduction_percentage" : data.cashback_deduction_percentage,
				"cashback_add_to_wallet_percentage" : data.cashback_add_to_wallet_percentage,
				"cashback_amount" : wallet_minus_amount,
				"description" : (wallet_minus_amount > 0) ? "Cashback Amount" : "Initial Amount",
				"flag": false 
			}
			//deduction amount save into database
			saveWallet(obj).then(function(walletResp){
				console.log("deduction amount save into wallet : ",walletResp);
				let paid_amout = (data.amount - wallet_minus_amount);
				let user_cashback_amount = (Math.round(paid_amout * data.cashback_deduction_percentage) /100);
				
				// record store into database
				saveProduct(data).then(function(productResp){
					console.log("called save method",productResp);
					
					var newCashbackObj = {
						"amount" : data.amount,
						"paid_amount" : paid_amout,
						"user_id" : data.user_id,
						"cashback_deduction_percentage" : data.cashback_deduction_percentage,
						"cashback_add_to_wallet_percentage" : data.cashback_add_to_wallet_percentage,
						"cashback_amount" : user_cashback_amount,
						"description" : "cashback Amount",
						"flag": true 
					}
					//new cashback amount save into database
					saveWallet(newCashbackObj).then(function(resp){
						res.send(resp);
					}).catch(function(err){
						console.log("save product error",err);
						res.status(403).send(err);
					});
				}).catch(function(err){
					console.log("save product error",err);
					res.status(403).send(err);
				});

			}).catch(function(err){
				console.log("save wallet error",err);
				res.status(403).send(err);
			});
	});
});
app.post('/wallet', function(req,res){
	let data = req.body;	
	saveWallet(data).then(function(resp){
		console.log("called save method",resp);
		res.send(resp);
	}).catch(function(err){
		console.log("save wallet error",err);
		res.status(403).send(err);
	});

});

app.post('/getwallet', function(req,res){
	let data = req.body;	
	getWallet(data.user_id).then(function(resp){
		console.log("called save method",resp);
		res.send(resp);
	})

});

function saveProduct(data){
	return new Promise((resolve, reject) => {
		
		const product = new ProductModel(data);

		product.save()
        .then(data => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
	});
}

function saveWallet(data){
	return new Promise((resolve, reject) => {
		
		const wallet = new WalletModel(data);

		wallet.save()
        .then(data => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
	});
}

function getWallet(userId){
	return new Promise((resolve, reject) => {
		WalletModel.find({user_id : userId}).then(function(data){
			if(data.length > 0){
				let wallet_total_amount = 0;
				for(var i = 0; i < data.length; i ++){
					if(data[i].flag == true){
						wallet_total_amount = wallet_total_amount + data[i].cashback_amount;
					}
					if(data[i].flag == false){
						wallet_total_amount = wallet_total_amount - data[i].cashback_amount;
					}
				}
				var dataObj = {
					data: data,
					wallet_total_amount: wallet_total_amount
				}
				resolve(dataObj);
			}else{
				var dataObj = {
					data: [],
					wallet_total_amount: 0
				}
				resolve(dataObj);
			}
			
		}).catch(err => {
            reject(err);
        });
	});
}



const port = process.env.PORT || 8080;

app.listen(port, () => console.log(`Staging server running on port ${port}`));
