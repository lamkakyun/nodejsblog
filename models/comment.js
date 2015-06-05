var mongodb = require('./db.js');

function Comment(postid, comment){
  this.postid = postid;
  this.comment = comment;
}

module.exports = Comment;

Comment.prototype.save = function(callback) {
  var postid = this.postid;

  var comment = {
    comment: this.comment,
    time: new Date()
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

      collection.update({
        _id: require('mongodb').ObjectId(postid),
      }, {
        $push: {comments: comment}
      }, function(err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        return callback(null);
      });

    });

  });
};
