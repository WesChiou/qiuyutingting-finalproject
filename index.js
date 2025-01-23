import dotenv from 'dotenv';
import Koa from 'koa';
import { koaBody } from 'koa-body';
import Router from 'koa-router';
import jwt from 'jsonwebtoken';
import { client } from './db.js';
import createUser from './routers/createUser.js';
import getToken from './routers/getToken.js';
import createAlbum from './routers/createAlbum.js';
import getAlbums from './routers/getAlbums.js';
import deleteAlbum from './routers/deleteAlbum.js';
import updateAlbum from './routers/updateAlbum.js';
import uploadPhoto from './routers/uploadPhoto.js';
import getPhotos from './routers/getPhotos.js';

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

async function authorizeByCookie(ctx, next) {
  const token = ctx.cookies.get('token');
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

router.post('/users', createUser); // 创建用户（即注册）
router.delete('/users/:id', (ctx) => ctx.body = 'TODO'); // 删除用户（即注销）
router.put('/users/:id', (ctx) => ctx.body = 'TODO'); // 修改用户信息
router.get('/users/:id', (ctx) => ctx.body = 'TODO'); // 获取用户信息
router.get('/users', (ctx) => ctx.body = 'TODO'); // 查询用户列表
router.post('/token', getToken); // 获取令牌（即登录）
router.post('/albums', authorize, createAlbum); // 创建相册
router.delete('/albums/:id', authorize, deleteAlbum); // 删除相册
router.put('/albums/:id', authorize, updateAlbum); // 修改相册信息
router.get('/albums/:id', authorize, (ctx) => ctx.body = 'TODO'); // 获取相册信息
router.get('/albums', authorize, getAlbums); // 查询相册列表
router.post('/photos', authorize, uploadPhoto); // 上传照片
router.delete('/photos/:id', (ctx) => ctx.body = 'TODO'); // 删除照片
router.put('/photos/:id', (ctx) => ctx.body = 'TODO'); // 修改照片信息（例如备注）
router.get('/photos/:id', (ctx) => ctx.body = 'TODO'); // 获取照片信息
router.get('/photos', authorizeByCookie, getPhotos); // 查询照片列表
router.post('/albums/{id}/photos', (ctx) => ctx.body = 'TODO'); // 上传照片到相册
router.get('/albums/{id}/photos', (ctx) => ctx.body = 'TODO'); // 获取相册的照片列表

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
