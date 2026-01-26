// ============================================
// BASIC INTERACTIVITY (Placeholder for future API integration)
// ============================================

// Import Iterable SDK configuration
import { 
    initializeIterable, 
    getIterableSDK, 
    isIterableInitialized, 
    resetIterable,
    trackEvent,
    updateUser,
    updateSubscription,
    config as iterableConfig
} from './iterable-config.js';

// Helper function to capitalize string values in dataFields
// Excludes fields that should preserve original casing (email, names, addresses, phone, dates, numbers)
function capitalizeDataFields(dataFields) {
    const excludeFromCapitalization = [
        'email',
        'firstName',
        'lastName',
        'phoneNumber',
        'address.street',
        'address.suburb',
        'address.region',
        'address.postcode',
        'order.deliveryDate',
        'order.deliveryTime',
        'order.deadlineDate',
        'order.deliveryInstructions',
        'order.price',
        'order.discount',
        'order.savings',
        'numberOfPeople',
        'mealsPerWeek',
        'timeSpentSeconds',
        'estimatedPrice',
        'pageUrl',
        'preference',
        'preferenceName',
        'buttonId',
        'buttonText',
        'pageCategory',
        'pageSubCategory'
    ];
    
    const capitalized = {};
    
    for (const [key, value] of Object.entries(dataFields)) {
        // Skip if key is in exclusion list
        if (excludeFromCapitalization.includes(key)) {
            capitalized[key] = value;
            continue;
        }
        
        // Skip if value is not a string
        if (typeof value !== 'string') {
            capitalized[key] = value;
            continue;
        }
        
        // Skip if value is empty
        if (!value || value.trim() === '') {
            capitalized[key] = value;
            continue;
        }
        
        // Capitalize: first letter uppercase, rest lowercase
        capitalized[key] = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
    
    return capitalized;
}

// Helper function to show API notifications (enhanced for demo purposes)
function showAPINotification(title, message, type = 'success', details = null) {
    // Create notification container
    const notificationEl = document.createElement('div');
    notificationEl.className = `api-notification api-notification-${type}`;
    
    // Build notification content
    let content = `
        <div class="api-notification-header">
            <span class="api-notification-icon">${type === 'success' ? '✓' : '✕'}</span>
            <strong class="api-notification-title">${title}</strong>
        </div>
        <div class="api-notification-message">${message}</div>
    `;
    
    // Add details if provided
    if (details) {
        content += `<div class="api-notification-details">${details}</div>`;
    }
    
    notificationEl.innerHTML = content;
    
    // Get existing notifications container or create one
    let notificationsContainer = document.getElementById('api-notifications-container');
    if (!notificationsContainer) {
        notificationsContainer = document.createElement('div');
        notificationsContainer.id = 'api-notifications-container';
        notificationsContainer.className = 'api-notifications-container';
        document.body.appendChild(notificationsContainer);
    }
    
    notificationsContainer.appendChild(notificationEl);
    
    // Auto-remove after delay (5 seconds for all notifications)
    setTimeout(() => {
        notificationEl.classList.add('api-notification-hide');
        setTimeout(() => notificationEl.remove(), 300);
    }, 5000);
}

// Make function globally available for iterable-config.js
window.showAPINotification = showAPINotification;

// Helper function to show simple success/error messages (backward compatibility)
function showMessage(message, type = 'success') {
    showAPINotification(type === 'success' ? 'Success' : 'Error', message, type);
}

// Track page view when user leaves the page (only if user is signed in)
// This tracks at the end of the page view and includes timeSpentSeconds
let pageLoadTime = Date.now();
let pageViewTracked = false;

function trackPageView() {
    // Don't track if already tracked
    if (pageViewTracked) {
        console.log('📊 Page Viewed: Already tracked, skipping');
        return;
    }
    
    // Check if user is signed in (SDK initialized or email in storage)
    const userEmail = iterableConfig.currentUserEmail || localStorage.getItem('iterable_user_email');
    if (!userEmail) {
        console.log('📊 Page Viewed: No user email, skipping');
        return; // User not signed in, don't track
    }
    
    // Ensure SDK is initialized before tracking
    if (!isIterableInitialized()) {
        console.warn('📊 Page Viewed: SDK not initialized, skipping track');
        return;
    }
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const pageName = currentPage.replace('.html', '').replace('index', 'home');
    
    console.log('📊 Page Viewed: Checking page:', pageName);
    
    // Only track Page Viewed on "How it Works" page
    if (pageName !== 'how-it-works') {
        console.log('📊 Page Viewed: Not on How it Works page, skipping');
        return;
    }
    
    // Calculate time spent on page
    const timeSpentSeconds = Math.round((Date.now() - pageLoadTime) / 1000);
    
    // Determine page category and subcategory for My Food Bag site
    let pageCategory = 'General';
    let pageSubCategory = '';
    
    // Map page names to categories
    if (pageName === 'home' || pageName === 'index' || pageName === '') {
        pageCategory = 'Homepage';
        pageSubCategory = 'Landing Page';
    } else if (pageName === 'checkout') {
        pageCategory = 'Checkout';
        pageSubCategory = 'Sign Up Flow';
    } else if (pageName === 'how-it-works') {
        pageCategory = 'Information';
        pageSubCategory = 'How it Works';
    } else {
        pageCategory = 'General';
        pageSubCategory = pageName;
    }
    
    const dataFields = {
        pageCategory: pageCategory,
        pageUrl: window.location.href,
        timeSpentSeconds: timeSpentSeconds
    };
    
    // Only add pageSubCategory if it exists
    if (pageSubCategory) {
        dataFields.pageSubCategory = pageSubCategory;
    }
    
    console.log('📊 Page Viewed: Tracking event with dataFields:', dataFields);
    
    // Mark as tracked to prevent duplicate tracking
    pageViewTracked = true;
    
    // Store page view info in localStorage to show notification on next page
    const pageViewInfo = {
        pageName: pageSubCategory || pageCategory,
        timeSpent: timeSpentSeconds,
        timestamp: Date.now()
    };
    localStorage.setItem('iterable_pending_pageview', JSON.stringify(pageViewInfo));
    
    trackEvent('Page Viewed', {
        email: userEmail,
        dataFields: dataFields,
        createNewFields: true
    }).then(() => {
        console.log('✅ Page Viewed: Event tracked successfully');
        
        // Store notification info in localStorage so it persists even if user navigates away
        const notificationInfo = {
            title: 'Page Viewed Event Tracked',
            message: `Page Viewed event has been sent to Iterable for "${pageSubCategory || pageCategory}" page.`,
            type: 'success',
            details: `Time spent: ${timeSpentSeconds}s | URL: ${window.location.href}`,
            timestamp: Date.now()
        };
        localStorage.setItem('iterable_pending_pageview_notification', JSON.stringify(notificationInfo));
        
        // Show notification immediately
        if (window.showAPINotification) {
            window.showAPINotification(
                notificationInfo.title,
                notificationInfo.message,
                notificationInfo.type,
                notificationInfo.details
            );
        }
    }).catch(err => {
        console.error('❌ Page Viewed: Failed to track page view:', err);
        pageViewTracked = false; // Allow retry on error
    });
}

// Track page view when links are clicked (before navigation)
// This ensures notification shows before page unloads
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href) {
        // Check if it's a navigation link (not anchor link to same page)
        const linkUrl = new URL(link.href, window.location.href);
        const currentUrl = new URL(window.location.href);
        
        // If it's navigating to a different page (not just anchor)
        if (linkUrl.pathname !== currentUrl.pathname || linkUrl.hash) {
            // Track immediately so notification shows before navigation
            trackPageView();
        }
    }
}, true); // Use capture phase to catch before navigation

