//========
// IMPORTS
//========




//============
// SAMPLE DATA
//============

import sampleData from "./sampleData.json" assert { type: 'json' }
import sampleData2 from "./sampleData2.json" assert { type: 'json' }

const sampleListUUID = generateUUID()
const sampleListUUID2 = generateUUID()

addListToIndex("Sample List", sampleListUUID)
sampleData.unshift({ listName: "Sample List", listUUID: sampleListUUID })
localStorage.setItem("Sample List", JSON.stringify(sampleData))

addListToIndex("Sample List 2", sampleListUUID2)
sampleData2.unshift({ listName: "Sample List 2", listUUID: sampleListUUID2 })
localStorage.setItem("Sample List 2", JSON.stringify(sampleData2))




//==========
// VARIABLES
//==========

// Array holding all available categories
const categories = ["bags", "clothing", "consumables", "electronics", "footwear", "grooming", "hygiene", "meds", "necessities", "toiletries", "other"]

const createListButton = document.getElementById("createListButton")
const listSelectorDropdown = document.getElementById("listSelector")
const deleteListButton = document.getElementById("deleteListButton")
const fileInput = document.getElementById("jsonFileInput")
const uploadListButton = document.getElementById("uploadListButton")
const downloadListButton = document.getElementById("downloadListButton")
const itemForm = document.getElementById("itemForm")
const categoryDropdown = document.querySelectorAll("#itemCategory")
const listFilters = document.querySelectorAll(".filters")
const targetCarryOn = document.querySelector(".bagCarryOn")
const targetPersonalItem = document.querySelector(".bagPersonalItem")
const weightDistribution = document.querySelectorAll(".weightDistribution")
const itemListSummaryCarryOn = document.querySelector(".bagCarryOn .itemListSummary")
const itemListSummaryPersonalItem = document.querySelector(".bagPersonalItem .itemListSummary")




//================
// EVENT LISTENERS
//================

createListButton.addEventListener("click", function (event) {
  event.preventDefault()
  const listName = document.getElementById("listName").value
  if (listName != "") {
    const listUUID = generateUUID()
    addListToIndex(listName, listUUID)
    setItemArray(listName, [{ "listName": listName, "listUUID": listUUID }])
    populateListSelector()
    const listSelector = document.getElementById("listSelector")
    listSelector.value = listName
    loadList(listName)
  } else {
    const listNameInput = document.getElementById("listName")
    listNameInput.focus()
    listNameInput.classList.add("highlight")
  }
})

listSelectorDropdown.addEventListener("change", function (event) {
  event.preventDefault()
  const selectedList = listSelectorDropdown.value
  getItemArray(selectedList)
  loadList(selectedList)
})

deleteListButton.addEventListener("click", function (event) {
  event.preventDefault()
  const selectedList = document.getElementById("listSelector").value
  if (selectedList != "") {
    let confirmed = confirm(
      "Are you sure you want to remove the following list:\n" + selectedList + "\n\nThis step cannot be undone!"
    )
    if (confirmed) {
      deleteList(selectedList)
      populateListSelector()
      loadList(selectedList)
    }
  } else {
    // alert("Please select a list first!")
    const listSelectorDropdown = document.getElementById("listSelector")
    listSelectorDropdown.focus()
    listSelectorDropdown.classList.add("highlight")
  }
})

uploadListButton.addEventListener("click", () => {
  fileInput.click()
})

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0]
  fileInput.value = ""
  if (file) {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const itemArray = JSON.parse(e.target.result)
        // const listUUID = generateUUID()
        // itemArray[0].listUUID = listUUID
        const listInfo = itemArray[0]
        const listIndex = getItemArray("List Index")
        listIndex.push(listInfo)
        setItemArray("List Index", listIndex)
        populateListSelector()
        setItemArray(listInfo.listName, itemArray)
        const listSelector = document.getElementById("listSelector")
        listSelector.value = listInfo.listName
        loadList(listInfo.listName)

      } catch (error) {
        console.error("Error parsing JSON:", error)
      }
    }

    reader.readAsText(file)
  }
})

downloadListButton.addEventListener('click', function () {
  let selectedList = document.getElementById("listSelector").value

  if (selectedList != "") {
    const itemArray = getItemArray(selectedList)

    if (itemArray) {
      downloadList(itemArray, `${selectedList}.json`)
    } else {
      alert('No data found in localStorage.')
    }
  } else {
    alert('You need to select a list first.')
  }
})

