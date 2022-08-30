// postgres
var Sequelize = require('sequelize');
var database = 'dehtfvogmoa6hq';
var password = '1e156a151c7150257650a3b888f3ea2c9e712c795218126d86b9ac5a54a4fbd2';
var username = 'xygicaoyinvzri';
var host = 'ec2-52-20-166-21.compute-1.amazonaws.com';

let sequelize = new Sequelize(database, username, password, {
    host: host,
    port: 5432,
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            rejectUnauthorized: false
        }
    },
    query: {
        raw: true
    },
    logging: false
});

let posts = sequelize.define('posts', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
});

let categories = sequelize.define('categories', {
    category: Sequelize.STRING
});

posts.belongsTo(categories, {
    foreignKey: 'CategoryId'
});


// reading the data from database using the promise | properly handling the errors
module.exports.initialize = function () {
    var promise = new Promise((resolve, reject) => {
        sequelize.sync().then(() => {
            resolve("initialize -> success");
        }).catch((e) => {
            reject("unable to sync with database");
        });
    });
    return promise;
}

// function for the returning all the posts, again with proper error handling using promise
module.exports.getAllPosts = function () {
    var promise = new Promise((resolve, reject) => {
        posts.findAll().then((data) => {
            if (data.length < 1) {
                var err = "No post returned!";
                reject({ message: err });
            }
            resolve(data);
        }).catch((e) => {
            var err = "Error while fetching results from database.";
            reject({ message: err });
        });
    });
    return promise;
};

// function for the published posts, again with proper error handling using promise
// the posts array will be checked and only the published posts (posts == true) will be returned back
module.exports.getPublishedPosts = function () {
    var promise = new Promise((resolve, reject) => {
        posts.findAll({
            where: {
                published: true
            }
        }).then((data) => {
            if (data.length < 1) {
                var err = "No post returned!";
                reject({ message: err });
            }
            resolve(data);
        }).catch((e) => {
            var err = "Error while fetching results from database.";
            reject({ message: err });
        });
    });
    return promise;
};

module.exports.getPublishedPostsByCategory = function (category) {
    var promise = new Promise((resolve, reject) => {
        posts.findAll({
            where: {
                published: true,
                CategoryId: category
            }
        }).then((data) => {
            if (data.length < 1) {
                var err = "No post returned!";
                reject({ message: err });
            }
            resolve(data);
        }).catch((e) => {
            var err = "Error while fetching results from database.";
            reject({ message: err });
        });
    });
    return promise;
};

// function for the categories, again with proper error handling using promise
module.exports.getCategories = function () {
    var promise = new Promise((resolve, reject) => {
        categories.findAll().then((data) => {
            if (data.length < 1) {
                var err = "No category returned!";
                reject({ message: err });
            }
            resolve(data);
        }).catch((e) => {
            var err = "Error while fetching results from database.";
            reject({ message: err });
        });
    });
    return promise;
};




// function for adding new posts
module.exports.addPost = function (postData) {
    (!postData.published) ? postData.published = false : postData.published = true;
    var promise = new Promise((resolve, reject) => {
        console.log(postData.category)
        posts.create({
            body: postData.body,
            title: postData.title,
            postDate: postData.postDate,
            featureImage:postData.featureImage,
            published: postData.published,
            CategoryId: postData.category
        }).then(function (){
            resolve(true);
        }).catch(function (){
            reject("addPost -> failure");
        });
    });
    return promise;
};

// function for adding new posts
module.exports.addCategory = function (postData) {
    var promise = new Promise((resolve, reject) => {
        categories.create( {
            category: postData.category
        }).then(function (){resolve()}).catch(function (){reject("addCategory -> failure");});
    });
    return promise;
};

//  return posts of specific categories only
module.exports.getPostsByCategory = function (id) {
    var promise = new Promise((resolve, reject) => {
        posts.findAll({
            where: {
                CategoryId: id
            }
        }).then((data) => {
            if (data.length < 1) {
                var err = "No post returned!";
                reject({ message: err });
            }
            resolve(data);
        }).catch((e) => {
            var err = "Error while fetching results from database.";
            reject({ message: err });
        });
    });
    return promise;
};


//  return posts of specific dates only
function dateCompare(date1, date2) {
    var promise = new Promise((resolve, reject) => {
        reject();
    });
    return promise;
};

//  fetch single post by id
module.exports.getPostById = function (id) {
    var promise = new Promise((resolve, reject) => {
        posts.findAll({
            where: { id: id }
        }).then((data) => {
            if (data.length < 1) {
                var err = "No post returned!";
                reject({ message: err });
            }
            resolve(data);
        }).catch((e) => {
            var err = "Error while fetching results from database.";
            reject({ message: err });
        });
    });
    return promise;
}

// delete a post by its id
module.exports.deletePost = function (id){
    var promise = new Promise((resolve, reject) => {
        posts.destroy({
            where: {
                id: id
            }
        }).then(()=>resolve()).catch((error)=>reject(error));
    });
    return promise;
}

// delete a category by its id
module.exports.deleteCategory = function (id){
    var promise = new Promise((resolve, reject) => {
        categories.destroy({
            where: {
                id: id
            }
        }).then(()=>resolve()).catch((error)=>reject(error));
    });
    return promise;
}
