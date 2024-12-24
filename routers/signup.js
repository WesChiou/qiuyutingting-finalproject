import { db } from '../db.js';

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

export default async (ctx, next) => {
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

}