// Track page view when user is about to leave the page
// Use visibilitychange first so notification shows before page unloads
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📊 visibilitychange: page hidden');
        trackPageView();
    }
});

// Track on beforeunload (fires before page unloads, notification might still show)
window.addEventListener('beforeunload', () => {
    console.log('📊 beforeunload event fired');
    trackPageView();
});

// Track page view when navigating away (for SPA-like behavior)
window.addEventListener('pagehide', () => {
    console.log('📊 pagehide event fired');
    trackPageView();
});

// Also track on unload as a fallback
window.addEventListener('unload', () => {
    console.log('📊 unload event fired');
    trackPageView();
});

// Reset tracking when navigating to a new page (for SPA-like behavior)
// This will be called when the page changes
function resetPageTracking() {
    pageLoadTime = Date.now();
    pageViewTracked = false;
}

// Reset page tracking on page load (new page navigation)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        resetPageTracking();
    });
} else {
    resetPageTracking();
}

// Reset on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pageLoadTime = Date.now();
    });
} else {
    pageLoadTime = Date.now();
}

// Update UI based on sign-in state (helper function)
function updateUIForSignInState(isSignedIn, email = '') {
    if (isSignedIn && email) {
        // Show logged-in UI
        if (userDisplayName) {
            userDisplayName.textContent = email;
        }
        if (userMenuEmail) {
            userMenuEmail.textContent = email;
        }
        if (userPanel) {
            userPanel.style.display = 'block';
        }
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }
        if (userMenu) {
            userMenu.style.display = 'flex';
        }
    } else {
        // Show logged-out UI
        if (userPanel) {
            userPanel.style.display = 'none';
        }
        if (loginBtn) {
            loginBtn.style.display = 'inline-block';
        }
        if (userMenu) {
            userMenu.style.display = 'none';
        }
    }
}

