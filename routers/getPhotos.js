import { db } from '../db.js';

export default async (ctx, next) => {
  const { id } = ctx.params;

  ctx.body = { id, tokenPayload: ctx.tokenPayload, msg: 'TODO' };
}