itemForm.addEventListener("submit", function (event) {
  event.preventDefault()
  addListItem()
})




//=================
// HELPER FUNCTIONS
//=================

function generateUUID() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID()
  } else {
    function randomHex(length) {
      let result = ''
      for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 16).toString(16)
      }
      return result
    }

    return (
      randomHex(8) +
      '-' +
      randomHex(4) +
      '-4' + // Version 4 UUID (random)
      randomHex(3) +
      '-' +
      (8 | (Math.random() * 4)) // 8, 9, A, or B (random)
        .toString(16)
        .substring(1) +
      randomHex(3) +
      '-' +
      randomHex(12)
    )
  }
}


function capitalizeFirstLetter(inputString) {
  return inputString.charAt(0).toUpperCase() + inputString.slice(1)
}


function createCategoryElements() {
  categories.forEach((category) => {
    // Category Selector Dropdowns
    categoryDropdown.forEach((option) => {
      const selectOption = document.createElement("option")
      selectOption.setAttribute("value", category)
      selectOption.innerText = capitalizeFirstLetter(category)
      option.append(selectOption)
    })
    // Filters
    listFilters.forEach((filter, index) => {
      const filterItem = document.createElement("label")
      const input = document.createElement("input")
      input.setAttribute("type", "checkbox")
      const text = capitalizeFirstLetter(category)
      if (index === 0) {
        filterItem.setAttribute("for", category)
        input.setAttribute("name", category)
        input.setAttribute("id", category)
      } else {
        filterItem.setAttribute("for", `${category}${index + 1}`)
        input.setAttribute("name", `${category}${index + 1}`)
        input.setAttribute("id", `${category}${index + 1}`)
      }
      filterItem.append(text, input)
      filter.append(filterItem)
    })
    weightDistribution.forEach((element) => {
      const span = document.createElement("span")
      span.classList.add("chartItemTitle")
      span.innerText = capitalizeFirstLetter(category)
      const categoryBox = document.createElement("div")
      categoryBox.classList.add("categoryBox")
      categoryBox.classList.add(category)
      categoryBox.append(span)
      element.append(categoryBox)
    })
  })
}
createCategoryElements()


function populateListSelector() {
  const listIndex = JSON.parse(localStorage.getItem("List Index"))
  const listSelector = document.getElementById("listSelector")
  listSelector.textContent = ""

  const defaultOption = document.createElement("option")
  defaultOption.setAttribute("value", "")
  defaultOption.setAttribute("selected", "")
  defaultOption.setAttribute("disabled", "")
  defaultOption.innerText = "Select List"
  listSelector.append(defaultOption)

  listIndex.forEach((listIndexItem, index) => {
    const option = document.createElement("option")
    option.setAttribute("value", listIndexItem.listName)
    option.setAttribute("data-index", index)
    option.innerText = listIndexItem.listName
    listSelector.append(option)
  })
}
populateListSelector()


function setChartItemWidths(listItems) {
  const result = processData(listItems)
  let percentages = []

  for (const bagType in result.bagCategoryWeightsPercentage) {
    percentages = []
    switch (bagType) {
      case "Carry On": {
        for (const category of categories) {
          if (result.bagCategoryWeightsPercentage[bagType][category] !== undefined) {
            percentages.push(Math.ceil(result.bagCategoryWeightsPercentage[bagType][category]))
          } else {
            percentages.push(0)
          }
        }
        let gridTemplateColumns = percentages.map(percentage => `${percentage}fr`).join(' ')
        document.querySelector(".bagCarryOn .weightDistribution").style.gridTemplateColumns = gridTemplateColumns
        gridTemplateColumns = []
        break
      }
      case "Personal Item": {
        for (const category of categories) {
          if (result.bagCategoryWeightsPercentage[bagType][category] !== undefined) {
            percentages.push(Math.ceil(result.bagCategoryWeightsPercentage[bagType][category]))
          } else {
            percentages.push(0)
          }
        }
        let gridTemplateColumns = percentages.map(percentage => `${percentage}fr`).join(' ')
        document.querySelector(".bagPersonalItem .weightDistribution").style.gridTemplateColumns = gridTemplateColumns
        gridTemplateColumns = []
        break
      }
    }
  }
}


