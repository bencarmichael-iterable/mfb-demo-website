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
    
    // Auto-remove after delay
    setTimeout(() => {
        notificationEl.classList.add('api-notification-hide');
        setTimeout(() => notificationEl.remove(), 300);
    }, type === 'success' ? 4000 : 5000);
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
    
    // Don't track for Home page
    if (pageName === 'home' || pageName === 'index') {
        console.log('📊 Page Viewed: Home page, skipping');
        return;
    }
    
    // Calculate time spent on page
    const timeSpentSeconds = Math.round((Date.now() - pageLoadTime) / 1000);
    
    // Determine page category and subcategory
    let pageCategory = 'General';
    let pageSubCategory = '';
    
    if (['data-capture', 'personalisation', 'automation', 'analytics'].includes(pageName)) {
        pageCategory = 'Features';
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
        if (signupLink) {
            signupLink.style.display = 'none';
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
        if (signupLink) {
            signupLink.style.display = 'inline-block';
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
const userMenu = document.getElementById('userMenu');
const userMenuEmail = document.getElementById('userMenuEmail');
const headerLogoutBtn = document.getElementById('headerLogoutBtn');
const signupLink = document.getElementById('signupLink');

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
    const pendingPageView = localStorage.getItem('iterable_pending_pageview');
    if (pendingPageView) {
        try {
            const pageViewInfo = JSON.parse(pendingPageView);
            const timeSince = Math.round((Date.now() - pageViewInfo.timestamp) / 1000);
            
            // Only show if it's recent (within last 5 seconds)
            if (timeSince < 5) {
                const pageInfo = pageViewInfo.pageName;
                const details = `${pageInfo} page | Time spent: ${pageViewInfo.timeSpent}s`;
                
                if (typeof window !== 'undefined' && window.showAPINotification) {
                    window.showAPINotification(
                        'Page Viewed Event',
                        `Previous page view tracked and sent to Iterable`,
                        'success',
                        details
                    );
                }
            }
            
            // Clear the pending notification
            localStorage.removeItem('iterable_pending_pageview');
        } catch (error) {
            console.error('Error showing pending page view notification:', error);
            localStorage.removeItem('iterable_pending_pageview');
        }
    }
}

// Initialize auth UI on page load (after DOM elements are defined)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeAuthUI();
        // Show pending page view notification after a short delay
        setTimeout(showPendingPageViewNotification, 500);
    });
} else {
    initializeAuthUI();
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
            
            if (!sdk) {
                throw new Error('Failed to initialize SDK');
            }
            
            // Store email in localStorage for persistence
            localStorage.setItem('iterable_user_email', email);
            
            // Track User Login event
            await trackEvent('User Login', {
                email: email,
                dataFields: {
                    channel: 'website'
                },
                createNewFields: true
            });
            
            // Update UI
            updateUIForSignInState(true, email);
            loginModal.classList.remove('active');
            loginForm.reset();
            
            // Show success message
            showMessage('Successfully signed in!');
            
            // Scroll to top to show user panel
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Track page view now that user is signed in
            trackPageView();
            
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
        const interestsCheckboxes = document.querySelectorAll('input[name="interests"]:checked');
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('signupEmail').value,
            phone: document.getElementById('phone').value,
            company: document.getElementById('company').value,
            interests: Array.from(interestsCheckboxes).map(checkbox => checkbox.value),
            consentEmail: document.getElementById('consentEmail').checked,
            consentSMS: document.getElementById('consentSMS').checked,
            termsConsent: document.getElementById('termsConsent').checked
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
            
            // Prepare updateUser payload according to users/update structure
            const userDataFields = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phone || undefined,
                selfAssessmentInterests: formData.interests.length > 0 ? formData.interests : undefined
            };
            
            // Add company as nested object if provided
            if (formData.company) {
                userDataFields.company = {
                    name: formData.company
                };
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
            
            // Track Sign Up event
            // Determine device type (simplified - could be enhanced)
            const device = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop';
            
            console.log('📊 Sign Up: Tracking Sign Up event...', {
                channel: 'website',
                device: device,
                firstName: formData.firstName,
                lastName: formData.lastName
            });
            await trackEvent('Sign Up', {
                email: formData.email,
                dataFields: {
                    channel: 'website',
                    device: device,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    signupChannel: 'website'
                },
                createNewFields: true
            });
            console.log('✅ Sign Up: Event tracked successfully');
            
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

// CTA button handlers (placeholder)
const ctaButtons = document.querySelectorAll('#ctaPrimary, #ctaBottom');
ctaButtons.forEach(btn => {
    if (btn) {
        btn.addEventListener('click', () => {
            // TODO: Track custom events to Iterable
            console.log('CTA clicked:', btn.id);
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
