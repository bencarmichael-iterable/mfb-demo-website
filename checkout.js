// Checkout Section Management
// Version: 2.0 - Added notification system
// Version: 2.1 - Added SDK integration with confirmation messages
console.log('📦 checkout.js loaded - Version 2.1');

// Import Iterable SDK functions
import { 
    initializeIterable, 
    trackEvent,
    updateUser,
    isIterableInitialized
} from './iterable-config.js';

let sectionStates = {
    section1: { completed: false, visible: true },
    section2: { completed: false, visible: false },
    section3: { completed: false, visible: false }
};

// Store plan data globally
let planData = {
    people: null,
    meals: null,
    preference: null
};

// Helper function to validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function to validate phone number format (NZ format: accepts +64, 0, or no prefix)
function validatePhoneNumber(phone) {
    // Remove spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // Accept: +64XXXXXXXXX, 0XXXXXXXXX, or XXXXXXXXX (9-10 digits after prefix)
    const phoneRegex = /^(\+64|0)?[2-9]\d{7,9}$/;
    return phoneRegex.test(cleaned);
}

// Helper function to format phone number to numbers only (no + sign, no spaces/dashes)
function formatPhoneNumber(phone) {
    // Remove spaces, dashes, parentheses, and + signs
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // If starts with 64 (country code), remove it
    if (cleaned.startsWith('64')) {
        return cleaned.substring(2);
    }
    
    // If starts with 0, remove the leading 0
    if (cleaned.startsWith('0')) {
        return cleaned.substring(1);
    }
    
    // Return cleaned number (just digits)
    return cleaned;
}

// Helper function to save checkout state to localStorage
function saveCheckoutState() {
    const state = {
        section1: sectionStates.section1,
        section2: sectionStates.section2,
        section3: sectionStates.section3,
        planData: planData,
        timestamp: Date.now()
    };
    localStorage.setItem('checkout_state', JSON.stringify(state));
}

// Helper function to restore checkout state from localStorage
function restoreCheckoutState() {
    const savedState = localStorage.getItem('checkout_state');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            // Only restore if less than 24 hours old
            const age = Date.now() - state.timestamp;
            if (age < 24 * 60 * 60 * 1000) {
                sectionStates = state.section1 ? { ...sectionStates, ...state } : sectionStates;
                planData = state.planData || planData;
                
                // Restore form values if available
                const savedEmail = localStorage.getItem('checkout_email');
                const savedAddress = localStorage.getItem('checkout_address');
                const savedDate = localStorage.getItem('checkout_deliveryDate');
                const savedFrequency = localStorage.getItem('checkout_deliveryFrequency');
                const savedInstructions = localStorage.getItem('checkout_deliveryInstructions');
                const savedFirstName = localStorage.getItem('checkout_firstName');
                const savedLastName = localStorage.getItem('checkout_lastName');
                const savedMobile = localStorage.getItem('checkout_mobile');
                
                if (savedEmail && document.getElementById('email')) {
                    document.getElementById('email').value = savedEmail;
                }
                if (savedAddress && document.getElementById('deliveryAddress')) {
                    document.getElementById('deliveryAddress').value = savedAddress;
                }
                if (savedDate && document.getElementById('deliveryDate')) {
                    document.getElementById('deliveryDate').value = savedDate;
                }
                if (savedFrequency) {
                    const frequencyRadio = document.querySelector(`input[name="deliveryFrequency"][value="${savedFrequency}"]`);
                    if (frequencyRadio) frequencyRadio.checked = true;
                }
                if (savedInstructions && document.getElementById('deliveryInstructions')) {
                    document.getElementById('deliveryInstructions').value = savedInstructions;
                }
                if (savedFirstName && document.getElementById('firstName')) {
                    document.getElementById('firstName').value = savedFirstName;
                }
                if (savedLastName && document.getElementById('lastName')) {
                    document.getElementById('lastName').value = savedLastName;
                }
                if (savedMobile && document.getElementById('mobile')) {
                    document.getElementById('mobile').value = savedMobile;
                }
                
                return true;
            }
        } catch (error) {
            console.error('Error restoring checkout state:', error);
        }
    }
    return false;
}

// Helper function to clear checkout state
function clearCheckoutState() {
    localStorage.removeItem('checkout_state');
    localStorage.removeItem('checkout_email');
    localStorage.removeItem('checkout_address');
    localStorage.removeItem('checkout_deliveryDate');
    localStorage.removeItem('checkout_deliveryFrequency');
    localStorage.removeItem('checkout_deliveryInstructions');
    localStorage.removeItem('checkout_firstName');
    localStorage.removeItem('checkout_lastName');
    localStorage.removeItem('checkout_mobile');
}