function loadList(listName) {
  clearItemList()
  const itemArray = getItemArray(listName)
  const listInfo = itemArray[0]
  const listItems = itemArray.slice(1)
  renderItems(listItems)
  activateDeleteListeners(listName)
  setChartItemWidths(listItems)
}


function renderItems(listItems) {
  let totalWeightCarryOn = 0
  let totalWeightPersonalItem = 0
  const carryOnTotalWeight = document.getElementById("carryOnTotalWeight")
  const personalItemTotalWeight = document.getElementById("personalItemTotalWeight")
  carryOnTotalWeight.innerText = 0
  personalItemTotalWeight.innerText = 0

  listItems.forEach((item, index) => {
    let itemTotalWeight = item.itemAmount * item.itemWeight
    const listItem = createItemListItem(item, itemTotalWeight, index + 1)

    if (item.itemBagType == "carryOn") {
      targetCarryOn.insertBefore(listItem, itemListSummaryCarryOn)
      totalWeightCarryOn += itemTotalWeight
      carryOnTotalWeight.innerText = totalWeightCarryOn + " g"
    } else if (item.itemBagType == "personalItem") {
      targetPersonalItem.insertBefore(listItem, itemListSummaryPersonalItem)
      totalWeightPersonalItem += itemTotalWeight
      personalItemTotalWeight.innerText = totalWeightPersonalItem + " g"
    }
  })
}


function getItemArray(listName) {
  return JSON.parse(localStorage.getItem(listName)) || []
}


function setItemArray(listName, itemArray) {
  localStorage.setItem(listName, JSON.stringify(itemArray))
}


function activateDeleteListeners(listName) {
  let deleteBtn = document.querySelectorAll(".deleteItem")
  deleteBtn.forEach((dB) => {
    dB.addEventListener("click", () => {
      const index = dB.getAttribute("data-index")
      deleteItem(listName, index)
    })
  })
}


function sanitizeList(listName) {
  const itemArray = JSON.parse(localStorage.getItem(listName))
  for (let item of itemArray) {
    for (const key in item) {
      if (typeof item[key] === 'string') {
        item[key] = sanitizeString(item[key])
      }
    }
  }
  return itemArray
}


function sanitizeString(inputString) {
  return inputString.replace(/(<([^>]+)>)/g, '')
}


function downloadList(itemArray, listName) {
  const data = JSON.stringify(itemArray)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = listName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}


function sendData(listName) {
  // fetch("/process", {
  //   method: "POST",
  //   body: sanitizeData(listName),
  // })
  //   .then((response) => response.text())
  //   .then((data) => {
  //     console.log(data)
  //   })
}




//=========
// ANALYSIS
//=========

function formatBagType(bagType) {
  switch (bagType) {
    case "carryOn":
      return "Carry On"
    case "personalItem":
      return "Personal Item"
    default:
      return bagType
  }
}


function processData(items) {
  let totalWeight = 0
  let bagWeights = {}
  let categoryWeights = {}
  let priorityWeights = {}
  let categoryData = {}
  let bagCategoryWeights = {}

  items.forEach(item => {
    let itemTotalWeight = item.itemAmount * item.itemWeight
    totalWeight += itemTotalWeight

    priorityWeights[item.itemPriority] = (priorityWeights[item.itemPriority] || 0) + itemTotalWeight
    categoryWeights[item.itemCategory] = (categoryWeights[item.itemCategory] || 0) + itemTotalWeight

    const formattedBagType = formatBagType(item.itemBagType)
    bagWeights[formattedBagType] = (bagWeights[formattedBagType] || 0) + itemTotalWeight

    if (!bagCategoryWeights[formattedBagType]) {
      bagCategoryWeights[formattedBagType] = {}
    }
    bagCategoryWeights[formattedBagType][item.itemCategory] = (bagCategoryWeights[formattedBagType][item.itemCategory] || 0) + itemTotalWeight
  })

  let averageWeight = items.length > 0 ? totalWeight / items.length : 0

  items.sort((a, b) => b.itemWeight - a.itemWeight)
  let topHeaviestItems = items.slice(0, 5)

  let categoryWeightPercentage = {}
  for (let category in categoryWeights) {
    categoryWeightPercentage[category] = (categoryWeights[category] / totalWeight) * 100
  }

  for (let category in categoryWeights) {
    let percentage = (categoryWeights[category] / totalWeight) * 100
    categoryData[category] = {
      weight: categoryWeights[category],
      percentage: percentage
    }
  }

  const bagCategoryWeightsPercentage = {}
  for (let bagType in bagCategoryWeights) {
    bagCategoryWeightsPercentage[bagType] = {}
    for (let category in bagCategoryWeights[bagType]) {
      bagCategoryWeightsPercentage[bagType][category] = (bagCategoryWeights[bagType][category] / bagWeights[bagType]) * 100
    }
  }

  return {
    totalWeight: totalWeight,
    topHeaviestItems: topHeaviestItems,
    bagWeights: bagWeights,
    averageWeight: averageWeight,
    priorityWeights: priorityWeights,
    categoryWeights: categoryWeights,
    categoryWeightPercentage: categoryWeightPercentage,
    categoryData: categoryData,
    bagCategoryWeights: bagCategoryWeights,
    bagCategoryWeightsPercentage: bagCategoryWeightsPercentage
  }
}


