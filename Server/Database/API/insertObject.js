const { ObjectId } = require('mongodb');
const client = require("../connection")

async function insertOneDocument(collectionName, document) {
    try {
        const mongoClient = await client.connect();
        const db = mongoClient.db("WebIllustrator");
        const collection = db.collection(collectionName);
        if (!collection) {
            console.log(`Collection ${collectionName} does not exist.`);
            return;
        }
        const result = await collection.insertOne(document);
        console.log(`Inserted document with ID: ${result.insertedId}`);
    } catch (err) {
        console.log("ERROR [INSERT]:" + err);
    } finally {
        await client.close();
    }
}

async function insertManyDocuments(collectionName, documents) {
    try {
        const mongoClient = await client.connect();
        const db = mongoClient.db("WebIllustrator");
        const collection = db.collection(collectionName);
        const options = { ordered: false }; // Allows insertion of multiple documents without stopping on error
        if (!collection) {
            console.log(`Collection ${collectionName} does not exist.`);
            return;
        }
        if (!Array.isArray(documents)) {
            console.log(`Collection ${collectionName} does not exist.`);
            return;
        }
        const result = await collection.insertMany(documents,options);
        console.log(`Inserted ${result.insertedCount} documents`);
    } catch (err) {
        console.log("ERROR [INSERT MANY]:" + err);
    } finally {
        await client.close();
    }
    
}


module.exports = {
    insertOneDocument,
    insertManyDocuments
};