// Helper function to show confirmation notifications (without SDK dependency)
function showNotification(title, message, type = 'success', duration = 3000) {
    console.log('🔔 showNotification called:', { title, message, type, duration });
    
    // Create notification container if it doesn't exist
    let notificationsContainer = document.getElementById('checkout-notifications-container');
    if (!notificationsContainer) {
        notificationsContainer = document.createElement('div');
        notificationsContainer.id = 'checkout-notifications-container';
        notificationsContainer.className = 'api-notifications-container';
        document.body.appendChild(notificationsContainer);
        console.log('✅ Created notifications container');
    }
    
    // Create notification element
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
    
    notificationEl.innerHTML = content;
    
    // Add to container
    notificationsContainer.appendChild(notificationEl);
    console.log('✅ Notification element added to DOM');
    
    // Force a reflow to ensure animation triggers
    notificationEl.offsetHeight;
    
    // Auto-remove after duration
    setTimeout(() => {
        notificationEl.classList.add('api-notification-hide');
        setTimeout(() => notificationEl.remove(), 300);
    }, duration);
}

// Form submission handler for signup
async function handleSignupSubmit(e) {
    if (e) {
        e.preventDefault();
    }
    
    const email = document.getElementById('email').value.trim();
    
    // Validate email format
    if (!email) {
        showNotification('Email Required', 'Please enter your email address', 'error', 4000);
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Invalid Email', 'Please enter a valid email address', 'error', 4000);
        return;
    }
    
    // Save email to state
    localStorage.setItem('checkout_email', email);
    
    // Save checkout state
    saveCheckoutState();
    
    // Initialize SDK and track Sign Up event
    try {
        // Step 1: Initialize SDK
        showNotification('Initializing SDK...', 'Setting up Iterable SDK', 'success', 2000);
        
        const sdk = await initializeIterable(email);
        
        if (sdk) {
            showNotification('SDK Initialized', 'Iterable SDK successfully initialized', 'success', 3000);
            
            // Step 2: Create/Update user profile with plan data
            setTimeout(async () => {
                try {
                    // Get plan data from URL params
                    const people = parseInt(planData.people) || 2;
                    const meals = parseInt(planData.meals) || 5;
                    const preference = planData.preference || 'all';
                    
                    // Calculate pricing (aligned with home page calculation)
                    const basePricePerMeal = 8.85;
                    const totalMeals = people * meals;
                    const pricePerWeek = totalMeals * basePricePerMeal;
                    const pricePerPlate = basePricePerMeal;
                    const originalPricePerWeek = totalMeals * basePricePerMeal * 2;
                    const weeklySavings = originalPricePerWeek - pricePerWeek;
                    
                    // Format numbers to 2 decimal places
                    const pricePerWeekFormatted = parseFloat(pricePerWeek.toFixed(2));
                    const pricePerPlateFormatted = parseFloat(pricePerPlate.toFixed(2));
                    const weeklySavingsFormatted = parseFloat(weeklySavings.toFixed(2));
                    
                    // Calculate deadline date (next Monday 6pm)
                    const deadlineDate = calculateDeadlineDate();
                    
                    // Get boxName from preference
                    const boxName = getBoxName(preference);
                    
                    // Update user profile with plan data (using nested object format as required by Iterable API)
                    // Note: email is already set via setEmail() during initialization, so we don't include it in dataFields
                    await updateUser(email, {
                        account: {
                            boxName: boxName,
                            peopleinPlan: people,
                            mealsPerWeek: meals,
                            nextOrderDeadlineDate: deadlineDate,
                            startDate: new Date().toISOString().split('T')[0] // Today's date YYYY-MM-DD
                        }
                    }, {
                        mergeNestedObjects: true,
                        createNewFields: true
                    });
                    
                    showNotification('User Profile Updated', 'User profile created/updated in Iterable', 'success', 3000);
                    
                    // Step 3: Track Sign Up event with required metadata
                    setTimeout(async () => {
                        try {
                            // Generate event ID for progressive updates
                            const signUpEventId = `signup-${email}-${Date.now()}`;
                            localStorage.setItem('iterable_signup_event_id', signUpEventId);
                            
                            await trackEvent('Sign Up', {
                                email: email,
                                id: signUpEventId, // Required for progressive updates
                                dataFields: {
                                    email: email,
                                    boxName: boxName,
                                    numberOfPeople: people,
                                    mealsPerWeek: meals,
                                    pricePerWeek: pricePerWeekFormatted,
                                    pricePerPlate: pricePerPlateFormatted,
                                    weeklySavings: weeklySavingsFormatted,
                                    order: {
                                        deadlineDate: deadlineDate
                                    }
                                }
                            });
                            
                            showNotification('Sign Up Event Tracked', 'Sign Up custom event sent to Iterable', 'success', 3000);
                        } catch (error) {
                            console.error('Error tracking Sign Up event:', error);
                            showNotification('Event Tracking Failed', 'Could not track Sign Up event: ' + error.message, 'error', 4000);
                        }
                    }, 500);
                } catch (error) {
                    console.error('Error updating user:', error);
                    showNotification('User Update Failed', 'Could not update user profile: ' + error.message, 'error', 4000);
                }
            }, 500);
        } else {
            showNotification('SDK Initialization Failed', 'Could not initialize Iterable SDK. Check API key configuration.', 'error', 4000);
        }
    } catch (error) {
        console.error('Error initializing SDK:', error);
        showNotification('SDK Error', 'Error initializing SDK: ' + error.message, 'error', 4000);
    }
    
    // Mark section 1 as completed
    sectionStates.section1.completed = true;
    
    // Collapse section 1 (flatten it)
    const section1 = document.getElementById('section1');
    if (section1) {
        section1.classList.add('collapsed');
        const section1Content = document.getElementById('section1Content');
        if (section1Content) {
            section1Content.style.display = 'none';
        }
    }
    
    // Show section 2
    sectionStates.section2.visible = true;
    
    // Update visibility
    updateSectionVisibility();
    
    // Scroll to section 2 header (accounting for sticky header)
    setTimeout(() => {
        const section2Header = document.getElementById('section2Header');
        if (section2Header) {
            const headerOffset = 120; // Account for sticky header + brand bar
            const elementPosition = section2Header.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }, 150);
}

// Form submission handler for delivery
async function handleDeliverySubmit(e) {
    e.preventDefault();
    
    const deliveryAddressSelect = document.getElementById('deliveryAddress');
    const deliveryAddressValue = deliveryAddressSelect ? deliveryAddressSelect.value : '';
    const deliveryAddressText = deliveryAddressSelect ? deliveryAddressSelect.options[deliveryAddressSelect.selectedIndex]?.text : '';
    const deliveryDateValue = document.getElementById('deliveryDate').value;
    const deliveryDateText = document.getElementById('deliveryDate').options[document.getElementById('deliveryDate').selectedIndex]?.text || '';
    const deliveryFrequency = document.querySelector('input[name="deliveryFrequency"]:checked')?.value;
    const deliveryInstructions = document.getElementById('deliveryInstructions').value;
    
    if (!deliveryAddressValue) {
        showNotification('Address Required', 'Please enter your delivery address', 'error', 4000);
        return;
    }
    
    if (!deliveryDateValue) {
        showNotification('Date Required', 'Please select a delivery date', 'error', 4000);
        return;
    }
    
    // Parse address and delivery date/time
    const address = parseAddress(deliveryAddressText);
    const deliveryDateTime = parseDeliveryDateTime(deliveryDateValue, deliveryDateText);
    
    // Save delivery state
    localStorage.setItem('checkout_address', deliveryAddressValue);
    localStorage.setItem('checkout_deliveryDate', deliveryDateValue);
    if (deliveryFrequency) localStorage.setItem('checkout_deliveryFrequency', deliveryFrequency);
    if (deliveryInstructions) localStorage.setItem('checkout_deliveryInstructions', deliveryInstructions);
    
    // Save parsed address components
    localStorage.setItem('checkout_address_street', address.street);
    localStorage.setItem('checkout_address_suburb', address.suburb);
    localStorage.setItem('checkout_address_region', address.region);
    localStorage.setItem('checkout_address_postcode', address.postcode);
    localStorage.setItem('checkout_deliveryDate_formatted', deliveryDateTime.deliveryDate);
    localStorage.setItem('checkout_deliveryTime', deliveryDateTime.deliveryTime);
    
    // Save checkout state
    saveCheckoutState();
    
    // Update user profile with address details and update Sign Up event progressively
    const email = localStorage.getItem('checkout_email');
    if (email && isIterableInitialized()) {
        try {
            // Prepare account object with delivery instructions if provided
            const accountData = {};
            if (deliveryInstructions && deliveryInstructions.trim()) {
                accountData.deliveryInstructions = deliveryInstructions.trim();
            }
            
            // Update user profile with address (using nested object format as required by Iterable API)
            const updateData = {
                address: {
                    street: address.street,
                    suburb: address.suburb,
                    region: address.region,
                    postcode: address.postcode
                }
            };
            
            // Add account.deliveryInstructions if provided
            if (Object.keys(accountData).length > 0) {
                updateData.account = accountData;
            }
            
            await updateUser(email, updateData, {
                mergeNestedObjects: true,
                createNewFields: true
            });
            
            showNotification('Address Saved', 'Delivery address updated in profile', 'success', 3000);
        } catch (error) {
            console.error('Error updating user profile:', error);
        }
    }
    
    // Mark section 2 as completed
    sectionStates.section2.completed = true;
    
    // Collapse section 2 (flatten it)
    const section2 = document.getElementById('section2');
    if (section2) {
        section2.classList.add('collapsed');
        const section2Content = document.getElementById('section2Content');
        if (section2Content) {
            section2Content.style.display = 'none';
        }
    }
    
    // Show section 3
    sectionStates.section3.visible = true;
    
    // Update visibility
    updateSectionVisibility();
    
    // Scroll to section 3 header (accounting for sticky header)
    setTimeout(() => {
        const section3Header = document.getElementById('section3Header');
        if (section3Header) {
            const headerOffset = 120; // Account for sticky header + brand bar
            const elementPosition = section3Header.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }, 150);
}

// Form submission handler for user info
async function handleUserInfoSubmit(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    
    // Validate required fields
    if (!firstName || !lastName || !mobile) {
        let missingFields = [];
        if (!firstName) missingFields.push('First Name');
        if (!lastName) missingFields.push('Last Name');
        if (!mobile) missingFields.push('Mobile');
        showNotification('Fields Required', `Please fill in: ${missingFields.join(', ')}`, 'error', 4000);
        return;
    }
    
    // Validate phone number format
    if (!validatePhoneNumber(mobile)) {
        showNotification('Invalid Phone Number', 'Please enter a valid phone number (e.g., 021 123 4567 or +64 21 123 4567)', 'error', 4000);
        return;
    }
    
    // Save user info state
    localStorage.setItem('checkout_firstName', firstName);
    localStorage.setItem('checkout_lastName', lastName);
    localStorage.setItem('checkout_mobile', mobile);
    
    // Get email and other data
    const email = localStorage.getItem('checkout_email');
    
    // Also save to iterable_user_* keys for subscription-success page
    if (email) {
        localStorage.setItem('iterable_user_email', email);
        localStorage.setItem('iterable_user_firstName', firstName);
        localStorage.setItem('iterable_user_lastName', lastName);
    }
    if (!email) {
        showNotification('Error', 'Email not found. Please start over.', 'error', 4000);
        return;
    }
    
    // Get plan data
    const people = parseInt(planData.people) || 2;
    const meals = parseInt(planData.meals) || 5;
    const preference = planData.preference || 'all';
    
    // Get address data from localStorage
    const addressStreet = localStorage.getItem('checkout_address_street') || '';
    const addressSuburb = localStorage.getItem('checkout_address_suburb') || '';
    const addressRegion = localStorage.getItem('checkout_address_region') || '';
    const addressPostcode = localStorage.getItem('checkout_address_postcode') || '';
    
    // Get delivery data
    const deliveryDate = localStorage.getItem('checkout_deliveryDate_formatted') || '';
    const deliveryTime = localStorage.getItem('checkout_deliveryTime') || '7am - 5pm';
    const deliveryFrequency = localStorage.getItem('checkout_deliveryFrequency') || 'weekly';
    const deliveryInstructions = localStorage.getItem('checkout_deliveryInstructions') || '';
    
    // Calculate pricing (aligned with home page calculation)
    const basePricePerMeal = 8.85;
    const totalMeals = people * meals;
    const pricePerWeek = totalMeals * basePricePerMeal;
    const originalPricePerWeek = totalMeals * basePricePerMeal * 2;
    const weeklySavings = originalPricePerWeek - pricePerWeek;
    
    // Format numbers to 2 decimal places
    const orderPrice = parseFloat(pricePerWeek.toFixed(2));
    const orderDiscount = parseFloat(weeklySavings.toFixed(2));
    const orderSavings = parseFloat(weeklySavings.toFixed(2));
    
    // Get other calculated values
    const deadlineDate = calculateDeadlineDate();
    const boxName = getBoxName(preference);
    
    // Format phone number to +64XXXXXXXXX format
    const formattedPhoneNumber = formatPhoneNumber(mobile);
    
    // Update user profile with firstName, lastName, phoneNumber
    if (isIterableInitialized()) {
        try {
            await updateUser(email, {
                firstName: firstName,
                lastName: lastName,
                phoneNumber: formattedPhoneNumber,
                address: {
                    street: addressStreet,
                    suburb: addressSuburb,
                    region: addressRegion,
                    postcode: addressPostcode
                }
            }, {
                mergeNestedObjects: true,
                createNewFields: true
            });
            
            showNotification('Profile Updated', 'User profile updated with personal information', 'success', 3000);
            
            // Track Subscription Started event
            setTimeout(async () => {
                try {
                    await trackEvent('Subscription Started', {
                        email: email,
                        dataFields: {
                            email: email,
                            firstName: firstName,
                            lastName: lastName,
                            phoneNumber: formattedPhoneNumber,
                            boxName: boxName,
                            numberOfPeople: people,
                            mealsPerWeek: meals,
                            address: {
                                street: addressStreet,
                                suburb: addressSuburb,
                                region: addressRegion,
                                postcode: addressPostcode
                            },
                            order: {
                                deliveryDate: deliveryDate,
                                deliveryTime: deliveryTime,
                                deliveryFrequency: deliveryFrequency,
                                deadlineDate: deadlineDate,
                                price: orderPrice,
                                discount: orderDiscount,
                                savings: orderSavings,
                                deliveryInstructions: deliveryInstructions
                            }
                        }
                    });
                    
                    showNotification('Subscription Started', 'Subscription Started event tracked successfully', 'success', 3000);
                } catch (error) {
                    console.error('Error tracking Subscription Started event:', error);
                    showNotification('Error', 'Failed to track Subscription Started event', 'error', 3000);
                }
            }, 500);
        } catch (error) {
            console.error('Error updating user profile:', error);
            showNotification('Error', 'Failed to update user profile', 'error', 3000);
        }
    }
    
    // Show success message before redirect
    showNotification('Subscription Complete!', 'Redirecting to confirmation page...', 'success', 2000);
    
    // Clear checkout state (checkout is complete)
    clearCheckoutState();
    
    // Mark section 3 as completed
    sectionStates.section3.completed = true;
    updateSectionVisibility();
    
    // Redirect to success page with plan data (after brief delay to show message)
    setTimeout(() => {
        const successUrl = new URL('subscription-success.html', window.location.origin);
        successUrl.searchParams.set('people', planData.people);
        successUrl.searchParams.set('meals', planData.meals);
        successUrl.searchParams.set('preference', planData.preference);
        window.location.href = successUrl.toString();
    }, 2000);
}

function handleDeliveryAddressChange() {
    const deliveryAddress = document.getElementById('deliveryAddress').value;
    const deliveryDateGroup = document.getElementById('deliveryDateGroup');
    const deliveryDate = document.getElementById('deliveryDate');
    
    if (deliveryAddress) {
        // Show delivery date selector
        if (deliveryDateGroup) {
            deliveryDateGroup.style.display = 'block';
        }
        
        // Reset delivery date
        if (deliveryDate) {
            deliveryDate.value = '';
        }
        
        // Hide recipes and other fields until date is selected
        const recipesSection = document.getElementById('recipesSection');
        const deliveryFrequencyGroup = document.getElementById('deliveryFrequencyGroup');
        const deliveryInstructionsGroup = document.getElementById('deliveryInstructionsGroup');
        const deliveryContinueBtn = document.getElementById('deliveryContinueBtn');
        
        if (recipesSection) recipesSection.style.display = 'none';
        if (deliveryFrequencyGroup) deliveryFrequencyGroup.style.display = 'none';
        if (deliveryInstructionsGroup) deliveryInstructionsGroup.style.display = 'none';
        if (deliveryContinueBtn) deliveryContinueBtn.style.display = 'none';
    } else {
        // Hide delivery date selector
        if (deliveryDateGroup) {
            deliveryDateGroup.style.display = 'none';
        }
    }
}

function handleDeliveryDateChange() {
    const deliveryDate = document.getElementById('deliveryDate').value;
    const recipesSection = document.getElementById('recipesSection');
    const deliveryFrequencyGroup = document.getElementById('deliveryFrequencyGroup');
    const deliveryInstructionsGroup = document.getElementById('deliveryInstructionsGroup');
    const deliveryContinueBtn = document.getElementById('deliveryContinueBtn');
    
    if (deliveryDate) {
        // Show recipes carousel
        if (recipesSection) {
            recipesSection.style.display = 'block';
            // Reinitialize carousel when section becomes visible
            setTimeout(() => {
                initializeRecipeCarousel();
            }, 100);
        }
        
        // Show delivery frequency
        if (deliveryFrequencyGroup) {
            deliveryFrequencyGroup.style.display = 'block';
        }
        
        // Show delivery instructions
        if (deliveryInstructionsGroup) {
            deliveryInstructionsGroup.style.display = 'block';
        }
        
        // Show continue button
        if (deliveryContinueBtn) {
            deliveryContinueBtn.style.display = 'block';
        }
    } else {
        // Hide all dependent fields
        if (recipesSection) recipesSection.style.display = 'none';
        if (deliveryFrequencyGroup) deliveryFrequencyGroup.style.display = 'none';
        if (deliveryInstructionsGroup) deliveryInstructionsGroup.style.display = 'none';
        if (deliveryContinueBtn) deliveryContinueBtn.style.display = 'none';
    }
}

function initializeRecipeCarousel() {
    const carouselTrack = document.getElementById('recipesCarouselTrack');
    const prevBtn = document.getElementById('recipeCarouselPrev');
    const nextBtn = document.getElementById('recipeCarouselNext');
    
    if (!carouselTrack || !prevBtn || !nextBtn) return;
    
    // Remove existing event listeners by cloning and replacing
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    
    let currentIndex = 0;
    const cards = carouselTrack.querySelectorAll('.recipe-card');
    const totalCards = cards.length;
    const cardsPerView = 3;
    
    function updateCarousel() {
        const maxIndex = Math.max(0, totalCards - cardsPerView);
        currentIndex = Math.max(0, Math.min(currentIndex, maxIndex));
        
        // Calculate translate based on card width + gap
        if (cards.length > 0) {
            const cardWidth = cards[0].offsetWidth;
            const gap = 16; // var(--spacing-md) = 16px typically
            const translateX = -(currentIndex * (cardWidth + gap));
            carouselTrack.style.transform = `translateX(${translateX}px)`;
        }
        
        // Update button visibility
        newPrevBtn.style.opacity = currentIndex > 0 ? '1' : '0.3';
        newPrevBtn.style.pointerEvents = currentIndex > 0 ? 'auto' : 'none';
        newNextBtn.style.opacity = currentIndex < maxIndex ? '1' : '0.3';
        newNextBtn.style.pointerEvents = currentIndex < maxIndex ? 'auto' : 'none';
    }
    
    newPrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });
    
    newNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const maxIndex = Math.max(0, totalCards - cardsPerView);
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateCarousel();
        }
    });
    
    // Initialize
    setTimeout(() => {
        updateCarousel();
    }, 50);
}

