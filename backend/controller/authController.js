const Joi = require('joi');
const bcrypt = require('bcryptjs');
const User = require('../models/users');
const passwordpattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;
const UserDTO = require('../dto/user');
const JWTService = require('../services/JWTService');
const RefreshToken = require('../models/token');
const authController = {
    async register(req,res,next)
    {
       const userRegisterSchema = Joi.object({
        username: Joi.string().min(5).max(30).required(),
        name:Joi.string().max(30).required(),
        email: Joi.string().email().required(),
        password: Joi.string().pattern(passwordpattern).required(),
        confirmpassword: Joi.ref('password')
       });
       const{error} = userRegisterSchema.validate(req.body); 
       if(error)
        {
            return next(error);
        }
        const {name,username,email,password} = req.body;
        try {
            const emailInuse = await User.exists({email});
            const usernameInuse = await User.exists({username})

            if (emailInuse)
                { const error ={
                    status: 409,
                    message: 'Email already in use, register another email'
                }
                return next(error);
                }
                if(usernameInuse)
                    {
                        const error = {
                            status: 409,
                            message: 'username already taken'

                        }
                        return next(error);
                    }

        } catch (error) {
            return next(error);
        }
        const hashedpassword = await bcrypt.hash(password,10);
        let accessToken;
        let refreshToken;
        let userz;
        try {
            const usertoRegister = new User({
                username,
                name,
                email,
                password: hashedpassword,
                
                
            });
            userz = await usertoRegister.save();
            accessToken = JWTService.signAccessToken({_id: userz._id, username: userz.username}, '30m');
            refreshToken = JWTService.signRefreshToken({_id: userz._id}, '60m')
            
                
        } catch (error) {
            return next(error);
        }
        await JWTService.storeRefreshToken(refreshToken, userz._id);
        res.cookie('accessToken', accessToken,{
            maxAge: 1000*60*60*24,
            httpOnly: true
        })
        res.cookie('refreshToken', refreshToken,{
            maxAge: 1000*60*60*24,
            httpOnly: true
        })
        const userDTO = new UserDTO(userz);
        return res.status(201).json({userz: userDTO, auth: true});
    },
    async login(req, res, next)
    {   
        const userLoginSchemma = Joi.object({
            username: Joi.string().min(5).max(30).required(),
            password: Joi.string().pattern(passwordpattern).required(),
        });
        const {error} = userLoginSchemma.validate(req.body);
        const {username,password} = req.body;
        if(error)
            {
                return next(error);
            }
            let user;
            try {
                user = await User.findOne({username});
                if(!user)
                    {
                        const error = {
                            status: 401,
                            message: "Invalid user"
                        }
                        return next(error);
                    }
                     const match = await bcrypt.compare(password, user.password);      
                    if(!match)
                        {const error = {
                            status:401,
                            message : "Invalid Password"
                        }
                        return next(error);
                    }
                        
            } catch (error) {
                return next(error);
            }
            const accessToken = JWTService.signAccessToken({_id: user._id, username: user.name}, '30m');
            const refreshToken = JWTService.signRefreshToken({_id: user._id},'60m');
            try {
                
            } catch (error) {
                
            }
            try {
                await RefreshToken.updateOne({_id: user._id},
                    {token: refreshToken},
                    {upsert: true}
                )    
            } catch (error) {
                return next(error);
            }
            
            res.cookie('accessToken', accessToken, {
                maxAge: 1000*60*60*24,
                httpOnly: true
            }

            )
            res.cookie('refreshToken', refreshToken,{
                maxAge: 1000*60*60*24,
                httpOnly: true
            })
            const userDTO = new UserDTO(user);
            return res.status(200).json({user: userDTO, auth: true});
    },
    async logOut(req,res,next)
    {
        console.log(req);
        const {refreshToken} = req.cookies;
        try {
                await RefreshToken.deleteOne({token: refreshToken});

            
        } catch (error) {
            return next(error);
        }
        res.clearCookie('accessToken');
        res.clearCookie('refreshTokenn');
        res.status(201).json({user: null, auth: false});
    },
    async refresh(req,res,next)
    {
        const originalRefreshToken = req.cookies.refreshToken;
        let id;
        try {
            id= JWTService.verifyRefreshToken(originalRefreshToken);
 
        } catch (error) {

        return next(error);
        }
        try {
            const match = RefreshToken.findOne({_id: id, token: originalRefreshToken})
            if(!match)
                {
                    const error ={
                        status: 401,
                        message: "unauthorized"
    
                    }
                    return next(error);
                }
        } catch (error) {
            return next(error);
        }
        try {
            const accessToken = JWTService.signAccessToken({_id: id}, '30m');
            const refreshToken = JWTService.signRefreshToken({_id: id}, '60m');
            await RefreshToken.updateOne({_id: id},{token: refreshToken});
            res.cookie('accessToken', accessToken,{
                maxAge: 1000*60*60*24,
                httpOnly: true
            });
            res.cookie('refreshToken', refreshToken,{
                maxAge: 1000*60*60*24,
                httpOnly: true
            })
        } catch (error) {
            return next(error);
        }
        const user = await User.findOne({_id: id});
        const userDTO = new UserDTO(user);
        return res.status(201).json({user: userDTO, auth: true})
    }
}

module.exports = authController;