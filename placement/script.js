// DOM Elements
const addItemBtn = document.getElementById('addItemBtn');
const itemModal = document.getElementById('itemModal');
const itemForm = document.getElementById('itemForm');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const searchInput = document.getElementById('searchInput');

// State
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
let currentItemId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
});

addItemBtn.addEventListener('click', () => openModal());
document.getElementById('cancelBtn').addEventListener('click', closeModal);
itemForm.addEventListener('submit', handleSubmit);
searchInput.addEventListener('input', filterInventory);

// Modal Functions
function openModal(item = null) {
    const modal = document.getElementById('itemModal');
    const form = document.getElementById('itemForm');
    
    if (item) {
        document.getElementById('modalTitle').textContent = 'Edit Item';
        currentItemId = item.id;
        document.getElementById('productName').value = item.name;
        document.getElementById('category').value = item.category;
        document.getElementById('quantity').value = item.quantity;
        document.getElementById('price').value = item.price;
    } else {
        document.getElementById('modalTitle').textContent = 'Add Item';
        currentItemId = null;
        form.reset();
    }
    
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('itemModal');
    modal.classList.remove('show');
    currentItemId = null;
}

// Form Handling
function handleSubmit(e) {
    e.preventDefault();
    
    const item = {
        id: currentItemId || Date.now().toString(),
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('category').value,
        quantity: parseInt(document.getElementById('quantity').value) || 0,
        price: parseFloat(document.getElementById('price').value) || 0,
        lastUpdated: new Date().toISOString()
    };

    if (currentItemId) {
        // Update existing item
        const index = inventory.findIndex(i => i.id === currentItemId);
        if (index !== -1) {
            inventory[index] = item;
        }
    } else {
        // Add new item
        inventory.unshift(item);
    }

    saveInventory();
    closeModal();
}

// Delete item
function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        inventory = inventory.filter(item => item.id !== id);
        saveInventory();
    }
}

// Save to localStorage and refresh the view
function saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    loadInventory();
}

// Load and display inventory
function loadInventory() {
    const items = filterInventory();
    
    if (items.length === 0) {
        inventoryTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty">No items found. Click 'Add Item' to get started.</td>
            </tr>
        `;
        return;
    }

    inventoryTableBody.innerHTML = items.map(item => {
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td class="actions">
                    <button onclick="openModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                        Edit
                    </button>
                    <button class="btn-delete" onclick="deleteItem('${item.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter inventory based on search input
function filterInventory() {
    const searchTerm = searchInput.value.toLowerCase();
    
    if (!searchTerm) {
        return [...inventory];
    }
    
    return inventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
    );
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === itemModal) {
        closeModal();
    }
});

// Make functions available globally
window.openModal = openModal;
window.deleteItem = deleteItem;
