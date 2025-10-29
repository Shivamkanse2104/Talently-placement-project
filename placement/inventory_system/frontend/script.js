// @ts-check

// Declare functions at the top to avoid hoisting issues
/**
 * Opens the item modal for adding/editing
 * @param {string} [itemId] - Optional item ID for edit mode
 */
function openModal(itemId) {}

/**
 * Closes the currently open modal
 */
function closeModal() {}

/**
 * Handles form submission for adding/editing items
 * @param {Event} e - Form submit event
 */
function handleFormSubmit(e) {}

/**
 * Shows a notification to the user
 * @param {string} message - The message to display
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - The type of notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles if they don't exist
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 4px;
                color: white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 1000;
                opacity: 0;
                transform: translateY(-20px);
                transition: opacity 0.3s, transform 0.3s;
            }
            .notification.show {
                opacity: 1;
                transform: translateY(0);
            }
            .info { background-color: #2196F3; }
            .success { background-color: #4CAF50; }
            .warning { background-color: #FFC107; color: #000; }
            .error { background-color: #F44336; }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

/**
 * Confirms item deletion
 */
function confirmDelete() {}

// Type assertions for DOM elements
const addItemBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('addItemBtn'));
const inventoryForm = /** @type {HTMLFormElement | null} */ (document.getElementById('inventoryForm'));
const inventoryList = /** @type {HTMLTableSectionElement | null} */ (document.getElementById('inventoryList'));
const searchInput = /** @type {HTMLInputElement | null} */ (document.getElementById('searchInput'));
const categoryFilter = /** @type {HTMLSelectElement | null} */ (document.getElementById('categoryFilter'));
const modal = document.getElementById('itemModal');
const confirmModal = document.getElementById('confirmModal');
const closeBtn = document.querySelector('.close');
const cancelBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('cancelBtn'));
const confirmDeleteBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('confirmDelete'));
const confirmCancelBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('confirmCancel'));

// Type definitions for item structure
/**
 * @typedef {Object} InventoryItem
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {number} quantity
 * @property {number} price
 * @property {string} [description]
 */

// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Inventory data will be fetched from the backend
let inventory = [];

let currentItemId = null;
let isEditMode = false;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadInventory().catch(console.error);
    setupEventListeners();
});

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
    // Modal controls
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => openModal());
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Form submission
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', handleFormSubmit);
    }

    // Search and filter
    if (searchInput) {
        searchInput.addEventListener('input', filterInventory);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterInventory);
    }

    // Confirmation modal
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    if (confirmCancelBtn && confirmModal) {
        confirmCancelBtn.addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });
    }
}

/**
 * Loads inventory items into the table
 * @param {Array<Object>} [items] - Optional items to display (if not provided, fetches from API)
 * @returns {Promise<void>}
 */
async function loadInventory(items = null) {
    try {
        // If items are not provided, fetch from API
        if (!items) {
            const response = await fetch(`${API_BASE_URL}/items`);
            if (!response.ok) throw new Error('Failed to fetch items');
            items = await response.json();
            inventory = items; // Update local inventory cache
        }
        
        if (!inventoryList) {
            console.error('Inventory list element not found');
            return;
        }
        
        inventoryList.innerHTML = '';
        
        if (!items || items.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="8" style="text-align: center; padding: 20px;">
                    No items found. Click "Add Item" to get started.
                </td>
            `;
            inventoryList.appendChild(emptyRow);
            return;
        }

    items.forEach(item => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', item.id);
        
        // Determine stock status
        let statusClass = '';
        if (item.quantity <= 0) {
            statusClass = 'status-out-of-stock';
        } else if (item.quantity <= 5) {
            statusClass = 'status-low-stock';
        } else {
            statusClass = 'status-in-stock';
        }
        
        row.innerHTML = `
            <td>${item.productName}</td>
            <td>${item.sku}</td>
            <td>${item.category}</td>
            <td><span class="status-badge ${statusClass}">${item.quantity}</span></td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${item.supplier || 'N/A'}</td>
            <td>${item.location || 'N/A'}</td>
            <td class="actions">
                <button class="btn btn-edit" onclick="editItem(${item.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-delete" onclick="deleteItem(${item.id})">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </td>
        `;
        
        inventoryList.appendChild(row);
    });
}

// Filter inventory based on search and category
async function filterInventory() {
    const searchTerm = (searchInput?.value || '').toLowerCase();
    const category = categoryFilter?.value || '';
    
    try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (category) params.append('category', category);
        
        const response = await fetch(`${API_BASE_URL}/items?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to filter items');
        
        const filteredItems = await response.json();
        loadInventory(filteredItems);
    } catch (error) {
        console.error('Error filtering items:', error);
        showNotification('Failed to filter items', 'error');
    }
}

// Helper function to create a table row for an item
function createTableRow(item) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', item.id);
    
    // Determine stock status
    let statusClass = '';
    if (item.quantity <= 0) {
        statusClass = 'status-out-of-stock';
    } else if (item.quantity <= 5) {
        statusClass = 'status-low-stock';
    } else {
        statusClass = 'status-in-stock';
    }
    
    row.innerHTML = `
        <td>${item.productName}</td>
        <td>${item.sku}</td>
        <td>${item.category}</td>
        <td><span class="status-badge ${statusClass}">${item.quantity}</span></td>
        <td>$${item.price.toFixed(2)}</td>
        <td>${item.supplier || 'N/A'}</td>
        <td>${item.location || 'N/A'}</td>
        <td class="actions">
            <button class="btn btn-edit" onclick="editItem(${item.id})">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-delete" onclick="deleteItem(${item.id})">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        </td>
    `;
    
    return row;
}

