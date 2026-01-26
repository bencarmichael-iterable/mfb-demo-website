// ============================================
// Iterable Web SDK Configuration
// ============================================
// SDK initializes when user signs in

// SDK imports (must be at top of file for ES modules)
import { initializeWithConfig, track, updateUser as sdkUpdateUser, updateSubscriptions as sdkUpdateSubscriptions } from '@iterable/web-sdk';

// ============================================
// SDK Configuration
// ============================================
const SDK_ENABLED = true; // Set to true to enable SDK functionality

// Debug: Log SDK status (this will show in console to verify it's enabled)
console.log('🔧 SDK Configuration:', { SDK_ENABLED: true, timestamp: new Date().toISOString() });

// Get API key from environment variable (will be null while disabled)
const API_KEY = SDK_ENABLED ? import.meta.env.VITE_ITERABLE_API_KEY : null;

// Debug: Log API key status (without exposing the key)
console.log('🔑 API Key Status:', { 
    hasApiKey: !!API_KEY, 
    apiKeyLength: API_KEY ? API_KEY.length : 0,
    envVar: import.meta.env.VITE_ITERABLE_API_KEY ? 'Present' : 'Missing'
});

// Configuration object
let iterableConfig = {
    apiKey: API_KEY || null,
    isInitialized: false,
    sdkInstance: null,
    currentUserEmail: null,
    logoutInProgress: false // Flag to prevent re-initialization immediately after logout
};

/**
 * Initialize Iterable SDK (called on Sign In)
 * @param {string} email - User email address
 * @param {Object} options - Additional configuration options
 */
export async function initializeIterable(email, options = {}) {
    // SDK is disabled - return early
    if (!SDK_ENABLED) {
        console.log('Iterable SDK: Disabled (set SDK_ENABLED = true to enable)');
        return null;
    }
    
    // Check if logout is in progress - prevent initialization during/after logout
    if (iterableConfig.logoutInProgress) {
        console.warn('Iterable SDK: Initialization blocked - logout in progress');
        return null;
    }
    
    // Check API key first
    if (!iterableConfig.apiKey) {
        console.error('Iterable SDK: API key not found. Check .env.local or Netlify environment variables.');
        console.error('Current API_KEY value:', API_KEY ? 'Present (but not set in config)' : 'Missing');
        return null;
    }

    if (!email) {
        console.warn('Iterable SDK: Email required for initialization.');
        return null;
    }

    // If already initialized for a different user, reset first
    if (iterableConfig.isInitialized && iterableConfig.currentUserEmail !== email) {
        console.log('Iterable SDK: Already initialized for different user. Resetting...');
        resetIterable();
        // Wait a moment for reset to complete
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (iterableConfig.isInitialized && iterableConfig.currentUserEmail === email) {
        console.log('Iterable SDK: Already initialized for this user.');
        return iterableConfig.sdkInstance;
    }

    // SDK initialization code
    try {
        console.log('Iterable SDK: Attempting initialization with API key:', iterableConfig.apiKey ? 'Present' : 'Missing');
        
        // The SDK requires a generateJWT function, even if JWT is not required
        // For non-JWT API keys, this function may not be called, but it's required by the SDK
        const generateJWT = async ({ email, userID }) => {
            // If JWT is not required, this function may not be called
            // If it is called and JWT is required, this will fail and you'll need to implement proper JWT generation
            console.warn('Iterable SDK: generateJWT called but JWT generation not implemented. If your API key requires JWT, you need to implement this function.');
            return Promise.resolve('');
        };
        
        const config = {
            authToken: iterableConfig.apiKey,
            configOptions: {
                isEuIterableService: options.isEuIterableService || false,
                ...options.configOptions
            },
            generateJWT: generateJWT
        };

        console.log('Iterable SDK: Config structure:', { 
            hasAuthToken: !!config.authToken, 
            hasGenerateJWT: !!config.generateJWT,
            configOptions: config.configOptions 
        });

        // Initialize SDK
        const sdk = initializeWithConfig(config);
        
        // Check if SDK initialized successfully
        if (!sdk) {
            console.error('Iterable SDK: initializeWithConfig returned null');
            console.error('This could mean:');
            console.error('1. API key is invalid');
            console.error('2. SDK import is incorrect');
            console.error('3. Config structure is wrong');
            throw new Error('SDK initialization returned null - check API key and SDK configuration');
        }
        
        // Set user email - this must be called before using track/updateUser functions
        // setEmail returns a Promise and must be awaited!
        if (sdk.setEmail) {
            try {
                await sdk.setEmail(email);
                console.log('Iterable SDK: Email set to', email);
            } catch (error) {
                console.error('Iterable SDK: Error setting email', error);
                throw error;
            }
        } else {
            console.warn('Iterable SDK: setEmail method not available on SDK instance');
        }
        
        // Log available SDK methods for debugging
        console.log('Iterable SDK: Available methods:', Object.keys(sdk).filter(key => typeof sdk[key] === 'function'));
        
        iterableConfig.isInitialized = true;
        iterableConfig.sdkInstance = sdk;
        iterableConfig.currentUserEmail = email;

        console.log('Iterable SDK: Successfully initialized for', email);
        
        // Don't show notification here - notifications should only be shown during checkout flow
        // This prevents notifications from appearing when restoring sign-in state on home page
        
        return sdk;
    } catch (error) {
        console.error('Iterable SDK: Initialization error', error);
        return null;
    }
}

/**
 * Get the current SDK instance (returns null if not initialized)
 */
export function getIterableSDK() {
    return iterableConfig.sdkInstance;
}

/**
 * Check if SDK is initialized
 */
export function isIterableInitialized() {
    return iterableConfig.isInitialized;
}

/**
 * Helper function to convert dot-notation keys to nested objects
 * Used by both updateUser and trackEvent to convert dot notation to nested structure
 * Example: { 'account.boxName': 'value', 'address.street': '123 Main', 'order.deadlineDate': '2024-01-01' }
 * Becomes: { account: { boxName: 'value' }, address: { street: '123 Main' }, order: { deadlineDate: '2024-01-01' } }
 */
function convertDotNotationToNested(dataFields) {
    const nested = {};
    
    for (const [key, value] of Object.entries(dataFields)) {
        if (key.includes('.')) {
            // Split by dot and create nested structure
            const parts = key.split('.');
            let current = nested;
            
            // Navigate/create nested structure
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
            
            // Set the final value
            current[parts[parts.length - 1]] = value;
        } else {
            // Non-nested key - if value is already an object, preserve it as nested object
            // This handles cases where nested objects are passed directly (e.g., { account: { boxName: 'value' } })
            if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                // Merge nested object if it already exists, otherwise set it
                if (nested[key] && typeof nested[key] === 'object') {
                    nested[key] = { ...nested[key], ...value };
                } else {
                    nested[key] = value;
                }
            } else {
                // Primitive value, add directly
                nested[key] = value;
            }
        }
    }
    
    return nested;
}