function handlePromoApply() {
    const promoCode = document.getElementById('promoCode').value.trim();
    const promoSuccess = document.getElementById('promoSuccess');
    
    if (!promoCode) {
        showNotification('Promo Code Required', 'Please enter a promo code', 'error', 3000);
        return;
    }
    
    // Simulate promo code application
    if (promoSuccess) {
        promoSuccess.style.display = 'block';
    }
    
    // Show notification
    showNotification('Promo Code Applied', 'Discount successfully applied!', 'success', 3000);
}

function loadPlanData() {
    // Get plan data from URL params
    const urlParams = new URLSearchParams(window.location.search);
    planData.people = urlParams.get('people') || '2';
    planData.meals = urlParams.get('meals') || '5';
    planData.preference = urlParams.get('preference') || 'all';
    
    // Update subscription summary
    updateSubscriptionSummary(planData.people, planData.meals, planData.preference);
}

function updateSubscriptionSummary(people, meals, preference) {
    // Calculate prices based on plan
    const basePrice = calculatePrice(people, meals);
    const originalPrice = basePrice * 2; // Show 50% discount
    const discount = basePrice;
    const total = basePrice;
    
    // Update subscription details
    const itemName = document.getElementById('subscriptionPlanName');
    if (itemName) {
        const preferenceText = getPreferenceText(preference);
        itemName.textContent = `${preferenceText} (${meals} Nights For ${people})`;
    }
    
    const itemPrice = document.getElementById('subscriptionPrice');
    if (itemPrice) {
        itemPrice.textContent = `$${originalPrice.toFixed(2)}`;
    }
    
    // Update totals
    const totalDiscount = document.getElementById('totalDiscount');
    if (totalDiscount) {
        totalDiscount.textContent = `- $${discount.toFixed(2)}`;
    }
    
    const totalAmount = document.getElementById('totalAmount');
    if (totalAmount) {
        totalAmount.textContent = `$${total.toFixed(2)}`;
    }
}

