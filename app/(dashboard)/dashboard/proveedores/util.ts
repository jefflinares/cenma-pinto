export const extractProductsIds = (rest: Record<string, any>) => {
  const products: { productId: number; quantity: number }[] = [];

  // Process dynamic product fields
  const productIds: Record<string, number> = {};
  const quantities: Record<string, number> = {};

  Object.entries(rest).forEach(([key, value]) => {
    if (key.startsWith("productId_")) {
      const id = key.replace("productId_", "");
      productIds[id] = Number(value);
    } else if (key.startsWith("quantity_")) {
      const id = key.replace("quantity_", "");
      const quantity = value === "" || value === null || value === undefined ? NaN : Number(value);
      quantities[id] = quantity;
    }
  });

  // Combine productIds and quantities
  Object.keys(productIds).forEach((id) => {
    const quantity = quantities[id];
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return;
    }

    products.push({
      productId: productIds[id],
      quantity,
    });
  });

  return products;
};
