import { ObjectId } from 'mongodb';
import { db } from '../db.js';

export default async (ctx, next) => {
  const { id } = ctx.params;
  if (!id || typeof id !== 'string') {
    ctx.status = 400;
    ctx.body = { msg: '请输入相册id！' };
    return;
  }

  const collection = db.collection('albums');
  const result = await collection.deleteOne({ 
    userId: ctx.tokenPayload?.id,
    _id: new ObjectId(id),
  });
  
  if (result.deletedCount) {
    ctx.status = 200;
    ctx.body = { msg: '删除成功！' };
  } else {
    ctx.status = 404;
    ctx.body = { msg: '相册不存在!' };
  }

}