function calculatePrice(people, meals) {
    // Simple price calculation
    // Base price per meal per person
    const basePricePerMeal = 8.85;
    return parseFloat(people) * parseFloat(meals) * basePricePerMeal;
}

function getPreferenceText(preference) {
    const preferences = {
        'all': 'I Like Everything',
        'high-protein': 'High Protein',
        'quick-easy': 'Quick & Easy',
        'kid-friendly': 'Kid-Friendly',
        'low-carb': 'Low Carb & Healthier',
        'vegan': 'Vegan & Veggie',
        'gourmet': 'Gourmet',
        'gluten-free': 'Gluten Free',
        'diabetes': 'Diabetes Plan'
    };
    return preferences[preference] || 'My Choice';
}

// Helper function to get boxName from preference (only 4 allowed values)
function getBoxName(preference) {
    const boxNameMap = {
        'vegan': 'Vegan and Veggie',
        'gourmet': 'Gourmet',
        'gluten-free': 'Gluten Free',
        'diabetes': 'Ready Made'
    };
    // Default to 'Ready Made' if preference doesn't match
    return boxNameMap[preference] || 'Ready Made';
}

// Helper function to calculate deadline date (next Monday 6pm)
function calculateDeadlineDate() {
    const now = new Date();
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7; // Days until next Monday
    const deadlineDate = new Date(now);
    deadlineDate.setDate(now.getDate() + daysUntilMonday);
    deadlineDate.setHours(18, 0, 0, 0); // 6pm
    
    // Format as yyyy-MM-dd HH:mm:ss
    const year = deadlineDate.getFullYear();
    const month = String(deadlineDate.getMonth() + 1).padStart(2, '0');
    const day = String(deadlineDate.getDate()).padStart(2, '0');
    const hours = String(deadlineDate.getHours()).padStart(2, '0');
    const minutes = String(deadlineDate.getMinutes()).padStart(2, '0');
    const seconds = String(deadlineDate.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Helper function to parse delivery address into components
function parseAddress(addressText) {
    // Example: "2 Smith Street, Balclutha, Balclutha 9230"
    // Format: "Street, Suburb, Region Postcode"
    const parts = addressText.split(',').map(p => p.trim());
    
    if (parts.length >= 3) {
        const street = parts[0];
        const suburb = parts[1];
        const regionPostcode = parts[2];
        // Split region and postcode (e.g., "Balclutha 9230")
        const regionPostcodeMatch = regionPostcode.match(/^(.+?)\s+(\d+)$/);
        if (regionPostcodeMatch) {
            return {
                street: street,
                suburb: suburb,
                region: regionPostcodeMatch[1],
                postcode: regionPostcodeMatch[2]
            };
        }
    }
    
    // Fallback if parsing fails
    return {
        street: addressText,
        suburb: '',
        region: '',
        postcode: ''
    };
}

// Helper function to parse delivery date and time
function parseDeliveryDateTime(deliveryDateValue, deliveryDateText) {
    // Example value: "mon-2nd-feb", text: "Mon 2nd Feb 7am - 5pm"
    // Extract date part and time part
    
    // Parse date from text (e.g., "Mon 2nd Feb" -> "2026-02-02")
    const dateMatch = deliveryDateText.match(/(\w+)\s+(\d+)(?:st|nd|rd|th)?\s+(\w+)/i);
    if (dateMatch) {
        const dayName = dateMatch[1];
        const day = parseInt(dateMatch[2]);
        const monthName = dateMatch[3];
        
        // Map month names to numbers
        const monthMap = {
            'jan': 1, 'january': 1,
            'feb': 2, 'february': 2,
            'mar': 3, 'march': 3,
            'apr': 4, 'april': 4,
            'may': 5,
            'jun': 6, 'june': 6,
            'jul': 7, 'july': 7,
            'aug': 8, 'august': 8,
            'sep': 9, 'september': 9,
            'oct': 10, 'october': 10,
            'nov': 11, 'november': 11,
            'dec': 12, 'december': 12
        };
        
        const month = monthMap[monthName.toLowerCase()];
        const currentYear = new Date().getFullYear();
        
        if (month) {
            const deliveryDate = new Date(currentYear, month - 1, day);
            const formattedDate = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Extract time (e.g., "7am - 5pm" -> "7am - 5pm")
            const timeMatch = deliveryDateText.match(/(\d+(?:am|pm))\s*-\s*(\d+(?:am|pm))/i);
            const deliveryTime = timeMatch ? `${timeMatch[1]} - ${timeMatch[2]}` : '7am - 5pm';
            
            return {
                deliveryDate: formattedDate,
                deliveryTime: deliveryTime
            };
        }
    }
    
    // Fallback
    return {
        deliveryDate: new Date().toISOString().split('T')[0],
        deliveryTime: '7am - 5pm'
    };
}

function initializeCheckout() {
    // Set initial state
    updateSectionVisibility();
    
    // Form submissions - attach submit handlers
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }
    
    const deliveryForm = document.getElementById('deliveryForm');
    if (deliveryForm) {
        deliveryForm.addEventListener('submit', handleDeliverySubmit);
    }
    
    // User Info Form
    const userInfoForm = document.getElementById('userInfoForm');
    if (userInfoForm) {
        userInfoForm.addEventListener('submit', handleUserInfoSubmit);
    }
    
    // Promo code
    const applyPromoBtn = document.getElementById('applyPromo');
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', handlePromoApply);
    }
    
    // Delivery address change - enable date selector
    const deliveryAddress = document.getElementById('deliveryAddress');
    if (deliveryAddress) {
        deliveryAddress.addEventListener('change', handleDeliveryAddressChange);
    }
    
    // Delivery date change - show recipes
    const deliveryDate = document.getElementById('deliveryDate');
    if (deliveryDate) {
        deliveryDate.addEventListener('change', handleDeliveryDateChange);
    }
    
    // Recipe carousel
    initializeRecipeCarousel();
    
    // Load plan data from URL params
    loadPlanData();
}