/**
 * Track a custom event
 * @param {string} eventName - Name of the event
 * @param {Object} eventData - Event data including email and dataFields
 * @returns {Promise} - Returns promise that resolves on success
 */
export async function trackEvent(eventName, eventData = {}) {
    // SDK is disabled - return early
    if (!SDK_ENABLED) {
        console.log(`Iterable SDK: trackEvent called for "${eventName}" but SDK is disabled`);
        return Promise.resolve(); // Resolve (not reject) so UI doesn't break
    }
    
    if (!isIterableInitialized()) {
        console.warn('Iterable SDK: Not initialized. Cannot track event.');
        return Promise.reject('SDK not initialized');
    }

    // Get email from eventData or from current user
    const email = eventData.email || iterableConfig.currentUserEmail;
    
    if (!email) {
        console.warn('Iterable SDK: Email required for tracking events. Provide email in eventData or ensure user is signed in.');
        return Promise.reject('Email required');
    }
    
    // Ensure email is set on SDK before tracking (track function requires user to be set)
    const sdk = getIterableSDK();
    if (sdk && sdk.setEmail) {
        // Ensure the email is set on the SDK instance before calling track
        // setEmail returns a Promise and must be awaited!
        if (iterableConfig.currentUserEmail !== email) {
            try {
                await sdk.setEmail(email);
                iterableConfig.currentUserEmail = email;
            } catch (error) {
                console.error('Iterable SDK: Error setting email before track', error);
                return Promise.reject(error);
            }
        }
    }

    try {
        // Convert dot-notation keys to nested objects in event dataFields (e.g., 'order.deadlineDate' -> order: { deadlineDate: ... })
        const nestedDataFields = convertDotNotationToNested(eventData.dataFields || {});
        
        // Prepare payload according to events/track structure
        // The track function expects: { eventName, dataFields, email?, userId?, ... }
        const payload = {
            eventName: eventName,
            dataFields: nestedDataFields
        };

        // Add email to payload (even though it's set on SDK, include it in payload too)
        payload.email = email;
        
        // Optional fields
        if (eventData.id) payload.id = eventData.id;
        if (eventData.createdAt) payload.createdAt = eventData.createdAt;
        if (eventData.campaignId) payload.campaignId = eventData.campaignId;
        if (eventData.templateId) payload.templateId = eventData.templateId;
        
        // Log conversion for debugging
        if (Object.keys(eventData.dataFields || {}).some(key => key.includes('.'))) {
            console.log('Iterable SDK: Converted event dataFields:', { 
                original: eventData.dataFields, 
                nested: nestedDataFields 
            });
        }

        // Use the track function directly (not a method on SDK instance)
        // Note: track function requires SDK to be initialized with user email via setEmail
        try {
            await track(payload);
            console.log('Iterable SDK: Event tracked:', eventName);
            console.log('Iterable SDK: Payload details:', {
                eventName: payload.eventName,
                email: payload.email,
                dataFields: payload.dataFields,
                hasDataFields: Object.keys(payload.dataFields || {}).length > 0
            });
            
            // Show notification for demo purposes
            if (typeof window !== 'undefined' && window.showAPINotification) {
                const dataFieldsSummary = Object.keys(payload.dataFields || {}).length > 0 
                    ? `${Object.keys(payload.dataFields).length} data fields sent`
                    : 'No additional data fields';
                window.showAPINotification(
                    'Event Tracked',
                    `${eventName} event sent to Iterable`,
                    'success',
                    dataFieldsSummary
                );
            }
            
            return Promise.resolve();
        } catch (error) {
            console.error('Iterable SDK: Error calling track function', error);
            return Promise.reject(error);
        }
    } catch (error) {
        console.error('Iterable SDK: Error tracking event', error);
        return Promise.reject(error);
    }
}

