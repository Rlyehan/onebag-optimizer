window.onload = loadOBItems

var targetCarryOn = document.querySelector(".bagCarryOn")
var itemListSummaryCarryOn = document.querySelector(".itemListSummary.carryOn")

var targetPersonalItem = document.querySelector(".bagPersonalItem")
var itemListSummaryPersonalItem = document.querySelector(
  ".itemListSummary.personalItem"
)

function loadOBItems() {
  var totalWeightCarryOn = 0
  var totalWeightPersonalItem = 0
  var itemsArray = localStorage.getItem("items")
    ? JSON.parse(localStorage.getItem("items"))
    : []
  var carryOnTotalWeight = document.getElementById("carryOnTotalWeight")
  var personalItemTotalWeight = document.getElementById(
    "personalItemTotalWeight"
  )

  carryOnTotalWeight.innerHTML = 0
  personalItemTotalWeight.innerHTML = 0

  var articles = document.querySelectorAll(
    ".itemListItem:not(.itemListHeader):not(.itemListSummary"
  )
  articles.forEach((entry) => {
    entry.remove()
  })

  itemsArray.forEach((item, counter) => {
    const itemListItem = document.createElement("article")
    itemListItem.classList.add("itemListItem")
    itemListItem.classList.add(item.itemCategory)
    itemListItem.classList.add(item.itemBagType)
    var itemTotalWeight = item.itemAmount * item.itemWeight
    itemListItem.innerHTML =
      '<div class="itemName">' +
      item.itemName +
      '</div><div class="itemAmount">' +
      item.itemAmount +
      '</div><div class="itemWeight">' +
      item.itemWeight +
      '</div><div class="itemTotalWeight"><span class="mobileOnlyInfo">Total: </span>' +
      itemTotalWeight +
      '</div><div class="itemPriority"><span class="mobileOnlyInfo">Prio: </span>' +
      item.itemPriority +
      '</div><div class="itemCategory">' +
      item.itemCategory.charAt(0).toUpperCase() +
      item.itemCategory.slice(1) +
      '</div><div class="itemSubcategory">' +
      item.itemSubcategory +
      '</div><span class="deleteItem">❌</button>'

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
  activateDeleteListeners()
}

function addListItem() {
  event.preventDefault();
  var itemsArray = localStorage.getItem("items")
    ? JSON.parse(localStorage.getItem("items"))
    : []

  var itemName = document.getElementById("itemName").value
  var itemAmount = parseInt(document.getElementById("itemAmount").value)
  var itemWeight = parseInt(document.getElementById("itemWeight").value)
  var itemCategory = document.getElementById("itemCategory").value
  var itemSubcategory = document.getElementById("itemSubcategory").value
  var itemPriority = document.getElementById("itemPriority").value
  var itemBagType = document.getElementById("itemBagType").value

  itemsArray.push({
    itemName: itemName,
    itemAmount: itemAmount,
    itemWeight: itemWeight,
    itemCategory: itemCategory,
    itemSubcategory: itemSubcategory,
    itemPriority: itemPriority,
    itemBagType: itemBagType,
  })
  localStorage.setItem("items", JSON.stringify(itemsArray))
  loadOBItems()
}

function activateDeleteListeners() {
  let deleteBtn = document.querySelectorAll(".deleteItem")
  deleteBtn.forEach((dB, i) => {
    dB.addEventListener("click", () => {
      deleteItem(i)
    })
  })
}

function deleteItem(i) {
  var itemsArray = localStorage.getItem("items")
    ? JSON.parse(localStorage.getItem("items"))
    : []
  itemsArray.splice(i, 1)
  localStorage.setItem("items", JSON.stringify(itemsArray))
  loadOBItems()
}

function sendData() {
  var itemsArray = localStorage.getItem("items")
  fetch("/process", {
    method: "POST",
    body: JSON.stringify(itemsArray),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
}
