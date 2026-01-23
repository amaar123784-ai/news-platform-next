import axios from 'axios';

async function test() {
    try {
        const response = await axios.get('http://localhost:3002/api/categories?all=true');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error(error.response?.data || error.message);
    }
}

test();
