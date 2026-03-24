const { minioClient, bucket } = require("./s3-client");

class S3Service {
    //  userId/projects/name_timestamp.json
    makeKey(userId, fileName) {
        const cleanName = fileName.replace(/\s+/g, '_');
        return `${userId}/projects/${cleanName}`;
    }

    async uploadJson(userId, json, fileName) {
        const key = fileName.includes('/') ? fileName : this.makeKey(userId, fileName);
        
        const buffer = Buffer.from(JSON.stringify(json));
        
        const metaData = {
            'Content-Type': 'application/json',
            'X-Amz-Meta-App': 'CanvasApp'
        };

        await minioClient.putObject(bucket, key, buffer, buffer.length, metaData);
        return key;
    }

    async getJson(key) {
        try {
            const stream = await minioClient.getObject(bucket, key);
            return new Promise((resolve, reject) => {
                const chunks = [];
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => {
                    try {
                        const data = Buffer.concat(chunks).toString('utf-8');
                        resolve(JSON.parse(data));
                    } catch (err) {
                        reject(new Error('Failed to parse JSON file from S3'));
                    }
                });
                stream.on('error', (err) => reject(err));
            });
        } catch (error) {
            console.error(`S3 getObject error for key ${key}:`, error);
            throw error; 
        }
    }

    async deleteFile(key) {
        try {
            await minioClient.removeObject(bucket, key);
        } catch (error) {
            console.error(`Error deleting file ${key} from S3:`, error);
        }
    }
}

module.exports = new S3Service();