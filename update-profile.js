// Update Profile Form Handler
import { updateUser, isIterableInitialized, initializeIterable } from './iterable-config.js';

const updateProfileForm = document.getElementById('updateProfileForm');
const profileResult = document.getElementById('profileResult');
const profileDataFieldsContainer = document.getElementById('profileDataFieldsContainer');
const addProfileFieldBtn = document.getElementById('addProfileFieldBtn');
let profileFieldCount = 0;

// Auto-populate email if user is logged in
function populateEmail() {
    const emailInput = document.getElementById('profileEmail');
    const storedEmail = localStorage.getItem('iterable_user_email');
    if (storedEmail && emailInput) {
        emailInput.value = storedEmail;
    }
}

// Add a new key-value pair field
function addProfileField(key = '', value = '') {
    const fieldId = `profileField_${profileFieldCount++}`;
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'key-value-pair';
    fieldDiv.id = fieldId;
    fieldDiv.innerHTML = `
        <input type="text" class="key-input" placeholder="Key (e.g., firstName, company.name)" value="${key}" />
        <input type="text" class="value-input" placeholder="Value" value="${value}" />
        <button type="button" class="btn-remove-field" data-field-id="${fieldId}">×</button>
    `;
    profileDataFieldsContainer.appendChild(fieldDiv);
    
    // Add remove button handler
    const removeBtn = fieldDiv.querySelector('.btn-remove-field');
    removeBtn.addEventListener('click', () => {
        fieldDiv.remove();
    });
}

// Get all data fields as an object (handles dot notation for nested objects)
function getProfileDataFields() {
    const fields = {};
    const pairs = profileDataFieldsContainer.querySelectorAll('.key-value-pair');
    pairs.forEach(pair => {
        const keyInput = pair.querySelector('.key-input');
        const valueInput = pair.querySelector('.value-input');
        const key = keyInput.value.trim();
        const value = valueInput.value.trim();
        
        if (key) {
            // Handle dot notation for nested objects (e.g., "company.name" -> {company: {name: value}})
            const keys = key.split('.');
            let current = fields;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            
            // Try to parse value as number or boolean, otherwise keep as string
            let parsedValue = value;
            if (value === 'true') parsedValue = true;
            else if (value === 'false') parsedValue = false;
            else if (value === 'null') parsedValue = null;
            else if (!isNaN(value) && value !== '') {
                parsedValue = Number(value);
            }
            
            current[keys[keys.length - 1]] = parsedValue;
        }
    });
    return fields;
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        populateEmail();
        // Add one empty field by default
        addProfileField();
    });
} else {
    populateEmail();
    addProfileField();
}

if (addProfileFieldBtn) {
    addProfileFieldBtn.addEventListener('click', () => {
        addProfileField();
    });
}

if (updateProfileForm) {
    updateProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const email = document.getElementById('profileEmail').value.trim();
        const userId = document.getElementById('profileUserId').value.trim() || null;
        const dataFieldsText = document.getElementById('profileDataFields').value.trim();
        const mergeNestedObjects = document.getElementById('mergeNestedObjects').checked;
        const createNewFields = document.getElementById('createNewFields').checked;
        const preferUserId = document.getElementById('preferUserId').checked;
        
        if (!email) {
            showResult('Please enter an email address', 'error');
            return;
        }
        
        // Get data fields from key-value pairs
        const dataFields = getProfileDataFields();
        
        if (Object.keys(dataFields).length === 0) {
            showResult('Please add at least one data field', 'error');
            return;
        }
        
        try {
            // Ensure SDK is initialized for this user
            if (!isIterableInitialized()) {
                await initializeIterable(email);
            }
            
            // Update user profile
            await updateUser(email, dataFields, {
                mergeNestedObjects: mergeNestedObjects,
                createNewFields: createNewFields,
                preferUserId: preferUserId
            });
            
            const fieldsCount = Object.keys(dataFields).length;
            showResult(`Successfully updated profile for ${email}! ${fieldsCount} field${fieldsCount !== 1 ? 's' : ''} updated.`, 'success');
            updateProfileForm.reset();
            
        } catch (error) {
            console.error('Error updating profile:', error);
            showResult(`Error: ${error.message || error}`, 'error');
        }
    });
}

function showResult(message, type) {
    profileResult.textContent = message;
    profileResult.className = `result-message result-message-${type}`;
    profileResult.style.display = 'block';
    
    setTimeout(() => {
        profileResult.style.display = 'none';
    }, 5000);
}
