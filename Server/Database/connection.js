const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const DbClient = {
  client, 
  connect: async () => {
    try {
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("Connected to MongoDB!");
      return client;
    }
    catch (err) {
      console.error(err);
    }
    
  },
  close: async () => {
    try {
      await client.close();
      console.log("Connection closed!")
    }
    catch (err) {
      console.error(err);
    }
  }
}

module.exports = DbClient;




