import { ObjectId } from 'mongodb';
import { db } from '../db.js';
//TODO BSONError: input must be a 24 character hex string, 12 byte Uint8Array, or an integer
export default async (ctx, next) => {
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

  const collection = db.collection('albums');
  const result = await collection.updateOne(
    { _id: new ObjectId(id), userId: ctx.tokenPayload?.id },
    { $set: { name } } 
  );
  if (result.matchedCount) {
    ctx.status = 200;
    ctx.body = { msg: "相册更新成功!" };
  } else {
    ctx.status = 404;
    ctx.body = { msg: "相册不存在!" };
  }
  
}
