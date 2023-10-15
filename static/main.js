window.addEventListener("load", loadOBItems);

var targetCarryOn = document.querySelector(".bagCarryOn");
var itemListSummaryCarryOn = document.querySelector(".itemListSummary.carryOn");
var targetPersonalItem = document.querySelector(".bagPersonalItem");
var itemListSummaryPersonalItem = document.querySelector(".itemListSummary.personalItem");

function loadOBItems() {
  clearItemList();
  var itemsArray = getItemsArray();

  if (itemsArray.length === 0) {
    displayNoItemsMessage();
  } else {
    renderItems(itemsArray);
  }

  activateDeleteListeners();
}

function clearItemList() {
  var articles = document.querySelectorAll(".itemListItem:not(.itemListHeader):not(.itemListSummary)");
  articles.forEach(entry => entry.remove());
}

function displayNoItemsMessage() {
  displayNoItemsMessageInBag(targetCarryOn);
  displayNoItemsMessageInBag(targetPersonalItem);
}

function displayNoItemsMessageInBag(target) {
  var itemListItem = document.createElement("article");
  itemListItem.classList.add("itemListItem");
  itemListItem.innerHTML = "<em>There are no items to display.</em>"
  target.insertBefore(itemListItem, target.querySelector(".itemListSummary"));
}

function renderItems(itemsArray) {
  var totalWeightCarryOn = 0;
  var totalWeightPersonalItem = 0;
  var carryOnTotalWeight = document.getElementById("carryOnTotalWeight");
  var personalItemTotalWeight = document.getElementById("personalItemTotalWeight");

  itemsArray.forEach((item) => {
    var itemTotalWeight = item.itemAmount * item.itemWeight;
    const itemListItem = createItemListItem(item, itemTotalWeight);
  
    if (item.itemBagType == "carryOn") {
      targetCarryOn.insertBefore(itemListItem, itemListSummaryCarryOn);
      totalWeightCarryOn += itemTotalWeight;
      carryOnTotalWeight.innerHTML = totalWeightCarryOn;
    } else if (item.itemBagType == "personalItem") {
      targetPersonalItem.insertBefore(itemListItem, itemListSummaryPersonalItem);
      totalWeightPersonalItem += itemTotalWeight;
      personalItemTotalWeight.innerHTML = totalWeightPersonalItem;
    }
  });
}

function createItemListItem(item, itemTotalWeight) {
  const itemListItem = document.createElement("article");
  itemListItem.classList.add("itemListItem");
  itemListItem.classList.add(item.itemCategory);
  itemListItem.classList.add(item.itemBagType);
  itemListItem.innerHTML = `
    <div class="itemName">${item.itemName}</div>
    <div class="itemAmount">${item.itemAmount}</div>
    <div class="itemWeight">${item.itemWeight}</div>
    <div class="itemTotalWeight"><span class="mobileOnlyInfo">Total: </span>${itemTotalWeight}</div>
    <div class="itemPriority"><span class="mobileOnlyInfo">Prio: </span>${item.itemPriority}</div>
    <div class="itemCategory">${item.itemCategory.charAt(0).toUpperCase() + item.itemCategory.slice(1)}</div>
    <div class="itemSubcategory">${item.itemSubcategory}
    <span class="deleteItem">❌</button>`;

  return itemListItem;
}

function addListItem() {
  var itemsArray = getItemsArray();

  var itemName = document.getElementById("itemName").value;
  var itemAmount = parseInt(document.getElementById("itemAmount").value);
  var itemWeight = parseInt(document.getElementById("itemWeight").value);
  var itemCategory = document.getElementById("itemCategory").value;
  var itemSubcategory = document.getElementById("itemSubcategory").value;
  var itemPriority = document.getElementById("itemPriority").value;
  var itemBagType = document.getElementById("itemBagType").value;
  event.preventDefault();

  itemsArray.push({
    itemName: itemName,
    itemAmount: itemAmount,
    itemWeight: itemWeight,
    itemCategory: itemCategory,
    itemSubcategory: itemSubcategory,
    itemPriority: itemPriority,
    itemBagType: itemBagType,
  });
  setItemsArray(itemsArray);
  loadOBItems();
}

function getItemsArray() {
  return JSON.parse(localStorage.getItem("items")) || [];
}

function setItemsArray(itemsArray) {
  localStorage.setItem("items", JSON.stringify(itemsArray));
}

function activateDeleteListeners() {
  let deleteBtn = document.querySelectorAll(".deleteItem");
  deleteBtn.forEach((dB, i) => {
    dB.addEventListener("click", () => {
      deleteItem(i);
    });
  });
}

function deleteItem(i) {
  var itemsArray = getItemsArray();
  itemsArray.splice(i, 1);
  setItemsArray(itemsArray);
  loadOBItems();
}

function sendData() {
  var itemsArray = localStorage.getItem("items");
  fetch("/process", {
    method: "POST",
    body: JSON.stringify(itemsArray),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  });
}
