const express = require('express');
const {PORT} = require('./config/index')
const dbconnect = require('./database/index');
const Router = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(Router);
dbconnect();
app.use(errorHandler);
app.get('/',(req,res)=> res.json({msg: 'hello  as world'}));
app.listen(PORT, console.log('I  am running'))