require('dotenv').config();
var Koa = require('koa');
const { koaBody } = require('koa-body');
var Router = require('koa-router');
const { MongoClient, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const DB_NAME = 'finalproject';

var app = new Koa();
var router = new Router();

app.use(koaBody());

router.get('/', (ctx, next) => {
  ctx.body = { };
});

router.post('/signup', async (ctx, next) => {
  const { username, password } = ctx.request.body;

  if (!username) {
    ctx.status = 400;
    ctx.body = { msg: '请输入用户名！' };
    return;
  } else if (!password) {
    ctx.status = 400;
    ctx.body = { msg: '请输入密码！' };
    return;
  } else if (typeof username !== 'string') {
    ctx.status = 400;
    ctx.body = { msg: '用户名必须为字符串！' };
    return;
  } else if (username.length < 6 || username.length > 64) {
    ctx.status = 400;
    ctx.body = { msg: '用户名不能少于6个字符或大于64个字符！' };
    return;
  } else if (typeof password !== 'string') {
    ctx.status = 400;
    ctx.body = { msg: '密码必须为字符串！' };
    return;
  } else if (password.length < 8 || password.length > 32) {
    ctx.status = 400;
    ctx.body = { msg: '密码不能少于8个字符或大于32个字符！' };
    return;
  }

  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection('user');
  const user = await collection.findOne({ username });

  if (user) {
    ctx.status = 409;
    ctx.body = { msg: '用户已存在！' };
  } else {
    await collection.insertOne({ username, password });
    ctx.status = 201;
    ctx.body = {msg: '创建成功！'};
  }
  await client.close();

});

router.post('/login', async (ctx, next) => {
  const { username, password } = ctx.request.body;
  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection('user');
  const user = await collection.findOne({ username, password });

  if (user) {
    const token = jwt.sign({ 
      username, 
      password, 
      id: user._id.toString(), 
    }, process.env.JWT_SECRET_KEY);
    ctx.body = { msg: '登陆成功！', token };
  } else {
    ctx.status = 404;
    ctx.body = { msg: '用户名或密码错误！' };
  }
  await client.close();
});

router.post('/album', async (ctx, next) =>{
  const { name } = ctx.request.body;

  if (!name || typeof name !== 'string') {
    ctx.status = 400;
    ctx.body = { msg: '相册名不能为空或非字符串！' };
    return;
  } else if (name.length > 64) {
    ctx.status = 400;
    ctx.body = { msg: '相册名不能超过64个字符！' };
    return;
  }

  const authorization = ctx.headers['authorization'];
  const token = authorization.split(' ')[1];
  var decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection('album');
  const album = await collection.findOne({ name, user_id: decoded.id });

  if (album) {
    ctx.status = 409;
    ctx.body = { msg: `相册 ${name} 已存在！` };
  } else {
    await collection.insertOne({ name, user_id: decoded.id });
    ctx.status = 201;
    ctx.body = { msg: '创建成功！' };
  }
  await client.close();

});

router.get('/album', async (ctx, next) => {
  const authorization = ctx.headers['authorization'];
  if (!authorization){
    ctx.status = 401;
    ctx.body = { msg: '未授权！' };
    return;
  }
  const token = authorization.split(' ')[1];
  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    ctx.status = 401;
    ctx.body = { msg: '未授权！' };
    return;
  }

  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection('album');
  const albums = await collection.find({ user_id: decoded.id }).toArray();

  ctx.status = 200;
  ctx.body = { 
    msg: '获取成功！', 
    albums: albums.map((item) => {
      return { 
        name: item.name,
        id: item._id.toString(),
      };
    }),
  };
  await client.close();

});

router.delete('/album/:id', async (ctx, next) => {
  const { id } = ctx.params;
  if (!id || typeof id !== 'string') {
    ctx.status = 400;
    ctx.body = { msg: '请输入相册id！' };
    return;
  }

  const authorization = ctx.headers['authorization'];
  if (!authorization){
    ctx.status = 401;
    ctx.body = { msg: '未授权！' };
    return;
  }
  const token = authorization.split(' ')[1];
  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    ctx.status = 401;
    ctx.body = { msg: '未授权！' };
    return;
  }

  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection('album');
  const result = await collection.deleteOne({ user_id: decoded.id, _id: new ObjectId(id) });
  console.log(result);
  if (result.deletedCount) {
    ctx.status = 200;
    ctx.body = { msg: '删除成功！' };
  } else {
    ctx.status = 404;
    ctx.body = { msg: '相册不存在!' };
  }
  await client.close();

});

router.put('/album/:id', async (ctx, next) => {
  const { id } = ctx.params;
  if (!id || typeof id !== 'string') {
    ctx.status = 400;
    ctx.body = { msg: '请输入相册id！' };
    return;
  }

  const { name } = ctx.request.body;
  if (!name || typeof name !== 'string') {
    ctx.status = 400;
    ctx.body = { msg: '相册名不能为空或非字符串！' };
    return;
  } else if (name.length > 64) {
    ctx.status = 400;
    ctx.body = { msg: '相册名不能超过64个字符！' };
    return;
  }

  const authorization = ctx.headers['authorization'];
  if (!authorization){
    ctx.status = 401;
    ctx.body = { msg: '未授权！' };
    return;
  }
  const token = authorization.split(' ')[1];
  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    ctx.status = 401;
    ctx.body = { msg: '未授权！' };
    return;
  }
  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection('album');
  const result = await collection.updateOne(
    { _id: new ObjectId(id) }, 
    { $set: { name } } 
  );
  if (result.matchedCount) {
    ctx.status = 200;
    ctx.body = { msg: "相册更新成功!" };
  } else {
    ctx.status = 404;
    ctx.body = { msg: "相册不存在!" };
  }

  await client.close();
  
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);