/**
 * Update user profile
 * @param {string} email - User email address
 * @param {Object} dataFields - User data fields to update
 * @param {Object} options - Additional options (mergeNestedObjects, createNewFields)
 * @returns {Promise} - Returns promise that resolves on success
 */
export async function updateUser(email, dataFields = {}, options = {}) {
    // SDK is disabled - return early
    if (!SDK_ENABLED) {
        console.log(`Iterable SDK: updateUser called for "${email}" but SDK is disabled`);
        return Promise.resolve(); // Resolve (not reject) so UI doesn't break
    }
    
    if (!isIterableInitialized()) {
        console.warn('Iterable SDK: Not initialized. Cannot update user.');
        return Promise.reject('SDK not initialized');
    }

    if (!email) {
        console.warn('Iterable SDK: Email required for updating user.');
        return Promise.reject('Email required');
    }

    try {
        // Convert dot-notation keys to nested objects (e.g., 'account.boxName' -> account: { boxName: ... })
        const nestedDataFields = convertDotNotationToNested(dataFields);
        
        console.log('Iterable SDK: updateUser called with:', {
            email,
            originalDataFields: dataFields,
            convertedDataFields: nestedDataFields,
            options
        });
        
        // Prepare payload according to Iterable Web SDK structure
        // The SDK's updateUser function expects a single object with:
        // { email, userId?, dataFields, preferUserId?, mergeNestedObjects?, createNewFields? }
        // Note: phoneNumber stays in dataFields as a string of numbers only (no + sign)
        const payload = {
            email: email,
            dataFields: nestedDataFields,
            mergeNestedObjects: options.mergeNestedObjects !== undefined ? options.mergeNestedObjects : true,
            createNewFields: options.createNewFields !== undefined ? options.createNewFields : true
        };
        
        // Add optional fields if provided
        if (options.userId) {
            payload.userId = options.userId;
        }
        if (options.preferUserId !== undefined) {
            payload.preferUserId = options.preferUserId;
        }

        // Use the updateUser function from SDK with the correct payload structure
        await sdkUpdateUser(payload);
        console.log('Iterable SDK: User updated successfully');
        console.log('Iterable SDK: Payload sent:', payload);
        console.log('Iterable SDK: Conversion details:', { 
            original: dataFields, 
            nested: nestedDataFields,
            originalKeys: Object.keys(dataFields),
            nestedKeys: Object.keys(nestedDataFields)
        });
        
        // Show notification for demo purposes
        if (typeof window !== 'undefined' && window.showAPINotification) {
            const fieldsCount = Object.keys(dataFields || {}).length;
            window.showAPINotification(
                'User Profile Updated',
                `User profile updated via API`,
                'success',
                `${fieldsCount} field${fieldsCount !== 1 ? 's' : ''} updated`
            );
        }
        
        return Promise.resolve();
    } catch (error) {
        console.error('Iterable SDK: Error updating user', error);
        return Promise.reject(error);
    }
}

