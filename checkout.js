// Checkout Section Management
let sectionStates = {
    section1: { completed: false, visible: true },
    section2: { completed: false, visible: false },
    section3: { completed: false, visible: false }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeCheckout();
});

function initializeCheckout() {
    // Set initial state
    updateSectionVisibility();
    
    // Form submissions
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

function handleSignupSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    
    if (!email) {
        alert('Please enter your email address');
        return;
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
    
    // Track event to Iterable (progressive profiling checkpoint)
    if (window.iterable) {
        window.iterable.trackEvent('Checkout Step 1 Completed', {
            email: email
        });
        
        // Update user profile with email
        window.iterable.updateUser({
            email: email
        });
    }
}

function handleDeliverySubmit(e) {
    e.preventDefault();
    
    const deliveryAddress = document.getElementById('deliveryAddress').value;
    const deliveryDate = document.getElementById('deliveryDate').value;
    const deliveryFrequency = document.querySelector('input[name="deliveryFrequency"]:checked')?.value;
    const deliveryInstructions = document.getElementById('deliveryInstructions').value;
    
    if (!deliveryAddress) {
        alert('Please enter your delivery address');
        return;
    }
    
    if (!deliveryDate) {
        alert('Please select a delivery date');
        return;
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
    
    // Track event to Iterable (progressive profiling checkpoint)
    if (window.iterable) {
        window.iterable.trackEvent('Checkout Step 2 Completed', {
            deliveryAddress: deliveryAddress,
            deliveryDate: deliveryDate,
            deliveryFrequency: deliveryFrequency,
            deliveryInstructions: deliveryInstructions
        });
        
        // Update user profile with delivery details
        window.iterable.updateUser({
            dataFields: {
                deliveryAddress: deliveryAddress,
                deliveryDate: deliveryDate,
                deliveryFrequency: deliveryFrequency,
                deliveryInstructions: deliveryInstructions
            }
        });
    }
}

function handleUserInfoSubmit(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const mobile = document.getElementById('mobile').value;
    const smsOptIn = document.getElementById('smsOptIn').checked;
    
    if (!firstName || !lastName || !mobile) {
        let missingFields = [];
        if (!firstName) missingFields.push('First Name');
        if (!lastName) missingFields.push('Last Name');
        if (!mobile) missingFields.push('Mobile');
        alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        return;
    }
    
    // Mark section 3 as completed
    sectionStates.section3.completed = true;
    updateSectionVisibility();
    
    // Track event to Iterable (progressive profiling checkpoint)
    if (window.iterable) {
        window.iterable.trackEvent('Checkout Step 3 Completed', {
            firstName: firstName,
            lastName: lastName,
            mobile: mobile,
            smsOptIn: smsOptIn
        });
        
        // Update user profile with user info
        window.iterable.updateUser({
            dataFields: {
                firstName: firstName,
                lastName: lastName,
                phoneNumber: mobile,
                smsOptIn: smsOptIn
            }
        });
    }
    
    // Show success message and redirect
    alert('Checkout completed successfully! Thank you for choosing My Food Bag.');
    // In a real implementation, this would redirect to a success page or dashboard
    // window.location.href = 'success.html';
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
    const promoCode = document.getElementById('promoCode').value;
    const promoSuccess = document.getElementById('promoSuccess');
    
    if (!promoCode) {
        alert('Please enter a promo code');
        return;
    }
    
    // Simulate promo code application
    if (promoSuccess) {
        promoSuccess.style.display = 'block';
    }
    
    // Track event to Iterable
    if (window.iterable) {
        window.iterable.trackEvent('Promo Code Applied', {
            promoCode: promoCode
        });
    }
}

function loadPlanData() {
    // Get plan data from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const people = urlParams.get('people') || '2';
    const meals = urlParams.get('meals') || '5';
    const preference = urlParams.get('preference') || 'all';
    
    // Update subscription summary
    updateSubscriptionSummary(people, meals, preference);
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
