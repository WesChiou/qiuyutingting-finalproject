import { MongoClient } from 'mongodb';

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const DB_NAME = 'finalproject';
client.connect(DB_NAME);
const db = client.db(DB_NAME);

export { 
  db,
  client,
};