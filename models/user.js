var mongodb = require('./db.js');

function User(user){
  this.name = user.name;
  this.password = user.password;
  this.email = user.email;
}

module.exports = User;

User.prototype.save = function(callback) {
  var user = {
    name: this.name,
    password: this.password,
    email: this.email
  };

  mongodb.open(function(err, db){
    if (err){
      return callback(err);
    }

    db.collection('users', function(err, collection){
      if (err){
        mongodb.close();
        return callback(err);
      }

      collection.insert(user, {safe: true}, function(err, user){
        mongodb.close();
        if (err) {
          return callback(err);
        }
        // console.log(user)
        // console.log(user.ops[0])
        callback(null, user);

      });
    });
  });
}

User.get = function(name, callback){
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('users', function(err, collection){
      
      if (err) {
        mongodb.close();
      }

      collection.findOne({name: name}, function(err, user){
        mongodb.close();

        if (err) {
          return callback(err);
        }

        callback(null, user);
      })
    });
  });
};

User.getAll = function(callback) {
  mongodb.open(function(err, db){
    if (err) {
      return callback(err);
    }

    db.collection('users', function(err, collection){
      if (err){
        mongodb.close();
        return callback(err);
      }

      collection.find({}).toArray(function(err, docs){
        if (err) {
          mongodb.close();
          return callback(err);
        }

        callback(null, docs);
      });
    });
  });
};
