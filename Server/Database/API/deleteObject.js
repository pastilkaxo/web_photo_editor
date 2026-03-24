const { ObjectId } = require('mongodb');
const client = require("../connection")

async function deleteDatabase(dbName) {
    try {
        const mongoClient = await client.connect();
        if (mongoClient) console.log("Connected to MongoDB");
        
        const db = mongoClient.db(dbName);
        if (db) {
            await db.dropDatabase();
            console.log(`Database ${dbName} deleted successfully`);
        } else {
            console.log(`Database ${dbName} does not exist`);
        }  
    }
    catch (err) {
        console.log("Error [DELETE]:" + err)
    }
    finally {
        await client.close();
    }
}

async function deleteCollection(colName,dbName) {
    try {
        const mongoClient = await client.connect();
        if (mongoClient) console.log("Connected to MongoDB");
        
        const db = mongoClient.db(dbName);
        if (db) {
            const collection = db.collection(colName);
            if (collection) {
                await collection.drop();
                console.log(`Collection ${colName} deleted successfully`);
            }
            else {
                console.log(`Collection ${colName} does not exist in database ${dbName}`);
            }
        } else {
            console.log(`Database ${dbName} does not exist`);
        }  
    }
    catch (err) {
        console.log("Error [DELETE]:" + err)
    }
    finally {
        await client.close();
    }
}

async function deleteDocument(colName, dbName, docId,filter) {
    try {
        const mongoClient = await client.connect();
        const db = mongoClient.db(dbName);
        if (db) {
            const collection = db.collection(colName);
            if (collection && filter === undefined) {
                const result = await collection.deleteOne({ _id: ObjectId(docId) });
                if (result.deletedCount > 0) {
                    console.log(`Document with ID ${docId} deleted successfully from collection ${colName}`);
                } else {
                    console.log(`No document found with ID ${docId} in collection ${colName}`);
                }
            }
            else if (collection && filter !== undefined) {
                const result = await collection.deleteMany(filter);
                console.log("Deleted " + result.deletedCount + " documents");
            }
            else {
                console.log(`Collection ${colName} does not exist in database ${dbName}`);
            }
        } else {
            console.log(`Database ${dbName} does not exist`);
        }  
    }
    catch (err) {
        console.log("Error [DELETE]:" + err)
    }
    finally {
        await client.close();
    }
}


module.exports = {
    deleteDatabase,
    deleteCollection,
    deleteDocument
};