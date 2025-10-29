const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'inventory.json');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    const initialData = [
        {
            id: 1,
            productName: 'Laptop',
            sku: 'LP001',
            category: 'Electronics',
            quantity: 15,
            price: 999.99,
            supplier: 'Tech Corp',
            location: 'Warehouse A',
            lastUpdated: '2023-10-28T10:30:00Z'
        },
        {
            id: 2,
            productName: 'Desk Chair',
            sku: 'DC001',
            category: 'Office',
            quantity: 8,
            price: 149.99,
            supplier: 'Furniture Plus',
            location: 'Warehouse B',
            lastUpdated: '2023-10-27T14:45:00Z'
        },
        {
            id: 3,
            productName: 'Wireless Mouse',
            sku: 'WM001',
            category: 'Electronics',
            quantity: 3,
            price: 29.99,
            supplier: 'Tech Corp',
            location: 'Warehouse A',
            lastUpdated: '2023-10-29T09:15:00Z'
        }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Helper function to read data
function readData() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Helper function to write data
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API Routes

// Get all items
app.get('/api/items', (req, res) => {
    try {
        const { search, category } = req.query;
        let items = readData();

        // Apply filters if provided
        if (search) {
            const searchTerm = search.toLowerCase();
            items = items.filter(item => 
                item.productName.toLowerCase().includes(searchTerm) ||
                item.sku.toLowerCase().includes(searchTerm) ||
                (item.supplier && item.supplier.toLowerCase().includes(searchTerm)) ||
                (item.location && item.location.toLowerCase().includes(searchTerm))
            );
        }

        if (category) {
            items = items.filter(item => item.category === category);
        }

        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// Get single item
app.get('/api/items/:id', (req, res) => {
    try {
        const items = readData();
        const item = items.find(i => i.id === parseInt(req.params.id));
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json(item);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

// Create new item
app.post('/api/items', (req, res) => {
    try {
        const items = readData();
        const newItem = {
            id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1,
            ...req.body,
            lastUpdated: new Date().toISOString()
        };

        // Basic validation
        if (!newItem.productName || !newItem.sku || newItem.quantity === undefined || newItem.price === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        items.push(newItem);
        writeData(items);
        
        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// Update item
app.put('/api/items/:id', (req, res) => {
    try {
        const items = readData();
        const index = items.findIndex(i => i.id === parseInt(req.params.id));
        
        if (index === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const updatedItem = {
            ...items[index],
            ...req.body,
            id: items[index].id, // Ensure ID remains the same
            lastUpdated: new Date().toISOString()
        };

        items[index] = updatedItem;
        writeData(items);
        
        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete item
app.delete('/api/items/:id', (req, res) => {
    try {
        let items = readData();
        const initialLength = items.length;
        
        items = items.filter(i => i.id !== parseInt(req.params.id));
        
        if (items.length === initialLength) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        writeData(items);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static(path.join(__dirname, '../frontend')));

    // Handle SPA
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; // For testing
