import path from 'path';
import fs from 'fs';
import dayjs from 'dayjs';
import formidable from 'formidable';
import sharp from 'sharp';
import { db } from '../db.js';

function parseForm(req) {
  const uploadDir = path.join(process.env.FILE_UPLOAD_DIR, dayjs().format('YYYY/MMDD'));
  fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    hashAlgorithm: 'md5',
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}

export default async (ctx, next) => {
  let photos = [];

  try {
    const { files } = await parseForm(ctx.req);

    if (!files?.photos) throw new Error('photos 不能为空');

    photos = files.photos;
  } catch (e) {
    console.error(e);
    // TOOD: 使用 ctx.throw 方法更优雅的向前端返回异常（多处需要更改）
    ctx.status = 400;
    ctx.body = { msg: e.message };
    return;
  }

  const collection = db.collection('photos');
  const tasks = [];

  photos.map(async (photo) => {
    const {
      size,
      filepath,
      newFilename,
      mimetype,
      mtime,
      // length, // TODO: undefined ?
      originalFilename,
      hash,
    } = photo.toJSON(); // [formidable] interface File

    let metadata = null;
    try {
      metadata = await sharp(filepath).metadata();
    } catch (e) {
      console.error(e);
    }

    const task = collection.insertOne({
      size,
      filepathSegments: path.normalize(filepath).split(path.sep).slice(-3), // Will get ['2025', '0121', 'xxx.png'] etc.
      filename: newFilename,
      mimetype,
      mtime,
      originalFilename,
      hash,
      metadata,
      uploaderId: ctx.tokenPayload?.id,
    });

    tasks.push(task);
  });

  await Promise.all(tasks);

  // TODO(weishi): 如何处理进度显示、上传失败等情况
  ctx.status = 201;
  ctx.body = { msg: '上传成功' };
}
