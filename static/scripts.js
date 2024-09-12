document.addEventListener('DOMContentLoaded', () => {
    const tripsList = document.getElementById('tripsList')
    const createTripBtn = document.getElementById('createTripBtn')
    const createTripForm = document.getElementById('createTripForm')
    const addTripBtn = document.getElementById('addTripBtn')
    const tripInfo = document.getElementById('tripInfo')
    const tripInfoNoSelection = document.getElementById('tripInfoNoSelection')
    const tripNameInput = document.getElementById('tripName')
    const tripStartDateInput = document.getElementById('tripStartDate')
    const tripEndDateInput = document.getElementById('tripEndDate')
    const bagsLibrary = document.getElementById('bagsLibrary')
    const addBagBtn = document.getElementById('addBagBtn')
    const bagNameInput = document.getElementById('bagName')
    const bagWeightInput = document.getElementById('bagWeight')
    const bagWeightLimitInput = document.getElementById('bagWeightLimit')
    const bagDescriptionInput = document.getElementById('bagDescription')
    const itemsLibrary = document.getElementById('itemsLibrary')
    const addItemBtn = document.getElementById('addItemBtn')
    const itemNameInput = document.getElementById('itemName')
    const itemAmountInput = document.getElementById('itemAmount')
    const itemWeightInput = document.getElementById('itemWeight')
    const itemPriorityInput = document.getElementById('itemPriority')
    const itemCategoryInput = document.getElementById('itemCategory')
    const itemSubcategoryInput = document.getElementById('itemSubcategory')
    const itemBagInput = document.getElementById('itemBag')
    const selectedTripName = document.getElementById('selectedTripName')
    const selectedTripDates = document.getElementById('tripDates')
    const addItemSection = document.getElementById('addItemSection')

    let trips = JSON.parse(localStorage.getItem('tripList')) || []
    let bagsLibraryData = JSON.parse(localStorage.getItem('bagsLibrary')) || []
    let itemsLibraryData = JSON.parse(localStorage.getItem('itemsLibrary')) || []
    let currentTrip = null


    // Sort by name (case-insensitive)
    function sortByName(array) {
        return array.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
    }

    function generateUUID() {
        return self.crypto.randomUUID()
    }



    function renderTrips() {
        tripsList.innerHTML = "No trips yet."
        if (trips.length !== 0) {
            tripsList.innerHTML = ''
            trips.forEach(trip => {
                const li = document.createElement('li')
                li.textContent = trip.name
                li.setAttribute('data-uuid', trip.uuid)  // Store UUID in a data attribute

                // Create a "Remove Trip" button
                const removeTripButton = document.createElement('button')
                const trashCan = document.createElement("i")
                trashCan.classList.add("fa-solid", "fa-trash-can")
                removeTripButton.appendChild(trashCan)
                removeTripButton.classList.add('remove-trip')
                removeTripButton.addEventListener('click', () => removeTrip(trip.uuid)) // Use UUID here

                li.appendChild(removeTripButton)
                li.addEventListener('click', () => loadTrip(trip)) // Pass the full trip object
                tripsList.appendChild(li)
            })
        }
    }

    function removeTrip(tripUUID) {
        // Confirm removal with the user
        const confirmRemoval = confirm(`Are you sure you want to remove the trip "${tripName}"?`)
        if (confirmRemoval) {
            // Remove the trip by UUID
            trips = trips.filter(trip => trip.uuid !== tripUUID)

            // Save the updated trips list to local storage
            saveToLocalStorage()

            // Re-render the trips list
            renderTrips()

            // Clear the current trip if it was removed
            if (currentTrip && currentTrip.uuid === tripUUID) {
                currentTrip = null
                tripInfo.classList.add('hidden')
                document.getElementById('bagsTable').innerHTML = '' // Clear bags table
            }
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
                div.classList.add('libraryEntry')
                const divName = document.createElement('div')
                divName.textContent = `${bag.name}`
                div.appendChild(divName)

                // Create remove button with trashcan icon
                const removeBtn = document.createElement('button')
                const trashCan = document.createElement('i')
                trashCan.classList.add('fa-solid', 'fa-trash-can')
                removeBtn.appendChild(trashCan)
                removeBtn.classList.add('remove-bag')
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation() // Prevent click from bubbling to the div
                    removeBagFromLibrary(index)
                })

                div.appendChild(removeBtn)
                div.addEventListener('click', () => {
                    bagNameInput.value = bag.name
                    bagWeightInput.value = bag.weight
                    bagWeightLimitInput.value = bag.weightLimit || ''
                    bagDescriptionInput.value = bag.description || ''
                })
                bagsLibrary.appendChild(div)
            })
        }

    }

    function removeBagFromLibrary(index) {
        bagsLibraryData.splice(index, 1) // Remove the bag from the array
        saveToLocalStorage() // Save the updated list to local storage
        renderBagsLibrary() // Re-render the updated list
    }



    function renderItemsLibrary() {
        itemsLibrary.innerHTML = 'No items in your library yet.'
        if (itemsLibraryData.length !== 0) {
            // Sort items by name
            const sortedItems = sortByName(itemsLibraryData)
            itemsLibrary.innerHTML = ''
            sortedItems.forEach((item, index) => {
                const div = document.createElement('div')
                div.classList.add('libraryEntry')
                const divName = document.createElement('div')
                divName.textContent = `${item.name}`
                div.appendChild(divName)

                // Create remove button with trashcan icon
                const removeBtn = document.createElement('button')
                const trashCan = document.createElement('i')
                trashCan.classList.add('fa-solid', 'fa-trash-can')
                // trashCan.innerText = 'X'
                removeBtn.appendChild(trashCan)
                removeBtn.classList.add('remove-item')
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation() // Prevent click from bubbling to the div
                    removeItemFromLibrary(index)
                })

                div.appendChild(removeBtn)
                div.addEventListener('click', () => {
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

    function removeItemFromLibrary(index) {
        itemsLibraryData.splice(index, 1) // Remove the item from the array
        saveToLocalStorage() // Save the updated list to local storage
        renderItemsLibrary() // Re-render the updated list
    }



    function renderBagsTable() {
        const bagsTableContainer = document.getElementById('tripBags')
        bagsTableContainer.innerHTML = 'No bags added to this trip yet!'
        addItemSection.classList.add('hidden')


        if (currentTrip.bags.length != 0) {
            bagsTableContainer.innerHTML = '' // Clear the table
            addItemSection.classList.remove('hidden')

            currentTrip.bags.forEach(bag => {
                const totalBagWeight = bag.weight + bag.items.reduce((acc, item) => acc + (item.weight * item.amount), 0)

                // Create table with the bag name and its total weight
                const bagTable = document.createElement('section')
                const caption = document.createElement('caption')
                // caption.textContent = `${bag.name} (Total weight: ${totalBagWeight}g)`;
                var totalBagWeightHighlight = ""
                if (bag.weightLimit !== null) {

                    // Yellow highlight if the total weight is between 90% and 100% of the user specified bag weight limit
                    if (bag.weightLimit * 0.9 <= totalBagWeight && totalBagWeight <= bag.weightLimit) {
                        totalBagWeightHighlight = "highlightYellow"
                        // Red highlight if total weight is above user specified bag weight limit
                    } else if (totalBagWeight > bag.weightLimit) {
                        totalBagWeightHighlight = "highlightRed"
                    }
                    caption.innerHTML = `${bag.name.replace(/(#[0-9]+)$/, '')} <span class="bag-index">${bag.name.match(/(#[0-9]+)$/)?.[0] || ''}</span> (${bag.weight} g) | Total Weight: <span class="${totalBagWeightHighlight}">${totalBagWeight}</span>/${bag.weightLimit} g`
                } else {
                    caption.innerHTML = `${bag.name.replace(/(#[0-9]+)$/, '')} <span class="bag-index">${bag.name.match(/(#[0-9]+)$/)?.[0] || ''}</span> (${bag.weight} g) | Total Weight: ${totalBagWeight} g`

                }

                // caption.innerHTML = `${bag.name.replace(/(#[0-9]+)$/, '')} <span class="bag-index">${bag.name.match(/(#[0-9]+)$/)?.[0] || ''}</span>\n${totalBagWeight} g`;


                // Create a "Remove Bag" button
                const removeBagButton = document.createElement('button')
                var trashCan = document.createElement("i")
                trashCan.classList.add("fa-solid")
                trashCan.classList.add("fa-trash-can")

                removeBagButton.appendChild(trashCan)
                removeBagButton.classList.add('remove-bag')
                removeBagButton.addEventListener('click', () => removeBagFromTrip(bag.id, bag.name)) // Add event listener

                bagTable.appendChild(caption)

                // Meter to show how full the bag is
                // if (bag.weightLimit) {
                //     const meterWeight = document.createElement('meter')
                //     meterWeight.setAttribute("value", totalBagWeight);
                //     meterWeight.setAttribute("min", 0)
                //     meterWeight.setAttribute("optimum", 0.4 * bag.weightLimit)
                //     meterWeight.setAttribute("low", 0.8 * bag.weightLimit)
                //     meterWeight.setAttribute("high", 0.9 * bag.weightLimit)
                //     meterWeight.setAttribute("max", bag.weightLimit)
                //     meterWeight.textContent = `${totalBagWeight} g`
                //     caption.appendChild(meterWeight)
                // }

                caption.appendChild(removeBagButton) // Append the button to the caption

                // Enable the table (bag) as a drop zone
                bagTable.setAttribute('data-bag', bag.id)
                bagTable.classList.add('drop-zone')
                bagTable.addEventListener('dragover', handleDragOver)
                bagTable.addEventListener('drop', handleDrop)
                bagTable.addEventListener('dragleave', handleDragLeave) // Add dragleave event listener

                // Create table header
                // if (bag.items.length !== 0) {    
                const headerRow = document.createElement('article')
                headerRow.classList.add('headerRow')
                headerRow.innerHTML = `
                    <div class="dragHandleHeader"></div>
                    <div class="itemName">Item</div>
                    <div class="itemAmount">Amount</div>
                    <div class="itemWeight">Weight (g)</div>
                    <div class="itemTotalWeight">Total (g)</div>
                    <div class="itemPriority">Prio</div>
                    <div class="itemCategory">Category</div>
                    <div class="itemSubcategory">Subcategory</div>
                    <div class="removeItem"></div>
                    `
                bagTable.appendChild(headerRow)


                // Add items to the table
                bag.items.forEach(item => {
                    const itemRow = document.createElement('article')

                    // Set the item as draggable
                    // itemRow.setAttribute('draggable', 'true');
                    itemRow.setAttribute('data-bag', bag.id) // Track which bag the item is in
                    itemRow.setAttribute('data-item', item.name) // Track the item name
                    itemRow.addEventListener('dragstart', handleDragStart)

                    // Calculate total item weight (amount * weight)
                    const totalItemWeight = item.amount * item.weight

                    itemRow.innerHTML = `
                            <div class="dragHandle" draggable="true"><i class="fa-solid fa-up-down-left-right"></i></div>
                            <div class="itemName">${item.name}</div>
                            <div class="itemAmount">${item.amount}x</div>
                            <div class="itemWeight">${item.weight}</div>
                            <div class="itemTotalWeight">${totalItemWeight}</div>
                            <div class="itemPriority">${item.priority}</div>
                            <div class="itemCategory">${item.category}</div>
                            <div class="itemSubcategory">${item.subcategory || 'None'}</div>
                            <div><button class="remove-item"><i class="fa-solid fa-trash-can"></i></button></div>
                        `

                    // Add event listener for removing the item
                    itemRow.querySelector('.remove-item').addEventListener('click', () => {
                        bag.items = bag.items.filter(b => b.name !== item.name)
                        saveToLocalStorage()
                        renderBagsTable()
                    })

                    bagTable.appendChild(itemRow)
                })
                // }

                bagsTableContainer.appendChild(bagTable)
            })
        }
    }

    function removeBagFromTrip(bagId, bagName) {
        // Confirm removal with the user
        const confirmRemoval = confirm(`Are you sure you want to remove the bag "${bagName}"?`)
        if (confirmRemoval) {
            // Remove the bag from the current trip
            currentTrip.bags = currentTrip.bags.filter(bag => bag.name !== bagName)

            // Save the updated trip to local storage
            saveToLocalStorage()

            // Re-populate the bag dropdown and select the default value
            updateBagDropdown()

            // Re-render the bags table to reflect changes
            renderBagsTable()
        }
    }




    // DRAG AND DROP FUNCTIONALITY

    let draggedItem = null

    // Function to handle drag start
    function handleDragStart(event) {
        draggedItem = {
            itemName: event.target.parentNode.getAttribute('data-item'),
            fromBag: event.target.parentNode.getAttribute('data-bag')
        }
        event.target.style.opacity = '0.5' // Visual feedback during drag
    }

    // Function to handle drag over (allows dropping)
    function handleDragOver(event) {
        event.preventDefault() // Prevent default to allow drop
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
            const fromBag = currentTrip.bags.find(bag => bag.name === draggedItem.fromBag)
            const toBag = currentTrip.bags.find(bag => bag.name === targetBag)

            const itemToMove = fromBag.items.find(item => item.name === draggedItem.itemName)
            if (itemToMove) {
                // Remove item from the original bag
                fromBag.items = fromBag.items.filter(item => item.name !== draggedItem.itemName)

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


    // IMPORTING/EXPORTING TRIPS

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




    // IMPORTING/EXPORTING LIBRARIES

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
        tripItems.forEach(item => item.classList.remove('selectedTrip'))

        // Find the list item by UUID and add the 'selectedTrip' class
        const selectedTripItem = Array.from(tripItems).find(item => item.getAttribute('data-uuid') === trip.uuid)
        if (selectedTripItem) {
            selectedTripItem.classList.add('selectedTrip')
        }

        tripNameInput.value = ''
        tripStartDateInput.value = ''
        tripEndDateInput.value = ''
        renderBagsTable()
        renderBagsLibrary()
        renderItemsLibrary()
        updateBagDropdown() // Populate the bag dropdown
        tripInfo.classList.remove('hidden')
        tripInfoNoSelection.classList.add('hidden')
        const tripStartDate = new Date(trip.startDate)
        const currentDate = new Date()
        const timeDiff = tripStartDate - currentDate
        const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
        const dayOrDays = Math.abs(daysRemaining) === 1 ? 'day' : 'days'

        if (daysRemaining > 0) {
            selectedTripName.innerText = `${trip.name} (in ${daysRemaining} ${dayOrDays})`
        } else if (daysRemaining === 0) {
            selectedTripName.textContent = `${currentTrip.name} (Today!)`
        } else {
            selectedTripName.textContent = `${currentTrip.name} (${Math.abs(daysRemaining)} ${dayOrDays} ago)`
        }
        selectedTripDates.innerText = `${trip.startDate} - ${trip.endDate}`
    }

    createTripBtn.addEventListener('click', () => {
        createTripForm.classList.toggle('hidden')
    })

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
            createTripForm.classList.add('hidden')
            loadTrip(newTrip) // Pass the whole trip object, not just the name
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
                console.log(index)
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
            const bagForLibrary = {
                name: bagName,
                weight,
                weightLimit,
                description,
                items: []
            }

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
            renderBagsTable()
            updateBagDropdown(bag.id)

            // Clear inputs
            bagNameInput.value = ''
            bagWeightInput.value = ''
            bagWeightLimitInput.value = ''
            bagDescriptionInput.value = ''
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
        // const bagName = itemBagInput.value;
        const bagId = itemBagInput.value

        if (itemName) {
            // Create item object
            const item = { name: itemName, amount, weight, priority, category, subcategory }

            // Add to itemsLibrary only if it doesn't already exist
            if (!itemsLibraryData.some(existingItem => existingItem.name === itemName)) {
                itemsLibraryData.push(item)
                itemsLibraryData = sortByName(itemsLibraryData) // Sort after addition
                saveToLocalStorage()
                renderItemsLibrary()
            }

            // Add the item to the selected bag
            const bag = currentTrip.bags.find(bag => bag.id === bagId)
            if (bag) {
                bag.items.push(item)
                saveToLocalStorage()
                renderBagsTable()
            }

            // Clear item inputs
            itemNameInput.value = ''
            itemAmountInput.value = '1'
            itemWeightInput.value = ''
            // itemPriorityInput.value = 'LO';
            // itemCategoryInput.value = 'Clothing';
            itemSubcategoryInput.value = ''
            // itemBagInput.value = '';

        }
    })

    window.removeItem = (itemName, bagId) => {
        if (!currentTrip) return

        const bag = currentTrip.bags.find(bag => bag.id === bagId)
        if (bag) {
            bag.items = bag.items.filter(item => item.name !== itemName)
            saveToLocalStorage()
            renderBagsTable()
        }
    }

    function populateBagDropdown() {
        const itemBagInput = document.getElementById('itemBag')
        itemBagInput.innerHTML = '' // Clear existing options

        const emptyOption = document.createElement('option')
        emptyOption.value = ''
        emptyOption.textContent = 'Please select a bag.'
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



    const itemBagSelect = document.getElementById('itemBag') // Updated bag dropdown with correct id
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
