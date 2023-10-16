document.addEventListener("DOMContentLoaded", loadOBItems)

const sampleData = [
  {
    itemName: "Sample Item 1",
    itemAmount: 2,
    itemWeight: 500,
    itemCategory: "bags",
    itemSubcategory: "Backpack",
    itemPriority: "1",
    itemBagType: "carryOn",
  },
  {
    itemName: "Sample Item 2",
    itemAmount: 3,
    itemWeight: 300,
    itemCategory: "clothing",
    itemSubcategory: "T-Shirts",
    itemPriority: "2",
    itemBagType: "carryOn",
  },
  {
    itemName: "Sample Item 3",
    itemAmount: 1,
    itemWeight: 750,
    itemCategory: "footwear",
    itemSubcategory: "Sneakers",
    itemPriority: "1",
    itemBagType: "carryOn",
  },
  {
    itemName: "Sample Item 4",
    itemAmount: 2,
    itemWeight: 250,
    itemCategory: "grooming",
    itemSubcategory: "Toiletries",
    itemPriority: "3",
    itemBagType: "personalItem",
  },
  {
    itemName: "Sample Item 5",
    itemAmount: 1,
    itemWeight: 1500,
    itemCategory: "electronics",
    itemSubcategory: "Laptop",
    itemPriority: "1",
    itemBagType: "carryOn",
  },
  {
    itemName: "Sample Item 6",
    itemAmount: 4,
    itemWeight: 200,
    itemCategory: "hygiene",
    itemSubcategory: "Soap",
    itemPriority: "2",
    itemBagType: "personalItem",
  },
  {
    itemName: "Sample Item 7",
    itemAmount: 2,
    itemWeight: 500,
    itemCategory: "meds",
    itemSubcategory: "Painkillers",
    itemPriority: "2",
    itemBagType: "carryOn",
  },
  {
    itemName: "Sample Item 8",
    itemAmount: 1,
    itemWeight: 1000,
    itemCategory: "consumables",
    itemSubcategory: "Snacks",
    itemPriority: "3",
    itemBagType: "carryOn",
  },
  {
    itemName: "Sample Item 9",
    itemAmount: 1,
    itemWeight: 500,
    itemCategory: "necessities",
    itemSubcategory: "Passport",
    itemPriority: "1",
    itemBagType: "personalItem",
  },
  {
    itemName: "Sample Item 10",
    itemAmount: 2,
    itemWeight: 300,
    itemCategory: "clothing",
    itemSubcategory: "Shorts",
    itemPriority: "2",
    itemBagType: "carryOn",
  },
  {
    itemName: "Sample Item 11",
    itemAmount: 1,
    itemWeight: 750,
    itemCategory: "footwear",
    itemSubcategory: "Sandals",
    itemPriority: "1",
    itemBagType: "carryOn",
  },
  {
    itemName: "Sample Item 12",
    itemAmount: 2,
    itemWeight: 250,
    itemCategory: "grooming",
    itemSubcategory: "Toothbrush",
    itemPriority: "3",
    itemBagType: "personalItem",
  },
  {
    itemName: "Sample Item 13",
    itemAmount: 1,
    itemWeight: 1500,
    itemCategory: "electronics",
    itemSubcategory: "Tablet",
    itemPriority: "1",
    itemBagType: "carryOn",
  },
  {
    itemName: "Sample Item 14",
    itemAmount: 4,
    itemWeight: 200,
    itemCategory: "hygiene",
    itemSubcategory: "Shampoo",
    itemPriority: "2",
    itemBagType: "personalItem",
  },
  {
    itemName: "Sample Item 15",
    itemAmount: 2,
    itemWeight: 500,
    itemCategory: "meds",
    itemSubcategory: "Antihistamines",
    itemPriority: "2",
    itemBagType: "carryOn",
  },
  {
    itemName: "Sample Item 16",
    itemAmount: 1,
    itemWeight: 1000,
    itemCategory: "consumables",
    itemSubcategory: "Water Bottle",
    itemPriority: "3",
    itemBagType: "carryOn",
  },
  {
    itemName: "Sample Item 17",
    itemAmount: 1,
    itemWeight: 500,
    itemCategory: "necessities",
    itemSubcategory: "Travel Adapter",
    itemPriority: "1",
    itemBagType: "personalItem",
  },
  {
    itemName: "Sample Item 18",
    itemAmount: 2,
    itemWeight: 300,
    itemCategory: "clothing",
    itemSubcategory: "Shirts",
    itemPriority: "2",
    itemBagType: "carryOn",
  },
  {
    itemName: "Sample Item 19",
    itemAmount: 1,
    itemWeight: 750,
    itemCategory: "footwear",
    itemSubcategory: "Slippers",
    itemPriority: "1",
    itemBagType: "carryOn",
  },
  {
    itemName: "Sample Item 20",
    itemAmount: 2,
    itemWeight: 250,
    itemCategory: "grooming",
    itemSubcategory: "Razor",
    itemPriority: "3",
    itemBagType: "personalItem",
  }
]

const loadSampleItemsButton = document.getElementById("loadSampleItems")

