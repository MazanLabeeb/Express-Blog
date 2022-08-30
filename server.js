/*********************************************************************************
* WEB322 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Ashish Kumar      Student ID: 145529202   Date: 24/06/2022
*
* Online (Heroku) Link: https://ashishkumarsblog.herokuapp.com/
*
********************************************************************************/

const express = require("express");
const path = require("path");
const blogService = require("./blog-service");
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier');
const { read } = require("fs");
const exphbs = require("express-handlebars");
const stripJs = require('strip-js');
const auth = require("./auth-service");
const clientSessions = require("client-sessions");

const app = express();
const port = process.env.PORT || 8080;
const upload = multer(); // no { storage: storage } since we are not using disk storage

// MIDDLEWARES
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(function (req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});
app.use(clientSessions({
    cookieName : "session", 
    secret: "ashishkumarblogassignment6", 
    duration: 1000*60*60*24*7, 
    activeDuration:1000*60*60*24
}))
app.use(function (req, res, next){
    res.locals.session = req.session;
    next();
})

function ensureLogin(req, res, next){
    if(!req.session.user){
        res.redirect('/login');
    }else{
        next();
    }
}

//  express handlbar setting up
app.engine(".hbs", exphbs.engine({
    extname: ".hbs",
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        }
        ,
        formatDate: function (dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        safeHTML: function (context) {
            return stripJs(context);
        }


    }
}));
app.set("view engine", ".hbs");


// cloudinary config 
cloudinary.config({
    cloud_name: 'dvlwsvym1',
    api_key: '959777665623617',
    api_secret: 'filSddd4W_1BFxkuIjXzqzaeSws',
    secure: true
});

//  date time function 
var d = new Date();
function postDate() {

    var date = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    if (month < 10) month = `0${month}`;
    if (date < 10) date = `0${date}`;
    return (year + "-" + month + "-" + date);
}




// index route being redirect to about page
app.get('/', (req, res) => {
    res.redirect("/blog");
});

app.route('/login')
.get( (req, res)=>{
    res.render('login')
})
.post((req, res)=>{
    req.body.userAgent = req.get('User-Agent');
    auth.checkUser(req.body).then((user)=>{
        req.session.user = {
            userName :user.userName, 
            email :user.email,
            loginHistory:user.loginHistory
        }
        res.redirect('/posts');
    })
    .catch((err)=>{
        res.render('login', {
            errorMessage:err.error
        })
    })
})
app.route('/register')
.get((req, res)=>{
    res.render('register')
})
.post((req, res)=>{
    auth.registerUser(req.body).then(()=>{
        res.render('register',{
            successMessage: "User Created. You can now login."
        })
    }).catch((err)=>{
        res.render('register',{
            errorMessage: err.error,
            userName :req.body.userName
        })
    })
})

app.get('/userHistory',ensureLogin, (req, res)=>{
    res.render('userHistory');
})
app.get('/logout', (req, res)=>{
    req.session.reset();
    res.redirect('/login');
})

//  the route "/about" returning the about.html file
app.get('/about', (req, res) => {

    res.render('about', {
    });
});

//  the route "/posts/add" returning the addPost.html file
app.get('/posts/add',ensureLogin,  async (req, res) => {
    blogService.getCategories().then((d) => {
        res.render('addPost', {
            categories: d
        });
    }).catch(() => {
        res.render('addPost');
    });
});



// route for the blog
app.get('/blog', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try {

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            posts = await blogService.getPublishedPostsByCategory(req.query.category);
        } else {
            // Obtain the published "posts"
            posts = await blogService.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest post from the front of the list (element 0)
        let post = posts[0];

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;

    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        let categories = await blogService.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", { data: viewData })

});
app.get('/blog/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try {

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if (req.query.category) {
            // Obtain the published "posts" by category
            posts = await blogService.getPublishedPostsByCategory(req.query.category);
        } else {
            // Obtain the published "posts"
            posts = await blogService.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;

    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the post by "id"
        viewData.post = await blogService.getPostById(req.params.id);
        viewData.post = viewData.post[0];
    } catch (err) {
        viewData.message = "no results";
    }

    try {
        // Obtain the full list of "categories"
        let categories = await blogService.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", { data: viewData })
});

app.post('/posts/add',ensureLogin, upload.single("featureImage"), (req, res) => {

    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream(
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );
            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };
    async function upload(req) {
        let result = await streamUpload(req);
        // console.log(result);
        return result;
    }

    upload(req).then((uploaded) => {
        req.body.featureImage = uploaded.url;
        req.body.postDate = postDate(); // post published date

        // now calling addPost function 
        blogService.addPost(req.body).then((data) => {
            if (data) {
                res.redirect("/posts");
            }
        }).catch((e) => {
            console.log(e);
        });
    }).catch((e) => {
        req.body.featureImage = "photo not available";
        req.body.postDate = postDate(); // post published date

        // now calling addPost function 
        blogService.addPost(req.body).then((data) => {
            if (data) {
                res.redirect("/posts");
            }
        }).catch((e) => {
            console.log(e);
        });
    });


});

app.route('/categories/add', ensureLogin)
    .get((req, res) => {
        res.render('addCategory')
    })
    .post((req, res) => {
        blogService.addCategory(req.body).then(function () {
            res.redirect('/categories')
        }).catch(function (e) {
            res.send(e);
        });
    })

app.get('/categories/delete/:id',ensureLogin, function (req, res) {
    blogService.deleteCategory(req.params.id).then(function () {
        res.redirect('/categories?deleted=true');
    }).catch(function (e) {
        res.send(e);
    });
});

app.get('/posts/delete/:id', ensureLogin,function (req, res) {
    blogService.deletePost(req.params.id).then(function () {
        res.redirect('/posts?deleted=true');
    }).catch(function (e) {
        res.send(e);
    });
});



// route for the posts
app.get('/posts',ensureLogin, (req, res) => {
    let category = req.query.category;
    let minDateStr = req.query.minDate;
    var msg = req.query.deleted;
    if (category) {
        blogService.getPostsByCategory(category)
            .then((data) => {
                res.render('posts', {
                    data: data
                });
            })
            .catch((err) => {
                res.render('posts', {
                    data: err
                });
            });
    } else if (minDateStr) {
        blogService.getPostsByMinDate(minDateStr)
            .then((data) => {
                res.render('posts', {
                    data: data
                });
            })
            .catch((err) => {
                res.render('posts', {
                    data: err
                });
            });
    } else {
        blogService.getAllPosts()
            .then((data) => {
                res.render('posts', {
                    data: data,
                    msg: msg
                });
            })
            .catch((err) => {
                res.render('posts', {
                    data: err,
                    msg: msg
                });
            });
    }

});

// route for the single post fetch
app.get('/post/:value',ensureLogin, (req, res) => {
    blogService.getPostById(req.params.value).then((data) => {
        res.json(data);
    }).catch((e) => {
        res.json(e);
    });
});
// route for the categories
app.get('/categories', ensureLogin,(req, res) => {
    var msg = req.query.deleted;
    blogService.getCategories()
        .then((data) => {
            res.render('categories', {
                data: data,
                msg: msg
            });
        })
        .catch((err) => {
            res.render('categories', {
                data: err,
                msg: msg
            });
        });

});


//  showing Error 404 in case the route is not valid
app.use((req, res) => {
    res.status(404).render('404');
});


// server will be accessible only if the json files were read successfully
blogService.initialize()
.then(auth.initialize())
    .then(() => {
        app.listen(port, () => {
            console.log(`Express http server listening to port: ${port}`);
        });

    })
    .catch(err => {
        console.log(err);
    })
