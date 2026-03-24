const { ObjectId } = require('mongodb');
const client = require("../connection")

async function modifyOneDocument(collectionName, filter, update) {
    try {
        const mongoClient = await client.connect();
        const db = mongoClient.db("WebIllustrator");
        const collection = db.collection(collectionName);
        const options = { upsert: true }; // Create the document if it does not exist
        if (!collection) {
            console.log(`Collection ${collectionName} does not exist.`);
            return;
        }
        const updateDoc = { $set: update };
        const result = await collection.updateOne(filter, updateDoc, options);
        console.log(
            `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`,
          );
    }
    catch (err) {
        console.log("ERROR [UPDATE]:" + err);
    }
    finally {
        await client.close();
    }
}

async function modifyDocument(collectionName, filter, update) {
    try {
        const mongoClient = await client.connect();
        const db = mongoClient.db("WebIllustrator");
        const collection = db.collection(collectionName);
        if (!collection) {
            console.log(`Collection ${collectionName} does not exist.`);
            return;
        }
        const updateDoc = { $set: update };
        const result = await collection.updateMany(filter, updateDoc);
        console.log(`Updated ${result.modifiedCount} documents`);
    }
    catch (err) {
        console.log("ERROR [UPDATE]:" + err);
    }
    finally {
        await client.close();
    }
}


// replacement for updateObjects function

async function replaceDocument(collectionName, query, replacement) {
    try {
        const mongoClient = await client.connect();
        const db = mongoClient.db("WebIllustrator");
        const collection = db.collection(collectionName);
        if (!collection) {
            console.log(`Collection ${collectionName} does not exist.`);
            return;
        }
        const result = await collection.replaceOne(query, replacement);
        console.log(`Modified ${result.modifiedCount} document(s)`);
    }
    catch (err) {
        console.log("ERROR [UPDATE]:" + err);
    }
    finally {
        await client.close();
    }
}

// arrays

async function modifyArray(collectionName, filter, update) { 
}



module.exports = {
    modifyOneDocument,
    modifyDocument,
    replaceDocument
};