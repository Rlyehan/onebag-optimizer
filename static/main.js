//========
// IMPORTS
//========

import { processData } from "./modules/analysis.js"
import { downloadList } from "./modules/jsonDownload.js"

import sampleData from "./sampleData.json" assert { type: 'json' }
import sampleData2 from "./sampleData2.json" assert { type: 'json' }


//==========
// VARIABLES
//==========

// Array holding all available categories
const categories = ["bags", "clothing", "consumables", "electronics", "footwear", "grooming", "hygiene", "meds", "necessities", "other"];

const createListButton = document.getElementById("createListButton")
const listSelectorDropdown = document.getElementById("listSelector")
const deleteListButton = document.getElementById("deleteListButton")
const fileInput = document.getElementById("jsonFileInput")
const uploadListButton = document.getElementById("uploadListButton")
const downloadListButton = document.getElementById("downloadListButton")
const itemForm = document.getElementById("itemForm")
const categoryDropdown = document.querySelectorAll("#itemCategory")
const listFilters = document.querySelectorAll(".filters")
// const clearLocalStorageButton = document.getElementById("clearLocalStorage")
// const startAnalysisButton = document.getElementById("startAnalysis")
const targetCarryOn = document.querySelector(".bagCarryOn")
const targetPersonalItem = document.querySelector(".bagPersonalItem")
const itemListSummaryCarryOn = document.querySelector(".bagCarryOn .itemListSummary")
const itemListSummaryPersonalItem = document.querySelector(".bagPersonalItem .itemListSummary")

addListToIndex("Sample List", generateUUID())
localStorage.setItem("Sample List", JSON.stringify(sampleData))

addListToIndex("Sample List 2", generateUUID())
localStorage.setItem("Sample List 2", JSON.stringify(sampleData2))


//================
// EVENT LISTENERS
//================

createListButton.addEventListener("click", function (event) {
  event.preventDefault()
  const listName = document.getElementById("listName").value
  if (listName != "") {
    let listUUID = generateUUID()
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
  fileInput.click();
});

// clearLocalStorageButton.addEventListener("click", function () {
//   localStorage.clear()
//   loadList()
// })

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0]
  // uploadList(file, fileInput)
  fileInput.value = ""
  console.log("event fired")
  if (file) {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const itemArray = JSON.parse(e.target.result)
        // const listUUID = generateUUID()
        // itemArray[0].listUUID = listUUID
        // console.log(itemArray)
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
    return crypto.randomUUID();
  } else {
    function randomHex(length) {
      let result = '';
      for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 16).toString(16);
      }
      return result;
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
    );
  }
}

function createCategoryElements() {
  categories.forEach((category) => {
    // Category Selector Dropdowns
    categoryDropdown.forEach((option) => {
      const selectOption = document.createElement("option")
      selectOption.setAttribute("value", category)
      selectOption.innerHTML = category
      option.appendChild(selectOption)
    })

    // Filters
    listFilters.forEach((filter, index) => {
      const filterItem = document.createElement("label")
      const span = document.createElement("span")
      const input = document.createElement("input")
      input.setAttribute("type", "checkbox")
      span.innerHTML = "▶"
      const text = document.createTextNode(category)

      if (index === 0) {
        filterItem.setAttribute("for", category)
        input.setAttribute("name", category)
        input.setAttribute("id", category)
      } else {
        filterItem.setAttribute("for", `${category}${index + 1}`)
        input.setAttribute("name", `${category}${index + 1}`)
        input.setAttribute("id", `${category}${index + 1}`)
      }

      filterItem.appendChild(span)
      filterItem.appendChild(text)
      filterItem.appendChild(input)
      filter.appendChild(filterItem)
    })

  })
}
createCategoryElements()

function populateListSelector() {
  var listIndex = JSON.parse(localStorage.getItem("List Index"))
  var listSelector = document.getElementById("listSelector")
  listSelector.innerHTML =
    '<option value="" selected disabled>Select List</option>'
  listIndex.forEach((listIndexItem, index) => {
    const option = document.createElement("option")
    option.setAttribute("value", listIndexItem.listName)
    option.setAttribute("data-index", index)
    option.innerHTML = listIndexItem.listName
    listSelector.appendChild(option)
  })
}
populateListSelector()

