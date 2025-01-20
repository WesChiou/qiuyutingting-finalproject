import dotenv from 'dotenv';
import Koa from 'koa';
import { koaBody } from 'koa-body';
import Router from 'koa-router';
import jwt from 'jsonwebtoken';
import { client } from './db.js';
import signup from './routers/signup.js';
import login from './routers/login.js';
import createAlbum from './routers/createAlbum.js';
import getAlbum from './routers/getAlbum.js';
import deleteAlbum from './routers/deleteAlbum.js';
import updateAlbum from './routers/updateAlbum.js';
import uploadPhoto from './routers/uploadPhoto.js';

dotenv.config();

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

router.post('/signup', signup);
router.post('/login', login);
router.post('/album', authorize, createAlbum);
router.get('/album', authorize, getAlbum);
router.delete('/album/:id', authorize, deleteAlbum);
router.put('/album/:id', authorize, updateAlbum);
router.post('/photo', authorize, uploadPhoto);

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