const setSampleData = () => {
  localStorage.setItem("items", JSON.stringify(sampleData))
}

loadSampleItemsButton.addEventListener("click", function () {
  setSampleData()
  loadOBItems()
})

const itemForm = document.getElementById("itemForm")
const clearLocalStorageButton = document.getElementById("clearLocalStorage")
const startAnalysisButton = document.getElementById("startAnalysis")

itemForm.addEventListener("submit", function (event) {
  event.preventDefault()
  addListItem()
})

clearLocalStorageButton.addEventListener("click", function () {
  localStorage.clear()
  loadOBItems()
})

startAnalysisButton.addEventListener("click", function () {
  sendData()
})

var targetCarryOn = document.querySelector(".bagCarryOn")
var itemListSummaryCarryOn = document.querySelector(
  ".bagCarryOn .itemListSummary"
)
var targetPersonalItem = document.querySelector(".bagPersonalItem")
var itemListSummaryPersonalItem = document.querySelector(
  ".bagPersonalItem .itemListSummary"
)

function loadOBItems() {
  clearItemList()
  var itemArray = getItemArray()
  renderItems(itemArray)
  activateDeleteListeners()
}

function clearItemList() {
  var articles = document.querySelectorAll(
    ".itemListItem"
  )
  articles.forEach((entry) => entry.remove())
}

function renderItems(itemArray) {
  var totalWeightCarryOn = 0
  var totalWeightPersonalItem = 0
  var carryOnTotalWeight = document.getElementById("carryOnTotalWeight")
  var personalItemTotalWeight = document.getElementById(
    "personalItemTotalWeight"
  )
  carryOnTotalWeight.innerHTML = 0
  personalItemTotalWeight.innerHTML = 0

  itemArray.forEach((item, index) => {
    var itemTotalWeight = item.itemAmount * item.itemWeight
    const itemListItem = createItemListItem(item, itemTotalWeight, index)

    if (item.itemBagType == "carryOn") {
      targetCarryOn.insertBefore(itemListItem, itemListSummaryCarryOn)
      totalWeightCarryOn += itemTotalWeight
      carryOnTotalWeight.innerHTML = totalWeightCarryOn
    } else if (item.itemBagType == "personalItem") {
      targetPersonalItem.insertBefore(
        itemListItem,
        itemListSummaryPersonalItem
      )
      totalWeightPersonalItem += itemTotalWeight
      personalItemTotalWeight.innerHTML = totalWeightPersonalItem
    }
  })
}

function createItemListItem(item, itemTotalWeight, index) {
  const itemListItem = document.createElement("article")
  itemListItem.classList.add(
    "itemListItem",
    item.itemCategory,
    item.itemBagType
  )
  itemListItem.setAttribute("data-index", `${index}`)
  itemListItem.innerHTML = `
    <div class="itemName">${item.itemName}</div>
    <div class="itemAmount">${item.itemAmount}</div>
    <div class="itemWeight">${item.itemWeight}</div>
    <div class="itemTotalWeight"><span class="mobileOnlyInfo">Total: </span>${itemTotalWeight}</div>
    <div class="itemPriority"><span class="mobileOnlyInfo">Prio: </span>${item.itemPriority
    }</div>
    <div class="itemCategory">${item.itemCategory.charAt(0).toUpperCase() + item.itemCategory.slice(1)
    }</div>
    <div class="itemSubcategory">${item.itemSubcategory}
    <span class="deleteItem" data-index="${index}">❌</span>`

  return itemListItem
}

function addListItem() {
  var itemArray = getItemArray()

  var itemName = document.getElementById("itemName").value
  var itemAmount = parseInt(document.getElementById("itemAmount").value)
  var itemWeight = parseInt(document.getElementById("itemWeight").value)
  var itemCategory = document.getElementById("itemCategory").value
  var itemSubcategory = document.getElementById("itemSubcategory").value
  var itemPriority = document.getElementById("itemPriority").value
  var itemBagType = document.getElementById("itemBagType").value
  event.preventDefault()

  itemArray.push({
    itemName: itemName,
    itemAmount: itemAmount,
    itemWeight: itemWeight,
    itemCategory: itemCategory,
    itemSubcategory: itemSubcategory,
    itemPriority: itemPriority,
    itemBagType: itemBagType,
  })
  setItemArray(itemArray)
  loadOBItems()
}

function getItemArray() {
  return JSON.parse(localStorage.getItem("items")) || []
}

function setItemArray(itemArray) {
  localStorage.setItem("items", JSON.stringify(itemArray))
}

function activateDeleteListeners() {
  let deleteBtn = document.querySelectorAll(".deleteItem")
  deleteBtn.forEach((dB) => {
    dB.addEventListener("click", () => {
      const index = dB.parentElement.parentElement.getAttribute("data-index")
      deleteItem(index)
    })
  })
}

function deleteItem(i) {
  var itemArray = getItemArray()
  itemArray.splice(i, 1)
  setItemArray(itemArray)
  loadOBItems()
}

function sendData() {
  var itemArray = localStorage.getItem("items")
  fetch("/process", {
    method: "POST",
    body: JSON.stringify(itemArray),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    }
  })
}