function updateSectionVisibility() {
    // Section 1
    const section1 = document.getElementById('section1');
    const section1Icon = document.getElementById('section1Icon');
    const section1Header = document.getElementById('section1Header');
    if (section1) {
        section1.style.display = sectionStates.section1.visible ? 'block' : 'none';
        if (section1Icon && section1Header) {
            if (sectionStates.section1.completed) {
                section1Icon.textContent = '✓';
                section1Header.classList.add('completed');
                section1Header.classList.remove('inactive');
            } else {
                section1Icon.textContent = '✓';
                section1Header.classList.remove('completed');
                section1Header.classList.remove('inactive');
            }
        }
    }
    
    // Section 2
    const section2 = document.getElementById('section2');
    const section2Icon = document.getElementById('section2Icon');
    const section2Header = document.getElementById('section2Header');
    if (section2) {
        section2.style.display = sectionStates.section2.visible ? 'block' : 'none';
        if (section2Icon && section2Header) {
            if (sectionStates.section2.completed) {
                section2Icon.textContent = '✓';
                section2Header.classList.add('completed');
                section2Header.classList.remove('inactive');
            } else if (sectionStates.section2.visible) {
                section2Icon.textContent = '✓';
                section2Header.classList.remove('completed');
                section2Header.classList.remove('inactive');
            } else {
                section2Header.classList.add('inactive');
            }
        }
    }
    
    // Section 3
    const section3 = document.getElementById('section3');
    const section3Icon = document.getElementById('section3Icon');
    const section3Header = document.getElementById('section3Header');
    if (section3) {
        section3.style.display = sectionStates.section3.visible ? 'block' : 'none';
        if (section3Icon && section3Header) {
            if (sectionStates.section3.completed) {
                section3Icon.textContent = '✓';
                section3Header.classList.add('completed');
                section3Header.classList.remove('inactive');
            } else if (sectionStates.section3.visible) {
                section3Icon.textContent = '✓';
                section3Header.classList.remove('completed');
                section3Header.classList.remove('inactive');
            } else {
                section3Header.classList.add('inactive');
            }
        }
    }
    
    // Update progress indicator
    updateProgressIndicator();
}

function updateProgressIndicator() {
    const progressSteps = document.querySelectorAll('.progress-step');
    
    // Determine current step based on section states
    let currentStep = 1;
    if (sectionStates.section1.completed && sectionStates.section2.visible) {
        currentStep = 2;
    }
    if (sectionStates.section2.completed && sectionStates.section3.visible) {
        currentStep = 3;
    }
    
    progressSteps.forEach((step, index) => {
        if (index + 1 <= currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeCheckout();
    
    // Restore checkout state if available
    if (restoreCheckoutState()) {
        updateSectionVisibility();
    }
});

// Also try to initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
    initializeCheckout();
}
