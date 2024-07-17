class BlogDetailsDTO{
    constructor(blog)
    {
        this.author = blog.author;
        this.content = blog.content;
        this.title = blog.content;
        this.photo = blog.photoPath;
        this.authorname = blog.author.name;
        this.authorusername = blog.author.username;
    }
}
module.exports = BlogDetailsDTO;