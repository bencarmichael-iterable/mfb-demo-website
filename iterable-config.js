// ============================================
// Iterable Web SDK Configuration
// ============================================
// SDK initializes when user signs in

import { initializeWithConfig, track, updateUser as sdkUpdateUser, updateSubscriptions as sdkUpdateSubscriptions } from '@iterable/web-sdk';

// Get API key from environment variable
const API_KEY = import.meta.env.VITE_ITERABLE_API_KEY;

// Configuration object
let iterableConfig = {
    apiKey: API_KEY || null,
    isInitialized: false,
    sdkInstance: null,
    currentUserEmail: null
};

/**
 * Initialize Iterable SDK (called on Sign In)
 * @param {string} email - User email address
 * @param {Object} options - Additional configuration options
 */
export async function initializeIterable(email, options = {}) {
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

    if (iterableConfig.isInitialized && iterableConfig.currentUserEmail === email) {
        console.log('Iterable SDK: Already initialized for this user.');
        return iterableConfig.sdkInstance;
    }

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
        
        // Show notification for demo purposes
        if (typeof window !== 'undefined' && window.showAPINotification) {
            window.showAPINotification(
                'SDK Authenticated',
                `Iterable Web SDK initialized for ${email}`,
                'success',
                'SDK ready to track events and update user profiles'
            );
        }
        
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
 * Track a custom event
 * @param {string} eventName - Name of the event
 * @param {Object} eventData - Event data including email and dataFields
 * @returns {Promise} - Returns promise that resolves on success
 */
export async function trackEvent(eventName, eventData = {}) {
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
        // Prepare payload according to events/track structure
        // The track function expects: { eventName, dataFields, email?, userId?, ... }
        const payload = {
            eventName: eventName,
            dataFields: eventData.dataFields || {}
        };

        // Add email to payload (even though it's set on SDK, include it in payload too)
        payload.email = email;
        
        // Optional fields
        if (eventData.id) payload.id = eventData.id;
        if (eventData.createdAt) payload.createdAt = eventData.createdAt;
        if (eventData.campaignId) payload.campaignId = eventData.campaignId;
        if (eventData.templateId) payload.templateId = eventData.templateId;

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
    if (!isIterableInitialized()) {
        console.warn('Iterable SDK: Not initialized. Cannot update user.');
        return Promise.reject('SDK not initialized');
    }

    if (!email) {
        console.warn('Iterable SDK: Email required for updating user.');
        return Promise.reject('Email required');
    }

    try {
        // Prepare payload according to users/update structure
        // The updateUser function expects: { email, dataFields, mergeNestedObjects?, createNewFields? }
        const payload = {
            email: email,
            dataFields: dataFields
        };

        // Add optional fields
        if (options.mergeNestedObjects !== undefined) {
            payload.mergeNestedObjects = options.mergeNestedObjects;
        }
        if (options.createNewFields !== undefined) {
            payload.createNewFields = options.createNewFields;
        }

        // Use the updateUser function directly (not a method on SDK instance)
        await sdkUpdateUser(payload);
        console.log('Iterable SDK: User updated:', payload);
        
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
 */
export function resetIterable() {
    if (iterableConfig.sdkInstance && iterableConfig.sdkInstance.logout) {
        iterableConfig.sdkInstance.logout();
    }
    iterableConfig.isInitialized = false;
    iterableConfig.sdkInstance = null;
    iterableConfig.currentUserEmail = null;
    // Note: apiKey stays so we can reinitialize
}

// Export config for debugging (read-only)
export const config = Object.freeze({
    get isInitialized() { return iterableConfig.isInitialized; },
    get hasApiKey() { return iterableConfig.apiKey !== null; },
    get currentUserEmail() { return iterableConfig.currentUserEmail; }
});
