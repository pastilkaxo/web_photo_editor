import { MongoClient, ObjectId, Document, WithId } from 'mongodb';
import client from '../connection';

export interface Photo{
    _id?: ObjectId;
    name: string;
    description: string;
    url: string;
    createdAt?: Date;
}

export async function queryOneDocument(collectionName:string, filter: Document) {
    try {
        const mongoClient = await client.connect();
        const db = mongoClient?.db("WebIllustrator");
        const collection = db?.collection(collectionName);
        if (!collection) {
            console.log(`Collection ${collectionName} does not exist.`);
            return;
        }
        const document = await collection.findOne(filter);
        if (document) {
            console.log(`Found document: ${JSON.stringify(document)}`);
            return document;
        } else {
            console.log(`No document matches the provided filter.`);
            return null;
        }
    } catch (err) {
        console.log("ERROR [QUERY ONE]:" + err);
    } finally {
        await client.close();
    }
}

export async function queryManyDocuments(collectionName:string, filter: Document) {
    try {
        const mongoClient = await client.connect();
        const db = mongoClient?.db("WebIllustrator");
        const collection = db?.collection(collectionName);
        if (!collection) {
            console.log(`Collection ${collectionName} does not exist.`);
            return;
        }
        const documents = await collection.find(filter).toArray();
        if (documents.length > 0) {
            console.log(`Found ${documents.length} documents: ${JSON.stringify(documents)}`);
            return documents;
        } else {
            console.log(`No documents match the provided filter.`);
            return [];
        }
    } catch (err) {
        console.log("ERROR [QUERY MANY]:" + err);
    } finally {
        await client.close();
    }
}



export async function sortQueryDocs(sortFields:Document, collectionName:string, query:Document, limit:number | null = null) {
    try {
        const mongoClient = await client.connect();
        let cursor;
        const db = mongoClient?.db("WebIllustrator");
        const collection = db?.collection(collectionName);
        if (!collection) {
            console.log(`Collection ${collectionName} does not exist.`);
            return;
        }
        if(limit !== null && limit !== undefined) {
             cursor = await collection.find(query).sort(sortFields).limit(limit).toArray();
        }
        else {
             cursor = await collection.find(query).sort(sortFields).toArray();
        }
        if (cursor.length > 0) {
            console.log(`Found ${cursor.length} documents: ${JSON.stringify(cursor)}`);
            return cursor;
        } else {
            console.log(`No documents match the provided filter.`);
            return [];
        }
    } catch (err) {
        console.log("ERROR [QUERY SORT]:" + err);
    } finally {
        await client.close();
    }
}