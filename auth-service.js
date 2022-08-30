require('dotenv').config();
const mongoose = require("mongoose");
const bcryptjs = require('bcryptjs');

const Schema = mongoose.Schema;
const userSchema = new Schema({
    userName: {
        type: String,
        unique: true
    },
    password: String,
    email: String,
    loginHistory: [{
        dateTime: Date,
        userAgent: String
    }]
});

let User;

module.exports.initialize = () => new Promise((resolve, reject) => {
    mongoose.connect(process.env.MONGODB)
        .then(() => {
            User = mongoose.model('User', userSchema);
            resolve();
        })
        .catch((err) => reject({error: err}));
})

module.exports.registerUser = (userData)=> new Promise(async (resolve, reject)=>{
    if(userData.password != userData.password2){
        return reject({error: 'Passwords do not match!'});
    }
    if(userData.password.trim() === "" || userData.email.trim() === "" || userData.userName.trim() === ""){
        return reject({error: 'All the fields are requireds!'});
    }
    if(userData.userName.length < 5 ){
        return reject({error: 'Username too short!'});
    }
    if(userData.password.length < 5){
        return reject({error: 'Password too weak!'});
    }
    if(userData.email.length < 5){
        return reject({error: 'Invalid Email'});
    }
    let hash = await bcryptjs.hash(userData.password, 10);
    let newUser = new User({
        userName: userData.userName,
        password: hash,
        email: userData.email
    })

    newUser.save().then((err)=>{
            resolve();
    }).catch((err)=>{
        if(err.code == 11000){
            reject({error:`Username "${userData.userName}" has already been taken. Please choose an other one.`});
        }else

        if(err.code != 11000){
            reject({error:"There was an error while creating the user. Error: "+err });
        }
        
    })

})


module.exports.checkUser = (userData) => new Promise((resolve, reject)=>{
    User.find({
        userName : userData.userName
    }).exec()
    .then(async (row)=>{
        if(row.length == 0){
            return reject({error: 'User not found!'});
        }
        let deHash = await bcryptjs.compare(userData.password, row[0].password);
        if(!deHash){
            return reject({error: 'Incorrect password!'});
        }
        row[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
        User.updateOne({
            userName:userData.userName
        },{
            $push:{
                loginHistory:{dateTime: (new Date()).toString(), userAgent: userData.userAgent}
            }
        })
        .exec().then(()=>resolve(row[0])).catch((err)=>{
            reject({error: "There was an error while verifying the user"});
        })
    }).catch((err)=>{
        reject({error: "User not found!"});
    })
})