/**
 * Update user subscription preferences
 * Uses SDK's updateSubscriptions method to avoid CORS issues
 * 
 * NOTE: SDK's updateSubscriptions uses POST /api/users/updateSubscriptions which overwrites all subscriptions
 * We pass unsubscribedChannelIds array to set which channels to unsubscribe from
 * 
 * @param {string} email - User email address (for logging, SDK uses current user)
 * @param {number|null} subscriptionGroupId - Channel ID (deprecated, use unsubscribedChannels instead)
 * @param {boolean|null} subscribe - Subscribe flag (deprecated, use unsubscribedChannels instead)
 * @param {number[]} unsubscribedChannels - Array of channel IDs to unsubscribe from (all others remain subscribed)
 * @returns {Promise} - Returns promise that resolves on success
 */
export async function updateSubscription(email, subscriptionGroupId = null, subscribe = null, unsubscribedChannels = []) {
    // SDK is disabled - return early
    if (!SDK_ENABLED) {
        console.log(`Iterable SDK: updateSubscription called but SDK is disabled`);
        return Promise.resolve(); // Resolve (not reject) so UI doesn't break
    }
    
    if (!isIterableInitialized()) {
        console.warn('Iterable SDK: Not initialized. Cannot update subscriptions.');
        return Promise.reject('SDK not initialized');
    }

    try {
        // Use SDK's updateSubscriptions method to avoid CORS issues
        // NOTE: This method overwrites ALL subscriptions, so we need to be careful
        // For new signups, this is safe since user has no existing subscriptions
        // For existing users, this would overwrite their preferences (limitation of SDK method)
        
        // Build payload - channels in unsubscribedChannelIds will be unsubscribed
        // All other channels remain subscribed (default behavior)
        const payload = {
            unsubscribedChannelIds: unsubscribedChannels
        };
        
        await sdkUpdateSubscriptions(payload);
        console.log(`Iterable SDK: Subscription updated via SDK for ${email}, unsubscribed channels:`, unsubscribedChannels);
        
        // Show notification for demo purposes
        if (typeof window !== 'undefined' && window.showAPINotification) {
            const action = unsubscribedChannels.length > 0 ? 'Unsubscribed' : 'Subscribed';
            window.showAPINotification(
                'Subscription Updated',
                `${action} from ${unsubscribedChannels.length > 0 ? unsubscribedChannels.length : 'all'} channel${unsubscribedChannels.length !== 1 ? 's' : ''}`,
                'success',
                `Channel preferences updated via API`
            );
        }
        
        return Promise.resolve();
    } catch (error) {
        console.error('Iterable SDK: Error updating subscription', error);
        return Promise.reject(error);
    }
}

/**
 * Reset/Logout from Iterable SDK
 * This completely stops SDK initialization and clears all user state
 */
export function resetIterable() {
    console.log('🔄 Resetting Iterable SDK...');
    
    // Call SDK logout method if available
    if (iterableConfig.sdkInstance) {
        try {
            if (iterableConfig.sdkInstance.logout && typeof iterableConfig.sdkInstance.logout === 'function') {
                iterableConfig.sdkInstance.logout();
                console.log('✅ SDK logout() called');
            }
            // Also try clearRefresh if available (clears any refresh tokens)
            if (iterableConfig.sdkInstance.clearRefresh && typeof iterableConfig.sdkInstance.clearRefresh === 'function') {
                iterableConfig.sdkInstance.clearRefresh();
                console.log('✅ SDK clearRefresh() called');
            }
        } catch (error) {
            console.warn('⚠️ Error during SDK logout:', error);
            // Continue with reset even if logout fails
        }
    }
    
    // Clear all SDK state
    iterableConfig.isInitialized = false;
    iterableConfig.sdkInstance = null;
    iterableConfig.currentUserEmail = null;
    
    // Set a flag to prevent immediate re-initialization
    // This prevents any ongoing initialization from completing after logout
    iterableConfig.logoutInProgress = true;
    
    // Clear the flag after a short delay to allow normal initialization later
    setTimeout(() => {
        iterableConfig.logoutInProgress = false;
        console.log('✅ SDK reset complete - ready for new initialization');
    }, 1000);
    
    console.log('✅ Iterable SDK reset complete');
    // Note: apiKey stays so we can reinitialize with a new user later
}

// Export config for debugging (read-only)
export const config = Object.freeze({
    get isInitialized() { return iterableConfig.isInitialized; },
    get hasApiKey() { return iterableConfig.apiKey !== null; },
    get currentUserEmail() { return iterableConfig.currentUserEmail; }
});
