const mongoose = require('mongoose');
const {Schema} = mongoose;
const commentsSchema = new Schema ({
content:{type: true, required:true},
blog:{type: mongoose.SchemaTypes.ObjectId, ref:"Blog"},
author:{type:mongoose.SchemaTypes.ObjectId, ref:'User'}
},
{
    timestamps:true
},
module.exports = mongoose.model('comment',commentsSchema,'comments')
);