function updateForAddedItem(metrics, newItem) {
  let itemTotalWeight = newItem.itemAmount * newItem.itemWeight
  metrics.totalWeight += itemTotalWeight
  metrics.priorityWeights[newItem.itemPriority] = (metrics.priorityWeights[newItem.itemPriority] || 0) + itemTotalWeight
  metrics.categoryWeights[newItem.itemCategory] = (metrics.categoryWeights[newItem.itemCategory] || 0) + itemTotalWeight

  const formattedBagType = formatBagType(newItem.itemBagType)
  metrics.bagWeights[formattedBagType] = (metrics.bagWeights[formattedBagType] || 0) + itemTotalWeight

  if (!metrics.bagCategoryWeights[formattedBagType]) {
    metrics.bagCategoryWeights[formattedBagType] = {}
  }
  metrics.bagCategoryWeights[formattedBagType][newItem.itemCategory] = (metrics.bagCategoryWeights[formattedBagType][newItem.itemCategory] || 0) + itemTotalWeight


  if (newItem.itemWeight > metrics.topHeaviestItems[metrics.topHeaviestItems.length - 1].itemWeight) {
    metrics.topHeaviestItems.pop()
    metrics.topHeaviestItems.push(newItem)
    metrics.topHeaviestItems.sort((a, b) => b.itemWeight - a.itemWeight)
  }

  let percentage = (metrics.categoryWeights[newItem.itemCategory] / metrics.totalWeight) * 100
  metrics.categoryData[newItem.itemCategory] = {
    weight: metrics.categoryWeights[newItem.itemCategory],
    percentage: percentage
  }

  return metrics
}


function updateForRemovedItem(metrics, removedItem, allItems) {

  let itemTotalWeight = removedItem.itemAmount * removedItem.itemWeight
  metrics.totalWeight -= itemTotalWeight
  metrics.priorityWeights[removedItem.itemPriority] -= itemTotalWeight
  metrics.categoryWeights[removedItem.itemCategory] -= itemTotalWeight

  const formattedBagType = formatBagType(removedItem.itemBagType)
  metrics.bagWeights[formattedBagType] -= itemTotalWeight

  metrics.bagCategoryWeights[formattedBagType][removedItem.itemCategory] -= itemTotalWeight

  if (metrics.topHeaviestItems.includes(removedItem)) {
    metrics.topHeaviestItems = metrics.topHeaviestItems.filter(item => item !== removedItem)
    let remainingItems = allItems.filter(item => !metrics.topHeaviestItems.includes(item))
    let nextTopItem = remainingItems.sort((a, b) => b.itemWeight - a.itemWeight)[0]
    if (nextTopItem) {
      metrics.topHeaviestItems.push(nextTopItem)
    }
  }

  let percentage = (metrics.categoryWeights[removedItem.itemCategory] / metrics.totalWeight) * 100
  metrics.categoryData[removedItem.itemCategory] = {
    weight: metrics.categoryWeights[removedItem.itemCategory],
    percentage: percentage
  }

  return metrics
}




//==================
// LIST MANIPULATION
//==================

function addListToIndex(listName, uuid) {
  var listIndex = localStorage.getItem("List Index")
  var listIndexItems = listIndex ? JSON.parse(listIndex) : []

  if (!listIndexItems.some((item) => item.listName === listName)) {
    listIndexItems.push({
      listName: listName,
      listUUID: uuid,
    })
  }
  localStorage.setItem("List Index", JSON.stringify(listIndexItems))
}


