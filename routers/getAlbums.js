import { db } from '../db.js';

export default async (ctx, next) => {
  const collection = db.collection('albums');
  const albums = await collection.find({ userId: ctx.tokenPayload?.id }).toArray();

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

}
