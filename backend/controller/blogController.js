const Joi = require('joi');
const fs = require('fs');
const mongodbIdPattern = /^[0-9a-fA-f]{24}$/;
const Blog = require('../models/blogs');
const {BACKEND_SERVER_PATH} = require('../config/index');
const BlogDTO = require('../dto/blog');
const BlogDetailsDTO = require('../dto/blogdetailsdto');
const blogController = {
    async create(req, res, next) {
        const createBlogSchema = Joi.object({
            title:Joi.string().required(),
            author:Joi.string().regex(mongodbIdPattern).required(),
            content:Joi.string().required(),
            photo:Joi.string().required()
        })
        const {error} = createBlogSchema.validate(req.body);
        if(error)
            {
                return next(error);
            }

        const{title, author, content, photo} = req.body;
        const buffer = Buffer.from(photo.replace(/^data: image\/(png|jpg|jpeg);base64,/, ''),'base64');
        const imagePath = `${Date.now()}-${author}.png`;
        try {
            fs.writeFileSync(`storage/${imagePath}`, buffer);
        } catch (error) {
            return next(error);
        }
        let newblog;
        try {
            newblog = new Blog({
                title,
                author,
                content,
                photopath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`
            });
            await newblog.save();
        } catch (error) {
            return next(error);
        }
        const blogDto = new BlogDTO(newblog);

        res.status(201).json({blog: blogDto});
    },
    async getAll(req,res,next){
        try {
            const blogs = await Blog.find({});
            const blogDto = [];
            for(i=0; i<blogs.length; i++)
                {
                    const dto = new BlogDTO(blogs[i]);
                    blogDto.push(dto);
                }
                return res.status(201).json({blogs: blogDto});
        } catch (error) {
            return next(error);
        }

    },
    async getById(req,res,next){
        const getbyIdschema = Joi.object({
            id: Joi.string.regex(mongodbIdPattern).required()
        });
        const {error} = getbyIdschema.validate(req.params);
        if(error)
            {
                return next(error);
            }
            let blog;
            const {id} = req.params;
            try {
                blog = await Blog.findOne({_id: id}).populate('author');
            } catch (error) {
                return next(error);
                
            }
            const blogDto = new BlogDetailsDTO(blog);
            return res.status(200).json({blogs: blogDto});
    },
    async update(req,res,next){

        const updateBlogSchema = Joi.object({
            title: Joi.string.required(),
            content: Joi.string.required(),
            author: Joi.string.regex(mongodbIdPattern).required(),
            blogId: Joi.string.regex(mongodbIdPattern).required(),
            photo: Joi.string()
        });
        const {error} = updateBlogSchema.validate(req.body);
        const {title, content, author, blogId, photo} = req.body;
        let blog;
        try {
            blog = await Blog.findOne({_id: blogId});
        } catch (error) {
            return next(error);
        }
        if (photo) {
            let previousPhoto = blog.photoPath;
      
            previousPhoto = previousPhoto.split("/").at(-1);
      
            // delete photo
            fs.unlinkSync(`storage/${previousPhoto}`);
      
        const buffer = Buffer.from(photo.replace(/^data: image\/(png|jpg|jpeg);base64,/, ''),'base64');
        const imagePath = `${Date.now()}-${author}.png`;
        try {
            fs.writeFileSync(`storage/${imagePath}`, buffer);
        } catch (error) {
            return next(error);
        }
        await Blog.updateOne({_id: blogId},
        {
            title, content, photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`
        });
    }
    else{
        await Blog.updateOne({_id: blogId},{title, content});
    }
    return res.status(200).json({message: 'blog updated'});
    },
    async delete(req, res, next){
        const deleteBlogSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required()
        });
    const {error} = deleteBlogSchema.validate(req.params);
    const{id} = req.params;
    try {
        Blog.deleteOne({_id: id});
        await Comment.deleteMany({blog: id});
    } catch (error) {
        return next(error);
    }
    return res.status(200).json({message: 'blog deleted'});
    }
}
module.exports = blogController;