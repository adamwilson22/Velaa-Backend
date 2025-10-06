const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

// Login first to get a fresh token
async function login() {
    try {
        // First, let's check if we can list clients to verify auth
        const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGRkYWVlNTljMGU5ZTAzMjJhMzJjOTEiLCJyb2xlIjoidXNlciIsImlhdCI6MTc1OTM1ODcwMSwiZXhwIjoxNzU5OTYzNTAxfQ.njUBxzFb97At0yrlkmKLDf7-kaTxDDtTm7d_Kzv6xpU';
        
        console.log('Testing authentication...');
        const testResponse = await axios.get(`${API_URL}/clients?limit=1`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        
        console.log('✅ Authentication successful');
        return TOKEN;
    } catch (error) {
        console.error('❌ Authentication failed:', error.response?.data || error.message);
        console.log('\n⚠️  The token might be expired. Please:');
        console.log('   1. Login to the frontend at http://localhost:8080');
        console.log('   2. Open browser console');
        console.log('   3. Type: localStorage.getItem("token")');
        console.log('   4. Copy the token and update the script\n');
        throw error;
    }
}

// Test vehicles data (12 vehicles with realistic VINs)
const testVehicles = [
    {
        chassisNumber: 'WBABA91060AL12345',
        brand: 'BMW',
        year: 2023,
        color: 'Black',
        marketValue: 55000,
        showInMarketplace: true,
        mileage: 12000,
        monthlyFee: 500,
        status: 'Available',
        isActive: true,
        tags: ['luxury', 'sedan', 'automatic']
    },
    {
        chassisNumber: 'SALGS2VF9HA123456',
        brand: 'Jaguar',
        year: 2022,
        color: 'White',
        marketValue: 48000,
        showInMarketplace: true,
        mileage: 18500,
        monthlyFee: 450,
        status: 'Available',
        isActive: true,
        tags: ['luxury', 'sedan']
    },
    {
        chassisNumber: 'JM1BK32F781234567',
        brand: 'Mazda',
        year: 2024,
        color: 'Red',
        marketValue: 32000,
        showInMarketplace: false,
        mileage: 5000,
        monthlyFee: 350,
        status: 'Reserved',
        isActive: true,
        tags: ['suv', 'automatic']
    },
    {
        chassisNumber: 'KMHCT4AE2CU123456',
        brand: 'Hyundai',
        year: 2023,
        color: 'Silver',
        marketValue: 28000,
        showInMarketplace: true,
        mileage: 15000,
        monthlyFee: 300,
        status: 'Available',
        isActive: true,
        tags: ['sedan', 'economical']
    },
    {
        chassisNumber: 'VNKKHTM32JA123456',
        brand: 'KIA',
        year: 2022,
        color: 'Blue',
        marketValue: 26000,
        showInMarketplace: true,
        mileage: 22000,
        monthlyFee: 280,
        status: 'Available',
        isActive: true,
        tags: ['suv', 'family']
    },
    {
        chassisNumber: 'WAUZZZ8V9DA123456',
        brand: 'Audi',
        year: 2024,
        color: 'Gray',
        marketValue: 62000,
        showInMarketplace: true,
        mileage: 3000,
        monthlyFee: 550,
        status: 'Available',
        isActive: true,
        tags: ['luxury', 'suv', 'quattro']
    },
    {
        chassisNumber: 'WP0AB2A78CL123456',
        brand: 'Porsche',
        year: 2023,
        color: 'Yellow',
        marketValue: 95000,
        showInMarketplace: false,
        mileage: 8000,
        monthlyFee: 800,
        status: 'Sold',
        isActive: false,
        tags: ['sports', 'luxury', 'performance']
    },
    {
        chassisNumber: '5YJSA1E14HF123456',
        brand: 'Tesla',
        year: 2024,
        color: 'White',
        marketValue: 72000,
        showInMarketplace: true,
        mileage: 1500,
        monthlyFee: 650,
        status: 'Available',
        isActive: true,
        tags: ['electric', 'autopilot', 'eco']
    },
    {
        chassisNumber: '1HGCV1F16JA123456',
        brand: 'Honda',
        year: 2023,
        color: 'Black',
        marketValue: 29000,
        showInMarketplace: true,
        mileage: 16000,
        monthlyFee: 320,
        status: 'Available',
        isActive: true,
        tags: ['sedan', 'reliable', 'economical']
    },
    {
        chassisNumber: 'SAJDA13C381234567',
        brand: 'Jaguar',
        year: 2021,
        color: 'Green',
        marketValue: 42000,
        showInMarketplace: false,
        mileage: 35000,
        monthlyFee: 400,
        status: 'Reserved',
        isActive: true,
        tags: ['luxury', 'sedan']
    },
    {
        chassisNumber: 'WBA3B1G52ENP12345',
        brand: 'BMW',
        year: 2022,
        color: 'Blue',
        marketValue: 48000,
        showInMarketplace: true,
        mileage: 20000,
        monthlyFee: 450,
        status: 'Available',
        isActive: true,
        tags: ['sedan', 'luxury', 'sport']
    },
    {
        chassisNumber: 'WDDWJ8EB9KF123456',
        brand: 'Mercedes-Benz',
        year: 2024,
        color: 'Silver',
        marketValue: 85000,
        showInMarketplace: true,
        mileage: 2000,
        monthlyFee: 750,
        status: 'Available',
        isActive: true,
        tags: ['luxury', 'sedan', 'amg']
    }
];

async function main() {
    console.log('🚗 Starting Vehicle CRUD Test...\n');
    
    // Wait for server
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        // Login/authenticate
        const TOKEN = await login();
        
        // Get first client
        console.log('\n📋 Step 1: Getting client for vehicle ownership...');
        const clientsResponse = await axios.get(`${API_URL}/clients?limit=1`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        
        if (!clientsResponse.data.success || clientsResponse.data.data.length === 0) {
            console.error('❌ No clients found. Please create a client first.');
            return;
        }
        
        const clientId = clientsResponse.data.data[0]._id;
        console.log(`✅ Using client: ${clientsResponse.data.data[0].name} (${clientId})\n`);

        // CREATE - Add 12 vehicles
        console.log('📋 Step 2: Adding 12 test vehicles...');
        console.log('─'.repeat(60));
        
        const addedVehicles = [];
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < testVehicles.length; i++) {
            const vehicleData = testVehicles[i];
            try {
                const payload = {
                    ...vehicleData,
                    owner: clientId,
                    purchaseDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
                    bondExpiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
                };

                const response = await axios.post(`${API_URL}/vehicles`, payload, {
                    headers: {
                        'Authorization': `Bearer ${TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    successCount++;
                    console.log(`✅ [${i+1}/12] ${vehicleData.brand} ${vehicleData.year} - ${vehicleData.color}`);
                    addedVehicles.push(response.data.data);
                }
            } catch (error) {
                failCount++;
                console.error(`❌ [${i+1}/12] ${vehicleData.brand}: ${error.response?.data?.message || error.message}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        console.log('─'.repeat(60));
        console.log(`\n📊 Results: ${successCount} success, ${failCount} failed\n`);

        if (addedVehicles.length === 0) {
            console.log('❌ No vehicles were added. Cannot continue with tests.');
            return;
        }

        // READ - Get all vehicles
        console.log('📋 Step 3: Testing READ operation...');
        const readResponse = await axios.get(`${API_URL}/vehicles?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log(`✅ Retrieved ${readResponse.data.data.length} vehicles`);
        console.log(`   Total: ${readResponse.data.pagination.total}, Pages: ${readResponse.data.pagination.pages}\n`);

        // SEARCH
        console.log('📋 Step 4: Testing SEARCH operation...');
        const searchResponse = await axios.get(`${API_URL}/vehicles/search?q=BMW`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log(`✅ Search "BMW" found ${searchResponse.data.data.length} vehicles\n`);

        // UPDATE
        console.log('📋 Step 5: Testing UPDATE operation...');
        const vehicleToUpdate = addedVehicles[0];
        const updateResponse = await axios.put(`${API_URL}/vehicles/${vehicleToUpdate._id}`, {
            mileage: 30000,
            status: 'Reserved'
        }, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log(`✅ Updated ${vehicleToUpdate.brand} - Mileage: 30000, Status: Reserved\n`);

        // DELETE
        console.log('📋 Step 6: Testing DELETE operation...');
        const vehicleToDelete = addedVehicles[addedVehicles.length - 1];
        await axios.delete(`${API_URL}/vehicles/${vehicleToDelete._id}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log(`✅ Deleted ${vehicleToDelete.brand}\n`);

        // STATS
        console.log('📋 Step 7: Getting vehicle statistics...');
        const statsResponse = await axios.get(`${API_URL}/vehicles/stats`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log('✅ Statistics retrieved:');
        console.log(`   Total Vehicles: ${statsResponse.data.data.overall.total}`);
        console.log(`   Total Value: $${statsResponse.data.data.overall.totalValue.toLocaleString()}`);
        console.log(`   Average Value: $${Math.round(statsResponse.data.data.overall.avgValue).toLocaleString()}\n`);

        console.log('🎉 All CRUD operations completed successfully!\n');
        console.log('🌐 Test the frontend:');
        console.log('   📋 Vehicle List: http://localhost:8080/vehicles-list.html');
        console.log('   ➕ Add Vehicle: http://localhost:8080/vehicle-add.html');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response?.data) {
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

main();
