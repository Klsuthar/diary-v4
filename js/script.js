document.addEventListener('DOMContentLoaded', () => {
    // --- Splash Screen Logic ---
    const splashScreen = document.getElementById('splashScreen');
    
    function hideSplashScreen() {
        if (splashScreen) {
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 300);
        }
    }
    
    // Show splash screen based on settings
    if (splashScreen) {
        const settings = JSON.parse(localStorage.getItem('diarySettings') || '{}');
        const splashDuration = settings.splashDuration !== undefined ? settings.splashDuration : 1;
        
        if (splashDuration === 0) {
            splashScreen.style.display = 'none';
        } else {
            setTimeout(hideSplashScreen, splashDuration * 1000);
        }
        
        splashScreen.addEventListener('click', () => {
            if (settings.splashDuration > 0) hideSplashScreen();
        });
    }

    // --- DOM Element References ---
    const diaryForm = document.getElementById('diaryForm');
    const jsonFileInput = document.getElementById('jsonFile');
    const saveFormButton = document.getElementById('saveFormButton');
    const toastContainer = document.getElementById('toast-container');
    const downloadButton = document.getElementById('downloadButton');

    const dateInput = document.getElementById('date');
    const dateIncrementButton = document.getElementById('dateIncrement');
    const dateDecrementButton = document.getElementById('dateDecrement');
    const currentDateDisplay = document.getElementById('currentDateDisplay');

    const bottomNavButtons = document.querySelectorAll('.bottom-nav-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const tabViewPort = document.getElementById('tabViewPort');
    const tabPanelsSlider = document.getElementById('tabPanelsSlider');

    const energyLevelSlider = document.getElementById('energyLevel');
    const energyLevelValueDisplay = document.getElementById('energyLevelValue');
    const stressLevelSlider = document.getElementById('stressLevel');
    const stressLevelValueDisplay = document.getElementById('stressLevelValue');
    const sleepQualitySlider = document.getElementById('sleepQuality');
    const sleepQualityValueDisplay = document.getElementById('sleepQualityValue');
    const uvIndexSlider = document.getElementById('uvIndex');
    const uvIndexValueDisplay = document.getElementById('uvIndexValue');

    // Mood sliders
    const morningMoodSlider = document.getElementById('morningMoodLevel');
    const morningMoodValueDisplay = document.getElementById('morningMoodValue');
    const afternoonMoodSlider = document.getElementById('afternoonMoodLevel');
    const afternoonMoodValueDisplay = document.getElementById('afternoonMoodValue');
    const eveningMoodSlider = document.getElementById('eveningMoodLevel');
    const eveningMoodValueDisplay = document.getElementById('eveningMoodValue');
    const nightMoodSlider = document.getElementById('nightMoodLevel');
    const nightMoodValueDisplay = document.getElementById('nightMoodValue');

    // --- Scroll Selector Elements ---
    const temperatureMinSelector = document.getElementById('temperatureMinSelector');
    const temperatureMaxSelector = document.getElementById('temperatureMaxSelector');
    const airQualityIndexSelector = document.getElementById('airQualityIndexSelector');
    const humidityPercentSelector = document.getElementById('humidityPercentSelector');
    const temperatureCInput = document.getElementById('temperatureC');
    const airQualityIndexInput = document.getElementById('airQualityIndex');
    const humidityPercentInput = document.getElementById('humidityPercent');


    const dailyActivitySummaryTextarea = document.getElementById('dailyActivitySummary');
    const summaryCountsDisplay = document.getElementById('summaryCounts');
    const overallDayExperienceTextarea = document.getElementById('overallDayExperience');
    const overallCountsDisplay = document.getElementById('overallCounts');
    const energyReasonTextarea = document.getElementById('energyReason');
    const energyReasonCountsDisplay = document.getElementById('energyReasonCounts');
    const stressReasonTextarea = document.getElementById('stressReason');
    const stressReasonCountsDisplay = document.getElementById('stressReasonCounts');

    const historyListContainer = document.getElementById('historyListContainer');
    const historyTabPanel = document.getElementById('tab-history');

    const topBar = document.querySelector('.top-bar');
    const multiSelectCountSpan = document.getElementById('multiSelectCount');
    const exportSelectedButton = document.getElementById('exportSelectedButton');
    const deleteSelectedButton = document.getElementById('deleteSelectedButton');
    const cancelMultiSelectButton = document.getElementById('cancelMultiSelectButton');

    // Menu Elements
    const menuButton = document.getElementById('menuButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const shareEntryButton = document.getElementById('shareEntryButton');
    const menuImportButton = document.getElementById('menuImportButton');
    const menuClearFormButton = document.getElementById('menuClearFormButton');
    const createBackupButton = document.getElementById('createBackupButton');
    const importBackupButton = document.getElementById('importBackupButton');
    const backupFileInput = document.getElementById('backupFile');
    const hardRefreshButton = document.getElementById('hardRefreshButton');
    const settingsButton = document.getElementById('settingsButton');
    const importPersonalCareBtn = document.getElementById('importPersonalCareBtn');
    const importEnvironmentBtn = document.getElementById('importEnvironmentBtn');


    // --- Constants and State Variables ---
    const REFERENCE_START_DATE = new Date(2003, 6, 4); // July 4, 2003
    const LOCAL_STORAGE_KEY = 'myPersonalDiaryFormData';
    const MAX_SUGGESTIONS_PER_FIELD = 7;

    let currentTabIndex = 0;
    let isKeyboardOpen = false;
    let viewportHeightBeforeKeyboard = window.innerHeight;
    const MIN_KEYBOARD_HEIGHT_PX = 150;

    let isMultiSelectModeActive = false;
    let selectedEntriesForMultiAction = [];
    let longPressTimer;
    const LONG_PRESS_DURATION = 600;
    let itemTouchStartX, itemTouchStartY;
    let isDropdownMenuOpen = false;


    const suggestionConfigs = [
        { key: 'myPersonalDiaryPersonalCareSuggestions', fieldIds: ['faceProductName', 'faceProductBrand', 'hairProductName', 'hairProductBrand', 'hairOil', 'skincareRoutine'] },
        { key: 'myPersonalDiaryDietSuggestions', fieldIds: ['breakfast', 'lunch', 'dinner', 'additionalItems'] },
        { key: 'myPersonalDiaryAppSuggestions', fieldIds: ['app1Name', 'app2Name', 'app3Name', 'app4Name', 'app5Name'] }
    ];

    // --- Utility Functions ---

    function isPotentiallyFocusableForKeyboard(element) {
        if (!element) return false;
        const tagName = element.tagName;
        const type = element.type;
        if (tagName === 'TEXTAREA') return true;
        if (tagName === 'INPUT' && !['checkbox', 'radio', 'range', 'button', 'submit', 'reset', 'file', 'date', 'color'].includes(type)) {
            return true;
        }
        if (tagName === 'SELECT') return true;
        return false;
    }

    function updateKeyboardStatus() {
        const currentWindowHeight = window.innerHeight;
        const activeElement = document.activeElement;
        const isTextInputActive = isPotentiallyFocusableForKeyboard(activeElement);

        if (isTextInputActive) {
            if (viewportHeightBeforeKeyboard - currentWindowHeight > MIN_KEYBOARD_HEIGHT_PX) {
                isKeyboardOpen = true;
            }
            else if (currentWindowHeight > (viewportHeightBeforeKeyboard - MIN_KEYBOARD_HEIGHT_PX + (MIN_KEYBOARD_HEIGHT_PX / 3))) {
                isKeyboardOpen = false;
                viewportHeightBeforeKeyboard = currentWindowHeight;
            }
        } else {
            isKeyboardOpen = false;
            viewportHeightBeforeKeyboard = currentWindowHeight;
        }
    }

    function setButtonLoadingState(button, isLoading, originalIconHTML = null) {
        if (!button) return;
        const iconElement = button.querySelector('i');
        if (isLoading) {
            button.disabled = true;
            if (iconElement) {
                if (!button.dataset.originalIcon && originalIconHTML) {
                    button.dataset.originalIcon = originalIconHTML;
                } else if (!button.dataset.originalIcon && iconElement.outerHTML) {
                    button.dataset.originalIcon = iconElement.outerHTML;
                }
                iconElement.className = 'fas fa-spinner fa-spin';
            }
        } else {
            button.disabled = false;
            if (iconElement && button.dataset.originalIcon) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = button.dataset.originalIcon;
                iconElement.className = tempDiv.firstChild.className;
                delete button.dataset.originalIcon;
            } else if (iconElement && originalIconHTML) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = originalIconHTML;
                if (tempDiv.firstChild) iconElement.className = tempDiv.firstChild.className;
            }
        }
    }

    function showToast(message, type = 'info') {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        let iconClass = 'fas fa-info-circle';
        if (type === 'success') iconClass = 'fas fa-check-circle';
        else if (type === 'error') iconClass = 'fas fa-times-circle';
        toast.innerHTML = `<i class="${iconClass}"></i> <p>${message}</p>`;

        if (toastContainer.firstChild) {
            toastContainer.insertBefore(toast, toastContainer.firstChild);
        } else {
            toastContainer.appendChild(toast);
        }

        const autoRemoveTimer = setTimeout(() => {
            toast.remove();
        }, 3000);

        let touchStartX = 0;
        let deltaX = 0;
        let isSwiping = false;
        const swipeThreshold = 80;

        const handleTouchStart = (e) => {
            touchStartX = e.touches[0].clientX;
            toast.style.transition = 'none';
            isSwiping = true;
        };

        const handleTouchMove = (e) => {
            if (!isSwiping) return;
            deltaX = e.touches[0].clientX - touchStartX;
            toast.style.transform = `translateY(0) translateX(${deltaX}px)`;
        };

        const handleTouchEnd = () => {
            if (!isSwiping) return;
            isSwiping = false;
            toast.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';

            if (Math.abs(deltaX) > swipeThreshold) {
                clearTimeout(autoRemoveTimer);
                const exitDirection = deltaX > 0 ? '120%' : '-120%';
                toast.classList.add('exiting');
                toast.style.transform = `translateX(${exitDirection})`;

                toast.addEventListener('transitionend', () => {
                    toast.remove();
                }, { once: true });

            } else {
                toast.style.transform = 'translateY(0) translateX(0)';
            }
        };

        toast.addEventListener('touchstart', handleTouchStart, { passive: true });
        toast.addEventListener('touchmove', handleTouchMove, { passive: true });
        toast.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function updateCurrentDateDisplay(dateStr) {
        if (currentDateDisplay) {
            if (dateStr) {
                try {
                    const dateObj = new Date(dateStr + 'T00:00:00');
                    if (isNaN(dateObj.getTime())) {
                        currentDateDisplay.innerHTML = `Invalid Date <i class="fas fa-calendar-alt date-display-icon"></i>`;
                    } else {
                        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const weekday = weekdays[dateObj.getDay()];
                        currentDateDisplay.innerHTML = `${weekday}, ${dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} <i class="fas fa-calendar-alt date-display-icon"></i>`;
                    }
                } catch (e) {
                    currentDateDisplay.innerHTML = `Select Date <i class="fas fa-calendar-alt date-display-icon"></i>`;
                }
            } else {
                currentDateDisplay.innerHTML = `Select Date <i class="fas fa-calendar-alt date-display-icon"></i>`;
            }
        }
    }

    function changeDate(days) {
        let currentDateValue;
        if (dateInput.value) {
            const [year, month, day] = dateInput.value.split('-').map(Number);
            currentDateValue = new Date(year, month - 1, day);
        } else {
            currentDateValue = new Date();
        }

        if (!isNaN(currentDateValue.getTime())) {
            currentDateValue.setDate(currentDateValue.getDate() + days);
            const newDateStr = formatDate(currentDateValue);
            dateInput.value = newDateStr;
            updateCurrentDateDisplay(newDateStr);
            loadFormForDate(newDateStr);
        } else {
            const today = new Date();
            const todayStr = formatDate(today);
            dateInput.value = todayStr;
            updateCurrentDateDisplay(todayStr);
            loadFormForDate(todayStr);
        }
    }

    function updateSliderDisplay(slider, displayElement) {
        if (slider && displayElement) displayElement.textContent = slider.value;
    }

    function updateSummaryCounts() {
        if (dailyActivitySummaryTextarea && summaryCountsDisplay) {
            const text = dailyActivitySummaryTextarea.value;
            const charCount = text.length;
            const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
            summaryCountsDisplay.textContent = `Words: ${wordCount}, Chars: ${charCount}`;
        }
    }

    function updateOverallCounts() {
        if (overallDayExperienceTextarea && overallCountsDisplay) {
            const text = overallDayExperienceTextarea.value;
            const charCount = text.length;
            const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
            overallCountsDisplay.textContent = `Words: ${wordCount}, Chars: ${charCount}`;
        }
    }

    function updateEnergyReasonCounts() {
        if (energyReasonTextarea && energyReasonCountsDisplay) {
            const text = energyReasonTextarea.value;
            const charCount = text.length;
            const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
            energyReasonCountsDisplay.textContent = `Words: ${wordCount}, Chars: ${charCount}`;
        }
    }

    function updateStressReasonCounts() {
        if (stressReasonTextarea && stressReasonCountsDisplay) {
            const text = stressReasonTextarea.value;
            const charCount = text.length;
            const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
            stressReasonCountsDisplay.textContent = `Words: ${wordCount}, Chars: ${charCount}`;
        }
    }

    function getValue(elementId, type = 'text') {
        const element = document.getElementById(elementId);
        if (!element) return type === 'number' || type === 'range' ? null : '';

        const value = element.value.trim();
        if (type === 'range') return element.value === '' ? null : parseFloat(element.value);
        if (type === 'number') return value === '' ? null : parseFloat(value);
        return value;
    }

    function setValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = (value === null || value === undefined) ? '' : value;
            if (element.type === 'range') {
                if (element.id === 'energyLevel') updateSliderDisplay(element, energyLevelValueDisplay);
                if (element.id === 'stressLevel') updateSliderDisplay(element, stressLevelValueDisplay);
                if (element.id === 'sleepQuality') updateSliderDisplay(element, sleepQualityValueDisplay);
                if (element.id === 'uvIndex') updateSliderDisplay(element, uvIndexValueDisplay);
                if (element.id === 'morningMoodLevel') updateSliderDisplay(element, morningMoodValueDisplay);
                if (element.id === 'afternoonMoodLevel') updateSliderDisplay(element, afternoonMoodValueDisplay);
                if (element.id === 'eveningMoodLevel') updateSliderDisplay(element, eveningMoodValueDisplay);
                if (element.id === 'nightMoodLevel') updateSliderDisplay(element, nightMoodValueDisplay);
            }
            if (elementId === 'dailyActivitySummary') updateSummaryCounts();
            if (elementId === 'overallDayExperience') updateOverallCounts();
            if (elementId === 'energyReason') updateEnergyReasonCounts();
            if (elementId === 'stressReason') updateStressReasonCounts();
        }
    }

    function setMoodFeeling(timeOfDay, feeling) {
        if (!feeling) return;
        const moodData = {
            positive_high_energy: ['happy', 'calm', 'peaceful', 'relaxed', 'content', 'motivated', 'energetic', 'confident', 'hopeful', 'satisfied'],
            neutral_balanced: ['neutral', 'normal', 'stable', 'okay', 'composed', 'indifferent'],
            low_energy_tired: ['tired', 'sleepy', 'exhausted', 'lazy', 'drained', 'dull'],
            negative_heavy: ['stressed', 'anxious', 'irritated', 'frustrated', 'overwhelmed', 'sad', 'low', 'lonely', 'bored'],
            cognitive_mental_states: ['focused', 'distracted', 'confused', 'overthinking', 'mentally_heavy', 'mentally_clear']
        };
        
        const normalizedFeeling = feeling.toLowerCase().trim().replace(/\s+/g, '_');
        let foundCategory = '';
        
        for (const [category, moods] of Object.entries(moodData)) {
            if (moods.includes(normalizedFeeling)) {
                foundCategory = category;
                break;
            }
        }
        
        if (foundCategory) {
            const categorySelect = document.getElementById(`${timeOfDay}MoodCategory`);
            const feelingSelect = document.getElementById(`${timeOfDay}MoodFeeling`);
            if (categorySelect && feelingSelect) {
                categorySelect.value = foundCategory;
                const changeEvent = new Event('change', { bubbles: true });
                categorySelect.dispatchEvent(changeEvent);
                setTimeout(() => {
                    feelingSelect.disabled = false;
                    feelingSelect.value = normalizedFeeling;
                    if (!feelingSelect.value) {
                        console.warn(`Mood feeling '${normalizedFeeling}' not found in dropdown for ${timeOfDay}`);
                    }
                }, 150);
            }
        }
    }

    function setMoodSliderValue(inputId, value) {
        if (value === null || value === undefined) return;
        const slider = document.getElementById(inputId);
        if (!slider) return;
        
        slider.value = value;
        
        if (inputId === 'morningMoodLevel' && morningMoodValueDisplay) morningMoodValueDisplay.textContent = value;
        if (inputId === 'afternoonMoodLevel' && afternoonMoodValueDisplay) afternoonMoodValueDisplay.textContent = value;
        if (inputId === 'eveningMoodLevel' && eveningMoodValueDisplay) eveningMoodValueDisplay.textContent = value;
        if (inputId === 'nightMoodLevel' && nightMoodValueDisplay) nightMoodValueDisplay.textContent = value;
    }

    function calculateDaysSince(startDate, endDateStr) {
        if (!endDateStr) return null;
        const [year, month, day] = endDateStr.split('-').map(Number);
        const endDate = new Date(Date.UTC(year, month - 1, day));
        if (isNaN(endDate.getTime())) return null;

        const start = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
        const diffTime = endDate.getTime() - start.getTime();
        if (diffTime < 0) return null;

        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    }

    function downloadJSON(content, fileName) {
        const a = document.createElement('a');
        const file = new Blob([content], { type: 'application/json' });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    // --- Suggestion Logic ---
    function loadAllSuggestions() {
        suggestionConfigs.forEach(config => {
            const suggestionsData = JSON.parse(localStorage.getItem(config.key)) || {};
            config.fieldIds.forEach(fieldId => {
                const datalistElement = document.getElementById(`${fieldId}Suggestions`);
                if (datalistElement && suggestionsData[fieldId] && Array.isArray(suggestionsData[fieldId])) {
                    datalistElement.innerHTML = '';
                    suggestionsData[fieldId].forEach(suggestionText => {
                        const option = document.createElement('option');
                        option.value = suggestionText;
                        datalistElement.appendChild(option);
                    });
                }
            });
        });
        loadAppRecommendations();
    }

    function loadAppRecommendations() {
        const allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        const dates = Object.keys(allSavedData).sort((a, b) => new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00'));
        const appFrequency = {};
        
        dates.forEach(dateStr => {
            const entry = allSavedData[dateStr];
            if (entry) {
                for (let i = 1; i <= 5; i++) {
                    const appName = entry[`app${i}Name`];
                    if (appName && appName.trim()) {
                        const name = appName.trim();
                        appFrequency[name] = (appFrequency[name] || 0) + 1;
                    }
                }
            }
        });
        
        const sortedApps = Object.entries(appFrequency)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
        
        const datalistElement = document.getElementById('appNameSuggestions');
        if (datalistElement) {
            datalistElement.innerHTML = '';
            sortedApps.forEach(appName => {
                const option = document.createElement('option');
                option.value = appName;
                datalistElement.appendChild(option);
            });
        }
    }

    function saveAllSuggestions() {
        suggestionConfigs.forEach(config => {
            let suggestionsData = JSON.parse(localStorage.getItem(config.key)) || {};
            config.fieldIds.forEach(fieldId => {
                const inputElement = document.getElementById(fieldId);
                if (inputElement && inputElement.value.trim() !== '') {
                    const newValue = inputElement.value.trim();
                    suggestionsData[fieldId] = suggestionsData[fieldId] || [];
                    suggestionsData[fieldId] = suggestionsData[fieldId].filter(s => s.toLowerCase() !== newValue.toLowerCase());
                    suggestionsData[fieldId].unshift(newValue);
                    if (suggestionsData[fieldId].length > MAX_SUGGESTIONS_PER_FIELD) {
                        suggestionsData[fieldId] = suggestionsData[fieldId].slice(0, MAX_SUGGESTIONS_PER_FIELD);
                    }
                }
            });
            localStorage.setItem(config.key, JSON.stringify(suggestionsData));
        });
    }

    // --- Empty Field Indicator Logic ---
    function hasEmptyFieldsInEntry(entryData) {
        if (!entryData) return false;
        
        const fieldsToCheck = [
            'weatherCondition', 'environmentExperience', 'stepsCount', 'stepsDistanceKm',
            'kilocalorie', 'waterIntakeLiters', 'sleepQualityDescription', 'energyStressReason',
            'mentalState', 'mentalStateReason', 'faceProductName', 'faceProductBrand',
            'hairProductName', 'hairProductBrand', 'hairOil', 'breakfast', 'lunch', 'dinner',
            'additionalItems', 'tasksTodayEnglish', 'travelDestination', 'phoneScreenOnHr',
            'app1Name', 'app2Name', 'app3Name', 'app4Name', 'app5Name',
            'keyEvents', 'dailyActivitySummary', 'overallDayExperience'
        ];
        
        for (const field of fieldsToCheck) {
            const value = entryData[field];
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                return true;
            }
        }
        return false;
    }
    
    function checkTabForEmptyValues(tabPanelElement) {
        if (!tabPanelElement || tabPanelElement.id === 'tab-history') {
            return false;
        }
        const inputsToCheck = tabPanelElement.querySelectorAll(
            'input[type="text"], input[type="number"], input[type="email"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"], textarea, select'
        );
        for (const input of inputsToCheck) {
            if (input.closest('.slider-container')) continue;
            if (input.id === 'date') continue;
            if (input.type === 'select-one' || input.type === 'select-multiple') {
                if (input.value === '') return true;
            } else {
                if (input.value.trim() === '') return true;
            }
        }
        return false;
    }

    function updateTabIconWithIndicator(tabId, hasEmptyValues) {
        const navButton = document.querySelector(`.bottom-nav-button[data-tab-target="${tabId}"]`);
        if (navButton) {
            if (hasEmptyValues) {
                navButton.classList.add('has-empty-indicator');
            }
            else {
                navButton.classList.remove('has-empty-indicator');
            }
        }
    }

    function checkAndUpdateAllTabIcons() {
        if (typeof tabPanels !== 'undefined') {
            tabPanels.forEach(panel => {
                if (panel.id && panel.id !== 'tab-history' && panel.querySelector('input, textarea, select')) {
                    const hasEmpty = checkTabForEmptyValues(panel);
                    updateTabIconWithIndicator(panel.id, hasEmpty);
                }
            });
        }
    }


    // --- Form Management ---
    function loadFormForDate(dateStr) {
        if (!dateStr) return;

        diaryForm.reset();

        const allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        const formDataForDate = allSavedData[dateStr];

        setValue('date', dateStr);
        updateCurrentDateDisplay(dateStr);

        if (formDataForDate) {
            try {
                Object.keys(formDataForDate).forEach(elementId => {
                    const element = document.getElementById(elementId);
                    if (element && elementId !== 'date') {
                        setValue(elementId, formDataForDate[elementId]);
                    }
                });
                setValue('otherNoteStatus', formDataForDate.otherNoteStatus || 'No');
                setSelectorValuesFromData(formDataForDate);
                
                // Restore mood dropdowns
                requestAnimationFrame(() => {
                    ['morning', 'afternoon', 'evening', 'night'].forEach(timeOfDay => {
                        const savedCategory = formDataForDate[`${timeOfDay}MoodCategory`];
                        const savedFeeling = formDataForDate[`${timeOfDay}MoodFeeling`];
                        
                        if (savedCategory || savedFeeling) {
                            const categorySelect = document.getElementById(`${timeOfDay}MoodCategory`);
                            const feelingSelect = document.getElementById(`${timeOfDay}MoodFeeling`);
                            
                            if (savedCategory && categorySelect) {
                                categorySelect.value = savedCategory;
                                categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                            
                            if (savedFeeling && feelingSelect) {
                                requestAnimationFrame(() => {
                                    feelingSelect.disabled = false;
                                    feelingSelect.value = savedFeeling;
                                });
                            }
                        }
                    });
                });

                if (!document.hidden && !isMultiSelectModeActive) {
                    showToast('Previously saved data for this date loaded.', 'info');
                }
            } catch (e) {
                console.error("Error loading from localStorage for date:", dateStr, e);
                showToast('Could not load saved data. It might be corrupted.', 'error');
            }
        } else {
            ['weightKg', 'heightCm', 'chest', 'belly', 'meditationStatus',
                'meditationDurationMin', 'sleepHours', 'medicationsTaken', 'skincareRoutine', 'physicalSymptoms'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        if (id === 'weightKg') el.value = "72";
                        else if (id === 'heightCm') el.value = "178";
                        else if (id === 'chest') el.value = "90";
                        else if (id === 'belly') el.value = "89";
                        else if (id === 'meditationStatus') el.value = "Na";
                        else if (id === 'meditationDurationMin') el.value = "0";
                        else if (id === 'sleepHours') el.value = "8:00";
                        else if (id === 'medicationsTaken') el.value = "Na";
                        else if (id === 'skincareRoutine') el.value = "Na";
                        else if (id === 'physicalSymptoms') el.value = "No";
                        else el.value = '';
                    }
                });
            setValue('otherNoteStatus', 'No');
            if (energyLevelSlider) energyLevelSlider.value = 5;
            if (stressLevelSlider) stressLevelSlider.value = 5;
            if (sleepQualitySlider) sleepQualitySlider.value = 5;
            if (uvIndexSlider) uvIndexSlider.value = 9;
            setSelectorValuesFromData(null);
        }

        if (energyLevelSlider) updateSliderDisplay(energyLevelSlider, energyLevelValueDisplay);
        if (stressLevelSlider) updateSliderDisplay(stressLevelSlider, stressLevelValueDisplay);
        if (sleepQualitySlider) updateSliderDisplay(sleepQualitySlider, sleepQualityValueDisplay);
        if (uvIndexSlider) updateSliderDisplay(uvIndexSlider, uvIndexValueDisplay);
        if (morningMoodSlider) updateSliderDisplay(morningMoodSlider, morningMoodValueDisplay);
        if (afternoonMoodSlider) updateSliderDisplay(afternoonMoodSlider, afternoonMoodValueDisplay);
        if (eveningMoodSlider) updateSliderDisplay(eveningMoodSlider, eveningMoodValueDisplay);
        if (nightMoodSlider) updateSliderDisplay(nightMoodSlider, nightMoodValueDisplay);
        updateSummaryCounts();
        updateOverallCounts();
        updateEnergyReasonCounts();
        updateStressReasonCounts();
        checkAndUpdateAllTabIcons();
        loadAppRecommendations();
    }

    function clearDiaryForm() {
        if (confirm("Are you sure you want to clear the form? This will remove unsaved changes and locally saved data for the current date (suggestions will remain).")) {
            const currentFormDate = dateInput.value;
            if (currentFormDate) {
                const allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
                if (allSavedData[currentFormDate]) {
                    delete allSavedData[currentFormDate];
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allSavedData));
                    if (tabPanels[currentTabIndex]?.id === 'tab-history') {
                        renderHistoryList();
                    }
                }
            }
            loadFormForDate(currentFormDate);
            showToast("Form cleared for current date.", "info");
            slideToPanel(0);
        }
    }

    function initializeForm() {
        const today = new Date();
        const todayStr = formatDate(today);
        dateInput.value = todayStr;
        loadAllSuggestions();
        loadFormForDate(todayStr);
    }

    function populateFormWithJson(jsonData, skipLoadFormForDate = false) {
        if (!skipLoadFormForDate) {
            loadFormForDate(jsonData.date);
        }
        setValue('date', jsonData.date);
        updateCurrentDateDisplay(jsonData.date);

        if (jsonData.environment) { 
            const envMap = { temperature_c: 'temperatureC', air_quality_index: 'airQualityIndex', humidity_percent: 'humidityPercent', uv_index: 'uvIndex', weather_condition: 'weatherCondition', environment_experience: 'environmentExperience' }; 
            Object.keys(envMap).forEach(key => { 
                if (jsonData.environment[key] !== undefined && jsonData.environment[key] !== null) setValue(envMap[key], jsonData.environment[key]); 
            }); 
            const selectorData = {
                temperatureC: jsonData.environment.temperature_c,
                airQualityIndex: jsonData.environment.air_quality_index,
                humidityPercent: jsonData.environment.humidity_percent
            };
            setSelectorValuesFromData(selectorData); 
        }
        if (jsonData.body_measurements) { const bodyMap = { weight_kg: 'weightKg', height_cm: 'heightCm', chest: 'chest', belly: 'belly' }; Object.keys(bodyMap).forEach(key => { if (jsonData.body_measurements[key] !== undefined && jsonData.body_measurements[key] !== null) setValue(bodyMap[key], jsonData.body_measurements[key]); }); }
        if (jsonData.health_and_fitness) { 
            const healthMap = { 
                sleep_hours: 'sleepHours', 
                sleep_quality: 'sleepQuality', 
                sleep_quality_description: 'sleepQualityDescription', 
                steps_count: 'stepsCount', 
                steps_distance_km: 'stepsDistanceKm', 
                kilocalorie: 'kilocalorie', 
                water_intake_liters: 'waterIntakeLiters', 
                medications_taken: 'medicationsTaken', 
                physical_symptoms: 'physicalSymptoms', 
                energy_level: 'energyLevel', 
                stress_level: 'stressLevel', 
                energy_reason: 'energyReason', 
                stress_reason: 'stressReason',
                energy_stress_reason: 'energyReason'
            }; 
            Object.keys(healthMap).forEach(key => {
                if (jsonData.health_and_fitness[key] !== undefined) {
                    setValue(healthMap[key], jsonData.health_and_fitness[key]);
                }
            });
            if (jsonData.health_and_fitness.energy_stress_reason && !jsonData.health_and_fitness.energy_reason) {
                setValue('energyReason', jsonData.health_and_fitness.energy_stress_reason);
            }
        }
        if (jsonData.mental_and_emotional_health) { 
            setValue('mentalState', jsonData.mental_and_emotional_health.mental_state); 
            setValue('mentalStateReason', jsonData.mental_and_emotional_health.mental_state_reason); 
            if (jsonData.mental_and_emotional_health.mood_timeline) {
                const mt = jsonData.mental_and_emotional_health.mood_timeline;
                if (mt.morning) {
                    setMoodSliderValue('morningMoodLevel', mt.morning.mood_level);
                    if (mt.morning.mood_feeling) setMoodFeeling('morning', mt.morning.mood_feeling);
                }
                if (mt.afternoon) {
                    setMoodSliderValue('afternoonMoodLevel', mt.afternoon.mood_level);
                    if (mt.afternoon.mood_feeling) setMoodFeeling('afternoon', mt.afternoon.mood_feeling);
                }
                if (mt.evening) {
                    setMoodSliderValue('eveningMoodLevel', mt.evening.mood_level);
                    if (mt.evening.mood_feeling) setMoodFeeling('evening', mt.evening.mood_feeling);
                }
                if (mt.night) {
                    setMoodSliderValue('nightMoodLevel', mt.night.mood_level);
                    if (mt.night.mood_feeling) setMoodFeeling('night', mt.night.mood_feeling);
                }
            }
            setValue('meditationStatus', jsonData.mental_and_emotional_health.meditation_status); 
            setValue('meditationDurationMin', jsonData.mental_and_emotional_health.meditation_duration_min); 
        }
        if (jsonData.personal_care) { setValue('faceProductName', jsonData.personal_care.face_product_name); setValue('faceProductBrand', jsonData.personal_care.face_product_brand); setValue('hairProductName', jsonData.personal_care.hair_product_name); setValue('hairProductBrand', jsonData.personal_care.hair_product_brand); setValue('hairOil', jsonData.personal_care.hair_oil); setValue('skincareRoutine', jsonData.personal_care.skincare_routine); }
        if (jsonData.diet_and_nutrition) { setValue('breakfast', jsonData.diet_and_nutrition.breakfast); setValue('lunch', jsonData.diet_and_nutrition.lunch); setValue('dinner', jsonData.diet_and_nutrition.dinner); setValue('additionalItems', jsonData.diet_and_nutrition.additional_items); }
        if (jsonData.activities_and_productivity) { 
            setValue('tasksTodayEnglish', jsonData.activities_and_productivity.tasks_today_english); 
            setValue('travelDestination', jsonData.activities_and_productivity.travel_destination); 
            setValue('phoneScreenOnHr', jsonData.activities_and_productivity.phone_screen_on_hr); 
            if (jsonData.activities_and_productivity.most_used_apps) { 
                const apps = jsonData.activities_and_productivity.most_used_apps;
                if (Array.isArray(apps)) {
                    apps.forEach(app => {
                        if (app.rank >= 1 && app.rank <= 5) {
                            setValue(`app${app.rank}Name`, app.name);
                            setValue(`app${app.rank}Time`, app.time);
                        }
                    });
                } else {
                    setValue('app1Name', apps.app1?.name); setValue('app1Time', apps.app1?.time);
                    setValue('app2Name', apps.app2?.name); setValue('app2Time', apps.app2?.time);
                    setValue('app3Name', apps.app3?.name); setValue('app3Time', apps.app3?.time);
                    setValue('app4Name', apps.app4?.name); setValue('app4Time', apps.app4?.time);
                    setValue('app5Name', apps.app5?.name); setValue('app5Time', apps.app5?.time);
                }
            }
            setValue('appUsageIntent', jsonData.activities_and_productivity.app_usage_intent);
        }
        if (jsonData.additional_notes) { setValue('keyEvents', jsonData.additional_notes.key_events); setValue('otherNoteStatus', jsonData.additional_notes.other_note_status || 'No'); } else { setValue('otherNoteStatus', 'No'); }
        setValue('dailyActivitySummary', jsonData.daily_activity_summary);
        setValue('overallDayExperience', jsonData.overall_day_experience);


        if (energyLevelSlider) updateSliderDisplay(energyLevelSlider, energyLevelValueDisplay);
        if (stressLevelSlider) updateSliderDisplay(stressLevelSlider, stressLevelValueDisplay);
        if (sleepQualitySlider) updateSliderDisplay(sleepQualitySlider, sleepQualityValueDisplay);
        if (uvIndexSlider) updateSliderDisplay(uvIndexSlider, uvIndexValueDisplay);
        if (morningMoodSlider) updateSliderDisplay(morningMoodSlider, morningMoodValueDisplay);
        if (afternoonMoodSlider) updateSliderDisplay(afternoonMoodSlider, afternoonMoodValueDisplay);
        if (eveningMoodSlider) updateSliderDisplay(eveningMoodSlider, eveningMoodValueDisplay);
        if (nightMoodSlider) updateSliderDisplay(nightMoodSlider, nightMoodValueDisplay);
        updateSummaryCounts();
        updateOverallCounts();
        checkAndUpdateAllTabIcons();
    }

    function performSaveOperation(isSilent = false) {
        try {
            saveAllSuggestions();
            const currentFormDate = dateInput.value;
            if (!currentFormDate) {
                if (!isSilent) showToast('Please select a date first to save.', 'error');
                return false;
            }

            const formDataToSave = {};
            diaryForm.querySelectorAll('input[id]:not([type="file"]), textarea[id], select[id]').forEach(element => {
                if (element.id) {
                    formDataToSave[element.id] = (element.type === 'checkbox' || element.type === 'radio') ? element.checked : element.value;
                }
            });
            formDataToSave.date = currentFormDate;


            let allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
            allSavedData[currentFormDate] = formDataToSave;

            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allSavedData));

            if (!isSilent) {
                if (document.visibilityState === 'visible') {
                    showToast('Form data saved locally for this date!', 'success');
                } else {
                    console.log('Form data auto-saved silently.');
                }
            }


            if (tabPanels[currentTabIndex]?.id === 'tab-history') {
                renderHistoryList();
            }
            return true;
        } catch (e) {
            console.error("Error saving to localStorage:", e);
            if (!isSilent) showToast('Failed to save form data. Storage might be full.', 'error');
            return false;
        }
    }

    function autoSaveOnVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            if (isMultiSelectModeActive || (tabPanels[currentTabIndex]?.id === 'tab-history')) return;
            const success = performSaveOperation(true);
            if (success) {
                console.log('Auto-save successful on visibility change to hidden.');
            }
        }
    }


    // --- Tab Navigation ---
    function slideToPanel(index, animate = true) {
        if (!tabPanelsSlider || index < 0 || index >= tabPanels.length) return;

        if (isMultiSelectModeActive && tabPanels[currentTabIndex]?.id === 'tab-history' && tabPanels[index]?.id !== 'tab-history') {
            disableMultiSelectMode();
        }

        currentTabIndex = index;
        const offset = -index * 100;
        tabPanelsSlider.style.transition = animate ? 'transform 0.35s ease-in-out' : 'none';
        tabPanelsSlider.style.transform = `translateX(${offset}%)`;

        bottomNavButtons.forEach((btn, i) => btn.classList.toggle('active', i === index));

        if (tabPanels[index] && tabPanels[index].id === 'tab-history') {
            renderHistoryList();
        }
    }

    // --- Scroll Selector Logic ---
    function populateSelector(selector, min, max, suffix = '', step = 1) {
        const fragment = document.createDocumentFragment();
        const paddingTop = document.createElement('div');
        paddingTop.className = 'scroll-selector-item-padding';
        fragment.appendChild(paddingTop);

        for (let i = min; i <= max; i += step) {
            const item = document.createElement('div');
            item.className = 'scroll-selector-item';
            item.dataset.value = i;
            item.textContent = i + suffix;
            fragment.appendChild(item);
        }
        const paddingBottom = document.createElement('div');
        paddingBottom.className = 'scroll-selector-item-padding';
        fragment.appendChild(paddingBottom);

        selector.innerHTML = '';
        selector.appendChild(fragment);
    }

    function handleScroll(selector) {
        const itemHeight = 40;
        const scrollTop = selector.scrollTop;
        const centeredIndex = Math.round(scrollTop / itemHeight);

        selector.querySelectorAll('.scroll-selector-item').forEach((item, index) => {
            item.classList.toggle('active', index === centeredIndex);
        });
    }

    function snapToCenter(selector) {
        const itemHeight = 40;
        const scrollTop = selector.scrollTop;
        const centeredIndex = Math.round(scrollTop / itemHeight);
        const newScrollTop = centeredIndex * itemHeight;

        selector.scrollTo({
            top: newScrollTop,
            behavior: 'smooth'
        });
        setTimeout(updateHiddenInputs, 150);
    }

    function setupScrollSelector(selector, min, max, suffix, step = 1) {
        populateSelector(selector, min, max, suffix, step);
        let scrollTimeout;
        selector.addEventListener('scroll', () => {
            handleScroll(selector);
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => snapToCenter(selector), 150);
        });
    }

    function getSelectedValue(selector) {
        const itemHeight = 40;
        const scrollTop = selector.scrollTop;
        const centeredIndex = Math.round(scrollTop / itemHeight);
        const activeItem = selector.querySelectorAll('.scroll-selector-item')[centeredIndex];
        return activeItem ? activeItem.dataset.value : null;
    }

    function updateHiddenInputs() {
        const minTemp = getSelectedValue(temperatureMinSelector);
        const maxTemp = getSelectedValue(temperatureMaxSelector);
        const aqi = getSelectedValue(airQualityIndexSelector);
        const humidity = getSelectedValue(humidityPercentSelector);

        if (minTemp !== null && maxTemp !== null) {
            temperatureCInput.value = `${minTemp}-${maxTemp}`;
        }
        if (aqi !== null) {
            airQualityIndexInput.value = aqi;
        }
        if (humidity !== null) {
            humidityPercentInput.value = humidity;
        }
        
        // Update indicators after scroll selector changes
        setTimeout(() => {
            checkAndUpdateAllTabIcons();
        }, 100);
    }

    function scrollToValue(selector, value, smooth = false) {
        if (value === null || value === undefined) return;
        const itemHeight = 40;
        const items = Array.from(selector.querySelectorAll('.scroll-selector-item'));
        const index = items.findIndex(item => parseInt(item.dataset.value, 10) === parseInt(value, 10));
        if (index > -1) {
            selector.scrollTo({
                top: index * itemHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
            handleScroll(selector);
        }
    }

    function setSelectorValuesFromData(data) {
        if (data && data.temperatureC && typeof data.temperatureC === 'string') {
            const [min, max] = data.temperatureC.split('-').map(val => parseInt(val, 10));
            if (!isNaN(min)) scrollToValue(temperatureMinSelector, min);
            if (!isNaN(max)) scrollToValue(temperatureMaxSelector, max);
        } else {
            scrollToValue(temperatureMinSelector, 20);
            scrollToValue(temperatureMaxSelector, 30);
        }

        if (data && data.airQualityIndex) {
            const aqi = parseInt(data.airQualityIndex, 10);
            if (!isNaN(aqi)) scrollToValue(airQualityIndexSelector, aqi);
        } else {
            scrollToValue(airQualityIndexSelector, 80);
        }

        if (data && data.humidityPercent) {
            const humidity = parseInt(data.humidityPercent, 10);
            if (!isNaN(humidity)) scrollToValue(humidityPercentSelector, humidity);
        } else {
            scrollToValue(humidityPercentSelector, 60);
        }
        updateHiddenInputs();
    }


    // --- History Tab & Multi-Select Functionality ---
    function renderHistoryList() {
        if (!historyListContainer || !historyTabPanel) return;

        let currentScrollTop = historyTabPanel.scrollTop;

        const expandedItemDates = new Set();
        historyListContainer.querySelectorAll('.history-item.expanded-json').forEach(item => {
            if (item.dataset.date) expandedItemDates.add(item.dataset.date);
        });

        const noHistoryMsgElement = historyListContainer.querySelector('.no-history-message');
        const existingItems = historyListContainer.querySelectorAll('.history-item');
        existingItems.forEach(item => item.remove());


        const allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        const dates = Object.keys(allSavedData).sort((a, b) => new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00'));

        if (dates.length === 0) {
            if (noHistoryMsgElement) noHistoryMsgElement.style.display = 'block';
        } else {
            if (noHistoryMsgElement) noHistoryMsgElement.style.display = 'none';
            dates.forEach(dateStr => {
                const entryData = allSavedData[dateStr];
                if (!entryData) return;

                const listItem = document.createElement('div');
                listItem.classList.add('history-item');
                listItem.dataset.date = dateStr;
                
                // Check if entry has empty fields
                if (hasEmptyFieldsInEntry(entryData)) {
                    listItem.classList.add('has-empty-fields');
                }

                const mainContent = document.createElement('div');
                mainContent.classList.add('history-item-main-content');

                if (isMultiSelectModeActive) {
                    listItem.classList.add('multi-select-active');
                    if (selectedEntriesForMultiAction.includes(dateStr)) {
                        listItem.classList.add('selected');
                    }
                }

                const expandJsonBtn = document.createElement('button');
                expandJsonBtn.type = 'button';
                expandJsonBtn.classList.add('history-item-expand-json');
                expandJsonBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
                expandJsonBtn.title = 'Show/Hide JSON Data';
                expandJsonBtn.setAttribute('aria-expanded', 'false');
                mainContent.appendChild(expandJsonBtn);

                const checkboxContainer = document.createElement('div');
                checkboxContainer.classList.add('history-item-checkbox-container');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.classList.add('history-item-checkbox');
                checkbox.dataset.date = dateStr;
                checkbox.checked = isMultiSelectModeActive && selectedEntriesForMultiAction.includes(dateStr);
                checkboxContainer.appendChild(checkbox);
                mainContent.appendChild(checkboxContainer);

                const details = document.createElement('div');
                details.classList.add('history-item-details');
                const itemDate = document.createElement('div');
                itemDate.classList.add('history-item-date');
                try {
                    itemDate.textContent = new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
                } catch (e) { itemDate.textContent = dateStr; }
                const preview = document.createElement('div');
                preview.classList.add('history-item-preview');
                const summary = entryData.dailyActivitySummary || entryData.keyEvents || 'No summary/events';
                preview.textContent = summary.substring(0, 50) + (summary.length > 50 ? '...' : '');
                details.appendChild(itemDate);
                details.appendChild(preview);
                mainContent.appendChild(details);

                const actions = document.createElement('div');
                actions.classList.add('history-item-actions');

                const exportBtn = document.createElement('button');
                exportBtn.type = 'button';
                exportBtn.innerHTML = '<i class="fas fa-file-export"></i>'; exportBtn.title = 'Export Entry'; exportBtn.classList.add('action-export');
                actions.appendChild(exportBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'; deleteBtn.title = 'Delete Entry'; deleteBtn.classList.add('action-delete');
                actions.appendChild(deleteBtn);

                mainContent.appendChild(actions);
                listItem.appendChild(mainContent);

                const jsonWrapper = document.createElement('div');
                jsonWrapper.classList.add('history-item-json-wrapper');
                const jsonView = document.createElement('pre');
                jsonView.classList.add('history-item-json-view');
                const copyJsonBtn = document.createElement('button');
                copyJsonBtn.type = 'button';
                copyJsonBtn.classList.add('copy-json-btn');
                copyJsonBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                copyJsonBtn.title = 'Copy JSON to clipboard';

                jsonWrapper.appendChild(copyJsonBtn);
                jsonWrapper.appendChild(jsonView);
                listItem.appendChild(jsonWrapper);

                if (expandedItemDates.has(dateStr)) {
                    const fullEntryData = getFullEntryDataForExport(entryData, dateStr);
                    jsonView.textContent = JSON.stringify(fullEntryData, null, 2);
                    jsonWrapper.style.display = 'block';
                    expandJsonBtn.setAttribute('aria-expanded', 'true');
                    expandJsonBtn.classList.add('expanded');
                    listItem.classList.add('expanded-json');
                }

                expandJsonBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isCurrentlyExpanded = expandJsonBtn.getAttribute('aria-expanded') === 'true';
                    if (isCurrentlyExpanded) {
                        jsonWrapper.style.display = 'none';
                        jsonView.textContent = '';
                        expandJsonBtn.setAttribute('aria-expanded', 'false');
                        expandJsonBtn.classList.remove('expanded');
                        listItem.classList.remove('expanded-json');
                    } else {
                        const currentEntryDataFromStorage = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}')[dateStr];
                        if (currentEntryDataFromStorage) {
                            const fullEntryData = getFullEntryDataForExport(currentEntryDataFromStorage, dateStr);
                            jsonView.textContent = JSON.stringify(fullEntryData, null, 2);
                            jsonWrapper.style.display = 'block';
                            expandJsonBtn.setAttribute('aria-expanded', 'true');
                            expandJsonBtn.classList.add('expanded');
                            listItem.classList.add('expanded-json');
                        }
                    }
                });

                copyJsonBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const jsonText = jsonView.textContent;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(jsonText).then(() => {
                            showToast('JSON copied to clipboard!', 'success');
                        }).catch(err => {
                            console.error('Failed to copy JSON: ', err);
                            showToast('Could not copy JSON.', 'error');
                        });
                    } else {
                        showToast('Clipboard API not supported.', 'error');
                    }
                });

                checkbox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleMultiSelectEntry(dateStr, listItem, checkbox);
                });

                exportBtn.addEventListener('click', (e) => { e.stopPropagation(); handleExportEntry(dateStr); });
                deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); handleDeleteEntry(dateStr); });

                mainContent.addEventListener('click', (event) => {
                    handleHistoryItemClick(event, dateStr, listItem);
                });

                listItem.addEventListener('touchstart', (e) => handleHistoryItemTouchStart(e, dateStr, listItem), { passive: false });
                listItem.addEventListener('touchmove', handleHistoryItemTouchMove);
                listItem.addEventListener('touchend', () => handleHistoryItemTouchEnd(dateStr, listItem));

                listItem.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (e.target.closest('.history-item-expand-json') ||
                        e.target.closest('.history-item-actions button') ||
                        e.target.closest('.history-item-checkbox-container')) {
                        return;
                    }

                    if (!isMultiSelectModeActive) enableMultiSelectMode();
                    const currentCheckbox = listItem.querySelector('.history-item-checkbox');
                    toggleMultiSelectEntry(dateStr, listItem, currentCheckbox);
                });

                if (noHistoryMsgElement) {
                    historyListContainer.insertBefore(listItem, noHistoryMsgElement);
                } else {
                    historyListContainer.appendChild(listItem);
                }
            });
        }
        historyTabPanel.scrollTop = currentScrollTop;
    }

    // --- MODIFIED FUNCTION ---
    function handleHistoryItemTouchStart(event, dateStr, listItem) {
        // Updated the guard condition to include the new copy button
        if (event.target.closest('.history-item-expand-json') || event.target.closest('.history-item-actions button') || event.target.closest('.history-item-checkbox-container') || event.target.closest('.copy-json-btn')) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
            return;
        }
        itemTouchStartX = event.touches[0].clientX;
        itemTouchStartY = event.touches[0].clientY;
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
            longPressTimer = null;
            if (!isMultiSelectModeActive) {
                enableMultiSelectMode();
                const freshListItem = historyListContainer.querySelector(`.history-item[data-date="${dateStr}"]`);
                if (freshListItem) {
                    const checkbox = freshListItem.querySelector('.history-item-checkbox');
                    toggleMultiSelectEntry(dateStr, freshListItem, checkbox);
                }
            } else {
                const checkbox = listItem.querySelector('.history-item-checkbox');
                toggleMultiSelectEntry(dateStr, listItem, checkbox);
            }
            if (navigator.vibrate) navigator.vibrate(50);
        }, LONG_PRESS_DURATION);
    }

    function handleHistoryItemTouchMove(event) {
        if (longPressTimer) {
            const deltaX = Math.abs(event.touches[0].clientX - itemTouchStartX);
            const deltaY = Math.abs(event.touches[0].clientY - itemTouchStartY);
            if (deltaX > 10 || deltaY > 10) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }
    }

    function handleHistoryItemTouchEnd(dateStr, listItem) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
            handleHistoryItemClick(null, dateStr, listItem);
        }
    }

    // --- MODIFIED FUNCTION ---
    function handleHistoryItemClick(event, dateStr, listItem) {
        if (event && event.target) {
            // Updated the guard condition to include the new copy button
            if (event.target.closest('.history-item-expand-json') ||
                event.target.closest('.history-item-checkbox-container input[type="checkbox"]') ||
                event.target.closest('.history-item-actions button') ||
                event.target.closest('.copy-json-btn')) {
                return;
            }
        }

        if (isMultiSelectModeActive) {
            const checkbox = listItem.querySelector('.history-item-checkbox');
            toggleMultiSelectEntry(dateStr, listItem, checkbox);
        } else {
            handleEditEntry(dateStr);
        }
    }


    function handleEditEntry(dateStr) {
        if (isMultiSelectModeActive) disableMultiSelectMode();

        const allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        const entryFormData = allSavedData[dateStr];
        if (entryFormData) {
            loadFormForDate(dateStr);
            showToast(`Editing entry for ${new Date(dateStr + 'T00:00:00').toLocaleDateString()}.`, 'info');
            slideToPanel(0);
        } else {
            showToast('Could not find entry data to edit.', 'error');
        }
    }

    function getFullEntryDataForExport(entryFormData, dateKey) {
        const exportData = {};
        exportData.version = "4.0";
        exportData.date = entryFormData.date || dateKey;
        exportData.day_id = calculateDaysSince(REFERENCE_START_DATE, exportData.date);
        
        // Add weekday
        try {
            const dateObj = new Date(exportData.date + 'T00:00:00');
            const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            exportData.weekday = weekdays[dateObj.getDay()];
        } catch (e) {
            exportData.weekday = '';
        }

        const pFloat = val => (val !== null && val !== undefined && String(val).trim() !== "" && !isNaN(parseFloat(String(val)))) ? parseFloat(String(val)) : null;
        const pInt = val => (val !== null && val !== undefined && String(val).trim() !== "" && !isNaN(parseInt(String(val)))) ? parseInt(String(val)) : null;

        exportData.environment = { temperature_c: entryFormData.temperatureC || '', air_quality_index: pInt(entryFormData.airQualityIndex), humidity_percent: pInt(entryFormData.humidityPercent), uv_index: pInt(entryFormData.uvIndex), weather_condition: entryFormData.weatherCondition || '', environment_experience: entryFormData.environmentExperience || '' };
        exportData.body_measurements = { weight_kg: pFloat(entryFormData.weightKg), height_cm: pInt(entryFormData.heightCm), chest: pInt(entryFormData.chest), belly: pInt(entryFormData.belly) };
        exportData.health_and_fitness = { sleep_hours: entryFormData.sleepHours || '', sleep_quality: pInt(entryFormData.sleepQuality), sleep_quality_description: entryFormData.sleepQualityDescription || '', steps_count: pInt(entryFormData.stepsCount), steps_distance_km: pFloat(entryFormData.stepsDistanceKm), kilocalorie: pInt(entryFormData.kilocalorie), water_intake_liters: pFloat(entryFormData.waterIntakeLiters), medications_taken: entryFormData.medicationsTaken || '', physical_symptoms: entryFormData.physicalSymptoms || '', energy_level: pInt(entryFormData.energyLevel), stress_level: pInt(entryFormData.stressLevel), energy_reason: entryFormData.energyReason || '', stress_reason: entryFormData.stressReason || '' };
        exportData.mental_and_emotional_health = { 
            mental_state: entryFormData.mentalState || '', 
            mental_state_reason: entryFormData.mentalStateReason || '', 
            mood_timeline: {
                morning: { mood_level: pInt(entryFormData.morningMoodLevel), mood_feeling: entryFormData.morningMoodFeeling || '' },
                afternoon: { mood_level: pInt(entryFormData.afternoonMoodLevel), mood_feeling: entryFormData.afternoonMoodFeeling || '' },
                evening: { mood_level: pInt(entryFormData.eveningMoodLevel), mood_feeling: entryFormData.eveningMoodFeeling || '' },
                night: { mood_level: pInt(entryFormData.nightMoodLevel), mood_feeling: entryFormData.nightMoodFeeling || '' }
            },
            meditation_status: entryFormData.meditationStatus || '', 
            meditation_duration_min: pInt(entryFormData.meditationDurationMin) 
        };
        exportData.personal_care = { face_product_name: entryFormData.faceProductName || '', face_product_brand: entryFormData.faceProductBrand || '', hair_product_name: entryFormData.hairProductName || '', hair_product_brand: entryFormData.hairProductBrand || '', hair_oil: entryFormData.hairOil || '', skincare_routine: entryFormData.skincareRoutine || '' };
        exportData.diet_and_nutrition = { breakfast: entryFormData.breakfast || '', lunch: entryFormData.lunch || '', dinner: entryFormData.dinner || '', additional_items: entryFormData.additionalItems || '' };
        exportData.activities_and_productivity = { 
            tasks_today_english: entryFormData.tasksTodayEnglish || '', 
            travel_destination: entryFormData.travelDestination || '', 
            phone_screen_on_hr: entryFormData.phoneScreenOnHr || '', 
            most_used_apps: [
                { rank: 1, name: entryFormData.app1Name || '', time: entryFormData.app1Time || '' },
                { rank: 2, name: entryFormData.app2Name || '', time: entryFormData.app2Time || '' },
                { rank: 3, name: entryFormData.app3Name || '', time: entryFormData.app3Time || '' },
                { rank: 4, name: entryFormData.app4Name || '', time: entryFormData.app4Time || '' },
                { rank: 5, name: entryFormData.app5Name || '', time: entryFormData.app5Time || '' }
            ],
            app_usage_intent: entryFormData.appUsageIntent || ''
        };
        exportData.additional_notes = { key_events: entryFormData.keyEvents || '', other_note_status: entryFormData.otherNoteStatus || 'No' };
        exportData.daily_activity_summary = entryFormData.dailyActivitySummary || '';
        exportData.overall_day_experience = entryFormData.overallDayExperience || '';
        return exportData;
    }

    function handleExportEntry(dateStr) {
        const allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        const entryFormData = allSavedData[dateStr];
        if (entryFormData) {
            const exportData = getFullEntryDataForExport(entryFormData, dateStr);
            const jsonString = JSON.stringify(exportData, null, 2);
            downloadJSON(jsonString, `${dateStr}.json`);
            showToast('Entry exported.', 'success');
        } else {
            showToast('Could not find entry data to export.', 'error');
        }
    }

    function handleDeleteEntry(dateStr, isPartOfMulti = false) {
        const confirmed = isPartOfMulti ? true : confirm(`Are you sure you want to delete the entry for ${new Date(dateStr + 'T00:00:00').toLocaleDateString()}? This action cannot be undone.`);
        if (confirmed) {
            const allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
            if (allSavedData[dateStr]) {
                delete allSavedData[dateStr];
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allSavedData));
                if (!isPartOfMulti) {
                    showToast('Entry deleted.', 'success');
                    renderHistoryList();
                }
                return true;
            } else {
                if (!isPartOfMulti) showToast('Entry not found for deletion.', 'error');
                return false;
            }
        }
        return false;
    }

    function enableMultiSelectMode() {
        if (isMultiSelectModeActive) return;
        isMultiSelectModeActive = true;
        selectedEntriesForMultiAction = [];
        updateTopBarForMultiSelectView(true);
        renderHistoryList();
        showToast('Multi-select enabled. Tap items to select.', 'info');
        if (isDropdownMenuOpen) toggleDropdownMenu(false);
    }

    function disableMultiSelectMode() {
        if (!isMultiSelectModeActive) return;
        isMultiSelectModeActive = false;
        selectedEntriesForMultiAction = [];
        updateTopBarForMultiSelectView(false);
        renderHistoryList();
    }

    function toggleMultiSelectEntry(dateStr, listItemElement, checkboxElement = null) {
        const index = selectedEntriesForMultiAction.indexOf(dateStr);
        const actualCheckbox = checkboxElement || listItemElement.querySelector('.history-item-checkbox');

        if (index > -1) {
            selectedEntriesForMultiAction.splice(index, 1);
            listItemElement.classList.remove('selected');
            if (actualCheckbox) actualCheckbox.checked = false;
        } else {
            selectedEntriesForMultiAction.push(dateStr);
            listItemElement.classList.add('selected');
            if (actualCheckbox) actualCheckbox.checked = true;
        }
        updateMultiSelectCount();
    }

    function updateMultiSelectCount() {
        if (multiSelectCountSpan) multiSelectCountSpan.textContent = `${selectedEntriesForMultiAction.length} selected`;
        const hasSelection = selectedEntriesForMultiAction.length > 0;
        if (deleteSelectedButton) deleteSelectedButton.disabled = !hasSelection;
        if (exportSelectedButton) exportSelectedButton.disabled = !hasSelection;
    }

    function updateTopBarForMultiSelectView(isActive) {
        if (!topBar) return;
        if (isActive) {
            topBar.classList.add('multi-select-mode');
            updateMultiSelectCount();
        } else {
            topBar.classList.remove('multi-select-mode');
        }
    }

    function handleDeleteSelectedEntries() {
        if (selectedEntriesForMultiAction.length === 0) {
            showToast('No entries selected for deletion.', 'info');
            return;
        }
        const confirmed = confirm(`Are you sure you want to delete ${selectedEntriesForMultiAction.length} selected entries? This action cannot be undone.`);
        if (confirmed) {
            let deleteCount = 0;
            selectedEntriesForMultiAction.forEach(dateStr => {
                if (handleDeleteEntry(dateStr, true)) deleteCount++;
            });
            showToast(`${deleteCount} of ${selectedEntriesForMultiAction.length} entries deleted.`, 'success');
            disableMultiSelectMode();
        }
    }

    function handleExportSelectedEntries() {
        if (selectedEntriesForMultiAction.length === 0) {
            showToast('No entries selected for export.', 'info');
            return;
        }
        const allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        const entriesToExport = [];
        selectedEntriesForMultiAction.forEach(dateStr => {
            const entryFormData = allSavedData[dateStr];
            if (entryFormData) {
                entriesToExport.push(getFullEntryDataForExport(entryFormData, dateStr));
            }
        });

        if (entriesToExport.length > 0) {
            const jsonString = JSON.stringify(entriesToExport, null, 2);
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            downloadJSON(jsonString, `diary_export_multiple_${timestamp}.json`);
            showToast(`${entriesToExport.length} entries exported.`, 'success');
            disableMultiSelectMode();
        } else {
            showToast('No valid data found for selected entries.', 'error');
            disableMultiSelectMode();
        }
    }

    // --- Dropdown Menu Logic ---
    function toggleDropdownMenu(forceState) {
        if (dropdownMenu) {
            isDropdownMenuOpen = typeof forceState === 'boolean' ? forceState : !isDropdownMenuOpen;
            dropdownMenu.style.display = isDropdownMenuOpen ? 'block' : 'none';
        }
    }

    async function handleShareCurrentEntry() {
        if (isMultiSelectModeActive) {
            showToast('Sharing is disabled in multi-select mode.', 'info');
            toggleDropdownMenu(false);
            return;
        }

        // Get current selected date
        const selectedDateStr = dateInput.value;
        if (!selectedDateStr) {
            showToast('Please select a date first.', 'error');
            toggleDropdownMenu(false);
            return;
        }

        // Get current form data
        const currentFormValuesForExport = {};
        diaryForm.querySelectorAll('input[id]:not([type="file"]), textarea[id], select[id]').forEach(element => {
            if (element.id) {
                currentFormValuesForExport[element.id] = (element.type === 'checkbox' || element.type === 'radio') ? element.checked : element.value;
            }
        });
        currentFormValuesForExport.date = selectedDateStr;

        const shareButtonOriginalIconHTML = shareEntryButton.querySelector('i')?.outerHTML;
        setButtonLoadingState(shareEntryButton, true, shareButtonOriginalIconHTML);

        try {
            const entryData = getFullEntryDataForExport(currentFormValuesForExport, selectedDateStr);
            const jsonString = JSON.stringify(entryData, null, 2);
            const fileName = `diary-${selectedDateStr}.json`;

            // Try Web Share API first (for mobile)
            if (navigator.share && navigator.canShare) {
                try {
                    const fileToShare = new File([jsonString], fileName, { type: 'application/json' });
                    
                    if (navigator.canShare({ files: [fileToShare] })) {
                        await navigator.share({
                            title: `Diary Entry - ${selectedDateStr}`,
                            text: `My diary entry for ${new Date(selectedDateStr + 'T00:00:00').toLocaleDateString()}`,
                            files: [fileToShare]
                        });
                        showToast('Diary entry shared successfully!', 'success');
                        return;
                    }
                } catch (shareError) {
                    if (shareError.name === 'AbortError') {
                        showToast('Sharing cancelled.', 'info');
                        return;
                    }
                    console.log('File sharing failed, falling back to download.');
                }
            }

            // Fallback: Download the file
            downloadJSON(jsonString, fileName);
            showToast('File downloaded! You can now upload it to Drive.', 'success');

        } catch (error) {
            console.error('Error sharing entry:', error);
            showToast('Error creating file. Please try again.', 'error');
        } finally {
            setButtonLoadingState(shareEntryButton, false, shareButtonOriginalIconHTML);
            toggleDropdownMenu(false);
        }
    }


    // --- Backup System Functions ---
    function createBackup() {
        const allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        const dates = Object.keys(allSavedData);
        
        if (dates.length === 0) {
            showToast('No diary entries found to backup.', 'info');
            return;
        }

        const backupEntries = [];
        dates.forEach(dateStr => {
            const entryFormData = allSavedData[dateStr];
            if (entryFormData) {
                backupEntries.push(getFullEntryDataForExport(entryFormData, dateStr));
            }
        });

        const jsonString = JSON.stringify(backupEntries, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `diary-backup-${timestamp}.json`;
        
        downloadJSON(jsonString, fileName);
        showToast(`Backup created with ${dates.length} entries.`, 'success');
    }

    function importBackup(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const backupData = JSON.parse(e.target.result);
                
                if (!Array.isArray(backupData)) {
                    showToast('Invalid backup file format.', 'error');
                    return;
                }

                const confirmed = confirm(`This will import ${backupData.length} entries. Continue?`);
                if (!confirmed) return;

                let allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
                let importedCount = 0;

                backupData.forEach(entry => {
                    if (entry && entry.date) {
                        diaryForm.reset();
                        populateFormWithJson(entry, true);
                        const currentFormObject = {};
                        diaryForm.querySelectorAll('input[id]:not([type="file"]), textarea[id], select[id]').forEach(element => {
                            if (element.id) {
                                currentFormObject[element.id] = (element.type === 'checkbox' || element.type === 'radio') ? element.checked : element.value;
                            }
                        });
                        allSavedData[entry.date] = currentFormObject;
                        importedCount++;
                    }
                });

                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allSavedData));
                showToast(`Backup imported! ${importedCount} entries restored.`, 'success');
                
                const currentDate = dateInput.value || formatDate(new Date());
                loadFormForDate(currentDate);
                renderHistoryList();
                
            } catch (error) {
                console.error('Error importing backup:', error);
                showToast('Error importing backup. Invalid file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    function performHardRefresh() {
        const confirmed = confirm('This will perform a hard refresh and reload the app with latest files. Continue?');
        if (confirmed) {
            // Clear service worker cache and force reload
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.unregister();
                    });
                    // Force hard reload
                    window.location.reload(true);
                });
            } else {
                // Fallback hard reload
                window.location.reload(true);
            }
        }
    }

    // --- Event Listeners & Initialization ---

    window.addEventListener('resize', updateKeyboardStatus);

    diaryForm.addEventListener('focusin', (event) => {
        if (isPotentiallyFocusableForKeyboard(event.target)) viewportHeightBeforeKeyboard = window.innerHeight;
    });
    diaryForm.addEventListener('focusout', (event) => {
        if (isPotentiallyFocusableForKeyboard(event.target)) setTimeout(() => { isKeyboardOpen = false; viewportHeightBeforeKeyboard = window.innerHeight; updateKeyboardStatus(); }, 100);
    });

    if (dateInput) dateInput.addEventListener('change', () => {
        const newDateStr = dateInput.value;
        updateCurrentDateDisplay(newDateStr);
        loadFormForDate(newDateStr);
    });
    if (dateIncrementButton) dateIncrementButton.addEventListener('click', () => changeDate(1));
    if (dateDecrementButton) dateDecrementButton.addEventListener('click', () => changeDate(-1));
    if (currentDateDisplay) currentDateDisplay.addEventListener('click', () => {
        if (dateInput) dateInput.showPicker ? dateInput.showPicker() : dateInput.click();
    });

    if (energyLevelSlider) energyLevelSlider.addEventListener('input', () => updateSliderDisplay(energyLevelSlider, energyLevelValueDisplay));
    if (stressLevelSlider) stressLevelSlider.addEventListener('input', () => updateSliderDisplay(stressLevelSlider, stressLevelValueDisplay));
    if (sleepQualitySlider) sleepQualitySlider.addEventListener('input', () => updateSliderDisplay(sleepQualitySlider, sleepQualityValueDisplay));
    if (uvIndexSlider) uvIndexSlider.addEventListener('input', () => updateSliderDisplay(uvIndexSlider, uvIndexValueDisplay));
    if (morningMoodSlider) morningMoodSlider.addEventListener('input', () => updateSliderDisplay(morningMoodSlider, morningMoodValueDisplay));
    if (afternoonMoodSlider) afternoonMoodSlider.addEventListener('input', () => updateSliderDisplay(afternoonMoodSlider, afternoonMoodValueDisplay));
    if (eveningMoodSlider) eveningMoodSlider.addEventListener('input', () => updateSliderDisplay(eveningMoodSlider, eveningMoodValueDisplay));
    if (nightMoodSlider) nightMoodSlider.addEventListener('input', () => updateSliderDisplay(nightMoodSlider, nightMoodValueDisplay));

    if (uvIndexSlider) uvIndexSlider.addEventListener('input', () => updateSliderDisplay(uvIndexSlider, uvIndexValueDisplay));

    if (dailyActivitySummaryTextarea) dailyActivitySummaryTextarea.addEventListener('input', updateSummaryCounts);
    if (overallDayExperienceTextarea) overallDayExperienceTextarea.addEventListener('input', updateOverallCounts);
    if (energyReasonTextarea) energyReasonTextarea.addEventListener('input', updateEnergyReasonCounts);
    if (stressReasonTextarea) stressReasonTextarea.addEventListener('input', updateStressReasonCounts);

    diaryForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!downloadButton) return;
        const originalDownloadIconHTML = downloadButton.querySelector('i')?.outerHTML;
        setButtonLoadingState(downloadButton, true, originalDownloadIconHTML);

        const currentFormValuesForExport = {};
        diaryForm.querySelectorAll('input[id]:not([type="file"]), textarea[id], select[id]').forEach(element => {
            if (element.id) {
                currentFormValuesForExport[element.id] = (element.type === 'checkbox' || element.type === 'radio') ? element.checked : element.value;
            }
        });
        const selectedDateStr = currentFormValuesForExport.date || getValue('date');

        setTimeout(() => {
            try {
                if (!selectedDateStr) {
                    showToast('Please select a date for the entry.', 'error');
                    setButtonLoadingState(downloadButton, false, originalDownloadIconHTML);
                    return;
                }
                const data = getFullEntryDataForExport(currentFormValuesForExport, selectedDateStr);
                const jsonString = JSON.stringify(data, null, 2);
                downloadJSON(jsonString, `${selectedDateStr}.json`);
                showToast('JSON file downloaded.', 'success');
            } catch (error) {
                console.error("Error during JSON generation/download:", error);
                showToast('Error generating/downloading JSON.', 'error');
            } finally {
                setButtonLoadingState(downloadButton, false, originalDownloadIconHTML);
            }
        }, 50);
    });

    jsonFileInput.addEventListener('change', async function (event) {
        const files = event.target.files;
        if (!files || files.length === 0) {
            jsonFileInput.value = '';
            return;
        }
        const buttonForLoading = menuImportButton || document.getElementById('importJsonButton');
        const originalImportIconHTML = buttonForLoading ? buttonForLoading.querySelector('i')?.outerHTML : null;
        if (buttonForLoading) setButtonLoadingState(buttonForLoading, true, originalImportIconHTML);


        const allEntriesFromFiles = [];
        const fileReadPromises = [];

        for (const file of files) {
            fileReadPromises.push(
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        try {
                            const fileContent = JSON.parse(e.target.result);
                            let entriesInThisFile = [];
                            if (Array.isArray(fileContent)) {
                                entriesInThisFile = fileContent.filter(item => item && typeof item === 'object' && item.date);
                            } else if (typeof fileContent === 'object' && fileContent !== null && fileContent.date) {
                                entriesInThisFile = [fileContent];
                            }
                            resolve(entriesInThisFile);
                        } catch (err) {
                            console.error('Error parsing JSON from file:', file.name, err);
                            showToast(`Error parsing ${file.name}. Invalid JSON.`, 'error');
                            resolve([]);
                        }
                    };
                    reader.onerror = function () {
                        console.error('Error reading file:', file.name);
                        showToast(`Error reading ${file.name}.`, 'error');
                        resolve([]);
                    };
                    reader.readAsText(file);
                })
            );
        }

        try {
            const results = await Promise.all(fileReadPromises);
            results.forEach(entries => allEntriesFromFiles.push(...entries));

            if (allEntriesFromFiles.length > 0) {
                let allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
                let importedCount = 0;
                let successfullyProcessedEntries = [];

                allEntriesFromFiles.forEach(entry => {
                    if (entry && entry.date) {
                        diaryForm.reset();
                        populateFormWithJson(entry, true);

                        const currentFormObject = {};
                        diaryForm.querySelectorAll('input[id]:not([type="file"]), textarea[id], select[id]').forEach(element => {
                            if (element.id) {
                                currentFormObject[element.id] = (element.type === 'checkbox' || element.type === 'radio') ? element.checked : element.value;
                            }
                        });
                        allSavedData[entry.date] = currentFormObject;
                        importedCount++;
                        successfullyProcessedEntries.push(entry);
                    }
                });

                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allSavedData));

                if (importedCount > 0) {
                    showToast(`${importedCount} entries imported successfully!`, 'success');
                    const lastEntryToDisplay = successfullyProcessedEntries.pop();
                    if (lastEntryToDisplay) {
                        // Load the last imported entry into the form view
                        loadFormForDate(lastEntryToDisplay.date);
                        slideToPanel(0);
                    }
                } else {
                    showToast('No valid diary entries found in the selected file(s).', 'info');
                }
            } else {
                showToast('No processable entries found in selected files.', 'info');
            }
        } catch (error) {
            console.error("Error processing imported files:", error);
            showToast('An error occurred during import.', 'error');
        } finally {
            jsonFileInput.value = '';
            if (buttonForLoading) setButtonLoadingState(buttonForLoading, false, originalImportIconHTML);
            renderHistoryList();
            checkAndUpdateAllTabIcons();
        }
    });

    if (saveFormButton) saveFormButton.addEventListener('click', () => {
        const originalSaveIconHTML = saveFormButton.querySelector('i')?.outerHTML;
        setButtonLoadingState(saveFormButton, true, originalSaveIconHTML);
        setTimeout(() => {
            performSaveOperation(false);
            setButtonLoadingState(saveFormButton, false, originalSaveIconHTML);
        }, 10);
    });

    bottomNavButtons.forEach((button, index) => button.addEventListener('click', () => slideToPanel(index)));


    if (typeof tabPanels !== 'undefined') {
        tabPanels.forEach(panel => {
            if (panel.id && panel.id !== 'tab-history' && panel.querySelector('input, textarea, select')) {
                panel.addEventListener('input', (event) => {
                    if (event.target.matches('input[type="text"], input[type="number"], textarea, input[type="email"], input[type="password"], input[type="search"], input[type="tel"], input[type="url"], input[type="range"]')) {
                        setTimeout(() => {
                            checkAndUpdateAllTabIcons();
                        }, 50);
                    }
                });
                panel.addEventListener('change', (event) => {
                    if (event.target.matches('select, input[type="range"]')) {
                        setTimeout(() => {
                            checkAndUpdateAllTabIcons();
                        }, 50);
                    }
                });
            }
        });
    }

    window.addEventListener('beforeunload', (event) => {
        if (!isMultiSelectModeActive && tabPanels[currentTabIndex]?.id !== 'tab-history') {
            console.log('Auto-saving data on beforeunload.');
            performSaveOperation(true);

            event.preventDefault();
            event.returnValue = '';
            return '';
        }
    });

    window.addEventListener('pagehide', () => autoSaveOnVisibilityChange());
    document.addEventListener('visibilitychange', autoSaveOnVisibilityChange);

    if (cancelMultiSelectButton) cancelMultiSelectButton.addEventListener('click', disableMultiSelectMode);
    if (deleteSelectedButton) deleteSelectedButton.addEventListener('click', handleDeleteSelectedEntries);
    if (exportSelectedButton) exportSelectedButton.addEventListener('click', handleExportSelectedEntries);

    if (menuButton) {
        menuButton.addEventListener('click', (event) => {
            event.stopPropagation();
            if (isMultiSelectModeActive) return;
            toggleDropdownMenu();
        });
    }
    if (shareEntryButton) {
        shareEntryButton.addEventListener('click', () => {
            handleShareCurrentEntry();
        });
    }
    if (menuImportButton) {
        menuImportButton.addEventListener('click', () => {
            jsonFileInput.click();
            toggleDropdownMenu(false);
        });
    }
    if (menuClearFormButton) {
        menuClearFormButton.addEventListener('click', () => {
            clearDiaryForm();
            toggleDropdownMenu(false);
        });
    }
    if (createBackupButton) {
        createBackupButton.addEventListener('click', () => {
            createBackup();
            toggleDropdownMenu(false);
        });
    }
    if (importBackupButton) {
        importBackupButton.addEventListener('click', () => {
            backupFileInput.click();
            toggleDropdownMenu(false);
        });
    }
    if (backupFileInput) {
        backupFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                importBackup(file);
                backupFileInput.value = '';
            }
        });
    }
    if (hardRefreshButton) {
        hardRefreshButton.addEventListener('click', () => {
            performHardRefresh();
            toggleDropdownMenu(false);
        });
    }
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            // Auto-save current form data before going to settings
            performSaveOperation(true);
            // Disable beforeunload warning for settings navigation
            window.onbeforeunload = null;
            setTimeout(() => {
                window.location.href = 'settings.html';
            }, 100);
            toggleDropdownMenu(false);
        });
    }

    document.addEventListener('click', (event) => {
        if (isDropdownMenuOpen && dropdownMenu && !dropdownMenu.contains(event.target) && event.target !== menuButton && !menuButton.contains(event.target)) {
            toggleDropdownMenu(false);
        }
    });

    // Import Personal Care from Last Day
    if (importPersonalCareBtn) {
        importPersonalCareBtn.addEventListener('click', () => {
            const currentDate = dateInput.value;
            if (!currentDate) {
                showToast('Please select a date first.', 'error');
                return;
            }
            
            const currentDateObj = new Date(currentDate + 'T00:00:00');
            currentDateObj.setDate(currentDateObj.getDate() - 1);
            const lastDayStr = formatDate(currentDateObj);
            
            const allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
            const lastDayData = allSavedData[lastDayStr];
            
            if (!lastDayData) {
                showToast('No data found for previous day.', 'info');
                return;
            }
            
            const confirmed = confirm(`Import Personal Care data from ${new Date(lastDayStr + 'T00:00:00').toLocaleDateString()}?\n\nThis will replace current values.`);
            if (!confirmed) return;
            
            const personalCareFields = ['faceProductName', 'faceProductBrand', 'hairProductName', 'hairProductBrand', 'hairOil', 'skincareRoutine'];
            let importedCount = 0;
            
            personalCareFields.forEach(fieldId => {
                if (lastDayData[fieldId]) {
                    setValue(fieldId, lastDayData[fieldId]);
                    importedCount++;
                }
            });
            
            if (importedCount > 0) {
                showToast(`Imported ${importedCount} fields successfully!`, 'success');
                checkAndUpdateAllTabIcons();
            } else {
                showToast('No personal care data found for previous day.', 'info');
            }
        });
    }

    // Import Environment from Last Day
    if (importEnvironmentBtn) {
        importEnvironmentBtn.addEventListener('click', () => {
            const currentDate = dateInput.value;
            if (!currentDate) {
                showToast('Please select a date first.', 'error');
                return;
            }
            
            const currentDateObj = new Date(currentDate + 'T00:00:00');
            currentDateObj.setDate(currentDateObj.getDate() - 1);
            const lastDayStr = formatDate(currentDateObj);
            
            const allSavedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
            const lastDayData = allSavedData[lastDayStr];
            
            if (!lastDayData) {
                showToast('No data found for previous day.', 'info');
                return;
            }
            
            const confirmed = confirm(`Import Environment data from ${new Date(lastDayStr + 'T00:00:00').toLocaleDateString()}?\n\nThis will replace current values.`);
            if (!confirmed) return;
            
            setValue('uvIndex', lastDayData.uvIndex);
            setValue('weatherCondition', lastDayData.weatherCondition);
            setValue('environmentExperience', lastDayData.environmentExperience);
            setSelectorValuesFromData(lastDayData);
            
            if (uvIndexSlider) updateSliderDisplay(uvIndexSlider, uvIndexValueDisplay);
            
            showToast('Environment data imported successfully!', 'success');
            checkAndUpdateAllTabIcons();
        });
    }


    // --- Theme Management ---
    function applyStoredTheme() {
        const settings = JSON.parse(localStorage.getItem('diarySettings') || '{}');
        const theme = settings.theme || 'dark';
        const fontSize = settings.fontSize || 16;
        
        applyTheme(theme);
        document.documentElement.style.fontSize = fontSize + 'px';
    }
    
    function applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'light') {
            root.style.setProperty('--primary-bg', '#fafbfc');
            root.style.setProperty('--secondary-bg', '#ffffff');
            root.style.setProperty('--tertiary-bg', '#f1f5f9');
            root.style.setProperty('--text-primary', '#0f172a');
            root.style.setProperty('--text-secondary', '#334155');
            root.style.setProperty('--text-muted', '#64748b');
            root.style.setProperty('--accent-light', 'rgba(245, 158, 11, 0.12)');
            root.style.setProperty('--box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)');
            root.style.setProperty('--box-shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)');
        } else if (theme === 'dark') {
            root.style.setProperty('--primary-bg', '#0f172a');
            root.style.setProperty('--secondary-bg', '#1e293b');
            root.style.setProperty('--tertiary-bg', '#334155');
            root.style.setProperty('--text-primary', '#f8fafc');
            root.style.setProperty('--text-secondary', '#94a3b8');
            root.style.setProperty('--text-muted', '#64748b');
            root.style.setProperty('--accent-light', 'rgba(245, 158, 11, 0.1)');
            root.style.setProperty('--box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)');
            root.style.setProperty('--box-shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)');
        } else if (theme === 'black') {
            root.style.setProperty('--primary-bg', '#000000');
            root.style.setProperty('--secondary-bg', '#0a0a0a');
            root.style.setProperty('--tertiary-bg', '#1a1a1a');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#b3b3b3');
            root.style.setProperty('--text-muted', '#666666');
            root.style.setProperty('--accent-light', 'rgba(245, 158, 11, 0.15)');
            root.style.setProperty('--box-shadow', '0 4px 6px -1px rgba(255, 255, 255, 0.02), 0 2px 4px -1px rgba(255, 255, 255, 0.01)');
            root.style.setProperty('--box-shadow-lg', '0 10px 15px -3px rgba(255, 255, 255, 0.03), 0 4px 6px -2px rgba(255, 255, 255, 0.02)');
        } else if (theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(isDark ? 'dark' : 'light');
            return;
        }
    }

    // --- Password Protection Check ---
    function checkPasswordProtection() {
        const settings = JSON.parse(localStorage.getItem('diarySettings') || '{}');
        if (settings.passwordProtection && (settings.password || settings.pattern)) {
            const sessionAuth = sessionStorage.getItem('diaryAuth');
            if (!sessionAuth || sessionAuth !== 'authenticated') {
                showPasswordPrompt();
                return false;
            } else {
                applyStoredTheme();
                updateTopBarForMultiSelectView(false);
                setupScrollSelector(temperatureMinSelector, -20, 50, '°');
                setupScrollSelector(temperatureMaxSelector, -20, 50, '°');
                setupScrollSelector(airQualityIndexSelector, 0, 300, '', 5);
                setupScrollSelector(humidityPercentSelector, 1, 100, '%');
                initializeForm();
                slideToPanel(0, false);
            }
        } else {
            applyStoredTheme();
            updateTopBarForMultiSelectView(false);
            setupScrollSelector(temperatureMinSelector, -20, 50, '°');
            setupScrollSelector(temperatureMaxSelector, -20, 50, '°');
            setupScrollSelector(airQualityIndexSelector, 0, 300, '', 5);
            setupScrollSelector(humidityPercentSelector, 1, 100, '%');
            initializeForm();
            slideToPanel(0, false);
        }
        return true;
    }
    
    function showPasswordPrompt() {
        const settings = JSON.parse(localStorage.getItem('diarySettings') || '{}');
        const isPattern = settings.authType === 'pattern';
        
        const overlay = document.createElement('div');
        overlay.id = 'passwordOverlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(ellipse at center, #1e293b 0%, #0f172a 70%, #000000 100%);
            z-index: 10000; display: flex;
            align-items: center; justify-content: center; backdrop-filter: blur(10px);
        `;
        
        if (isPattern) {
            overlay.innerHTML = `
                <div style="
                    background: var(--secondary-bg); padding: 30px; border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3); max-width: 320px; width: 90%;
                    text-align: center;
                ">
                    <i class="fas fa-unlock-alt" style="font-size: 2.5rem; color: var(--accent-color); margin-bottom: 20px;"></i>
                    <h3 style="margin: 0 0 10px 0; color: var(--text-primary);">Draw Pattern</h3>
                    <p style="margin: 0 0 20px 0; color: var(--text-secondary); font-size: 0.9rem;">Draw your unlock pattern</p>
                    <div id="authPatternGrid" style="
                        display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
                        max-width: 150px; margin: 0 auto 20px;
                    "></div>
                    <div id="authPatternStatus" style="color: var(--text-secondary); font-size: 0.85rem;">Draw your pattern</div>
                </div>
            `;
            initAuthPatternGrid();
        } else {
            overlay.innerHTML = `
                <div style="
                    background: var(--secondary-bg); padding: 30px; border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3); max-width: 320px; width: 90%;
                    text-align: center;
                ">
                    <i class="fas fa-lock" style="font-size: 2.5rem; color: var(--accent-color); margin-bottom: 20px;"></i>
                    <h3 style="margin: 0 0 10px 0; color: var(--text-primary);">Enter Password</h3>
                    <p style="margin: 0 0 20px 0; color: var(--text-secondary); font-size: 0.9rem;">This diary is password protected</p>
                    <input type="password" id="passwordPrompt" placeholder="Enter password" style="
                        width: 100%; padding: 12px; border: 2px solid var(--tertiary-bg);
                        border-radius: 8px; background: var(--primary-bg); color: var(--text-primary);
                        font-size: 1rem; margin-bottom: 20px; box-sizing: border-box;
                    ">
                    <button onclick="verifyPassword()" style="
                        width: 100%; padding: 12px; background: var(--accent-color);
                        color: var(--primary-bg); border: none; border-radius: 8px;
                        font-weight: 600; cursor: pointer; font-size: 1rem;
                    ">Unlock</button>
                </div>
            `;
            
            document.getElementById('passwordPrompt').focus();
            document.getElementById('passwordPrompt').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') verifyPassword();
            });
        }
        
        document.body.appendChild(overlay);
        
        window.verifyPassword = () => {
            const enteredPassword = document.getElementById('passwordPrompt').value;
            if (enteredPassword === settings.password) {
                sessionStorage.setItem('diaryAuth', 'authenticated');
                overlay.remove();
                delete window.verifyPassword;
                applyStoredTheme();
                updateTopBarForMultiSelectView(false);
                setupScrollSelector(temperatureMinSelector, -20, 50, '°');
                setupScrollSelector(temperatureMaxSelector, -20, 50, '°');
                setupScrollSelector(airQualityIndexSelector, 0, 300, '', 5);
                setupScrollSelector(humidityPercentSelector, 1, 100, '%');
                initializeForm();
                slideToPanel(0, false);
            } else {
                document.getElementById('passwordPrompt').style.borderColor = 'var(--danger-color)';
                document.getElementById('passwordPrompt').value = '';
                document.getElementById('passwordPrompt').placeholder = 'Wrong password, try again';
                setTimeout(() => {
                    document.getElementById('passwordPrompt').style.borderColor = 'var(--tertiary-bg)';
                    document.getElementById('passwordPrompt').placeholder = 'Enter password';
                }, 2000);
            }
        };
    }
    
    // Pattern verification functions
    let authPattern = [];
    let authIsDrawing = false;
    
    function initAuthPatternGrid() {
        const grid = document.getElementById('authPatternGrid');
        for (let i = 1; i <= 9; i++) {
            const dot = document.createElement('div');
            dot.style.cssText = `
                width: 40px; height: 40px; border-radius: 50%; cursor: pointer;
                background: var(--secondary-bg); border: 2px solid var(--tertiary-bg);
                transition: all 0.2s ease; position: relative;
            `;
            dot.dataset.id = i;
            
            dot.addEventListener('mousedown', startAuthPattern);
            dot.addEventListener('mouseenter', addToAuthPattern);
            dot.addEventListener('mouseup', endAuthPattern);
            
            grid.appendChild(dot);
        }
    }
    
    function startAuthPattern(e) {
        e.preventDefault();
        authIsDrawing = true;
        authPattern = [];
        clearAuthPatternVisual();
        addAuthDotToPattern(e.target);
    }
    
    function addToAuthPattern(e) {
        if (authIsDrawing) addAuthDotToPattern(e.target);
    }
    
    function addAuthDotToPattern(dot) {
        const dotId = parseInt(dot.dataset.id);
        if (!authPattern.includes(dotId)) {
            authPattern.push(dotId);
            dot.style.background = 'var(--accent-color)';
            dot.style.borderColor = 'var(--accent-color)';
        }
    }
    
    function endAuthPattern() {
        if (authIsDrawing && authPattern.length >= 4) {
            verifyPattern();
        }
        authIsDrawing = false;
    }
    
    function verifyPattern() {
        const settings = JSON.parse(localStorage.getItem('diarySettings') || '{}');
        const savedPattern = settings.pattern;
        const enteredPattern = authPattern.join(',');
        
        if (enteredPattern === savedPattern) {
            sessionStorage.setItem('diaryAuth', 'authenticated');
            const overlay = document.getElementById('passwordOverlay');
            if (overlay) overlay.remove();
            applyStoredTheme();
            updateTopBarForMultiSelectView(false);
            setupScrollSelector(temperatureMinSelector, -20, 50, '°');
            setupScrollSelector(temperatureMaxSelector, -20, 50, '°');
            setupScrollSelector(airQualityIndexSelector, 0, 300, '', 5);
            setupScrollSelector(humidityPercentSelector, 1, 100, '%');
            initializeForm();
            slideToPanel(0, false);
        } else {
            document.getElementById('authPatternStatus').textContent = 'Wrong pattern, try again';
            document.getElementById('authPatternStatus').style.color = 'var(--danger-color)';
            setTimeout(() => {
                clearAuthPatternVisual();
                authPattern = [];
                document.getElementById('authPatternStatus').textContent = 'Draw your pattern';
                document.getElementById('authPatternStatus').style.color = 'var(--text-secondary)';
            }, 1500);
        }
    }
    
    function clearAuthPatternVisual() {
        document.querySelectorAll('#authPatternGrid > div').forEach(dot => {
            dot.style.background = 'var(--secondary-bg)';
            dot.style.borderColor = 'var(--tertiary-bg)';
        });
    }

    // --- Initial Application Setup ---
    
    // --- Mood Timeline Cascading Dropdowns ---
    const moodData = {
        positive_high_energy: ['happy', 'calm', 'peaceful', 'relaxed', 'content', 'motivated', 'energetic', 'confident', 'hopeful', 'satisfied'],
        neutral_balanced: ['neutral', 'normal', 'stable', 'okay', 'composed', 'indifferent'],
        low_energy_tired: ['tired', 'sleepy', 'exhausted', 'lazy', 'drained', 'dull'],
        negative_heavy: ['stressed', 'anxious', 'irritated', 'frustrated', 'overwhelmed', 'sad', 'low', 'lonely', 'bored'],
        cognitive_mental_states: ['focused', 'distracted', 'confused', 'overthinking', 'mentally_heavy', 'mentally_clear']
    };

    function setupMoodDropdown(categoryId, feelingId) {
        const categorySelect = document.getElementById(categoryId);
        const feelingSelect = document.getElementById(feelingId);
        
        if (!categorySelect || !feelingSelect) return;
        
        categorySelect.addEventListener('change', function() {
            const category = this.value;
            feelingSelect.innerHTML = '<option value="">Select Mood</option>';
            
            if (category && moodData[category]) {
                feelingSelect.disabled = false;
                moodData[category].forEach(mood => {
                    const option = document.createElement('option');
                    option.value = mood;
                    option.textContent = mood.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    feelingSelect.appendChild(option);
                });
            } else {
                feelingSelect.disabled = true;
            }
        });
    }

    setupMoodDropdown('morningMoodCategory', 'morningMoodFeeling');
    setupMoodDropdown('afternoonMoodCategory', 'afternoonMoodFeeling');
    setupMoodDropdown('eveningMoodCategory', 'eveningMoodFeeling');
    setupMoodDropdown('nightMoodCategory', 'nightMoodFeeling');
    
    checkPasswordProtection();

    // --- Enhanced PWA Features ---
    let deferredPrompt;
    let isAppInstalled = false;
    
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        isAppInstalled = true;
        console.log('App is running in standalone mode');
    }
    
    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('Install prompt available');
        e.preventDefault();
        deferredPrompt = e;
        
        if (!isAppInstalled) {
            showToastWithAction('Install app for better experience!', 'Install', () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted the install prompt');
                            showToast('App will be installed shortly!', 'success');
                        }
                        deferredPrompt = null;
                    });
                }
            });
        }
    });
    
    // Handle app installed event
    window.addEventListener('appinstalled', () => {
        console.log('App was installed');
        isAppInstalled = true;
        showToast('App installed successfully!', 'success');
        deferredPrompt = null;
    });
    
    // Service Worker Registration with enhanced features
    if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                    
                    // Check for updates periodically
                    setInterval(() => {
                        registration.update();
                    }, 60000); // Check every minute
                    
                    // Handle service worker updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('New service worker found');
                        
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showToastWithAction('New version available!', 'Update', () => {
                                    newWorker.postMessage({ action: 'skipWaiting' });
                                    window.location.reload();
                                });
                            }
                        });
                    });
                    
                    // Register for background sync
                    if ('sync' in window.ServiceWorkerRegistration.prototype) {
                        console.log('Background sync supported');
                    }
                    
                    // Request notification permission
                    if ('Notification' in window) {
                        const settings = JSON.parse(localStorage.getItem('diarySettings') || '{}');
                        if (settings.notifications && Notification.permission === 'default') {
                            setTimeout(() => {
                                showToastWithAction('Enable notifications for reminders?', 'Enable', () => {
                                    Notification.requestPermission().then(permission => {
                                        if (permission === 'granted') {
                                            showToast('Notifications enabled!', 'success');
                                            scheduleNotifications();
                                        } else {
                                            showToast('Notification permission denied', 'error');
                                            settings.notifications = false;
                                            localStorage.setItem('diarySettings', JSON.stringify(settings));
                                        }
                                    });
                                });
                            }, 5000);
                        } else if (settings.notifications && Notification.permission === 'granted') {
                            scheduleNotifications();
                        }
                    }
                })
                .catch(error => {
                    console.error('ServiceWorker registration failed:', error);
                });
        });
        
        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            console.log('Controller changed, reloading...');
            window.location.reload();
            refreshing = true;
        });
    }
    
    // Network status monitoring
    function updateOnlineStatus() {
        const isOnline = navigator.onLine;
        if (isOnline) {
            showToast('Back online! Data will sync.', 'success');
        } else {
            showToast('You\'re offline. Changes saved locally.', 'info');
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    function showToastWithAction(message, actionText, callback) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.classList.add('toast', 'info', 'toast-with-action');
        
        const content = document.createElement('div');
        content.classList.add('toast-content');
        
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        
        const actionButton = document.createElement('button');
        actionButton.classList.add('toast-action-button');
        actionButton.textContent = actionText;
        actionButton.onclick = () => {
            callback();
            toast.remove();
        };
        
        const dismissButton = document.createElement('button');
        dismissButton.classList.add('toast-dismiss-button');
        dismissButton.innerHTML = '×';
        dismissButton.onclick = () => toast.remove();
        
        content.appendChild(messageElement);
        content.appendChild(actionButton);
        toast.appendChild(content);
        toast.appendChild(dismissButton);
        
        if (toastContainer.firstChild) {
            toastContainer.insertBefore(toast, toastContainer.firstChild);
        } else {
            toastContainer.appendChild(toast);
        }
        
        // Auto-dismiss after 10 seconds for action toasts
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 10000);
    }

    // Notification scheduling functions
    function scheduleNotifications() {
        if (window.notificationTimeouts) {
            window.notificationTimeouts.forEach(timeout => clearTimeout(timeout));
        }
        window.notificationTimeouts = [];
        
        const settings = JSON.parse(localStorage.getItem('diarySettings') || '{}');
        if (!settings.notifications || Notification.permission !== 'granted') {
            return;
        }
        
        const notifications = settings.notificationsList || [];
        
        notifications.forEach(notification => {
            if (!notification.enabled) return;
            
            const [hours, minutes] = notification.time.split(':').map(Number);
            const now = new Date();
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes, 0, 0);
            
            if (scheduledTime <= now) {
                scheduledTime.setDate(scheduledTime.getDate() + 1);
            }
            
            const timeUntilNotification = scheduledTime.getTime() - now.getTime();
            
            const timeout = setTimeout(() => {
                showDiaryNotification(notification.label);
                setTimeout(scheduleNotifications, 1000);
            }, timeUntilNotification);
            
            window.notificationTimeouts.push(timeout);
        });
    }

    function showDiaryNotification(message) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }
        
        try {
            const notification = new Notification('My Personal Diary', {
                body: message,
                icon: 'images/logo256.png',
                badge: 'images/logo64.png',
                requireInteraction: false,
                silent: false,
                tag: 'diary-reminder'
            });
            
            setTimeout(() => notification.close(), 5000);
            
            notification.onclick = function() {
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }
});