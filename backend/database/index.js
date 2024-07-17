const mongoose = require ('mongoose');
const {ConnectionString} = require('../config/index');
const dbconnect = async()=>{
try{
    const con = await mongoose.connect(ConnectionString);
    console.log('db connected');
}
catch (error){
    console.log(error);

}
    
}

module.exports = dbconnect;