function clearItemList() {
  const articles = document.querySelectorAll(".listItem")
  articles.forEach((entry) => entry.remove())
}


function createItemListItem(item, itemTotalWeight, index) {
  const listItem = document.createElement("article");
  listItem.classList.add("listItem", item.itemCategory, item.itemBagType);
  listItem.setAttribute("data-index", index);

  const createSpan = (className, text) => {
    const span = document.createElement("span");
    span.classList.add(className);
    span.textContent = text;
    return span;
  };

  const mobileOnlyTotal = createSpan("mobileOnlyInfo", "Total: ");
  const mobileOnlyGrams = createSpan("mobileOnlyInfo", " g");
  const mobileOnlyTotalGrams = createSpan("mobileOnlyInfo", " g");
  const mobileOnlyPrio = createSpan("mobileOnlyInfo", "Prio: ");

  const divItemName = createDivWithClass('itemName', item.itemName);
  const divItemAmount = createDivWithClass('itemAmount', `${item.itemAmount}x`);
  const divItemWeight = createDivWithClass('itemWeight', item.itemWeight);
  divItemWeight.append(mobileOnlyGrams);
  const divItemTotalWeight = createDivWithClass('itemTotalWeight', itemTotalWeight);
  divItemTotalWeight.prepend(mobileOnlyTotal);
  divItemTotalWeight.append(mobileOnlyTotalGrams);
  const divItemPriority = createDivWithClass('itemPriority', item.itemPriority==="1"?"HI":item.itemPriority==="2"?"MD":"LO");
  divItemPriority.classList.add("prio-" + item.itemPriority)
  divItemPriority.prepend(mobileOnlyPrio);
  const divItemCategory = createDivWithClass('itemCategory', item.itemCategory.charAt(0).toUpperCase() + item.itemCategory.slice(1));
  const divItemSubcategory = createDivWithClass('itemSubcategory', item.itemSubcategory);

  const deleteItem = document.createElement('span');
  deleteItem.classList.add('deleteItem');
  deleteItem.dataset.index = index;
  deleteItem.textContent = '❌';

  listItem.append(
    divItemName,
    divItemAmount,
    divItemWeight,
    divItemTotalWeight,
    divItemPriority,
    divItemCategory,
    divItemSubcategory,
    deleteItem
  );

  return listItem;
}


function createDivWithClass(className, text) {
  const div = document.createElement('div');
  div.classList.add(className);
  div.textContent = text;
  return div;
}


function addListItem() {

  const listName = document.getElementById("listSelector").value

  if (listName != "") {
    const itemArray = getItemArray(listName)
    const itemName = document.getElementById("itemName").value
    const itemAmount = parseInt(document.getElementById("itemAmount").value)
    const itemWeight = parseInt(document.getElementById("itemWeight").value)
    const itemCategory = document.getElementById("itemCategory").value
    const itemSubcategory = document.getElementById("itemSubcategory").value
    const itemPriority = document.getElementById("itemPriority").value
    const itemBagType = document.getElementById("itemBagType").value

    itemArray.push({
      itemName: itemName,
      itemAmount: itemAmount,
      itemWeight: itemWeight,
      itemCategory: itemCategory,
      itemSubcategory: itemSubcategory,
      itemPriority: itemPriority,
      itemBagType: itemBagType,
    })
    setItemArray(listName, itemArray)
    loadList(listName)
  } else {
    alert("Please create or select a list first!")
    const listNameInput = document.getElementById("listName")
    listNameInput.classList.add("highlight")
    const listSelector = document.getElementById("listSelector")
    listSelector.classList.add("highlight")
  }
}


function deleteItem(listName, i) {
  let itemArray = getItemArray(listName)
  itemArray.splice(i, 1)
  setItemArray(listName, itemArray)
  loadList(listName)
}


function deleteList(listName) {
  let i = document.querySelector('[value="' + listName + '"').getAttribute("data-index")
  localStorage.removeItem(listName)

  let listIndex = getItemArray("List Index")
  listIndex.splice(i, 1)
  setItemArray("List Index", listIndex)
  loadList(listName)
  let listSelector = document.getElementById("listSelector")
  listSelector.value = ""
}