// Check for persisted sign-in state and restore it
async function restoreSignInState() {
    const storedEmail = localStorage.getItem('iterable_user_email');
    
    if (storedEmail && !isIterableInitialized()) {
        try {
            console.log('🔄 Restoring sign-in state for:', storedEmail);
            
            // Re-initialize SDK with stored email
            const sdk = await initializeIterable(storedEmail);
            
            if (sdk) {
                updateUIForSignInState(true, storedEmail);
                console.log('✅ Sign-in state restored successfully');
            } else {
                updateUIForSignInState(false);
            }
        } catch (error) {
            console.error('❌ Error restoring sign-in state:', error);
            // Clear invalid stored email
            localStorage.removeItem('iterable_user_email');
            updateUIForSignInState(false);
        }
    } else if (storedEmail && isIterableInitialized()) {
        // SDK already initialized, just update UI
        updateUIForSignInState(true, storedEmail);
    } else {
        // No stored email, show logged-out UI
        updateUIForSignInState(false);
    }
}

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const modalClose = document.getElementById('modalClose');
const loginForm = document.getElementById('loginForm');
const userPanel = document.getElementById('userPanel');
const logoutBtn = document.getElementById('logoutBtn');
const userDisplayName = document.getElementById('userDisplayName');
const userMenu = document.getElementById('userDropdown');
const userMenuEmail = document.getElementById('userMenuEmail');
const headerLogoutBtn = document.getElementById('headerLogoutBtn');

// Hide auth UI elements initially to prevent flicker, then restore state
async function initializeAuthUI() {
    // Initially hide both states to prevent flicker (only if elements exist)
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'none';
    if (userPanel) userPanel.style.display = 'none';
    
    // Small delay to ensure DOM is ready, then restore state
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Restore state (will show appropriate UI)
    await restoreSignInState();
}

