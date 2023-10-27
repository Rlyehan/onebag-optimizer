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

const createListButton = document.getElementById("createListButton")
const listSelectorDropdown = document.getElementById("listSelector")
const deleteListButton = document.getElementById("deleteListButton")
const fileInput = document.getElementById("jsonFileInput")
const uploadListButton = document.getElementById("uploadListButton")
const downloadListButton = document.getElementById("downloadListButton")
const itemForm = document.getElementById("itemForm")
const clearLocalStorageButton = document.getElementById("clearLocalStorage")
const startAnalysisButton = document.getElementById("startAnalysis")
const targetCarryOn = document.querySelector(".bagCarryOn")
const targetPersonalItem = document.querySelector(".bagPersonalItem")
const itemListSummaryCarryOn = document.querySelector(".bagCarryOn .itemListSummary")
const itemListSummaryPersonalItem = document.querySelector(".bagPersonalItem .itemListSummary")

addListToIndex("Sample List", "sampleListUUID")
localStorage.setItem("Sample List", JSON.stringify(sampleData))

addListToIndex("Sample List 2", "sampleList2UUID")
localStorage.setItem("Sample List 2", JSON.stringify(sampleData2))


//================
// EVENT LISTENERS
//================

createListButton.addEventListener("click", function (event) {
  event.preventDefault()
  const listName = document.getElementById("listName").value
  if (listName != "") {
    let listUUID = self.crypto.randomUUID()
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
        // const listUUID = self.crypto.randomUUID()
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
  const itemArray = getItemArray(selectedList)

  if (itemArray) {
    downloadList(itemArray, `${selectedList}.json`)
  } else {
    alert('No data found in localStorage.')
  }
})

itemForm.addEventListener("submit", function (event) {
  event.preventDefault()
  addListItem()
})

// startAnalysisButton.addEventListener("click", function (event) {
//   event.preventDefault()
//   const selectedList = document.getElementById("listSelector").value
//   // const itemList = getItemArray(selectedList)
//   // const result = processData(itemList)
//   // console.log(result)
//   // sendData(selectedList)
// })



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

// let sampleListUUID = "fancy UUID"
// Not using crypto atm as it only works on localhost or HTTPS


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


// clearLocalStorageButton.addEventListener("click", function () {
//   localStorage.clear()
//   loadList()
// })


function loadList(listName) {
  clearItemList()
  const itemArray = getItemArray(listName)
  const listInfo = itemArray[0]
  const listItems = itemArray.slice(1)
  renderItems(listItems)
  activateDeleteListeners(listName)
  const result = processData(listItems)
  console.log(result)
  const bagsPercentage = (result.categoryWeightPercentage.bags !== undefined) ? result.categoryWeightPercentage.bags : 0
  const clothingPercentage = (result.categoryWeightPercentage.clothing !== undefined) ? result.categoryWeightPercentage.clothing : 0
  const footwearPercentage = (result.categoryWeightPercentage.footwear !== undefined) ? result.categoryWeightPercentage.footwear : 0
  const groomingPercentage = (result.categoryWeightPercentage.grooming !== undefined) ? result.categoryWeightPercentage.grooming : 0
  const electronicsPercentage = (result.categoryWeightPercentage.electronics !== undefined) ? result.categoryWeightPercentage.electronics : 0
  const hygienePercentage = (result.categoryWeightPercentage.hygiene !== undefined) ? result.categoryWeightPercentage.hygiene : 0
  const medsPercentage = (result.categoryWeightPercentage.meds !== undefined) ? result.categoryWeightPercentage.meds : 0
  const consumablesPercentage = (result.categoryWeightPercentage.consumables !== undefined) ? result.categoryWeightPercentage.consumables : 0
  const necessitiesPercentage = (result.categoryWeightPercentage.necessities !== undefined) ? result.categoryWeightPercentage.necessities : 0
  const otherPercentage = (result.categoryWeightPercentage.other !== undefined) ? result.categoryWeightPercentage.other : 0

  document.querySelector(".weightDistribution").style.gridTemplateColumns = `${bagsPercentage}fr ${clothingPercentage}fr ${consumablesPercentage}fr ${electronicsPercentage}fr ${footwearPercentage}fr ${groomingPercentage}fr ${hygienePercentage}fr ${medsPercentage}fr ${necessitiesPercentage}fr ${otherPercentage}fr`
  // console.log(`"${bagsPercentage}fr ${clothingPercentage}fr ${consumablesPercentage}fr ${electronicsPercentage}fr ${footwearPercentage}fr ${groomingPercentage}fr ${hygienePercentage}fr ${medsPercentage}fr ${necessitiesPercentage}fr ${otherPercentage}fr"`)
}

function clearItemList() {
  const articles = document.querySelectorAll(".listItem")
  articles.forEach((entry) => entry.remove())
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
