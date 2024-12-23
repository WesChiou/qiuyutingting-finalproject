require('dotenv').config();
var Koa = require('koa');
const { koaBody } = require('koa-body');
var Router = require('koa-router');
const { MongoClient, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');

// TODO: 参数校验改为 ajv 校验
// TODO: 将中间件抽离到单独的文件中导出使用

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const DB_NAME = 'finalproject';
client.connect(DB_NAME);
const db = client.db(DB_NAME);

var app = new Koa();
var router = new Router();

async function authorize(ctx, next) {
  const authorization = ctx.headers['authorization'];
  if (!authorization) {
    ctx.status = 401;
    ctx.body = { msg: '未授权！' };
    return;
  }
  const token = authorization.split(' ')[1];
  try {
    ctx.tokenPayload = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    ctx.status = 401;
    ctx.body = { msg: '未授权！' };
    return;
  }
  
  await next();
}

app.use(koaBody());

router.get('/', (ctx, next) => {
  ctx.body = { };
});

function validateSignupBody(body){
  if (!body.username) {
    throw new Error('请输入用户名！');
  }  
  if (!body.password) {
    throw new Error('请输入密码！');
  } 
  if (typeof body.username !== 'string') {
    throw new Error('用户名必须为字符串！');
  } 
  if (body.username?.length < 6 || body.username?.length > 64) {
    throw new Error('用户名不能少于6个字符或大于64个字符！');
  } 
  if (typeof body.password !== 'string') {
    throw new Error('密码必须为字符串！');
  } 
  if (body.password?.length < 8 || body.password?.length > 32) {
    throw new Error('密码不能少于8个字符或大于32个字符！');
  }
}

router.post('/signup', async (ctx, next) => {
  try {
    validateSignupBody(ctx.request.body);
  } catch (err) {
    ctx.status = 400;
    ctx.body = { msg: err.message};
    return;
  }
  
  const { username, password } = ctx.request.body;

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

});

router.post('/login', async (ctx, next) => {
  const { username, password } = ctx.request.body;

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
});

router.post('/album', authorize, async (ctx, next) =>{
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

  const collection = db.collection('album');
  const album = await collection.findOne({ name, user_id: ctx.tokenPayload?.id });

  if (album) {
    ctx.status = 409;
    ctx.body = { msg: `相册 ${name} 已存在！` };
  } else {
    await collection.insertOne({ name, user_id: ctx.tokenPayload?.id });
    ctx.status = 201;
    ctx.body = { msg: '创建成功！' };
  }

});

router.get('/album', authorize, async (ctx, next) => {
  const collection = db.collection('album');
  const albums = await collection.find({ user_id: ctx.tokenPayload?.id }).toArray();

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

});

router.delete('/album/:id', authorize, async (ctx, next) => {
  const { id } = ctx.params;
  if (!id || typeof id !== 'string') {
    ctx.status = 400;
    ctx.body = { msg: '请输入相册id！' };
    return;
  }

  const collection = db.collection('album');
  const result = await collection.deleteOne({ 
    user_id: ctx.tokenPayload?.id, 
    _id: new ObjectId(id),
  });
  
  if (result.deletedCount) {
    ctx.status = 200;
    ctx.body = { msg: '删除成功！' };
  } else {
    ctx.status = 404;
    ctx.body = { msg: '相册不存在!' };
  }

});

router.put('/album/:id', authorize, async (ctx, next) => {
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

  const collection = db.collection('album');
  const result = await collection.updateOne(
    { _id: new ObjectId(id), user_id: ctx.tokenPayload?.id }, 
    { $set: { name } } 
  );
  if (result.matchedCount) {
    ctx.status = 200;
    ctx.body = { msg: "相册更新成功!" };
  } else {
    ctx.status = 404;
    ctx.body = { msg: "相册不存在!" };
  }
  
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);

async function shutdown() {
  await client.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