// Check for and show pending page view notification (from previous page)
function showPendingPageViewNotification() {
    // Check for Page Viewed notification (persists across navigation)
    const pendingNotification = localStorage.getItem('iterable_pending_pageview_notification');
    if (pendingNotification) {
        try {
            const notificationInfo = JSON.parse(pendingNotification);
            
            // Show notification regardless of time (it persists until shown)
            if (window.showAPINotification) {
                window.showAPINotification(
                    notificationInfo.title,
                    notificationInfo.message,
                    notificationInfo.type,
                    notificationInfo.details
                );
            }
            
            // Keep notification in localStorage so it can be shown again if needed
            // Only remove if user explicitly wants to clear it, or after a long time
            const timeSince = Date.now() - notificationInfo.timestamp;
            if (timeSince > 300000) { // Remove after 5 minutes
                localStorage.removeItem('iterable_pending_pageview_notification');
            }
        } catch (error) {
            console.error('Error showing pending page view notification:', error);
            localStorage.removeItem('iterable_pending_pageview_notification');
        }
    }
    
    // Also check for old page view info (for backward compatibility)
    const pendingPageView = localStorage.getItem('iterable_pending_pageview');
    if (pendingPageView) {
        try {
            const pageViewInfo = JSON.parse(pendingPageView);
            const timeSince = Math.round((Date.now() - pageViewInfo.timestamp) / 1000);
            
            if (timeSince < 60) { // Only show if less than 60 seconds ago
                const pageInfo = pageViewInfo.pageName;
                const details = `${pageInfo} page | Time spent: ${pageViewInfo.timeSpent}s`;
                
                if (window.showAPINotification) {
                    window.showAPINotification(
                        'Page Viewed Event',
                        `Previous page view tracked and sent to Iterable`,
                        'success',
                        details
                    );
                }
            }
            
            localStorage.removeItem('iterable_pending_pageview');
        } catch (error) {
            console.error('Error showing pending page view notification:', error);
            localStorage.removeItem('iterable_pending_pageview');
        }
    }
}

// Initialize auth UI on page load (after DOM elements are defined)
// Check if user is already logged in on page load and update UI
function checkLoggedInStateOnLoad() {
    const email = localStorage.getItem('iterable_user_email');
    const firstName = localStorage.getItem('iterable_user_firstName');
    
    if (email && firstName && isIterableInitialized()) {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.textContent = `Hi, ${firstName}`;
            loginBtn.classList.add('logged-in');
            loginBtn.style.cursor = 'default';
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeAuthUI();
        checkLoggedInStateOnLoad();
        // Show pending page view notification after a short delay
        setTimeout(showPendingPageViewNotification, 500);
    });
} else {
    initializeAuthUI();
    checkLoggedInStateOnLoad();
    setTimeout(showPendingPageViewNotification, 500);
}

// Modal functionality
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        loginModal.classList.add('active');
    });
}

if (modalClose) {
    modalClose.addEventListener('click', () => {
        loginModal.classList.remove('active');
    });
}

// Close modal when clicking outside
if (loginModal) {
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('active');
        }
    });
}

// Login form submission - Initialize SDK and track login event
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            alert('Please enter your email address');
            return;
        }
        
        try {
            // Initialize Iterable SDK with user email (now async - awaits setEmail)
            const sdk = await initializeIterable(email);
            
            // Store email in localStorage for persistence
            localStorage.setItem('iterable_user_email', email);
            
            // Check if SDK is initialized for UI feedback
            if (!sdk || !isIterableInitialized()) {
                // SDK is disabled or not initialized - show warning but allow login
                if (window.showAPINotification) {
                    window.showAPINotification(
                        'SDK Disabled',
                        'Iterable SDK is currently disabled. Login will work but events will not be tracked.',
                        'error',
                        'Enable SDK in iterable-config.js to track events'
                    );
                }
            }
            
            // Store firstName if available
            const firstName = localStorage.getItem('iterable_user_firstName');
            if (firstName) {
                // Update header to show "Hi, {{firstName}}"
                const loginBtn = document.getElementById('loginBtn');
                if (loginBtn) {
                    loginBtn.textContent = `Hi, ${firstName}`;
                    loginBtn.classList.add('logged-in');
                    loginBtn.style.cursor = 'default';
                }
            }
            
            // Update UI
            updateUIForSignInState(true, email);
            loginModal.classList.remove('active');
            loginForm.reset();
            
            // Show success message
            showMessage('Successfully signed in!');
            
            // Scroll to top to show user panel
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Track page view now that user is signed in (only if SDK initialized)
            if (isIterableInitialized()) {
                trackPageView();
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Error signing in. Please try again.', 'error');
        }
    });
}

