const Joi = require('joi');
const mongodbIdPattern = /^[0-9a-fA-f]{24}$/;
const commentDTO = require('../dto/comments');

const commentController ={
    async create(req,res,next){
        const createCommentSchema = Joi.object({
            content: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            blog:Joi.string().regex(mongodbIdPattern).required()
        });
        const {error} = createCommentSchema.validate(req.body);
        if(error)
        {
            return next(error);
        }
        const {content, author, blog} = req.body;
        try {
            const newComment = new Comment({
                content, author, blog
            });
            await newComment.save();
        } catch (error) {
            return next(error);
        }
        return res.status(201).json({message: 'comment created'});
    },
    async getById(req,res,next)
    {
        const getbyIdschema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required(),
        });
        const {error} = getbyIdschema.validate(req.params);
        if(error)
        {
            return next(error);
        }
        const {id} = req.params;
        let comments;
        try {
           comments = await Comment.find({blog: id})
        } catch (error) {
            return next(error);
        }
        let commentsDTO = [];
        for(let i =0; i<comments.length; i++)
        {
            const obj  = new commentDTO(comments[i]);
            commentsDTO.push(obj);
        }
        return res.status(200).json({data: commentsDTO});
    }
}
module.exports = commentController;