document.addEventListener('DOMContentLoaded', () => {
    const tripsList = document.getElementById('tripsList')
    const createTripForm = document.getElementById('createTripForm')
    const addTripBtn = document.getElementById('addTripBtn')
    const editTripBtn = document.getElementById('editTripBtn')
    const tripNameInput = document.getElementById('tripName')
    const tripStartDateInput = document.getElementById('tripStartDate')
    const tripEndDateInput = document.getElementById('tripEndDate')
    const bagsLibrary = document.getElementById('bagsLibrary')
    const addBagBtn = document.getElementById('addBagBtn')
    const editBagBtn = document.getElementById('editBagBtn')
    const bagNameInput = document.getElementById('bagName')
    const bagWeightInput = document.getElementById('bagWeight')
    const bagWeightLimitInput = document.getElementById('bagWeightLimit')
    const bagDescriptionInput = document.getElementById('bagDescription')
    const itemsLibrary = document.getElementById('itemsLibrary')
    const addItemBtn = document.getElementById('addItemBtn')
    const editItemBtn = document.getElementById('editItemBtn')
    const itemNameInput = document.getElementById('itemName')
    const itemAmountInput = document.getElementById('itemAmount')
    const itemWeightInput = document.getElementById('itemWeight')
    const itemPriorityInput = document.getElementById('itemPriority')
    const itemCategoryInput = document.getElementById('itemCategory')
    const itemSubcategoryInput = document.getElementById('itemSubcategory')
    const itemBagInput = document.getElementById('itemBag')
    const selectedTripName = document.getElementById('selectedTripName')
    const selectedTripDates = document.getElementById('tripDates')
    const bagsTableContainer = document.getElementById('tripBags')
    const addBagForm = document.getElementById('addBagForm')
    const addItemForm = document.getElementById('addItemForm')
    const editEntries = document.getElementById('editEntries')
    let trips = JSON.parse(localStorage.getItem('tripList')) || []
    let bagsLibraryData = JSON.parse(localStorage.getItem('bagsLibrary')) || []
    let itemsLibraryData = JSON.parse(localStorage.getItem('itemsLibrary')) || []
    let currentTrip = null
    let currentTripIdForEditing = null
    let currentBagNameForEditing = null
    let currentItemNameForEditing = null



    /* UTILITY FUNCTIONS */

    function sortByName(array) {
        return array.sort((a, b) => {
            // Extract the text, number, and suffix for each item
            const regex = /^(\D+)(\d+)?(.*)?$/ // Match text, optional number, and optional remaining text
            const [, aText, aNum, aSuffix] = a.name.match(regex) || []
            const [, bText, bNum, bSuffix] = b.name.match(regex) || []

            // First, compare the main text part (e.g., "iPhone", "Samsung T7", "USB-C Cable")
            const textCompare = aText.trim().toLowerCase().localeCompare(bText.trim().toLowerCase())
            if (textCompare !== 0) {
                return textCompare
            }

            // If the text part is the same, compare the numeric part (e.g., "6", "12", "13")
            const numCompare = (aNum || 0) - (bNum || 0)
            if (numCompare !== 0) {
                return numCompare
            }

            // If the number is the same, compare the remaining suffix (e.g., "Pro", "Plus", "Max")
            return (aSuffix || "").trim().toLowerCase().localeCompare((bSuffix || "").trim().toLowerCase())
        })
    }

    function formatDate(dateString) {
        const date = new Date(dateString)

        // Options for the day of the week and month
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }

        // Format date parts
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
        const month = date.toLocaleDateString('en-US', { month: 'long' })
        const day = date.getDate()
        const year = date.getFullYear()

        // Function to add ordinal suffix (st, nd, rd, th)
        function getOrdinalSuffix(day) {
            if (day > 3 && day < 21) return 'th' // For 11th to 19th
            switch (day % 10) {
                case 1: return 'st'
                case 2: return 'nd'
                case 3: return 'rd'
                default: return 'th'
            }
        }

        const ordinalSuffix = getOrdinalSuffix(day)

        // Return formatted string
        return `${dayOfWeek}, ${month} ${day} ${year}`
        // return `${dayOfWeek}, ${month} ${day}${ordinalSuffix} ${year}`
    }

    function generateUUID() {
        return self.crypto.randomUUID()
    }

    function filterLibrary(inputId, libraryId) {
        const input = document.getElementById(inputId)
        const library = document.getElementById(libraryId)
        const entries = library.getElementsByClassName('library-entry')

        input.addEventListener('input', function () {
            const filter = input.value.toLowerCase()

            Array.from(entries).forEach(entry => {
                const text = entry.textContent.toLowerCase()
                const entryCategory = entry.getAttribute('data-category').toLowerCase()
                if (text.includes(filter) || entryCategory.includes(filter)) {
                    entry.style.display = ''
                } else {
                    entry.style.display = 'none'
                }
            })
        })
    }

    filterLibrary('searchBags', 'bagsLibrary')
    filterLibrary('searchItems', 'itemsLibrary')


    /* ####################### */
    /* AUTO COMPLETE FUNCTIONS */
    /* ####################### */

    // Fetch the JSON data for autocomplete
    let itemsDatabase = []
    let bagsDatabase = []

    const LOCAL_STORAGE_KEY_ITEMS = 'itemsDatabase'
    const LOCAL_STORAGE_KEY_BAGS = 'bagsDatabase'
    const LOCAL_STORAGE_KEY_ITEMS_TIMESTAMP = 'itemsDatabaseTimestamp'
    const LOCAL_STORAGE_KEY_BAGS_TIMESTAMP = 'bagsDatabaseTimestamp'
    const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

    function fetchAndCache(url, storageKey, timestampKey) {
        return fetch(url)
            .then(response => response.json())
            .then(data => {
                localStorage.setItem(storageKey, JSON.stringify(data))
                localStorage.setItem(timestampKey, Date.now())
                return data
            })
    }

    function loadData(url, storageKey, timestampKey) {
        const cachedData = localStorage.getItem(storageKey)
        const cachedTimestamp = localStorage.getItem(timestampKey)
        const currentTime = Date.now()

        if (cachedData && cachedTimestamp && (currentTime - cachedTimestamp < CACHE_DURATION_MS)) {
            // Use cached data
            // console.log("Using cached data.")
            return Promise.resolve(JSON.parse(cachedData))
        } else {
            // Fetch new data and cache it
            // console.log("Using new data.")
            return fetchAndCache(url, storageKey, timestampKey)
        }
    }

    function populateItemDatalist(itemsDatabase, itemsLibraryData) {
        const itemDatalist = document.getElementById('itemNameSuggestions')
        itemDatalist.innerHTML = '' // Clear previous options

        // Populate user's library first
        itemsLibraryData.forEach(item => {
            const option = document.createElement('option')
            option.value = item.name
            itemDatalist.appendChild(option)
        })

        // Populate database items next
        itemsDatabase.forEach(item => {
            if (!itemsLibraryData.some(userItem => userItem.name === item.name)) {
                const option = document.createElement('option')
                option.value = item.name
                itemDatalist.appendChild(option)
            }
        })
    }

    function populateBagDatalist(bagsDatabase, bagsLibraryData) {
        const bagDatalist = document.getElementById('bagNameSuggestions')
        bagDatalist.innerHTML = '' // Clear previous options

        // Populate user's library first
        bagsLibraryData.forEach(bag => {
            const option = document.createElement('option')
            option.value = bag.name
            bagDatalist.appendChild(option)
        })

        // Populate database bags next
        bagsDatabase.forEach(bag => {
            if (!bagsLibraryData.some(userBag => userBag.name === bag.name)) {
                const option = document.createElement('option')
                option.value = bag.name
                bagDatalist.appendChild(option)
            }
        })
    }

    // Load and populate data for items
    loadData('itemdb.json', LOCAL_STORAGE_KEY_ITEMS, LOCAL_STORAGE_KEY_ITEMS_TIMESTAMP)
        .then(itemsDatabase => {
            populateItemDatalist(itemsDatabase, itemsLibraryData)
            // Set up autocomplete selection for items
            itemNameInput.addEventListener('input', () => {
                const selectedItem = itemsLibraryData.find(item => item.name === itemNameInput.value)
                    || itemsDatabase.find(item => item.name === itemNameInput.value)
                if (selectedItem) {
                    itemWeightInput.value = selectedItem.weight
                    itemCategoryInput.value = selectedItem.category
                    itemSubcategoryInput.value = selectedItem.subcategory
                }
            })
        })

    // Load and populate data for bags
    loadData('bagdb.json', LOCAL_STORAGE_KEY_BAGS, LOCAL_STORAGE_KEY_BAGS_TIMESTAMP)
        .then(bagsDatabase => {
            populateBagDatalist(bagsDatabase, bagsLibraryData)
            // Set up autocomplete selection for bags
            bagNameInput.addEventListener('input', () => {
                const selectedBag = bagsLibraryData.find(bag => bag.name === bagNameInput.value)
                    || bagsDatabase.find(bag => bag.name === bagNameInput.value)
                if (selectedBag) {
                    bagWeightInput.value = selectedBag.weight
                    bagDescriptionInput.value = selectedBag.description
                    // bagWeightLimitInput.value = selectedBag.weightLimit;
                }
            })
        })

    // Autocomplete selection for items
    itemNameInput.addEventListener('input', () => {
        const selectedItem = itemsLibraryData.find(item => item.name === itemNameInput.value)
            || itemsDatabase.find(item => item.name === itemNameInput.value)
        if (selectedItem) {
            itemWeightInput.value = selectedItem.weight
            itemCategoryInput.value = selectedItem.category
            itemSubcategoryInput.value = selectedItem.subcategory
        }
    })

    // Autocomplete selection for bags
    bagNameInput.addEventListener('input', () => {
        const selectedBag = bagsLibraryData.find(bag => bag.name === bagNameInput.value)
            || bagsDatabase.find(bag => bag.name === bagNameInput.value)
        if (selectedBag) {
            bagWeightInput.value = selectedBag.weight
            // bagDescriptionInput.value = selectedBag.description;
            // bagWeightLimitInput.value = selectedBag.weightLimit;
        }
    })



    /* RENDER FUNCTIONS */
    function renderTrips() {
        if (trips.length !== 0) {
            tripsList.innerHTML = ''
            trips.forEach(trip => {
                const li = document.createElement('li')
                li.textContent = trip.name
                li.setAttribute('data-uuid', trip.uuid)
                li.classList.add('tooltip')

                const tooltip = document.createElement('span')
                tooltip.classList.add('tooltip-text')
                tooltip.innerHTML = `
                    <h3 style='grid-column:span 2'>${trip.name}</h3>
                    <span class='tooltip-entry'>Start:</span><span>${trip.startDate || 'Not specified.'}</span>
                    <span class='tooltip-entry'>End:</span><span>${trip.endDate || 'Not specified.'}</span>
                `
                li.appendChild(tooltip)

                // Create a "Remove Trip" button
                const removeTripButton = document.createElement('button')
                const trashCan = document.createElement("i")
                trashCan.classList.add("fa-solid", "fa-trash-can")
                removeTripButton.appendChild(trashCan)
                removeTripButton.classList.add('remove-trip-button')
                removeTripButton.addEventListener('click', (e) => {
                    e.stopPropagation() // Prevent click from bubbling to the li
                    removeTrip(trip.uuid, trip.name)
                })

                li.appendChild(removeTripButton)
                li.addEventListener('click', () => {
                    loadTrip(trip)
                    currentTripIdForEditing = trip.uuid // Store the selected trip ID for editing
                })
                tripsList.appendChild(li)
            })
        } else {
            tripsList.innerHTML = "No trips yet."
            createTripForm.showModal()
            tripNameInput.focus()
        }
    }

    function renderBagsLibrary() {
        bagsLibrary.innerHTML = 'No bags in your library yet.'
        if (bagsLibraryData.length !== 0) {
            // Sort bags by name
            const sortedBags = sortByName(bagsLibraryData)
            bagsLibrary.innerHTML = ''
            sortedBags.forEach((bag, index) => {
                const div = document.createElement('div')
                div.classList.add('library-entry', 'tooltip')
                const tooltip = document.createElement('span')
                tooltip.classList.add('tooltip-text')
                tooltip.innerHTML = `
                    <h3 style='grid-column:span 2'>${bag.name}</h3>
                    <span class='tooltip-entry'>Description:</span><span>${bag.description || 'No description added.'}</span>
                    <span class='tooltip-entry'>Weight:</span><span>${bag.weight} g</span>
                    <span class='tooltip-entry'>Weight Limit:</span><span>${bag.weightLimit || 'No limit specified'} ${bag.weightLimit ? ' g' : ''}</span>
                `
                div.appendChild(tooltip)
                const divName = document.createElement('div')
                divName.textContent = `${bag.name}`
                div.appendChild(divName)

                // Create remove button with trashcan icon
                const removeBtn = document.createElement('button')
                const trashCan = document.createElement('i')
                trashCan.classList.add('fa-solid', 'fa-trash-can')
                removeBtn.appendChild(trashCan)
                removeBtn.classList.add('remove-bag-button')
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation() // Prevent click from bubbling to the div
                    removeBagFromLibrary(index)
                })

                div.appendChild(removeBtn)
                div.addEventListener('click', () => {
                    addBagForm.showModal()
                    addBagBtn.focus()
                    currentBagNameForEditing = bag.name // Store the selected bag name for editing
                    bagNameInput.value = bag.name
                    bagWeightInput.value = bag.weight
                    bagWeightLimitInput.value = bag.weightLimit || ''
                    bagDescriptionInput.value = bag.description || ''
                })
                bagsLibrary.appendChild(div)
            })
        }
    }

    function renderItemsLibrary() {
        itemsLibrary.innerHTML = 'No items in your library yet.'
        if (itemsLibraryData.length !== 0) {
            // Sort items by name
            const sortedItems = sortByName(itemsLibraryData)
            itemsLibrary.innerHTML = ''
            sortedItems.forEach((item, index) => {
                const div = document.createElement('div')
                div.classList.add('library-entry', 'tooltip')
                const tooltip = document.createElement('span')
                tooltip.classList.add('tooltip-text')
                tooltip.innerHTML = `
                    <h3 style='grid-column:span 2'>${item.name}</h3>
                    <span class='tooltip-entry'>Weight:</span><span>${item.weight} g</span>
                    <span class='tooltip-entry'>Category:</span><span>${item.category || 'No category specified.'}</span>
                    <span class='tooltip-entry'>Subcategory:</span><span>${item.subcategory || 'No subcategory specified'}</span>
                `
                div.appendChild(tooltip)
                div.setAttribute('data-category', item.category)
                const divName = document.createElement('div')
                divName.textContent = `${item.name}`
                div.appendChild(divName)

                // Create remove button with trashcan icon
                const removeBtn = document.createElement('button')
                const trashCan = document.createElement('i')
                trashCan.classList.add('fa-solid', 'fa-trash-can')
                // trashCan.innerText = 'X'
                removeBtn.appendChild(trashCan)
                removeBtn.classList.add('remove-item-button')
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation() // Prevent click from bubbling to the div
                    removeItemFromLibrary(index)
                })

                div.appendChild(removeBtn)
                div.addEventListener('click', () => {
                    addItemForm.showModal()
                    addItemBtn.focus()
                    currentItemNameForEditing = item.name
                    itemNameInput.value = item.name
                    itemAmountInput.value = item.amount
                    itemWeightInput.value = item.weight
                    itemPriorityInput.value = item.priority
                    itemCategoryInput.value = item.category
                    itemSubcategoryInput.value = item.subcategory
                })
                itemsLibrary.appendChild(div)
            })
        }
    }

    function renderBagsTable() {
        bagsTableContainer.innerHTML = ''
        if (currentTrip.bags.length != 0) {
            currentTrip.bags.forEach(bag => {
                const totalBagWeight = bag.weight + bag.items.reduce((acc, item) => acc + (item.weight * item.amount), 0)

                const bagTable = document.createElement('section')
                const caption = document.createElement('div')
                const toggle = document.createElement('input')
                const toggleLabel = document.createElement('label')
                toggle.type = "checkbox"
                toggle.id = `toggle-${bag.id}`
                toggle.style.display = 'none'
                toggle.classList.add('bag-toggle-checkbox')
                toggleLabel.classList.add('bag-toggle')
                toggleLabel.setAttribute("for", `toggle-${bag.id}`)
                // toggle.style.display = 'none';
                caption.classList.add("bag-caption")
                var totalBagWeightHighlight = ""
                if (bag.weightLimit !== null) {

                    // Warning highlight color if the total weight is between 90% and 100% of the user specified bag weight limit
                    if (bag.weightLimit * 0.9 <= totalBagWeight && totalBagWeight <= bag.weightLimit) {
                        totalBagWeightHighlight = "highlight-warning"
                        // Alert highlight color if total weight is above user specified bag weight limit
                    } else if (totalBagWeight > bag.weightLimit) {
                        totalBagWeightHighlight = "highlight-alert"
                    }
                    caption.innerHTML = `<div>${bag.name.replace(/(#[0-9]+)$/, '')} <span class="bag-index">${bag.name.match(/(#[0-9]+)$/)?.[0] || ''}</span> (${bag.weight} g)</div><span class="empty-bag">Bag is empty</span><span class="loaded-bag">Total Weight: <span class="${totalBagWeightHighlight}">${totalBagWeight}</span>/${bag.weightLimit} g</span>`
                } else {
                    caption.innerHTML = `<div>${bag.name.replace(/(#[0-9]+)$/, '')} <span class="bag-index">${bag.name.match(/(#[0-9]+)$/)?.[0] || ''}</span> (${bag.weight} g)</div><span class="empty-bag">Bag is empty</span><span class="loaded-bag">Total Weight: ${totalBagWeight} g</span>`

                }

                const removeBagCheckbox = document.createElement('input')
                removeBagCheckbox.type = 'checkbox'
                removeBagCheckbox.id = `confirm-${bag.id}`
                removeBagCheckbox.style.display = 'none'
                removeBagCheckbox.classList.add('remove-bag-checkbox')

                const removeBagConfirm = document.createElement('label')
                removeBagConfirm.setAttribute("for", `confirm-${bag.id}`)
                removeBagConfirm.innerHTML = '<i class="fa-solid fa-square-check"></i>'
                removeBagConfirm.classList.add('remove-bag-confirm')

                const removeBagCancel = document.createElement('label')
                removeBagCancel.setAttribute("for", `confirm-${bag.id}`)
                removeBagCancel.innerHTML = '<i class="fa-solid fa-rectangle-xmark"></i>'
                removeBagCancel.classList.add('remove-bag-cancel')

                const removeBagText = document.createElement('p')
                removeBagText.classList.add('remove-bag-text')
                removeBagText.textContent = 'Delete this bag forever?'

                const removeBagButton = document.createElement('label')
                removeBagButton.setAttribute("for", `confirm-${bag.id}`)
                var trashCan = document.createElement("i")
                trashCan.classList.add("fa-solid")
                trashCan.classList.add("fa-trash-can")

                removeBagButton.appendChild(trashCan)
                removeBagButton.classList.add('remove-bag-button')
                removeBagConfirm.addEventListener('click', () => removeBagFromTrip(bag.id, bag.name))

                bagTable.appendChild(caption)

                caption.appendChild(toggle)
                caption.appendChild(toggleLabel)
                caption.appendChild(removeBagCheckbox)
                caption.appendChild(removeBagConfirm)
                caption.appendChild(removeBagCancel)
                caption.appendChild(removeBagText)
                caption.appendChild(removeBagButton)

                // Enable the table (bag) as a drop zone
                bagTable.setAttribute('data-bag', bag.id)
                bagTable.classList.add('drop-zone')
                bagTable.addEventListener('dragover', handleDragOver)
                bagTable.addEventListener('drop', handleDrop)
                bagTable.addEventListener('dragleave', handleDragLeave)

                // Create table header
                // if (bag.items.length !== 0) {    
                const headerRow = document.createElement('article')
                headerRow.classList.add('header-row')
                headerRow.innerHTML = `
                    <div class="drag-handle-header"></div>
                    <div class="item-name">Item</div>
                    <div class="item-amount">Amount</div>
                    <div class="item-weight">Weight (g)</div>
                    <div class="item-total-weight">Total (g)</div>
                    <div class="item-priority">Prio</div>
                    <div class="item-category">Category</div>
                    <div class="item-subcategory">Subcategory</div>
                    <div class="remove-item"></div>
                    `
                bagTable.appendChild(headerRow)


                // Add items to the table
                bag.items.forEach(item => {
                    const itemRow = document.createElement('article')
                    itemRow.setAttribute('data-bag', bag.id)
                    itemRow.setAttribute('data-item', item.id)
                    itemRow.addEventListener('dragstart', handleDragStart)

                    const totalItemWeight = item.amount * item.weight

                    itemRow.innerHTML = `
                            <div class="drag-handle" draggable="true"><i class="fa-solid fa-up-down-left-right"></i></div>
                            <div class="item-name">${item.name}</div>
                            <div class="item-amount">${item.amount}x</div>
                            <div class="item-weight">${item.weight}</div>
                            <div class="item-total-weight">${totalItemWeight}</div>
                            <div class="item-priority">${item.priority}</div>
                            <div class="item-category">${item.category}</div>
                            <div class="item-subcategory">${item.subcategory || 'None'}</div>
                            <div><button class="remove-item-button"><i class="fa-solid fa-trash-can"></i></button></div>
                        `

                    itemRow.querySelector('.remove-item-button').addEventListener('click', () => {
                        bag.items = bag.items.filter(i => i.id !== item.id)
                        saveToLocalStorage()
                        renderBagsTable()
                    })

                    bagTable.appendChild(itemRow)
                })

                bagsTableContainer.appendChild(bagTable)

                const article = document.createElement('article')
                article.classList.add('row-add-item')
                const div1 = document.createElement('div')
                const div2 = document.createElement('div')
                const button = document.createElement('button')
                button.className = 'modal-button'
                button.dataset.bag = bag.id
                button.textContent = 'Add Item'
                button.onclick = function () {
                    itemBagInput.value = bag.id
                    editEntries.checked = false
                    addItemForm.showModal()
                }
                div2.appendChild(button)
                article.appendChild(div1)
                article.appendChild(div2)
                bagTable.appendChild(article)
            })
        }
        attachDragEvents()
    }


    /* ################ */
    /* REMOVE FUNCTIONS */
    /* ################ */
    function removeTrip(tripUUID, tripName) {
        const confirmRemoval = confirm(`Are you sure you want to remove the trip "${tripName}"?`)
        if (confirmRemoval) {
            // Remove the trip by UUID
            trips = trips.filter(trip => trip.uuid !== tripUUID)

            saveToLocalStorage()
            renderTrips()

            // Clear the current trip if it was removed
            if (currentTrip && currentTrip.uuid === tripUUID) {
                currentTrip = null
                document.getElementById('tripBags').innerHTML = ''
            }
        }
    }

    function removeBagFromLibrary(index) {
        bagsLibraryData.splice(index, 1)
        saveToLocalStorage()
        renderBagsLibrary()
    }

    function removeItemFromLibrary(index) {
        itemsLibraryData.splice(index, 1)
        saveToLocalStorage()
        renderItemsLibrary()
    }

    function removeBagFromTrip(bagId) {
        currentTrip.bags = currentTrip.bags.filter(bag => bag.id !== bagId)
        saveToLocalStorage()
        removeBagFromDOM(bagId)
        updateBagDropdown()
    }







    /* ########################### */
    /* DRAG AND DROP FUNCTIONALITY */
    /* ########################### */
    let draggedItem = null
    let dragImage = null

    // Function to handle drag start
    function handleDragStart(event) {
        draggedItem = {
            itemId: event.target.parentNode.getAttribute('data-item'),
            fromBag: event.target.parentNode.getAttribute('data-bag')
        }

        // Create a custom drag image element
        if (!dragImage) {
            dragImage = document.createElement('div')
            dragImage.style.position = 'absolute'
            dragImage.style.pointerEvents = 'none' // Prevent the drag image from interfering with other events
            dragImage.style.background = 'rgba(0, 0, 0, 0.2)' // Optional: background color
            dragImage.style.border = '1px solid #000' // Optional: border
            dragImage.style.padding = '5px' // Optional: padding
            document.body.appendChild(dragImage)
        }

        // Set the content of the custom drag image
        dragImage.textContent = event.target.parentNode.querySelector('.item-name').textContent

        // Set the drag image
        event.dataTransfer.setDragImage(dragImage, 0, 0)

        // Apply opacity to the parent node
        event.target.parentNode.style.opacity = '0.5'
    }

    // Function to handle drag end
    function handleDragEnd(event) {
        // Reset opacity of the parent node
        event.target.parentNode.style.opacity = '1'

        // Remove the custom drag image
        if (dragImage) {
            document.body.removeChild(dragImage)
            dragImage = null
        }
    }

    // Function to handle drag over (allows dropping)
    function handleDragOver(event) {
        event.preventDefault()
        event.currentTarget.classList.add('drag-over') // Add a class to highlight drop zone
    }

    // Function to handle drag leave (when dragging out of a drop zone)
    function handleDragLeave(event) {
        event.currentTarget.classList.remove('drag-over') // Remove highlight
    }

    // Function to handle the drop event
    function handleDrop(event) {
        event.preventDefault()

        const targetBag = event.currentTarget.getAttribute('data-bag')
        if (draggedItem && draggedItem.fromBag !== targetBag) {
            // Move the item to the target bag
            const fromBag = currentTrip.bags.find(bag => bag.id === draggedItem.fromBag)
            const toBag = currentTrip.bags.find(bag => bag.id === targetBag)

            const itemToMove = fromBag.items.find(item => item.id === draggedItem.itemId)
            if (itemToMove) {
                // Remove item from the original bag
                fromBag.items = fromBag.items.filter(item => item.id !== draggedItem.itemId)

                // Add the item to the target bag
                toBag.items.push(itemToMove)

                // Save changes to local storage and re-render tables
                saveToLocalStorage()
                renderBagsTable()
            }
        }
        draggedItem = null // Clear dragged item

        // Remove highlight from the drop zone
        event.currentTarget.classList.remove('drag-over')
    }

    // Attach the drag events to items
    function attachDragEvents() {
        document.querySelectorAll('[data-item]').forEach(item => {
            item.addEventListener('dragstart', handleDragStart)
            item.addEventListener('dragend', handleDragEnd) // Attach dragend event
        })
    }




    /* ############################# */
    /* IMPORTING/EXPORTING FUNCTIONS */
    /* ############################# */

    const exportTripsBtn = document.getElementById('exportTripsBtn')
    const importTripsFileInput = document.getElementById('importTripsFile')

    // Export trips to a JSON file
    exportTripsBtn.addEventListener('click', () => {
        const tripsData = { trips }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tripsData))
        const downloadAnchor = document.createElement('a')
        downloadAnchor.setAttribute("href", dataStr)
        downloadAnchor.setAttribute("download", "trips.json")
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        downloadAnchor.remove()
    })

    // Import trips from a JSON file
    importTripsFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = function (e) {
                try {
                    const importedData = JSON.parse(e.target.result)

                    if (importedData.trips && Array.isArray(importedData.trips)) {
                        trips = importedData.trips

                        saveToLocalStorage()
                        renderTrips()
                        alert('Trips imported successfully!')
                    } else {
                        alert('Invalid file format.')
                    }
                } catch (error) {
                    alert('Error reading file: ' + error.message)
                }
            }
            reader.readAsText(file)
        }
    })


    const exportBtn = document.getElementById('exportBtn')
    const importFileInput = document.getElementById('importFile')

    // Export function: Converts libraries to JSON and downloads the file
    exportBtn.addEventListener('click', () => {
        const librariesData = {
            bagsLibrary: bagsLibraryData,
            itemsLibrary: itemsLibraryData
        }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(librariesData))
        const downloadAnchor = document.createElement('a')
        downloadAnchor.setAttribute("href", dataStr)
        downloadAnchor.setAttribute("download", "travel_libraries.json")
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        downloadAnchor.remove()
    })

    // Import function: Reads JSON file and updates the libraries
    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = function (e) {
                try {
                    const importedData = JSON.parse(e.target.result)

                    // Validate and merge or replace the libraries
                    if (importedData.bagsLibrary && importedData.itemsLibrary) {
                        bagsLibraryData = importedData.bagsLibrary
                        itemsLibraryData = importedData.itemsLibrary
                        saveToLocalStorage()
                        renderBagsLibrary()
                        renderItemsLibrary()
                        alert('Libraries imported successfully!')
                    } else {
                        alert('Invalid file format.')
                    }
                } catch (error) {
                    alert('Error reading file: ' + error.message)
                }
            }
            reader.readAsText(file)
        }
    })




    function saveToLocalStorage() {
        localStorage.setItem('tripList', JSON.stringify(trips))
        localStorage.setItem('bagsLibrary', JSON.stringify(bagsLibraryData))
        localStorage.setItem('itemsLibrary', JSON.stringify(itemsLibraryData))
    }

    function loadTrip(trip) {
        currentTrip = trip

        // Remove 'selected-trip' class from all trips
        const tripItems = tripsList.querySelectorAll('li')
        tripItems.forEach(item => item.classList.remove('selected-trip'))

        // Find the list item by UUID and add the 'selectedTrip' class
        const selectedTripItem = Array.from(tripItems).find(item => item.getAttribute('data-uuid') === trip.uuid)
        if (selectedTripItem) {
            selectedTripItem.classList.add('selected-trip')
        }

        tripNameInput.value = ''
        tripStartDateInput.value = ''
        tripEndDateInput.value = ''
        renderBagsTable()
        renderBagsLibrary()
        renderItemsLibrary()
        updateBagDropdown()

        selectedTripDates.innerHTML = ''

        if (trip.startDate) {
            const tripStartDate = new Date(trip.startDate)
            const tripEndDate = new Date(trip.endDate)
            const currentDate = new Date()
            const timeDiff = tripStartDate - currentDate
            const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
            const dayOrDays = Math.abs(daysRemaining) === 1 ? 'day' : 'days'

            if (daysRemaining > 0) {
                selectedTripName.innerText = `${trip.name}\n(in ${daysRemaining} ${dayOrDays})`
            } else if (daysRemaining === 0) {
                selectedTripName.textContent = `${currentTrip.name} (Today!)`
            } else {
                selectedTripName.textContent = `${currentTrip.name} (${Math.abs(daysRemaining)} ${dayOrDays} ago)`
            }
            selectedTripDates.innerHTML = `<div><span class="trip-start-end">Start</span><br>${formatDate(tripStartDate)}</div><div><span class="trip-start-end">End</span><br>${formatDate(tripEndDate)}</div>`
            // selectedTripDates.innerText = `${formatDate(tripStartDate)} - ${formatDate(tripEndDate)}`
            // selectedTripDates.innerText = `${trip.startDate} - ${trip.endDate}`
        } else {
            selectedTripName.innerText = `${trip.name}`
        }
        if (document.getElementById('editEntries').checked) {
            tripNameInput.value = trip.name
            tripStartDateInput.value = trip.startDate
            tripEndDateInput.value = trip.endDate
            createTripForm.showModal()
            // return
        }
    }

    // Close the dialog when clicking outside of it
    createTripForm.addEventListener('click', (event) => {
        if (event.target === createTripForm) {
            createTripForm.close()
        }
    })

    // Close the dialog when clicking outside of it
    addBagForm.addEventListener('click', (event) => {
        if (event.target === addBagForm) {
            addBagForm.close()
        }
    })

    // Close the dialog when clicking outside of it
    addItemForm.addEventListener('click', (event) => {
        if (event.target === addItemForm) {
            addItemForm.close()
        }
    })



    // FUNCTION TO DISALLOW SETTING END DATE BEFORE START DATE
    document.getElementById('tripStartDate').addEventListener('change', function () {
        const startDate = this.value
        const endDateInput = document.getElementById('tripEndDate')

        // Set the minimum value of the end date input to the start date
        endDateInput.min = startDate

        // Optional: if the currently selected end date is before the start date, reset it
        if (endDateInput.value && endDateInput.value < startDate) {
            endDateInput.value = startDate
        }
    })

    addTripBtn.addEventListener('click', () => {
        const tripName = tripNameInput.value
        const startDate = tripStartDateInput.value
        const endDate = tripEndDateInput.value

        if (tripName) {
            const newTrip = {
                uuid: generateUUID(),
                name: tripName,
                startDate,
                endDate,
                bags: []
            }
            trips.push(newTrip)
            saveToLocalStorage()
            renderTrips()
            tripNameInput.value = ''
            tripStartDateInput.value = ''
            tripEndDateInput.value = ''
            createTripForm.close()
            loadTrip(newTrip)
        }
    })

    editTripBtn.addEventListener('click', () => {
        if (!currentTripIdForEditing) return // Ensure a trip is selected for editing

        const updatedTripName = tripNameInput.value.trim()
        const updatedStartDate = tripStartDateInput.value || null
        const updatedEndDate = tripEndDateInput.value || null

        // Find the trip by its uuid
        const tripIndex = trips.findIndex(trip => trip.uuid === currentTripIdForEditing)

        if (tripIndex !== -1) {
            // Update the trip details
            trips[tripIndex].name = updatedTripName
            trips[tripIndex].startDate = updatedStartDate
            trips[tripIndex].endDate = updatedEndDate

            saveToLocalStorage()
            renderTrips()
            loadTrip(trips[tripIndex])

            currentTripIdForEditing = null
            tripNameInput.value = ''
            tripStartDateInput.value = ''
            tripEndDateInput.value = ''
            createTripForm.close()
        } else {
            console.error("Trip to edit was not found.")
        }
    })

    addBagBtn.addEventListener('click', () => {
        if (!currentTrip) return

        const bagName = bagNameInput.value.trim()
        const weight = parseFloat(bagWeightInput.value)
        const weightLimit = parseFloat(bagWeightLimitInput.value) || null
        const description = bagDescriptionInput.value || ''

        if (!bagName) {
            bagNameInput.focus()
            addBagBtn.setAttribute("data-after", "Please enter a bag name!")
            bagNameInput.addEventListener("input", () => {
                addBagBtn.setAttribute("data-after", "")
            })
        } else if (!weight) {
            bagWeightInput.focus()
            addBagBtn.setAttribute("data-after", "Please enter a valid weight!")
            bagWeightInput.addEventListener("input", () => {
                addBagBtn.setAttribute("data-after", "")
            })
        }

        if (bagName && weight) {
            let bagNameWithIndex = bagName
            let index = 1

            // Check for existing bags with the same name in the current trip
            const matchingBags = currentTrip.bags.filter(bag => bag.name.startsWith(bagName))

            if (matchingBags.length > 0) {
                // Increment index for the new bag
                index = matchingBags.length + 1

                // Rename existing bags by appending #1, #2, etc.
                matchingBags.forEach((bag, i) => {
                    bag.name = `${bagName} #${i + 1}`
                })

                // Assign the new bag name with the next index
                bagNameWithIndex = `${bagName} #${index}`
            }

            // Create the new bag object
            const bag = {
                id: generateUUID(),
                name: bagNameWithIndex,
                weight,
                weightLimit,
                description,
                items: []
            }

            // Create a copy of the bag without the id to store in bagsLibraryData
            const bagForLibrary = { ...bag }
            delete bagForLibrary.id // Remove the id for storage

            // Add to the bagsLibrary if it doesn't already exist
            if (!bagsLibraryData.some(existingBag => existingBag.name === bagName)) {
                bagsLibraryData.push(bagForLibrary)
                bagsLibraryData = sortByName(bagsLibraryData) // Sort after addition
                saveToLocalStorage()
                renderBagsLibrary()
            }

            // Add the new bag to the current trip
            currentTrip.bags.push(bag)
            saveToLocalStorage()
            addBagToDOM(bag)
            updateBagDropdown(bag.id)
            addBagForm.close()

            // Clear inputs
            bagNameInput.value = ''
            bagWeightInput.value = ''
            bagWeightLimitInput.value = ''
            bagDescriptionInput.value = ''
        }
    })

    function addBagToDOM(bag) {
        const totalBagWeight = bag.weight + bag.items.reduce((acc, item) => acc + (item.weight * item.amount), 0)

        const bagTable = document.createElement('section')
        const caption = document.createElement('div')
        const toggle = document.createElement('input')
        const toggleLabel = document.createElement('label')
        toggle.type = "checkbox"
        toggle.id = `toggle-${bag.id}`
        toggle.style.display = 'none'
        toggle.classList.add('bag-toggle-checkbox')
        toggleLabel.classList.add('bag-toggle')
        toggleLabel.setAttribute("for", `toggle-${bag.id}`)

        caption.classList.add("bag-caption")
        var totalBagWeightHighlight = ""
        if (bag.weightLimit !== null) {
            if (bag.weightLimit * 0.9 <= totalBagWeight && totalBagWeight <= bag.weightLimit) {
                totalBagWeightHighlight = "highlight-warning"
            } else if (totalBagWeight > bag.weightLimit) {
                totalBagWeightHighlight = "highlight-alert"
            }
            caption.innerHTML = `<div>${bag.name.replace(/(#[0-9]+)$/, '')} <span class="bag-index">${bag.name.match(/(#[0-9]+)$/)?.[0] || ''}</span> (${bag.weight} g)</div><span class="empty-bag">Bag is empty</span><span class="loaded-bag">Total Weight: <span class="${totalBagWeightHighlight}">${totalBagWeight}</span>/${bag.weightLimit} g</span>`
        } else {
            caption.innerHTML = `<div>${bag.name.replace(/(#[0-9]+)$/, '')} <span class="bag-index">${bag.name.match(/(#[0-9]+)$/)?.[0] || ''}</span> (${bag.weight} g)</div><span class="empty-bag">Bag is empty</span><span class="loaded-bag">Total Weight: ${totalBagWeight} g</span>`
        }


        const removeBagCheckbox = document.createElement('input')
        removeBagCheckbox.type = 'checkbox'
        removeBagCheckbox.id = `confirm-${bag.id}`
        removeBagCheckbox.style.display = 'none'
        removeBagCheckbox.classList.add('remove-bag-checkbox')

        const removeBagConfirm = document.createElement('label')
        removeBagConfirm.setAttribute("for", `confirm-${bag.id}`)
        removeBagConfirm.innerHTML = '<i class="fa-solid fa-square-check"></i>'
        removeBagConfirm.classList.add('remove-bag-confirm')

        const removeBagCancel = document.createElement('label')
        removeBagCancel.setAttribute("for", `confirm-${bag.id}`)
        removeBagCancel.innerHTML = '<i class="fa-solid fa-rectangle-xmark"></i>'
        removeBagCancel.classList.add('remove-bag-cancel')

        const removeBagText = document.createElement('p')
        removeBagText.classList.add('remove-bag-text')
        removeBagText.textContent = 'Delete this bag forever?'

        const removeBagButton = document.createElement('label')
        removeBagButton.setAttribute("for", `confirm-${bag.id}`)
        var trashCan = document.createElement("i")
        trashCan.classList.add("fa-solid")
        trashCan.classList.add("fa-trash-can")

        removeBagButton.appendChild(trashCan)
        removeBagButton.classList.add('remove-bag-button')
        removeBagConfirm.addEventListener('click', () => removeBagFromTrip(bag.id, bag.name))

        bagTable.appendChild(caption)

        caption.appendChild(toggle)
        caption.appendChild(toggleLabel)
        caption.appendChild(removeBagCheckbox)
        caption.appendChild(removeBagConfirm)
        caption.appendChild(removeBagCancel)
        caption.appendChild(removeBagText)
        caption.appendChild(removeBagButton)

        // Enable the table (bag) as a drop zone
        bagTable.setAttribute('data-bag', bag.id)
        bagTable.classList.add('drop-zone')
        bagTable.addEventListener('dragover', handleDragOver)
        bagTable.addEventListener('drop', handleDrop)
        bagTable.addEventListener('dragleave', handleDragLeave)

        // Create table header
        // if (bag.items.length !== 0) {    
        const headerRow = document.createElement('article')
        headerRow.classList.add('header-row')
        headerRow.innerHTML = `
            <div class="drag-handle-header"></div>
            <div class="item-name">Item</div>
            <div class="item-amount">Amount</div>
            <div class="item-weight">Weight (g)</div>
            <div class="item-total-weight">Total (g)</div>
            <div class="item-priority">Prio</div>
            <div class="item-category">Category</div>
            <div class="item-subcategory">Subcategory</div>
            <div class="remove-item"></div>
            `
        bagTable.appendChild(headerRow)


        // Add items to the table
        bag.items.forEach(item => {
            const itemRow = document.createElement('article')
            itemRow.setAttribute('data-bag', bag.id)
            itemRow.setAttribute('data-item', item.id)
            itemRow.addEventListener('dragstart', handleDragStart)

            const totalItemWeight = item.amount * item.weight

            itemRow.innerHTML = `
                    <div class="drag-handle" draggable="true"><i class="fa-solid fa-up-down-left-right"></i></div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-amount">${item.amount}x</div>
                    <div class="item-weight">${item.weight}</div>
                    <div class="item-total-weight">${totalItemWeight}</div>
                    <div class="item-priority">${item.priority}</div>
                    <div class="item-category">${item.category}</div>
                    <div class="item-subcategory">${item.subcategory || 'None'}</div>
                    <div><button class="remove-item-button"><i class="fa-solid fa-trash-can"></i></button></div>
                `

            itemRow.querySelector('.remove-item-button').addEventListener('click', () => {
                bag.items = bag.items.filter(i => i.id !== item.id)
                saveToLocalStorage()
                renderBagsTable()
            })

            bagTable.appendChild(itemRow)
        })

        bagsTableContainer.appendChild(bagTable)

        const article = document.createElement('article')
        article.classList.add('row-add-item')
        const div1 = document.createElement('div')
        const div2 = document.createElement('div')
        const button = document.createElement('button')
        button.className = 'modal-button'
        button.dataset.bag = bag.id
        button.textContent = 'Add Item'
        button.onclick = function () {
            itemBagInput.value = bag.id
            editEntries.checked = false
            addItemForm.showModal()
        }
        div2.appendChild(button)
        article.appendChild(div1)
        article.appendChild(div2)
        bagTable.appendChild(article)
        attachDragEvents()
    }


    editBagBtn.addEventListener('click', () => {
        if (!currentBagNameForEditing) return

        const newBagName = bagNameInput.value.trim()
        const newWeight = parseFloat(bagWeightInput.value)
        const newWeightLimit = parseFloat(bagWeightLimitInput.value) || null
        const newDescription = bagDescriptionInput.value.trim() || ''

        if (!newBagName || !newWeight) return

        // Find the old bag in the library by its name
        const bagIndex = bagsLibraryData.findIndex(bag => bag.name === currentBagNameForEditing)

        if (bagIndex !== -1) {
            bagsLibraryData[bagIndex] = {
                name: newBagName,
                weight: newWeight,
                weightLimit: newWeightLimit,
                description: newDescription
            }
            saveToLocalStorage()
            renderBagsLibrary()
            currentBagNameForEditing = null
            addBagForm.close()
        } else {
            console.error("Bag to edit was not found in the library.")
        }
    })

    addItemBtn.addEventListener('click', () => {
        if (!currentTrip) return

        const itemName = itemNameInput.value
        const amount = parseInt(itemAmountInput.value, 10)
        const weight = parseFloat(itemWeightInput.value)
        const priority = itemPriorityInput.value
        const category = itemCategoryInput.value
        const subcategory = itemSubcategoryInput.value
        const bagId = itemBagInput.value

        if (itemName) {
            // Create item object
            const item = {
                id: generateUUID(),
                name: itemName,
                amount,
                weight,
                priority,
                category,
                subcategory
            }

            // Create a copy of the item without the id to store in itemsLibraryData
            const itemForLibrary = { ...item }
            delete itemForLibrary.id // Remove the id for storage

            // Add to itemsLibrary only if it doesn't already exist
            if (!itemsLibraryData.some(existingItem => existingItem.name === itemName)) {
                itemsLibraryData.push(itemForLibrary)
                itemsLibraryData = sortByName(itemsLibraryData) // Sort after addition
                saveToLocalStorage()
                renderItemsLibrary()
            }

            // Add the new item to the trip's bag but not to bagsLibrary
            const bag = currentTrip.bags.find(bag => bag.id === bagId)
            if (bag) {
                // Only update the currentTrip.bags, not the bagsLibrary
                bag.items.push(item)

                // Check that no item is added to bagsLibraryData
                // Remove this if already being done elsewhere
                const libraryBag = bagsLibraryData.find(b => b.name === bag.name)
                if (libraryBag) {
                    libraryBag.items = []  // Ensure libraryBag stays empty
                }

                saveToLocalStorage()
                addItemToDOM(bagId, item) // Update the DOM with the new item
            }
            addItemForm.close()
            // Clear item inputs
            itemNameInput.value = ''
            itemAmountInput.value = '1'
            itemWeightInput.value = ''
            // itemPriorityInput.value = 'LO';
            // itemCategoryInput.value = 'Clothing'
            itemSubcategoryInput.value = ''
            // itemBagInput.value = ''

        }
    })

    function addItemToDOM(bagId, item) {
        const bagTable = bagsTableContainer.querySelector(`section[data-bag="${bagId}"]`)

        const itemRow = document.createElement('article')
        itemRow.setAttribute('data-bag', bagId)
        itemRow.setAttribute('data-item', item.id)
        itemRow.addEventListener('dragstart', handleDragStart)

        const totalItemWeight = item.amount * item.weight

        itemRow.innerHTML = `
            <div class="drag-handle" draggable="true"><i class="fa-solid fa-up-down-left-right"></i></div>
            <div class="item-name">${item.name}</div>
            <div class="item-amount">${item.amount}x</div>
            <div class="item-weight">${item.weight}</div>
            <div class="item-total-weight">${totalItemWeight}</div>
            <div class="item-priority">${item.priority}</div>
            <div class="item-category">${item.category}</div>
            <div class="item-subcategory">${item.subcategory || 'None'}</div>
            <div><button class="remove-item-button"><i class="fa-solid fa-trash-can"></i></button></div>
        `
        itemRow.querySelector('.remove-item-button').addEventListener('click', () => {
            const bag = currentTrip.bags.find(b => b.id === bagId)
            bag.items = bag.items.filter(i => i.id !== item.id)
            saveToLocalStorage()
            itemRow.remove() // Remove from DOM directly
        })

        bagTable.appendChild(itemRow)
        moveAddItemRowToEnd(bagTable)
    }

    function removeBagFromDOM(bagId) {
        const bagElement = bagsTableContainer.querySelector(`section[data-bag="${bagId}"]`)
        if (bagElement) {
            bagElement.remove()
        }
    }

    editItemBtn.addEventListener('click', () => {
        if (!currentItemNameForEditing) return

        const newItemName = itemNameInput.value
        const newAmount = parseInt(itemAmountInput.value, 10)
        const newWeight = parseFloat(itemWeightInput.value)
        const newPriority = itemPriorityInput.value
        const newCategory = itemCategoryInput.value
        const newSubcategory = itemSubcategoryInput.value

        // Find the old item in the library by its name
        const itemIndex = itemsLibraryData.findIndex(item => item.name === currentItemNameForEditing)

        if (itemIndex !== -1) {
            itemsLibraryData[itemIndex] = {
                name: newItemName,
                amount: newAmount,
                weight: newWeight,
                priority: newPriority,
                category: newCategory,
                subcategory: newSubcategory
            }
            saveToLocalStorage()
            renderItemsLibrary()
            currentItemNameForEditing = null
            addItemForm.close()
        } else {
            console.error("Item to edit was not found in the library.")
        }
    })

    function moveAddItemRowToEnd(section) {
        const addItemRow = section.querySelector('.row-add-item')
        if (addItemRow) {
            section.appendChild(addItemRow)  // Move it to the end
        }
    }







    function populateBagDropdown() {
        const itemBagInput = document.getElementById('itemBag')
        itemBagInput.innerHTML = '' // Clear existing options

        const emptyOption = document.createElement('option')
        emptyOption.value = ''
        emptyOption.textContent = 'Select a bag...'
        emptyOption.disabled = true
        itemBagInput.appendChild(emptyOption)

        if (currentTrip) {
            const bags = currentTrip.bags
            bags.forEach(bag => {
                const option = document.createElement('option')
                option.value = bag.id
                option.textContent = bag.name
                itemBagInput.appendChild(option)
            })
        }
    }



    const itemBagSelect = document.getElementById('itemBag')
    function updateBagDropdown(selectedBagUUID) {
        // Clear the dropdown
        itemBagSelect.innerHTML = ''

        // Populate dropdown with all bags in the current trip
        populateBagDropdown()

        // Automatically select the newly added bag or default value if not specified
        if (selectedBagUUID) {
            itemBagSelect.value = selectedBagUUID
        } else {
            itemBagSelect.value = ''
        }
    }

    // Initialize
    renderTrips()
    renderBagsLibrary()
    renderItemsLibrary()
})