// Logout functionality
const handleLogout = async () => {
    try {
        // Clear Iterable session if initialized
        if (isIterableInitialized()) {
            resetIterable();
        }
        
        // Clear any stored user data
        localStorage.removeItem('iterable_user_email');
        // Note: SDK logout() should handle SDK's own localStorage, but we clear our tracking
        
        // Update UI to logged-out state
        updateUIForSignInState(false);
        loginForm.reset();
        
        showMessage('Successfully signed out');
        
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Error during sign out', 'error');
    }
};

if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
}

if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener('click', handleLogout);
}

// Sign Up form submission - Create user, update profile, track event, then auto sign in
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect form data
        const preferencesCheckboxes = document.querySelectorAll('input[name="preferences"]:checked');
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('signupEmail').value,
            phone: document.getElementById('phone').value,
            deliveryAddress: document.getElementById('deliveryAddress')?.value || '',
            preferences: Array.from(preferencesCheckboxes).map(checkbox => checkbox.value),
            consentEmail: document.getElementById('consentEmail').checked,
            consentSMS: document.getElementById('consentSMS').checked,
            termsConsent: document.getElementById('termsConsent').checked,
            // Include plan selection if available
            numberOfPeople: selectedPeople || undefined,
            mealsPerWeek: selectedMeals || undefined
        };
        
        if (!formData.email) {
            showMessage('Please enter your email address', 'error');
            return;
        }
        
        try {
            // Initialize SDK first (needed for updateUser) - now async, awaits setEmail
            const sdk = await initializeIterable(formData.email);
            
            if (!sdk) {
                throw new Error('Failed to initialize SDK');
            }
            
            // Store email in localStorage for persistence
            localStorage.setItem('iterable_user_email', formData.email);
            
            // Prepare updateUser payload for My Food Bag
            const userDataFields = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phone || undefined,
                recipePreferences: formData.preferences.length > 0 ? formData.preferences : undefined
            };
            
            // Add delivery address if provided
            if (formData.deliveryAddress) {
                userDataFields.deliveryAddress = formData.deliveryAddress;
            }
            
            // Add plan selection if available
            if (formData.numberOfPeople) {
                userDataFields.numberOfPeople = formData.numberOfPeople;
            }
            if (formData.mealsPerWeek) {
                userDataFields.mealsPerWeek = formData.mealsPerWeek;
            }
            
            // Remove undefined fields
            Object.keys(userDataFields).forEach(key => {
                if (userDataFields[key] === undefined) {
                    delete userDataFields[key];
                }
            });
            
            // Update user profile
            console.log('📝 Sign Up: Updating user profile...', userDataFields);
            await updateUser(formData.email, userDataFields, {
                mergeNestedObjects: true,
                createNewFields: true
            });
            console.log('✅ Sign Up: User profile updated successfully');
            
            // Update subscription preferences using direct API calls
            // Email channel: 105894, SMS channel: 105898
            const EMAIL_CHANNEL_ID = 105894;
            const SMS_CHANNEL_ID = 105898;
            
            console.log('📧 Sign Up: Updating subscription preferences...');
            
            // Build subscription payload - SDK's updateSubscriptions overwrites all, so we need to set both channels at once
            const unsubscribedChannels = [];
            if (!formData.consentEmail) {
                console.log('  → Unsubscribing from Email channel (105894)');
                unsubscribedChannels.push(EMAIL_CHANNEL_ID);
            } else {
                console.log('  → Subscribing to Email channel (105894)');
            }
            
            if (!formData.consentSMS) {
                console.log('  → Unsubscribing from SMS channel (105898)');
                unsubscribedChannels.push(SMS_CHANNEL_ID);
            } else {
                console.log('  → Subscribing to SMS channel (105898)');
            }
            
            // Update both subscriptions in one call (SDK method overwrites all, so we set both at once)
            if (unsubscribedChannels.length > 0 || formData.consentEmail || formData.consentSMS) {
                // Only call if we need to set preferences
                await updateSubscription(formData.email, null, null, unsubscribedChannels);
            }
            console.log('✅ Sign Up: Subscription preferences updated');
            
            // Auto sign in - update UI
            updateUIForSignInState(true, formData.email);
            // Update display name if we have firstName
            if (userDisplayName && formData.firstName) {
                userDisplayName.textContent = formData.firstName;
            }
            
            // Show success message
            showMessage('Successfully signed up and signed in!');
            
            // Reset form
            signupForm.reset();
            
            // Scroll to top to show user panel
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Track page view now that user is signed in
            trackPageView();
            
        } catch (error) {
            console.error('Sign up error:', error);
            showMessage('Error during sign up. Please try again.', 'error');
        }
    });
}

