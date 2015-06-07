var mongodb = require('./db.js');
var markdown = require('markdown').markdown;

function Post(name, title, tags, post){
  this.name = name;
  this.title = title;
  this.tags = tags;
  this.post = post;
}

module.exports = Post;

Post.prototype.save = function(callback) {
  var date = new Date();
  var time = {
    date: date,
    year: date.getFullYear(),
    month: date.getFullYear() + "-" + (date.getMonth() + 1),
    day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
    minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : date.getMinutes())
  };

  var post = {
    name: this.name,
    time: time,
    title: this.title,
    tags: this.tags,
    post: this.post,
    reprint_info: {},
    pv: 0
  };

  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.insert(post, {safe: true}, function(err, post){
        mongodb.close();
        if (err) {
          return callback(err);
        }

        // console.log(post.ops[0]);
        return callback(null, post.ops[0]);
      })
    });

  });
};

Post.get = function(name, callback){
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      
      var query = {};
      if (name) {
        query.name = name;
      }
      collection.find(query).sort({time: -1}).toArray(function(err, posts){
        mongodb.close();
        if (err){
          return callback(err);
        }

        posts.forEach(function(post){
          post.post = markdown.toHTML(post.post);
        });

        callback(null, posts);
      });
    });
  });
};

Post.getOne = function(name, day, title, callback) {
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }
    
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      
      collection.findOne({name: name, "time.day": day, title: title}, function(err, post){
        mongodb.close();
        if (err || !post) {
          // console.log('fuc')
          return callback(err);
        }
        // console.log(post)
        post.post = markdown.toHTML(post.post);
        return callback(null, post);
      });
    });

  });
};

Post.edit = function(id, callback) {
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.findOne({_id: require('mongodb').ObjectId(id)}, function(err, post){
        mongodb.close();
        if (err) {
          return callback(err);
        }

        return callback(null, post);
      });
    });
  })
};

Post.update = function(id, title, tags,  post, callback) {
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.update({_id: require('mongodb').ObjectId(id)}, {$set: {
        title: title,
        post: post,
        tags: tags
      }}, function(err){
        if (err) {
          return callback(err);
        }

        return callback(null);
      });
    });
  });
};



/* -------------------------------*/
/** 
 * @Synopsis 删除文章，if 转载文章 then 删除原文章的reprint_to 
 * 
 * @Param id
 * @Param callback
 * 
 * @Returns   
 */
/* ---------------------------------*/
Post.remove = function(id, callback) {
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.findOne({_id: require('mongodb').ObjectId(id)}, function(err, post){
        if (err || !post) {
          mongodb.close();
          return callback(err);
        }

        // del reprint_to info 
        if (post.reprint_info && post.reprint_info.reprint_from) {
          var from_id = post.reprint_info.reprint_from;
          collection.update({_id: require('mongodb').ObjectId(from_id)}, {$pull: {"reprint_info.reprint_to": require('mongodb').ObjectId(id)}}, function(err){
            if (err) {
              mongodb.close();
              return callback(err);
            }
          });
        }

        collection.remove({_id: require('mongodb').ObjectId(id)}, function(err){
          if (err) {
            mongodb.close();
            return callback(err);
          }
          return callback(null);
        });

      });
    });
  });
};


Post.getById = function(id, callback) {
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.findOne({_id: require('mongodb').ObjectId(id)}, function(err, post){
        if (err) {
          mongodb.close();
          return callback(err);
        }
        if (post) {
          collection.update({_id: require('mongodb').ObjectId(id)}, {$inc: {pv: 1}}, function(err){
            mongodb.close();
            if (err){
              return callback(err);
            }
          });
        }
        // console.log(post);

        post.post = markdown.toHTML(post.post);
        return callback(null, post)
      });
    });
  });
};


Post.getPage = function(name, size, page, callback) {
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }
  
      var query = {};
      if (name) {
        query.name = name;
      }

      collection.count(query, function(err, total){
        collection.find(query, {
          skip: (page - 1) * size,
          limit: size
        }).sort({time: -1}).toArray(function(err, posts){
          mongodb.close();
          if (err) {
            return callback(err);
          }

          return callback(null, posts, total);
        });
      });

    });
  });
};

Post.getArchive = function(callback) {
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.find({},{name: 1, title:1, time:1}).sort({time: -1}).toArray(function(err, posts){
        mongodb.close();

        if (err) {
          return callback(err);
        }

        return callback(err, posts);
      });
    });
  })
};


Post.getTags = function(callback) {
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.distinct('tags', function(err, tags){
        mongodb.close();

        if (err) {
          return callback(err);
        }

        return callback(null, tags);
      });
    });
  });
};


Post.getPostByTag = function(tag, callback) {
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.find({tags: tag}).sort({time:-1}).toArray(function(err, posts){
        mongodb.close();

        if (err) {
          return callback(err);
        }

        return callback(null, posts);
      });
    });
  });
};


Post.search = function(keyword, callback) {
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
  
      var pattern = new RegExp(keyword, 'i');
      collection.find({title: pattern}).sort({time: -1}).toArray(function(err, posts) {
        mongodb.close();

        if (err) {
          return callback(err);
        }

        return callback(null, posts);
      });
    });
  });
};



/* -------------------------------*/
/** 
 * @Synopsis 转载文章
 * 
 * @Param from_id
 * @Param callback
 * 
 * @Returns   
 */
/* ---------------------------------*/
Post.reprint = function(from_id, to_info, callback) {
  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    }

    db.collection('posts', function(err, collection){
      if (err) {
        mongodb.close();
        return callback(err);
      }

      collection.findOne({_id: require('mongodb').ObjectId(from_id)}, function(err, post) {
        if (err) {
          mongodb.close();
          return callback(err);
        }

        var date = new Date();

        var time = {
          date: date,
          year: date.getFullYear(),
          month: date.getFullYear() + "-" + (date.getMonth() + 1),
          day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
          minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : date.getMinutes())
        };
        
        // 创建转载文章
        delete post._id;
        post.name = to_info.name;
        post.time = time;
        post.title = (post.title.search(/[转载]/) > -1) ? post.title : "[转载]" + post.title;
        post.comments = [];
        post.reprint_info = {reprint_from: from_id};
        post.pv = 0;

        collection.insert(post, {safe: true}, function(err, post){
          if (err) {
            mongodb.close();
            return callback(err);
          }

          // 更新被转载文章的转载信息
          collection.update({_id: require('mongodb').ObjectId(from_id)},{$push: {"reprint_info.reprint_to": post.ops[0]._id}}, function(err){
            mongodb.close();
            
            if (err) {
              return callback(err);
            }

            return callback(null, post.ops[0]._id);
          });

        });


      });
    });
  });
};
