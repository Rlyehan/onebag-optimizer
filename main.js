window.onload = loadOBItems;

var totalWeight = 0;
var totalWeightCarryOn = 0;
var totalWeightPersonalItem = 0;
var targetCarryOn = document.querySelector(".bagCarryOn");
var itemListSummaryCarryOn = document.querySelector(".itemListSummary.carryOn");
var targetPersonalItem = document.querySelector(".bagPersonalItem");
var itemListSummaryPersonalItem = document.querySelector(
  ".itemListSummary.personalItem"
);
const itemsArray = localStorage.getItem("items")
? JSON.parse(localStorage.getItem("items"))
: [];

function loadOBItems() {


  var carryOnTotalWeight = document.getElementById("carryOnTotalWeight");
  var personalItemTotalWeight = document.getElementById(
    "personalItemTotalWeight"
  );

  itemsArray.forEach((item) => {
    const itemListItem = document.createElement("article");
    itemListItem.classList.add("itemListItem");
    itemListItem.classList.add(item.itemCategory);
    itemListItem.classList.add(item.itemBagType);
    itemTotalWeight = item.itemAmount * item.itemWeight;
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
      '</div><span class="deleteItem">❌</button>';
    if (item.itemBagType == "carryOn") {
      targetCarryOn.insertBefore(itemListItem, itemListSummaryCarryOn);
      totalWeightCarryOn += itemTotalWeight;
      carryOnTotalWeight.innerHTML = totalWeightCarryOn;
    } else if (item.itemBagType == "personalItem") {
      targetPersonalItem.insertBefore(
        itemListItem,
        itemListSummaryPersonalItem
      );
      totalWeightPersonalItem += itemTotalWeight;
      personalItemTotalWeight.innerHTML = totalWeightPersonalItem;
    }
  });
  activateDeleteListeners();

}



function addListItem() {
  event.preventDefault();
  const itemsArray = localStorage.getItem("items")
    ? JSON.parse(localStorage.getItem("items"))
    : [];

  var itemName = document.getElementById("itemName").value;
  var itemAmount = document.getElementById("itemAmount").value;
  var itemWeight = document.getElementById("itemWeight").value;
  var itemCategory = document.getElementById("itemCategory").value;
  var itemSubcategory = document.getElementById("itemSubcategory").value;
  var itemPriority = document.getElementById("itemPriority").value;
  var itemBagType = document.getElementById("itemBagType").value;
  var totalWeightDiv = document.get;

  var itemTotalWeight = itemAmount * itemWeight;

  var article = document.createElement("article");
  article.classList.add("itemListItem");
  article.classList.add(itemCategory);
  article.classList.add(itemBagType);

  article.innerHTML =
    '<div class="itemName">' +
    itemName +
    '</div><div class="itemAmount">' +
    itemAmount +
    '</div><div class="itemWeight">' +
    itemWeight +
    '</div><div class="itemTotalWeight"><span class="mobileOnlyInfo">Total: </span>' +
    itemTotalWeight +
    '</div><div class="itemPriority">' +
    itemPriority +
    '</div><div class="itemCategory">' +
    itemCategory.charAt(0).toUpperCase() +
    itemCategory.slice(1) +
    '</div><div class="itemSubcategory">' +
    itemSubcategory +
    '</div><span class="deleteItem">❌</button>';
  if (itemBagType == "carryOn") {
    targetCarryOn.insertBefore(article, itemListSummaryCarryOn);
    totalWeightCarryOn += itemTotalWeight;
    carryOnTotalWeight.innerHTML = totalWeightCarryOn;
  } else if (itemBagType == "personalItem") {
    targetPersonalItem.insertBefore(article, itemListSummaryPersonalItem);
    totalWeightPersonalItem += itemTotalWeight;
    personalItemTotalWeight.innerHTML = totalWeightPersonalItem;
  }

  itemsArray.push({
    itemName: itemName,
    itemAmount: itemAmount,
    itemWeight: itemWeight,
    itemCategory: itemCategory,
    itemSubcategory: itemSubcategory,
    itemPriority: itemPriority,
    itemBagType: itemBagType,
  });
  localStorage.setItem("items", JSON.stringify(itemsArray));
}

function activateDeleteListeners() {
  let deleteBtn = document.querySelectorAll(".deleteItem");
  deleteBtn.forEach((dB, i) => {
    dB.addEventListener("click", () => {
      deleteItem(i);
    });
    console.log("added listener", i);

  });
}

function deleteItem(i) {
  console.log(itemsArray);
  itemsArray.splice(i, 1);
  console.log(itemsArray);
  localStorage.setItem("items", JSON.stringify(itemsArray));
  location.reload();
}
