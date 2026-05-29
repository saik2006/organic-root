// OrganicRoot — Product Data
window.PRODUCTS = [
  // Vegetables
  { id: 'v1', name: 'Farm Fresh Spinach', category: 'vegetables', price: 49, originalPrice: 65, emoji: '🥬', desc: 'Crisp, nutrient-packed spinach leaves. Harvested daily from certified organic farms.', badge: 'Fresh Today', unit: '250g' },
  { id: 'v2', name: 'Organic Tomatoes', category: 'vegetables', price: 79, originalPrice: 95, emoji: '🍅', desc: 'Vine-ripened, naturally sweet. No pesticides, no compromise.', badge: 'Best Seller', unit: '500g' },
  { id: 'v3', name: 'Baby Carrots', category: 'vegetables', price: 59, originalPrice: 75, emoji: '🥕', desc: 'Sweet, tender baby carrots. Perfect for snacking or cooking.', badge: null, unit: '400g' },
  { id: 'v4', name: 'Broccoli Crown', category: 'vegetables', price: 89, originalPrice: 110, emoji: '🥦', desc: 'Dense, vibrant green crowns. Rich in vitamins C and K.', badge: 'Organic', unit: '500g' },
  { id: 'v5', name: 'Red Bell Pepper', category: 'vegetables', price: 69, originalPrice: 85, emoji: '🫑', desc: 'Crisp, juicy and loaded with antioxidants. Naturally sweet.', badge: null, unit: '3 pcs' },
  { id: 'v6', name: 'Organic Cucumber', category: 'vegetables', price: 39, originalPrice: 50, emoji: '🥒', desc: 'Cool, refreshing and chemical-free. Straight from the farm.', badge: 'Fresh', unit: '2 pcs' },

  // Fruits
  { id: 'f1', name: 'Alphonso Mangoes', category: 'fruits', price: 299, originalPrice: 380, emoji: '🥭', desc: 'The king of mangoes. Authentic Ratnagiri Alphonso — naturally ripened.', badge: 'Seasonal', unit: '1 kg' },
  { id: 'f2', name: 'Organic Bananas', category: 'fruits', price: 69, originalPrice: 85, emoji: '🍌', desc: 'Naturally ripened on the plant. No ethylene gas used.', badge: 'Best Seller', unit: '12 pcs' },
  { id: 'f3', name: 'Fresh Strawberries', category: 'fruits', price: 149, originalPrice: 199, emoji: '🍓', desc: 'Plump, fragrant strawberries. Handpicked at peak ripeness.', badge: 'New', unit: '250g' },
  { id: 'f4', name: 'Green Apples', category: 'fruits', price: 189, originalPrice: 230, emoji: '🍏', desc: 'Crisp Granny Smith apples. Tart, refreshing, naturally waxed-free.', badge: null, unit: '4 pcs' },
  { id: 'f5', name: 'Pomegranate', category: 'fruits', price: 129, originalPrice: 160, emoji: '🍎', desc: 'Jewel-red arils bursting with juice. Antioxidant powerhouse.', badge: 'Organic', unit: '1 pc' },
  { id: 'f6', name: 'Kiwi Fruit', category: 'fruits', price: 159, originalPrice: 199, emoji: '🥝', desc: 'Tangy, vitamin-C rich kiwis. Import quality at local prices.', badge: null, unit: '4 pcs' },

  // Dairy
  { id: 'd1', name: 'A2 Cow Milk', category: 'dairy', price: 89, originalPrice: 105, emoji: '🥛', desc: 'Pure A2 milk from desi cows. No hormones, no antibiotics.', badge: 'Farm Fresh', unit: '1 litre' },
  { id: 'd2', name: 'Organic Paneer', category: 'dairy', price: 149, originalPrice: 180, emoji: '🧀', desc: 'Soft, fresh paneer made from A2 milk. Made fresh daily.', badge: 'Best Seller', unit: '200g' },
  { id: 'd3', name: 'Dahi (Curd)', category: 'dairy', price: 59, originalPrice: 75, emoji: '🫙', desc: 'Thick, creamy curd set overnight. Probiotic-rich and natural.', badge: null, unit: '400g' },
  { id: 'd4', name: 'Cultured Butter', category: 'dairy', price: 129, originalPrice: 155, emoji: '🧈', desc: 'Slow-churned from cream of grass-fed cows. No artificial color.', badge: 'Artisan', unit: '100g' },

  // Grains
  { id: 'g1', name: 'Brown Basmati Rice', category: 'grains', price: 189, originalPrice: 230, emoji: '🍚', desc: 'Long-grain, aromatic brown basmati. Slow-milled, full nutrition intact.', badge: 'Whole Grain', unit: '1 kg' },
  { id: 'g2', name: 'Organic Quinoa', category: 'grains', price: 349, originalPrice: 420, emoji: '🌾', desc: 'Complete protein grain. Certified organic, stone-cleaned.', badge: 'Superfood', unit: '500g' },
  { id: 'g3', name: 'Ragi Flour', category: 'grains', price: 99, originalPrice: 125, emoji: '🌿', desc: 'Stone-ground finger millet flour. Calcium-rich traditional grain.', badge: null, unit: '500g' },
  { id: 'g4', name: 'Rolled Oats', category: 'grains', price: 129, originalPrice: 160, emoji: '🥣', desc: 'Thick-cut organic oats. Slow-release energy, fiber-rich.', badge: 'Best Seller', unit: '500g' },

  // Oils & Condiments
  { id: 'o1', name: 'Cold Press Coconut Oil', category: 'oils', price: 299, originalPrice: 360, emoji: '🫒', desc: 'Virgin coconut oil, cold-pressed from fresh coconuts. No refining.', badge: 'Virgin', unit: '500ml' },
  { id: 'o2', name: 'Groundnut Oil', category: 'oils', price: 249, originalPrice: 300, emoji: '🫙', desc: 'Wood-pressed groundnut oil. Traditional kachi ghani method.', badge: 'Wood Pressed', unit: '1 litre' },
  { id: 'o3', name: 'Raw Honey', category: 'oils', price: 399, originalPrice: 480, emoji: '🍯', desc: 'Unprocessed, unheated wildflower honey. Preserves all natural enzymes.', badge: 'Raw', unit: '500g' },
  { id: 'o4', name: 'Turmeric Powder', category: 'oils', price: 89, originalPrice: 110, emoji: '🧄', desc: 'High-curcumin Lakadong turmeric. Single-origin, stone-ground.', badge: 'High Curcumin', unit: '200g' },
];

window.CATEGORIES = [
  { id: 'all', name: 'All Products', emoji: '🌿' },
  { id: 'vegetables', name: 'Vegetables', emoji: '🥦' },
  { id: 'fruits', name: 'Fruits', emoji: '🍎' },
  { id: 'dairy', name: 'Dairy', emoji: '🥛' },
  { id: 'grains', name: 'Grains', emoji: '🌾' },
  { id: 'oils', name: 'Oils & More', emoji: '🫒' },
];
