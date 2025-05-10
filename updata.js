const { MongoClient } = require('mongodb');
const fs = require('fs');

async function importData() {
    const uri = 'mongodb+srv://khhlym:123@nhahangchay.pm4ld.mongodb.net/?retryWrites=true&w=majority&appName=NhaHangChay';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('test');
        const collection = db.collection('stores');

        const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
        await collection.insertMany(data);
        console.log('Dữ liệu đã được nhập vào collection stores!');
    } catch (err) {
        console.error('Lỗi:', err);
    } finally {
        await client.close();
    }
}

importData();