function loadList(listName) {
  clearItemList()
  const itemArray = getItemArray(listName)
  const listInfo = itemArray[0]
  const listItems = itemArray.slice(1)
  renderItems(listItems)
  activateDeleteListeners(listName)
  const result = processData(listItems)
  const percentages = [];

  for (const category of categories) {
    if (result.categoryWeightPercentage[category] !== undefined) {
      percentages.push(result.categoryWeightPercentage[category]);
    } else {
      percentages.push(0);
    }
  }
  // Create the grid template column value
  const gridTemplateColumns = percentages.map(percentage => `${percentage}fr`).join(' ');
  document.querySelector(".bagCarryOn .weightDistribution").style.gridTemplateColumns = gridTemplateColumns;
  document.querySelector(".bagPersonalItem .weightDistribution").style.gridTemplateColumns = gridTemplateColumns;
}

function renderItems(listItem) {
  let totalWeightCarryOn = 0
  let totalWeightPersonalItem = 0
  const carryOnTotalWeight = document.getElementById("carryOnTotalWeight")
  const personalItemTotalWeight = document.getElementById("personalItemTotalWeight")
  carryOnTotalWeight.innerHTML = 0
  personalItemTotalWeight.innerHTML = 0

  listItem.forEach((item, index) => {
    let itemTotalWeight = item.itemAmount * item.itemWeight
    const listItem = createItemListItem(item, itemTotalWeight, index + 1)

    if (item.itemBagType == "carryOn") {
      targetCarryOn.insertBefore(listItem, itemListSummaryCarryOn)
      totalWeightCarryOn += itemTotalWeight
      carryOnTotalWeight.innerHTML = totalWeightCarryOn + " g"
    } else if (item.itemBagType == "personalItem") {
      targetPersonalItem.insertBefore(listItem, itemListSummaryPersonalItem)
      totalWeightPersonalItem += itemTotalWeight
      personalItemTotalWeight.innerHTML = totalWeightPersonalItem + " g"
    }
  })
}

function getItemArray(listName) {
  return JSON.parse(localStorage.getItem(listName)) || []
}

function setItemArray(listName, itemArray) {
  localStorage.setItem(listName, JSON.stringify(itemArray))
}

function deleteItemArray(listName) {
  localStorage.removeItem(listName)
}

function activateDeleteListeners(listName) {
  let deleteBtn = document.querySelectorAll(".deleteItem")
  deleteBtn.forEach((dB) => {
    dB.addEventListener("click", () => {
      const index = dB.parentElement.parentElement.getAttribute("data-index")
      deleteItem(listName, index)
    })
  })
}

function sendData(listName) {
  let itemArray = localStorage.getItem(listName)
  // let itemArray = JSON.stringify(localStorage.getItem(listName))

  fetch("/process", {
    method: "POST",
    body: itemArray,
    // headers: {
    //   "Content-type": "application/json; charset=UTF-8",
    // }
  })
    .then((response) => response.text())
    .then((data) => {
      document.querySelector(".analysisResult").innerHTML = data
    })
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
  const listItem = document.createElement("article")
  listItem.classList.add(
    "listItem",
    item.itemCategory,
    item.itemBagType
  )
  listItem.setAttribute("data-index", `${index}`)
  listItem.innerHTML = `
    <div class="itemName">${item.itemName}</div>
    <div class="itemAmount">${item.itemAmount}x</div>
    <div class="itemWeight">${item.itemWeight}<span class="mobileOnlyInfo"> g</span></div>
    <div class="itemTotalWeight"><span class="mobileOnlyInfo">Total: </span>${itemTotalWeight}<span class="mobileOnlyInfo"> g</span></div>
    <div class="itemPriority"><span class="mobileOnlyInfo">Prio: </span>${item.itemPriority
    }</div>
    <div class="itemCategory">${item.itemCategory.charAt(0).toUpperCase() + item.itemCategory.slice(1)
    }</div>
    <div class="itemSubcategory">${item.itemSubcategory}
    <span class="deleteItem" data-index="${index}">❌</span>`

  return listItem
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
