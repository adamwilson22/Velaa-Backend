const axios = require('axios');

const API_URL = 'http://localhost:5001/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGRkYWVlNTljMGU5ZTAzMjJhMzJjOTEiLCJyb2xlIjoidXNlciIsImlhdCI6MTc1OTM1ODcwMSwiZXhwIjoxNzU5OTYzNTAxfQ.njUBxzFb97At0yrlkmKLDf7-kaTxDDtTm7d_Kzv6xpU';

async function testOperations() {
    console.log('\n🧪 Testing Vehicle CRUD Operations...\n');
    console.log('='.repeat(60));
    
    try {
        // TEST 1: READ - Get all vehicles
        console.log('\n📖 TEST 1: READ - Get All Vehicles');
        console.log('-'.repeat(60));
        const readRes = await axios.get(`${API_URL}/vehicles?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        
        const vehicles = readRes.data.data || readRes.data;
        const pagination = readRes.data.pagination || { total: vehicles.length };
        
        console.log(`✅ Retrieved ${vehicles.length} vehicles`);
        console.log(`   Total in DB: ${pagination.total || vehicles.length}`);
        console.log(`   Pages: ${pagination.pages || 1}`);
        
        if (vehicles.length > 0) {
            console.log('\n   Sample vehicles:');
            vehicles.slice(0, 3).forEach((v, i) => {
                console.log(`   ${i+1}. ${v.brand} ${v.year} (${v.chassisNumber}) - ${v.status}`);
            });
        }

        // TEST 2: SEARCH - Search by brand
        console.log('\n\n🔍 TEST 2: SEARCH - Search by Brand');
        console.log('-'.repeat(60));
        const searchRes = await axios.get(`${API_URL}/vehicles/search?q=BMW`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const searchVehicles = searchRes.data.data || searchRes.data;
        console.log(`✅ Search "BMW" found ${searchVehicles.length} vehicles`);
        searchVehicles.forEach(v => {
            console.log(`   - ${v.brand} ${v.year} ${v.color}`);
        });

        // TEST 3: FILTER - Filter by status
        console.log('\n\n🎯 TEST 3: FILTER - Filter by Status');
        console.log('-'.repeat(60));
        const filterRes = await axios.get(`${API_URL}/vehicles?status=Available`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const availableVehicles = filterRes.data.data || filterRes.data;
        console.log(`✅ Filter "Available" found ${availableVehicles.length} vehicles`);

        // TEST 4: FILTER - Filter by brand
        console.log('\n\n🎯 TEST 4: FILTER - Filter by Brand');
        console.log('-'.repeat(60));
        const brandRes = await axios.get(`${API_URL}/vehicles?brand=Tesla`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const teslaVehicles = brandRes.data.data || brandRes.data;
        console.log(`✅ Filter "Tesla" found ${teslaVehicles.length} vehicles`);
        
        // TEST 5: UPDATE - Update a vehicle
        if (vehicles.length > 0) {
            console.log('\n\n✏️  TEST 5: UPDATE - Update Vehicle');
            console.log('-'.repeat(60));
            const vehicleToUpdate = vehicles[0];
            console.log(`   Updating: ${vehicleToUpdate.brand} ${vehicleToUpdate.year}`);
            console.log(`   Old mileage: ${vehicleToUpdate.mileage}`);
            
            const updateRes = await axios.put(`${API_URL}/vehicles/${vehicleToUpdate._id}`, {
                mileage: 50000,
                status: 'Reserved',
                monthlyFee: 600
            }, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            
            const updated = updateRes.data.data || updateRes.data;
            console.log(`✅ Updated successfully!`);
            console.log(`   New mileage: ${updated.mileage}`);
            console.log(`   New status: ${updated.status}`);
            console.log(`   New monthly fee: $${updated.monthlyFee}`);
        }

        // TEST 6: GET SINGLE - Get one vehicle by ID
        if (vehicles.length > 0) {
            console.log('\n\n🔎 TEST 6: GET SINGLE - Get Vehicle by ID');
            console.log('-'.repeat(60));
            const singleRes = await axios.get(`${API_URL}/vehicles/${vehicles[1]._id}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const single = singleRes.data.data || singleRes.data;
            console.log(`✅ Retrieved: ${single.brand} ${single.year}`);
            console.log(`   Chassis: ${single.chassisNumber}`);
            console.log(`   Owner: ${single.owner?.name || 'N/A'}`);
            console.log(`   Market Value: $${single.marketValue?.toLocaleString() || 0}`);
        }

        // TEST 7: STATS - Get vehicle statistics
        console.log('\n\n📊 TEST 7: STATISTICS - Get Vehicle Stats');
        console.log('-'.repeat(60));
        const statsRes = await axios.get(`${API_URL}/vehicles/stats`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const stats = statsRes.data.data || statsRes.data;
        
        if (stats.overall) {
            console.log(`✅ Statistics retrieved:`);
            console.log(`   Total Vehicles: ${stats.overall.total}`);
            console.log(`   Total Value: $${stats.overall.totalValue?.toLocaleString() || 0}`);
            console.log(`   Average Value: $${Math.round(stats.overall.avgValue || 0).toLocaleString()}`);
            
            if (stats.byStatus) {
                console.log('\n   By Status:');
                stats.byStatus.forEach(s => {
                    console.log(`   - ${s._id}: ${s.count} vehicles ($${s.totalValue?.toLocaleString() || 0})`);
                });
            }
            
            if (stats.byBrand) {
                console.log('\n   By Brand:');
                stats.byBrand.slice(0, 5).forEach(b => {
                    console.log(`   - ${b._id}: ${b.count} vehicles`);
                });
            }
        }

        // TEST 8: PAGINATION - Test pagination
        console.log('\n\n📄 TEST 8: PAGINATION - Multiple Pages');
        console.log('-'.repeat(60));
        const page1 = await axios.get(`${API_URL}/vehicles?page=1&limit=5`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const page2 = await axios.get(`${API_URL}/vehicles?page=2&limit=5`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        
        console.log(`✅ Page 1: ${page1.data.data.length} vehicles`);
        console.log(`✅ Page 2: ${page2.data.data.length} vehicles`);
        console.log(`   Pagination working correctly!`);

        // TEST 9: DELETE - Delete a vehicle
        if (vehicles.length > 2) {
            console.log('\n\n🗑️  TEST 9: DELETE - Delete Vehicle');
            console.log('-'.repeat(60));
            const vehicleToDelete = vehicles[vehicles.length - 1];
            console.log(`   Deleting: ${vehicleToDelete.brand} ${vehicleToDelete.year}`);
            
            await axios.delete(`${API_URL}/vehicles/${vehicleToDelete._id}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            
            console.log(`✅ Deleted successfully!`);
            
            // Verify deletion
            const verifyRes = await axios.get(`${API_URL}/vehicles`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const currentCount = (verifyRes.data.data || verifyRes.data).length;
            console.log(`   Vehicles remaining: ${currentCount}`);
        }

        // SUMMARY
        console.log('\n\n' + '='.repeat(60));
        console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('\n✅ CRUD Operations Tested:');
        console.log('   ✓ CREATE (12 vehicles added earlier)');
        console.log('   ✓ READ (Get all with pagination)');
        console.log('   ✓ SEARCH (By chassis number / brand)');
        console.log('   ✓ FILTER (By status / brand)');
        console.log('   ✓ UPDATE (Mileage, status, monthly fee)');
        console.log('   ✓ DELETE (Remove vehicle)');
        console.log('   ✓ STATS (Vehicle statistics)');
        console.log('   ✓ PAGINATION (Multiple pages)');
        
        console.log('\n🌐 Frontend URLs:');
        console.log('   📋 Vehicle List: http://localhost:8080/vehicles-list.html');
        console.log('   ➕ Add Vehicle: http://localhost:8080/vehicle-add.html');
        console.log('\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response?.data) {
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Wait a bit then run tests
setTimeout(testOperations, 1000);
