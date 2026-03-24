require('dotenv').config();
const Minio  = require("minio")
const os = require('os');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
       }
     }
  }
  return '0.0.0.0';
 }


const minioClient = new Minio.Client({
  endPoint: "minio",
  port: 9000,
  useSSL: false,
  accessKey: "Vladislav" ,
  secretKey:"12345678" ,
})


const bucket = "melody";


const initBucket = async () => {
  const exists = await minioClient.bucketExists(bucket)
  if (exists) {
    console.log('Bucket ' + bucket + ' exists.')
  } else {
    await minioClient.makeBucket(bucket, process.env.S3_REGION || 'us-east-1')
    console.log('Bucket ' + bucket + ' created in "us-east-1".')
  }
}

initBucket().catch(console.error);

module.exports = { minioClient, bucket };