// My Food Bag specific interactions

// Recipe Preference Selection
const recipePreferenceCards = document.querySelectorAll('.recipe-preference-card');
recipePreferenceCards.forEach(card => {
    card.addEventListener('click', () => {
        // Remove active class from all cards
        recipePreferenceCards.forEach(c => c.classList.remove('active'));
        // Add active class to clicked card
        card.classList.add('active');
        
        const preference = card.dataset.preference;
        console.log('Recipe preference selected:', preference);
    });
});

// Plan Selection - Number of People
const peopleOptions = document.querySelectorAll('.plan-option[data-people]');
let selectedPeople = 1;
peopleOptions.forEach(option => {
    option.addEventListener('click', () => {
        peopleOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        selectedPeople = parseInt(option.dataset.people);
        updateWeeklyPrice();
    });
});

// Plan Selection - Meals per Week
const mealsOptions = document.querySelectorAll('.plan-option[data-meals]');
let selectedMeals = 3;
mealsOptions.forEach(option => {
    option.addEventListener('click', () => {
        mealsOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        selectedMeals = parseInt(option.dataset.meals);
        updateWeeklyPrice();
    });
});

// Price calculation (simplified - adjust based on actual pricing)
function updateWeeklyPrice() {
    const basePricePerMeal = 5.75; // Current price per plate
    const originalPricePerMeal = 11.50; // Original price per plate
    const totalMeals = selectedPeople * selectedMeals;
    const currentPrice = totalMeals * basePricePerMeal;
    const originalPrice = totalMeals * originalPricePerMeal;
    
    const weeklyPriceElement = document.getElementById('weeklyPrice');
    const weeklyOriginalElement = document.getElementById('weeklyOriginal');
    const platePriceElement = document.getElementById('platePrice');
    const plateOriginalElement = document.getElementById('plateOriginal');
    
    if (weeklyPriceElement) {
        weeklyPriceElement.textContent = `$${currentPrice.toFixed(2)}`;
    }
    if (weeklyOriginalElement) {
        weeklyOriginalElement.textContent = `$${originalPrice.toFixed(2)}`;
    }
    if (platePriceElement) {
        platePriceElement.textContent = `$${basePricePerMeal.toFixed(2)}`;
    }
    if (plateOriginalElement) {
        plateOriginalElement.textContent = `$${originalPricePerMeal.toFixed(2)}`;
    }
}

// Initialize price on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        updateWeeklyPrice();
    });
} else {
    updateWeeklyPrice();
}

// Plan Actions
const continuePlanBtn = document.getElementById('continuePlanBtn');
if (continuePlanBtn) {
    continuePlanBtn.addEventListener('click', () => {
        // Get selected preference
        const activePreferenceCard = document.querySelector('.recipe-preference-card.active');
        const selectedPreference = activePreferenceCard ? activePreferenceCard.dataset.preference : 'all';
        
        // Redirect to checkout with plan data
        const checkoutUrl = new URL('checkout.html', window.location.origin);
        checkoutUrl.searchParams.set('people', selectedPeople);
        checkoutUrl.searchParams.set('meals', selectedMeals);
        checkoutUrl.searchParams.set('preference', selectedPreference);
        window.location.href = checkoutUrl.toString();
    });
}

