const client = require("../connection")
const { ObjectId } = require('mongodb');


async function createDataBase() {
    try {
        const mongoClient = await client.connect();
        if (mongoClient) console.log("Success");
        const db = mongoClient.db("WebIllustrator");
        if (db) console.log("Database WebIllustrator created successfully");
    } catch (err) {
       console.log("ERROR [CREATE]:" + err) 
    }
    finally {
        await client.close()
    }
}

async function createCustomCollection(name,db) {
    try {
        const mongoClient = await client.connect();
        if (mongoClient) console.log("Success");
        const collection = db.collection(name);
        if (collection) console.log(`Collection ${name} created successfully`);
    } catch (err) {
       console.log("ERROR [CREATE]:" + err) 
    }
    finally {
        await client.close()
    }
}

async function createCollections(db,collections) {
    try {
        const mongoClient = await client.connect();
        for (const collectionName of collections) {
            const collection = db.collection(collectionName);
            if (collection) console.log(`Collection ${collectionName} created successfully`);
        }
    } catch (err) {
       console.log("ERROR [CREATE]:" + err) 
    }
    finally {
        await client.close()
    }
}

module.exports = {
    createDataBase,
    createCustomCollection,
    createCollections,
}