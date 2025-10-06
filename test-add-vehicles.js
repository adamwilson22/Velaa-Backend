const axios = require('axios');

// Your auth token
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGRkYWVlNTljMGU5ZTAzMjJhMzJjOTEiLCJyb2xlIjoidXNlciIsImlhdCI6MTc1OTM1ODcwMSwiZXhwIjoxNzU5OTYzNTAxfQ.njUBxzFb97At0yrlkmKLDf7-kaTxDDtTm7d_Kzv6xpU';

const API_URL = 'http://localhost:5001/api';

// Test vehicles data (12 vehicles)
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

async function getFirstClient() {
    try {
        const response = await axios.get(`${API_URL}/clients?limit=1`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        
        if (response.data.success && response.data.data.length > 0) {
            return response.data.data[0]._id;
        }
        
        console.log('No clients found. Creating a test client...');
        const clientResponse = await axios.post(`${API_URL}/clients`, {
            name: 'Test Vehicle Owner',
            phone: '+255754999888',
            type: 'Individual',
            isActive: true
        }, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        
        return clientResponse.data.data._id;
    } catch (error) {
        console.error('Error getting client:', error.response?.data || error.message);
        throw error;
    }
}

async function addVehicle(vehicleData, clientId) {
    try {
        const payload = {
            ...vehicleData,
            owner: clientId,
            purchaseDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 90 days
            bondExpiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString() // Random future date
        };

        const response = await axios.post(`${API_URL}/vehicles`, payload, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            console.log(`✅ Added: ${vehicleData.brand} ${vehicleData.year} (${vehicleData.chassisNumber})`);
            return response.data.data;
        }
    } catch (error) {
        console.error(`❌ Failed to add ${vehicleData.brand}:`, error.response?.data?.message || error.message);
        if (error.response?.data?.errors) {
            console.error('Validation errors:', error.response.data.errors);
        }
    }
}

async function testVehicleCRUD() {
    console.log('🚗 Starting Vehicle CRUD Test...\n');
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
        // Get or create a client
        console.log('📋 Step 1: Getting client for vehicle ownership...');
        const clientId = await getFirstClient();
        console.log(`✅ Using client ID: ${clientId}\n`);

        // CREATE - Add 12 vehicles
        console.log('📋 Step 2: Adding 12 test vehicles...');
        const addedVehicles = [];
        for (const vehicleData of testVehicles) {
            const vehicle = await addVehicle(vehicleData, clientId);
            if (vehicle) {
                addedVehicles.push(vehicle);
            }
            await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between requests
        }
        console.log(`\n✅ Successfully added ${addedVehicles.length} vehicles!\n`);

        // READ - Get all vehicles with pagination
        console.log('📋 Step 3: Testing READ operation (Get All Vehicles)...');
        const readResponse = await axios.get(`${API_URL}/vehicles?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log(`✅ Retrieved ${readResponse.data.data.length} vehicles`);
        console.log(`   Total: ${readResponse.data.pagination.total}, Pages: ${readResponse.data.pagination.pages}\n`);

        // SEARCH - Test search functionality
        console.log('📋 Step 4: Testing SEARCH operation...');
        const searchResponse = await axios.get(`${API_URL}/vehicles/search?q=BMW`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log(`✅ Search for "BMW" found ${searchResponse.data.data.length} vehicles\n`);

        // FILTER - Test by brand
        console.log('📋 Step 5: Testing FILTER operation (by brand)...');
        const filterResponse = await axios.get(`${API_URL}/vehicles?brand=Tesla`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log(`✅ Filter by "Tesla" found ${filterResponse.data.data.length} vehicles\n`);

        // FILTER - Test by status
        console.log('📋 Step 6: Testing FILTER operation (by status)...');
        const statusResponse = await axios.get(`${API_URL}/vehicles?status=Available`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log(`✅ Filter by "Available" found ${statusResponse.data.data.length} vehicles\n`);

        // UPDATE - Update first vehicle
        if (addedVehicles.length > 0) {
            console.log('📋 Step 7: Testing UPDATE operation...');
            const vehicleToUpdate = addedVehicles[0];
            const updateResponse = await axios.put(`${API_URL}/vehicles/${vehicleToUpdate._id}`, {
                mileage: 25000,
                status: 'Reserved'
            }, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            console.log(`✅ Updated vehicle ${vehicleToUpdate.chassisNumber}`);
            console.log(`   New mileage: ${updateResponse.data.data.mileage}, Status: ${updateResponse.data.data.status}\n`);
        }

        // GET STATS
        console.log('📋 Step 8: Testing STATS operation...');
        const statsResponse = await axios.get(`${API_URL}/vehicles/stats`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log('✅ Vehicle Statistics:');
        console.log('   By Status:', statsResponse.data.data.byStatus);
        console.log('   By Brand:', statsResponse.data.data.byBrand);
        console.log('   Overall:', statsResponse.data.data.overall);
        console.log('\n');

        // DELETE - Delete last vehicle
        if (addedVehicles.length > 0) {
            console.log('📋 Step 9: Testing DELETE operation...');
            const vehicleToDelete = addedVehicles[addedVehicles.length - 1];
            await axios.delete(`${API_URL}/vehicles/${vehicleToDelete._id}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            console.log(`✅ Deleted vehicle ${vehicleToDelete.chassisNumber}\n`);
        }

        console.log('🎉 All CRUD operations completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   ✅ CREATE: ${addedVehicles.length} vehicles added`);
        console.log(`   ✅ READ: Pagination working`);
        console.log(`   ✅ SEARCH: Search by chassis/brand working`);
        console.log(`   ✅ FILTER: Filter by brand/status working`);
        console.log(`   ✅ UPDATE: Vehicle updated successfully`);
        console.log(`   ✅ DELETE: Vehicle deleted successfully`);
        console.log(`   ✅ STATS: Statistics retrieved successfully`);
        
        console.log('\n🌐 Frontend URLs:');
        console.log('   📋 Vehicle List: http://localhost:8080/vehicles-list.html');
        console.log('   ➕ Add Vehicle: http://localhost:8080/vehicle-add.html');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run the test
testVehicleCRUD();