const cancelPlanBtn = document.getElementById('cancelPlanBtn');
if (cancelPlanBtn) {
    cancelPlanBtn.addEventListener('click', () => {
        // Reset selections
        peopleOptions.forEach(o => o.classList.remove('active'));
        mealsOptions.forEach(o => o.classList.remove('active'));
        if (peopleOptions[0]) peopleOptions[0].classList.add('active');
        if (mealsOptions[0]) mealsOptions[0].classList.add('active');
        selectedPeople = 1;
        selectedMeals = 3;
        updateWeeklyPrice();
    });
}

// Build Menu Button
const buildMenuBtn = document.getElementById('buildMenuBtn');
if (buildMenuBtn) {
    buildMenuBtn.addEventListener('click', () => {
        // Note: Sign up form removed - this button can trigger a separate signup flow
        console.log('Build Menu clicked - would trigger signup flow');
    });
}

// CTA button handlers
const ctaButtons = document.querySelectorAll('#ctaPrimary, #ctaBottom, .happy-foodies-cta .btn, .how-it-works-cta .btn');
ctaButtons.forEach(btn => {
    if (btn) {
        btn.addEventListener('click', (e) => {
            // If it's a link, let it handle navigation
            if (btn.tagName === 'A') {
                return;
            }
            
            // Scroll to signup form
            const signupSection = document.getElementById('signup');
            if (signupSection) {
                signupSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
});

// Event trigger button (placeholder)
const triggerEventBtn = document.getElementById('triggerEventBtn');
if (triggerEventBtn) {
    triggerEventBtn.addEventListener('click', () => {
        window.location.href = '/custom-event.html';
    });
}

// Update profile button
const updateProfileBtn = document.getElementById('updateProfileBtn');
if (updateProfileBtn) {
    updateProfileBtn.addEventListener('click', () => {
        window.location.href = '/update-profile.html';
    });
}

// Dropdown menu functionality - keep menu open on hover
// CSS handles the hover state, but we also support click for mobile
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
        e.preventDefault();
        const dropdown = this.closest('.nav-dropdown');
        dropdown.classList.toggle('active');
    });
});

// Close dropdown when clicking outside (for mobile/click behavior)
document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-dropdown')) {
        document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Testimonials Carousel
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');
const testimonialsTrack = document.getElementById('testimonialsTrack');
let currentSlide = 0;

if (testimonialsTrack && carouselPrev && carouselNext) {
    const testimonialCards = testimonialsTrack.querySelectorAll('.testimonial-card');
    const cardsPerView = 3; // Show 3 cards at a time
    const maxSlide = Math.max(0, testimonialCards.length - cardsPerView);
    
    function updateCarousel() {
        const cardWidth = testimonialCards[0].offsetWidth + parseInt(getComputedStyle(testimonialsTrack).gap);
        testimonialsTrack.style.transform = `translateX(-${currentSlide * cardWidth}px)`;
        
        carouselPrev.style.opacity = currentSlide === 0 ? '0.5' : '1';
        carouselPrev.style.pointerEvents = currentSlide === 0 ? 'none' : 'auto';
        carouselNext.style.opacity = currentSlide >= maxSlide ? '0.5' : '1';
        carouselNext.style.pointerEvents = currentSlide >= maxSlide ? 'none' : 'auto';
    }
    
    carouselPrev.addEventListener('click', () => {
        if (currentSlide > 0) {
            currentSlide--;
            updateCarousel();
        }
    });
    
    carouselNext.addEventListener('click', () => {
        if (currentSlide < maxSlide) {
            currentSlide++;
            updateCarousel();
        }
    });
    
    // Initialize carousel
    updateCarousel();
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            updateCarousel();
        }, 250);
    });
}
