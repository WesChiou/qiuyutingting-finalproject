var Koa = require('koa');
const { koaBody } = require('koa-body');
var Router = require('koa-router');
const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const DB_NAME = 'finalproject';

var app = new Koa();
var router = new Router();

app.use(koaBody());

router.get('/', (ctx, next) => {
  // ctx.router available
  ctx.body = 'hello world';
});

router.post('/signup', async (ctx, next) => {
  console.log(ctx.request);
  console.log(ctx.request.body);
  if (!ctx.request.body.email) {
    ctx.status = 400;
    ctx.body = {msg: '请输入邮箱！'};
    return;
  } else if (!ctx.request.body.password) {
    ctx.status = 400;
    ctx.body = {msg: '请输入密码！'};
    return;
  }
  await client.connect();
  console.log('Connected successfully to server');
  const db = client.db(DB_NAME);
  const collection = db.collection('user');
  const insertResult = await collection.insertOne({
    email: ctx.request.body.email, 
    password: ctx.request.body.password,
  });
  console.log(insertResult);
  ctx.status = 201;
  ctx.body = {msg: '创建成功！'};
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);