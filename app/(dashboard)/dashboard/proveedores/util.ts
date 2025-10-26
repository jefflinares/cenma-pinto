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
      quantities[id] = Number(value);
    }
  });

  // Combine productIds and quantities
  Object.keys(productIds).forEach((id) => {
    products.push({
      productId: productIds[id],
      quantity: quantities[id],
    });
  });

  return products;
};
