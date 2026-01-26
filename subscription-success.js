// Subscription Success Page
import { 
    isIterableInitialized,
    resetIterable
} from './iterable-config.js';

// Update UI for logged in state
function updateUIForLoggedInState() {
    const email = localStorage.getItem('iterable_user_email');
    const firstName = localStorage.getItem('iterable_user_firstName');
    const lastName = localStorage.getItem('iterable_user_lastName') || '';
    
    const loginBtn = document.getElementById('loginBtn');
    const userDropdown = document.getElementById('userDropdown');
    const userGreeting = document.getElementById('userGreeting');
    
    // Update login button/dropdown
    if (email && firstName) {
        // Hide login button, show dropdown
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }
        if (userDropdown) {
            userDropdown.style.display = 'block';
        }
        if (userGreeting) {
            userGreeting.textContent = `Hi, ${firstName}`;
        }
    } else {
        // Show login button, hide dropdown
        if (loginBtn) {
            loginBtn.style.display = 'block';
        }
        if (userDropdown) {
            userDropdown.style.display = 'none';
        }
    }
    
    // Update success page details
    const successEmail = document.getElementById('successEmail');
    const successName = document.getElementById('successName');
    
    if (successEmail) {
        successEmail.textContent = email || '-';
    }
    if (successName && firstName) {
        const fullName = lastName ? `${firstName} ${lastName}` : firstName;
        successName.textContent = fullName;
    }
}

// Display APIs triggered summary
function displayAPIsSummary() {
    const apisList = document.getElementById('apisList');
    if (!apisList) return;
    
    const apisTriggered = [];
    
    // Check which APIs were called
    const signUpEventId = localStorage.getItem('iterable_signup_event_id');
    if (signUpEventId) {
        apisTriggered.push({
            name: 'trackEvent',
            event: 'Sign Up',
            description: 'Sign Up event tracked (progressively updated through checkout)'
        });
    }
    
    // User profile was definitely updated
    apisTriggered.push({
        name: 'updateUser',
        event: 'User Profile Updated',
        description: 'User profile created and updated with account details'
    });
    
    // Subscription Started was tracked
    apisTriggered.push({
        name: 'trackEvent',
        event: 'Subscription Started',
        description: 'Subscription Started event tracked with final order details'
    });
    
    // Display APIs
    if (apisTriggered.length > 0) {
        apisList.innerHTML = apisTriggered.map(api => `
            <div class="api-item">
                <div class="api-name">${api.name}</div>
                <div class="api-event">${api.event}</div>
                <div class="api-description">${api.description}</div>
            </div>
        `).join('');
    } else {
        apisList.innerHTML = '<div class="api-item">No APIs triggered (Demo mode - SDK disabled)</div>';
    }
}

// Update plan details and price
function updatePlanDetails() {
    const successPlan = document.getElementById('successPlan');
    const successPrice = document.getElementById('successPrice');
    
    // Get plan data from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const people = urlParams.get('people') || '2';
    const meals = urlParams.get('meals') || '5';
    const preference = urlParams.get('preference') || 'all';
    
    // Map preference to box name
    const boxNameMap = {
        'vegan': 'Vegan and Veggie',
        'gourmet': 'Gourmet',
        'gluten-free': 'Gluten Free',
        'ready-made': 'Ready Made',
        'all': 'Ready Made'
    };
    const boxName = boxNameMap[preference] || 'Ready Made';
    
    // Update plan display
    if (successPlan) {
        successPlan.textContent = `${boxName} - ${meals} meals for ${people} ${people === '1' ? 'person' : 'people'}`;
    }
    
    // Calculate price (same calculation as checkout)
    if (successPrice) {
        const basePricePerMeal = 8.85;
        const pricePerWeek = parseFloat(people) * parseFloat(meals) * basePricePerMeal;
        successPrice.textContent = `$${pricePerWeek.toFixed(2)}`;
    }
}

// Logout handler
function handleLogout() {
    // Clear Iterable session if initialized
    if (isIterableInitialized()) {
        resetIterable();
    }
    
    // Clear stored user data
    localStorage.removeItem('iterable_user_email');
    localStorage.removeItem('iterable_user_firstName');
    localStorage.removeItem('iterable_user_lastName');
    localStorage.removeItem('iterable_signup_event_id');
    
    // Close dropdown if open
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.remove('active');
    }
    
    // Redirect to homepage
    window.location.href = 'index.html';
}

// Initialize page
function initializeSuccessPage() {
    // Debug: Check what's in localStorage
    const email = localStorage.getItem('iterable_user_email');
    const firstName = localStorage.getItem('iterable_user_firstName');
    const lastName = localStorage.getItem('iterable_user_lastName');
    
    console.log('📋 Success page: localStorage data', { email, firstName, lastName });
    
    // Update logged in state (with retry to ensure it works)
    updateUIForLoggedInState();
    
    // Retry after a short delay to ensure DOM is ready
    setTimeout(() => {
        updateUIForLoggedInState();
    }, 100);
    
    // Display APIs summary
    displayAPIsSummary();
    
    // Update plan details and price
    updatePlanDetails();
    
    // User dropdown toggle (matching index.html implementation)
    const userGreetingBtn = document.getElementById('userGreetingBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userGreetingBtn && userDropdown) {
        userGreetingBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }
    
    // Handle logout from dropdown menu
    const headerLogoutBtn = document.getElementById('headerLogoutBtn');
    if (headerLogoutBtn) {
        headerLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSuccessPage);
} else {
    initializeSuccessPage();
}

// Also update on page show (back/forward navigation)
window.addEventListener('pageshow', () => {
    setTimeout(updateUIForLoggedInState, 50);
});
