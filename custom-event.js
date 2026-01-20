// Custom Event Form Handler
import { trackEvent, isIterableInitialized } from './iterable-config.js';

const customEventForm = document.getElementById('customEventForm');
const eventResult = document.getElementById('eventResult');
const dataFieldsContainer = document.getElementById('dataFieldsContainer');
const addDataFieldBtn = document.getElementById('addDataFieldBtn');
let dataFieldCount = 0;

// Auto-populate email if user is logged in
function populateEmail() {
    const emailInput = document.getElementById('eventEmail');
    const storedEmail = localStorage.getItem('iterable_user_email');
    if (storedEmail && emailInput) {
        emailInput.value = storedEmail;
    }
}

// Add a new key-value pair field
function addDataField(key = '', value = '') {
    const fieldId = `dataField_${dataFieldCount++}`;
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'key-value-pair';
    fieldDiv.id = fieldId;
    fieldDiv.innerHTML = `
        <input type="text" class="key-input" placeholder="Key" value="${key}" />
        <input type="text" class="value-input" placeholder="Value" value="${value}" />
        <button type="button" class="btn-remove-field" data-field-id="${fieldId}">×</button>
    `;
    dataFieldsContainer.appendChild(fieldDiv);
    
    // Add remove button handler
    const removeBtn = fieldDiv.querySelector('.btn-remove-field');
    removeBtn.addEventListener('click', () => {
        fieldDiv.remove();
    });
}

// Get all data fields as an object
function getDataFields() {
    const fields = {};
    const pairs = dataFieldsContainer.querySelectorAll('.key-value-pair');
    pairs.forEach(pair => {
        const keyInput = pair.querySelector('.key-input');
        const valueInput = pair.querySelector('.value-input');
        const key = keyInput.value.trim();
        const value = valueInput.value.trim();
        
        if (key) {
            // Try to parse value as number or boolean, otherwise keep as string
            let parsedValue = value;
            if (value === 'true') parsedValue = true;
            else if (value === 'false') parsedValue = false;
            else if (value === 'null') parsedValue = null;
            else if (!isNaN(value) && value !== '') {
                parsedValue = Number(value);
            }
            
            fields[key] = parsedValue;
        }
    });
    return fields;
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        populateEmail();
    });
} else {
    populateEmail();
}

if (addDataFieldBtn) {
    addDataFieldBtn.addEventListener('click', () => {
        addDataField();
    });
}

if (customEventForm) {
    customEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = {
            eventName: document.getElementById('eventName').value.trim(),
            email: document.getElementById('eventEmail').value.trim() || null,
            userId: document.getElementById('eventUserId').value.trim() || null,
            id: document.getElementById('eventId').value.trim() || null,
            dataFields: {},
            campaignId: null,
            templateId: null
        };
        
        if (!formData.eventName) {
            showResult('Please enter an event name', 'error');
            return;
        }
        
        // Get data fields from key-value pairs
        formData.dataFields = getDataFields();
        
        // Parse optional numeric fields
        const campaignId = document.getElementById('campaignId').value.trim();
        if (campaignId) {
            formData.campaignId = parseInt(campaignId, 10);
        }
        
        const templateId = document.getElementById('templateId').value.trim();
        if (templateId) {
            formData.templateId = parseInt(templateId, 10);
        }
        
        // Get email from signed-in user if not provided
        if (!formData.email) {
            const storedEmail = localStorage.getItem('iterable_user_email');
            if (storedEmail) {
                formData.email = storedEmail;
            } else if (!isIterableInitialized()) {
                showResult('Please sign in or provide an email address', 'error');
                return;
            }
        }
        
        try {
            // Track the event
            await trackEvent(formData.eventName, {
                email: formData.email,
                userId: formData.userId,
                id: formData.id,
                dataFields: formData.dataFields,
                campaignId: formData.campaignId,
                templateId: formData.templateId,
                createNewFields: true
            });
            
            showResult(`Successfully triggered "${formData.eventName}" event!`, 'success');
            customEventForm.reset();
            
        } catch (error) {
            console.error('Error triggering event:', error);
            showResult(`Error: ${error.message || error}`, 'error');
        }
    });
}

function showResult(message, type) {
    eventResult.textContent = message;
    eventResult.className = `result-message result-message-${type}`;
    eventResult.style.display = 'block';
    
    setTimeout(() => {
        eventResult.style.display = 'none';
    }, 5000);
}
