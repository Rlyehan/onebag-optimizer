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

    items.slice(1).forEach(item => {
        let itemTotalWeight = item.itemAmount * item.itemWeight;
        totalWeight += itemTotalWeight;

        priorityWeights[item.itemPriority] = (priorityWeights[item.itemPriority] || 0) + itemTotalWeight;
        categoryWeights[item.itemCategory] = (categoryWeights[item.itemCategory] || 0) + itemTotalWeight;

        const formattedBagType = formatBagType(item.itemBagType);
        bagWeights[formattedBagType] = (bagWeights[formattedBagType] || 0) + itemTotalWeight;
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
        categoryData: categoryData
    };
}

// const sampleData = [
//     {
//         itemAmount: 2,
//         itemWeight: 100,
//         itemCategory: "electronics",
//         itemPriority: "high",
//         itemBagType: "carryOn"
//     },
//     {
//         itemAmount: 1,
//         itemWeight: 50,
//         itemCategory: "clothing",
//         itemPriority: "medium",
//         itemBagType: "personalItem"
//     },
// ];

// const result = dataProcessing(sampleData);
// console.log(result);