// Open modal for adding/editing items
async function openModal(itemId = null) {
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('inventoryForm');
    
    if (itemId) {
        // Edit mode
        isEditMode = true;
        currentItemId = itemId;
        modalTitle.textContent = 'Edit Item';
        
        try {
            // Fetch the item details from the API
            const response = await fetch(`${API_BASE_URL}/items/${itemId}`);
            if (!response.ok) throw new Error('Failed to fetch item details');
            
            const itemToEdit = await response.json();
            
            // Populate form fields
            document.getElementById('productName').value = itemToEdit.productName;
            document.getElementById('sku').value = itemToEdit.sku;
            document.getElementById('category').value = itemToEdit.category;
            document.getElementById('quantity').value = itemToEdit.quantity;
            document.getElementById('price').value = itemToEdit.price;
            document.getElementById('supplier').value = itemToEdit.supplier || '';
            document.getElementById('location').value = itemToEdit.location || '';
        } catch (error) {
            console.error('Error fetching item:', error);
            showNotification('Failed to load item details', 'error');
            closeModal();
            return;
        }
    } else {
        // Add mode
        isEditMode = false;
        currentItemId = null;
        modalTitle.textContent = 'Add New Item';
        form.reset();
    }
    
    modal.style.display = 'flex';
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
    inventoryForm.reset();
    currentItemId = null;
    isEditMode = false;
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        productName: document.getElementById('productName').value.trim(),
        sku: document.getElementById('sku').value.trim(),
        category: document.getElementById('category').value,
        quantity: parseInt(document.getElementById('quantity').value, 10),
        price: parseFloat(document.getElementById('price').value),
        supplier: document.getElementById('supplier').value.trim() || null,
        location: document.getElementById('location').value.trim() || null
    };
    
    // Simple validation
    if (!formData.productName || !formData.sku || isNaN(formData.quantity) || isNaN(formData.price)) {
        showNotification('Please fill in all required fields with valid values.', 'error');
        return;
    }
    
    try {
        let response;
        
        if (isEditMode && currentItemId) {
            // Update existing item
            response = await fetch(`${API_BASE_URL}/items/${currentItemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) throw new Error('Failed to update item');
            showNotification('Item updated successfully!', 'success');
        } else {
            // Add new item
            response = await fetch(`${API_BASE_URL}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) throw new Error('Failed to add item');
            showNotification('Item added successfully!', 'success');
        }
        
        // Reset and update UI
        closeModal();
        await loadInventory();
        filterInventory();
    } catch (error) {
        console.error('Error saving item:', error);
        showNotification(error.message || 'Failed to save item', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification content and style
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    #notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        transform: translateX(120%);
        transition: transform 0.3s ease-in-out;
    }
    
    #notification.show {
        transform: translateX(0);
    }
    
    #notification.info {
        background-color: #4361ee;
    }
    
    #notification.success {
        background-color: #2ecc71;
    }
    
    #notification.error {
        background-color: #ef233c;
    }
    
    #notification.warning {
        background-color: #f39c12;
        color: #000;
    }
`;
document.head.appendChild(notificationStyles);

// Edit item
function editItem(id) {
    openModal(id);
}

// Delete item with confirmation
function deleteItem(id) {
    currentItemId = id;
    confirmModal.style.display = 'flex';
}

// Confirm delete action
async function confirmDelete() {
    if (!currentItemId) {
        confirmModal.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/items/${currentItemId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete item');
        
        showNotification('Item deleted successfully!', 'success');
        await loadInventory();
        filterInventory();
    } catch (error) {
        console.error('Error deleting item:', error);
        showNotification(error.message || 'Failed to delete item', 'error');
    } finally {
        confirmModal.style.display = 'none';
        currentItemId = null;
    }
}

// Make functions available globally for inline event handlers
if (typeof window !== 'undefined') {
    /**
     * Edit an existing item
     * @param {string} id - The ID of the item to edit
     */
    // @ts-ignore - This is safe as we're adding to the global scope
    window.editItem = function(id) {
        openModal(id);
    };
    
    /**
     * Delete an item with confirmation
     * @param {string} id - The ID of the item to delete
     */
    // @ts-ignore - This is safe as we're adding to the global scope
    window.deleteItem = function(id) {
        currentItemId = id;
        if (confirmModal) {
            confirmModal.style.display = 'block';
        }
    };
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadInventory().catch(error => {
        console.error('Error loading inventory:', error);
        // Make sure showNotification is defined before using it
        if (typeof showNotification === 'function') {
            showNotification('Failed to load inventory. Please try again.', 'error');
        }
    });
    
    // Set up event listeners
    setupEventListeners();
});
