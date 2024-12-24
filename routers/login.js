import jwt from 'jsonwebtoken';
import { db } from '../db.js';

export default async (ctx, next) => {
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
}