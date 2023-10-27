function formatBagType(bagType) {
    switch (bagType) {
        case "carryOn":
            return "Carry On";
        case "personalItem":
            return "Personal Item";
        default:
            return bagType;
    }
}

export function processData(items) {
    let totalWeight = 0;
    let bagWeights = {};
    let categoryWeights = {};
    let priorityWeights = {};
    let categoryData = {};
    let bagCategoryWeights = {}

    items.forEach(item => {
        let itemTotalWeight = item.itemAmount * item.itemWeight;
        totalWeight += itemTotalWeight;

        priorityWeights[item.itemPriority] = (priorityWeights[item.itemPriority] || 0) + itemTotalWeight;
        categoryWeights[item.itemCategory] = (categoryWeights[item.itemCategory] || 0) + itemTotalWeight;

        const formattedBagType = formatBagType(item.itemBagType);
        bagWeights[formattedBagType] = (bagWeights[formattedBagType] || 0) + itemTotalWeight;

        if (!bagCategoryWeights[formattedBagType]) {
            bagCategoryWeights[formattedBagType] = {};
        }
        bagCategoryWeights[formattedBagType][item.itemCategory] = (bagCategoryWeights[formattedBagType][item.itemCategory] || 0) + itemTotalWeight;
    });

    let averageWeight = items.length > 0 ? totalWeight / items.length : 0;

    items.sort((a, b) => b.itemWeight - a.itemWeight);
    let topHeaviestItems = items.slice(0, 5);

    let categoryWeightPercentage = {};
    for (let category in categoryWeights) {
        categoryWeightPercentage[category] = (categoryWeights[category] / totalWeight) * 100;
    }

    for (let category in categoryWeights) {
        let percentage = (categoryWeights[category] / totalWeight) * 100;
        categoryData[category] = {
            weight: categoryWeights[category],
            percentage: percentage
        };
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
        bagCategoryWeights: bagCategoryWeights
    };
}

export function updateForAddedItem(metrics, newItem) {
    let itemTotalWeight = newItem.itemAmount * newItem.itemWeight;
    metrics.totalWeight += itemTotalWeight;
    metrics.priorityWeights[newItem.itemPriority] = (metrics.priorityWeights[newItem.itemPriority] || 0) + itemTotalWeight;
    metrics.categoryWeights[newItem.itemCategory] = (metrics.categoryWeights[newItem.itemCategory] || 0) + itemTotalWeight;

    const formattedBagType = formatBagType(newItem.itemBagType);
    metrics.bagWeights[formattedBagType] = (metrics.bagWeights[formattedBagType] || 0) + itemTotalWeight;

    if (!metrics.bagCategoryWeights[formattedBagType]) {
        metrics.bagCategoryWeights[formattedBagType] = {};
    }
    metrics.bagCategoryWeights[formattedBagType][newItem.itemCategory] = (metrics.bagCategoryWeights[formattedBagType][newItem.itemCategory] || 0) + itemTotalWeight;
    

    if (newItem.itemWeight > metrics.topHeaviestItems[metrics.topHeaviestItems.length - 1].itemWeight) {
        metrics.topHeaviestItems.pop();
        metrics.topHeaviestItems.push(newItem);
        metrics.topHeaviestItems.sort((a, b) => b.itemWeight - a.itemWeight);
    }

    let percentage = (metrics.categoryWeights[newItem.itemCategory] / metrics.totalWeight) * 100;
    metrics.categoryData[newItem.itemCategory] = {
        weight: metrics.categoryWeights[newItem.itemCategory],
        percentage: percentage
    };

    return metrics;
}

export function updateForRemovedItem(metrics, removedItem, allItems) {

    let itemTotalWeight = removedItem.itemAmount * removedItem.itemWeight;
    metrics.totalWeight -= itemTotalWeight;
    metrics.priorityWeights[removedItem.itemPriority] -= itemTotalWeight;
    metrics.categoryWeights[removedItem.itemCategory] -= itemTotalWeight;

    const formattedBagType = formatBagType(removedItem.itemBagType);
    metrics.bagWeights[formattedBagType] -= itemTotalWeight;

    metrics.bagCategoryWeights[formattedBagType][removedItem.itemCategory] -= itemTotalWeight;

    if (metrics.topHeaviestItems.includes(removedItem)) {
        metrics.topHeaviestItems = metrics.topHeaviestItems.filter(item => item !== removedItem);
        let remainingItems = allItems.filter(item => !metrics.topHeaviestItems.includes(item));
        let nextTopItem = remainingItems.sort((a, b) => b.itemWeight - a.itemWeight)[0];
        if (nextTopItem) {
            metrics.topHeaviestItems.push(nextTopItem);
        }
    }

    let percentage = (metrics.categoryWeights[removedItem.itemCategory] / metrics.totalWeight) * 100;
    metrics.categoryData[removedItem.itemCategory] = {
        weight: metrics.categoryWeights[removedItem.itemCategory],
        percentage: percentage
    };

    return metrics;
}