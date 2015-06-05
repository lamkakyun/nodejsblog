var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');
var common = require('../common/common.js');

module.exports = function(app) {
  // app.get(['/', '/home'], function(req, res){
  //   User.get('jet', function(err, user){
  //     res.render('home', {title: '主页'});
  //   });
  // });
  
  // app.get(['/', '/home'], function(req, res){
  //   User.getAll(function(err, users){
  //     // console.log(users);
  //     res.render('home', {title: '主页', users: users});
  //   });
  // });

  // app.get(['/', '/home'], function(req, res){
  //   Post.get(null, function(err, posts){
  //     if (err) {
  //       posts = [];
  //     }
  //     // console.log(posts);
  
  //     res.render('home', {
  //       title: '首页',
  //       user: req.session.user,
  //       success: req.flash('success').toString(),
  //       error: req.flash('error').toString(),
  //       posts: posts
  //     });
  //   })
  // });

  app.get(['/', '/home'], function(req, res){
    var size = 3;
    var page = /\d+/.test(req.query.p) ? (parseInt(req.query.p) > 0 ? parseInt(req.query.p) : 1) : 1;
    Post.getPage(null, size, page, function(err, posts, total){
      if (err) {
        posts = [];
      }

      var totalPage = total % size == 0 ? total / size : total / size + 1;

      res.render('home', {
        title: '首页',
        page: page,
        isFirstPage: page == 1,
        isLastPage: (page -1) * size + posts.length >= total,
        totalPage: totalPage,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString(),
        posts: posts
      });

    });
  });

  // app.get('/home', function(req, res){
  //   res.render('home', {title: '主页'});
  // });
  
  app.get('/login', common.checkLogout);
  app.get('/login', function(req, res){
    if (req.session.user) {
      res.redirect('/');
    } else {
      res.render('login', {title: '登录', user: req.session.user, success: req.flash('success').toString(), error: req.flash('error').toString()});
    }
  });

  app.post('/login', common.checkLogout);
  app.post('/login', function(req, res){
    var name = req.body.username;
    var password = req.body.password;

    if (name.trim() == '') {
      req.flash('error', '用户名不能为空');
      return res.redirect('/login');
    }

    if (password.trim() == '') {
      req.flash('error', '密码不能为空');
      return res.redirect('/login');
    }

    User.get(name, function(err, user){
      if (!user) {
        req.flash('error', '用户名不存在');
        return res.redirect('/login');
      }

      var md5 = crypto.createHash('md5');
      if (user.password != md5.update(password).digest('hex')) {
        req.flash('error', '密码错误');
        return res.redirect('/login');
      }
      req.session.user = user;
      req.flash('success', '登录成功');
      res.redirect('/');
    });
  });

  app.get('/register', common.checkLogout);
  app.get('/register', function(req, res){
    res.render('register', {title: '注册', user: req.session.user, success: req.flash('success').toString(), error: req.flash('error').toString()});
  });

  app.post('/register', common.checkLogout);
  app.post('/register', function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    var repassword = req.body.repassword;
    var email = req.body.email;

    if (username.trim() == '') {
      req.flash('error', '用户名不能为空');
      return res.redirect('/register');
    }
    
    if (password.trim() == '' || repassword.trim() == '') {
      req.flash('error', '密码不能留空');
      res.redirect('/register');
    }
  
    if (email.trim() == '') {
      req.flash('error', '邮箱不能为空');
      return res.redirect('/register');
    }

    if (password != repassword) {
      req.flash('error', '确认密码不正确');
      return res.redirect('/register');
    }
    
    var md5 = crypto.createHash('md5');
    password = md5.update(password).digest('hex');

    var newUser = new User({
      name: username,
      password: password,
      email: email
    });

    User.get(newUser.name, function(err, user){
      if (err){
        req.flash('error', err);
        return res.redirect('/');
      }

      // console.log(user)
      if (user){
        req.flash('error', '用户名已存在');
        return res.redirect('/register');
      }
      
  
      newUser.save(function(err, user){
        if (err) {
          req.flash('error', '注册失败');
          return res.redirect('/register');
        }
        req.session.user = user.ops[0];
        req.flash('success', '注册成功');
        return res.redirect('/');
      });

    });

  });

  app.get('/post', common.checkLogin);
  app.get('/post', function(req, res){
    if (req.session.user) {
      res.render('post', {
        title: '发表博文',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    } else {
      req.flash('error', '请先登录，在发表博文');
      return res.redirect('/login');
    }
  });

  app.post('/post', common.checkLogin);
  app.post('/post', function(req, res){
    var post = new Post(req.session.user.name, req.body.title, req.body.post);
    
    if (req.body.title.trim() == '') {
      req.flash('error', '标题不能为空');
      return res.redirect('/post');
    }

    if (req.body.post.trim() == '') {
      req.flash('error', '文章不能为空');
      return res.redirect('/post');
    }
    post.save(function(err, post){
      if (err) {
        req.flash('error', '发表文章失败');
        return res.redirect('/post');
      }

      // console.log(post.ops[0])
      req.flash('success', '发表文章成功');
      res.redirect('/');
    });
  });

  app.get('/logout', common.checkLogin);
  app.get('/logout', function(req, res){
    req.session.user = null;
    req.flash('success', '登出成功');
    res.redirect('/');
  });

  app.get('/upload', common.checkLogin);
  app.get('/upload', function(req, res){
    res.render('upload', {
      title: '上传文件',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/upload', common.checkLogin);
  app.post('/upload', function(req, res){
    req.flash('success', '上传成功');
    return res.redirect('/upload');
  });

  // app.get('/u/:name', function(req, res){
  
  //   User.get(req.params.name, function(err, user){
  //     if (!user) {
  //       req.flash('error', '用户不存在');
  //       return res.redirect('/');
  //     }

  //     Post.get(req.params.name, function(err, posts) {
  //       if (err) {
  //         req.flash('error', '获取用户博文失败');
  //         return res.redirect('/');
  //       }

  //       res.render('user', {
  //         title: user.name,
  //         posts: posts,
  //         user: req.session.user,
  //         success: req.flash('success').toString(),
  //         error: req.flash('error').toString()
  //       });
  //     });

  //   })

  // });

  app.get('/u/:name', function(req, res){
  
    // User.get(req.params.name, function(err, user){
    //   if (!user) {
    //     req.flash('error', '用户不存在');
    //     return res.redirect('/');
    //   }

    //   Post.get(req.params.name, function(err, posts) {
    //     if (err) {
    //       req.flash('error', '获取用户博文失败');
    //       return res.redirect('/');
    //     }

    //     res.render('user', {
    //       title: user.name,
    //       posts: posts,
    //       user: req.session.user,
    //       success: req.flash('success').toString(),
    //       error: req.flash('error').toString()
    //     });
    //   });

    // });

    var size = 3;
    var page = /\d+/.test(req.query.p) ? (parseInt(req.query.p) > 0 ? parseInt(req.query.p) : 1) : 1;
    Post.getPage(req.params.name, size, page, function(err, posts, total){
      if (err) {
        posts = [];
      }

      var totalPage = total % size == 0 ? total / size : total / size + 1;

      res.render('user', {
        title: req.params.name,
        page: page,
        isFirstPage: page == 1,
        isLastPage: (page -1) * size + posts.length >= total,
        totalPage: totalPage,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString(),
        posts: posts
      });

    });
  });

  app.get('/u/:name/:day/:title', function(req, res){
    Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post){
      if (err) {
        req.flash('error', '找不到文章');
        return res.redirect('/');
      }

      res.render('article', {
        title: req.params.title, 
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/article/:id', function(req, res) {
    Post.getById(req.params.id, function(err, post) {
      if (err) {
        req.flash('error', '找不到博文');
        return res.redirect('/');
      }

      res.render('article', {
        title: post.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });

    });
  });

  app.get('/edit/:id', common.checkLogin);
  app.get('/edit/:id', function(req, res){
    // console.log(req.params.id + '=====================')
    Post.edit(req.params.id, function(err, post){
      if (err) {
        req.flash('error', '编辑博文失败');
        return res.redirect('back');
      }

      req.flash('success', '编辑博文成功');
      res.render('edit', {
        title: '编辑博文',
        user: req.session.user,
        post: post,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  
  app.post('/update', common.checkLogin);
  app.post('/update', function(req, res){
    Post.update(req.body.postid, req.body.title, req.body.post, function(err){
      if (err) {
        req.flash('error', '更新博文失败'); 
        return res.redirect('back');
      }

      req.flash('success', '更新博文成功');
      // return res.redirect('/edit/' + req.body.id);
      return res.redirect('/u/' + req.session.user.name  );
    });
  });
  

  app.get('/remove/:id', common.checkLogin);
  app.get('/remove/:id', function(req, res){
    if (req.session.user.name != 'admin') {
      req.flash('error', '你不是管理员，不能删除博文');
      return res.redirect('back');
    }

    Post.remove(req.params.id, function(err){
      if (err) {
        req.flash('error', '删除博文失败');
        return res.redirect('back');
      }

      req.flash('success', '删除文章成功');
      return res.redirect('/');
    });
  });

  app.post('/comment', function(req, res){
    if (req.body.comment.trim() == "") {
      req.flash('error', '评论不能为空');
      return res.redirect('back');
    }

    var comment = new Comment(
      req.body.postid,
      req.body.comment
    );

    comment.save(function(err){
      if (err) {
        req.flash('error', '保存评论失败');
        return res.redirect('back');
      }
      
      req.flash('success', '评论成功');
      return res.redirect('back');
    });

  });

};
