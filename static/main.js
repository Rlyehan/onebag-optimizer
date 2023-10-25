//========
// IMPORTS
//========



//==========
// VARIABLES
//==========

const createListButton = document.getElementById("createListButton")
const listSelectorDropdown = document.getElementById("listSelector")
const deleteListButton = document.getElementById("deleteListButton")
const itemForm = document.getElementById("itemForm")
const clearLocalStorageButton = document.getElementById("clearLocalStorage")
const startAnalysisButton = document.getElementById("startAnalysis")
const targetCarryOn = document.querySelector(".bagCarryOn")
const targetPersonalItem = document.querySelector(".bagPersonalItem")
const itemListSummaryCarryOn = document.querySelector(".bagCarryOn .itemListSummary")
const itemListSummaryPersonalItem = document.querySelector(".bagPersonalItem .itemListSummary")
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
  },
]


//================
// EVENT LISTENERS
//================

createListButton.addEventListener("click", function (event) {
  event.preventDefault()
  const listName = document.getElementById("listName").value
  if (listName != "") {
    addListToIndex(listName, "self.crypto.randomUUID()")
    setItemArray(listName, [])
    populateListSelector()
    const listSelector = document.getElementById("listSelector")
    listSelector.value = listName
    loadOBItems(listName)
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
  loadOBItems(selectedList)
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
      loadOBItems(selectedList)
    }
  } else {
    // alert("Please select a list first!")
    const listSelectorDropdown = document.getElementById("listSelector")
    listSelectorDropdown.focus()
    listSelectorDropdown.classList.add("highlight")
  }
})

itemForm.addEventListener("submit", function (event) {
  event.preventDefault()
  addListItem()
})

startAnalysisButton.addEventListener("click", function (event) {
  event.preventDefault()
  const selectedList = document.getElementById("listSelector").value
  sendData(selectedList)
})



function addListToIndex(listName, uuid) {
  var listIndex = localStorage.getItem("List Index")
  var listIndexItems = listIndex ? JSON.parse(listIndex) : []

  if (!listIndexItems.some((item) => item.listName === listName)) {
    listIndexItems.push({
      listName: listName,
      uuid: uuid,
    })
  }
  localStorage.setItem("List Index", JSON.stringify(listIndexItems))
}

let sampleListUUID = "fancy UUID"
// Not using crypto atm as it only works on localhost or HTTPS
// let sampleListUUID = self.crypto.randomUUID()
addListToIndex("Sample List", sampleListUUID)

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


localStorage.setItem("Sample List", JSON.stringify(sampleData))


// const loadListButton = document.getElementById("loadListButton")

// loadListButton.addEventListener("click", function () {
//   event.preventDefault()
//   const selectedList = document.getElementById("listSelector").value
//   console.log(selectedList)
//   getItemArray(selectedList)
//   loadOBItems(selectedList)
// })

// const loadSampleItemsButton = document.getElementById("loadSampleItems")

// const setSampleData = () => {
//   localStorage.setItem("Sample List", JSON.stringify(sampleData))
// }

// loadSampleItemsButton.addEventListener("click", function () {
//   setSampleData()
//   loadOBItems()
// })


// clearLocalStorageButton.addEventListener("click", function () {
//   localStorage.clear()
//   loadOBItems()
// })


function loadOBItems(listName) {
  clearItemList()
  const itemArray = getItemArray(listName)
  renderItems(itemArray)
  activateDeleteListeners(listName)
}

function clearItemList() {
  const articles = document.querySelectorAll(".itemListItem")
  articles.forEach((entry) => entry.remove())
}

function renderItems(itemArray) {
  let totalWeightCarryOn = 0
  let totalWeightPersonalItem = 0
  const carryOnTotalWeight = document.getElementById("carryOnTotalWeight")
  const personalItemTotalWeight = document.getElementById("personalItemTotalWeight")
  carryOnTotalWeight.innerHTML = 0
  personalItemTotalWeight.innerHTML = 0

  itemArray.forEach((item, index) => {
    let itemTotalWeight = item.itemAmount * item.itemWeight
    const itemListItem = createItemListItem(item, itemTotalWeight, index)

    if (item.itemBagType == "carryOn") {
      targetCarryOn.insertBefore(itemListItem, itemListSummaryCarryOn)
      totalWeightCarryOn += itemTotalWeight
      carryOnTotalWeight.innerHTML = totalWeightCarryOn + " g"
    } else if (item.itemBagType == "personalItem") {
      targetPersonalItem.insertBefore(itemListItem,itemListSummaryPersonalItem)
      totalWeightPersonalItem += itemTotalWeight
      personalItemTotalWeight.innerHTML = totalWeightPersonalItem + " g"
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
    <div class="itemAmount">${item.itemAmount}x</div>
    <div class="itemWeight">${item.itemWeight}<span class="mobileOnlyInfo"> g</span></div>
    <div class="itemTotalWeight"><span class="mobileOnlyInfo">Total: </span>${itemTotalWeight}<span class="mobileOnlyInfo"> g</span></div>
    <div class="itemPriority"><span class="mobileOnlyInfo">Prio: </span>${item.itemPriority
    }</div>
    <div class="itemCategory">${item.itemCategory.charAt(0).toUpperCase() + item.itemCategory.slice(1)
    }</div>
    <div class="itemSubcategory">${item.itemSubcategory}
    <span class="deleteItem" data-index="${index}">❌</span>`

  return itemListItem
}

function addListItem(event) {
  // event.preventDefault()

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
    loadOBItems(listName)
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
  loadOBItems(listName)
}

function deleteList(listName) {
  let i = document.querySelector('[value="' + listName + '"').getAttribute("data-index")
  localStorage.removeItem(listName)

  let listIndex = getItemArray("List Index")
  listIndex.splice(i, 1)
  setItemArray("List Index", listIndex)
  loadOBItems(listName)
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
