const products = [
  {
    id: "linen-throw",
    name: "The Sunday Linen Throw",
    category: "Home",
    price: 68,
    badge: "A LITTLE FAVORITE",
    description: "A soft, breathable linen-cotton throw for slow mornings, afternoon naps, and everything in between.",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
    alt: "Soft neutral linen throw folded over a cozy armchair",
  },
  {
    id: "everyday-tote",
    name: "The Everyday Tote",
    category: "Accessories",
    price: 42,
    badge: "MADE TO GO",
    description: "Your bring-everywhere bag. Roomy enough for the daily bits, with sturdy handles and an easy, timeless shape.",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    alt: "Minimal everyday tote bag in a warm neutral color",
  },
  {
    id: "stoneware-mug",
    name: "Slow Morning Mug",
    category: "Home",
    price: 26,
    badge: "SMALL BATCH",
    description: "Hand-finished stoneware with a lovely, balanced weight. Made for that first cup you don't want to rush.",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80",
    alt: "Handmade ceramic coffee mug on a wooden table",
  },
  {
    id: "weekend-sneaker",
    name: "The Weekend Sneaker",
    category: "Wearables",
    price: 84,
    badge: "JUST LANDED",
    description: "A clean, comfortable everyday sneaker that goes with just about everything and only gets better with wear.",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    alt: "Classic red low-top sneaker on a light background",
  },
  {
    id: "little-catchall",
    name: "The Little Catchall",
    category: "Home",
    price: 24,
    badge: "",
    description: "A hand-shaped ceramic dish for rings, keys, and all those little things that deserve their own spot.",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
    alt: "Handmade ceramic dish in a warm, earthy glaze",
  },
  {
    id: "daily-cap",
    name: "The Daily Cap",
    category: "Wearables",
    price: 32,
    badge: "",
    description: "An easy, low-profile cotton cap with a relaxed fit for sunny walks, errand runs, and everything after.",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80",
    alt: "Simple neutral cotton baseball cap",
  },
  {
    id: "soft-weekend",
    name: "Soft Weekend Candle",
    category: "Home",
    price: 38,
    badge: "CUSTOMER PICK",
    description: "A mellow blend of cedar, soft citrus, and fresh linen to make staying in feel like the best plan.",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80",
    alt: "Warmly lit scented candle in a simple glass jar",
  },
  {
    id: "pocket-notebook",
    name: "The Pocket Notebook",
    category: "Accessories",
    price: 18,
    badge: "",
    description: "A lovely little place for lists, passing thoughts, and ideas you don't want to forget. Includes 120 recycled pages.",
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=80",
    alt: "Open notebook and pen on a tidy desk",
  },
];

const productGrid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#search-input");
const sortSelect = document.querySelector("#sort-select");
const resultsMessage = document.querySelector("#results-message");
const emptyResults = document.querySelector("#empty-results");
const cartDrawer = document.querySelector("#cart-drawer");
const cartItems = document.querySelector("#cart-items");
const cartEmpty = document.querySelector("#cart-empty");
const drawerFooter = document.querySelector("#drawer-footer");
const drawerBackdrop = document.querySelector("#drawer-backdrop");
const toast = document.querySelector("#toast");
const productDialog = document.querySelector("#product-dialog");
const dialogContent = document.querySelector("#dialog-content");

let activeCategory = "All";
let cart = loadCart();
let toastTimeout;

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem("morrow-cart") || "[]");
    if (!Array.isArray(savedCart)) {
      return [];
    }

    return savedCart.filter(
      (item) =>
        item &&
        products.some((product) => product.id === item.id) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );
  } catch (error) {
    console.error("Could not read the saved shopping bag.", error);
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem("morrow-cart", JSON.stringify(cart));
  } catch (error) {
    console.error("Could not save the shopping bag.", error);
    showToast("Your bag could not be saved on this device.");
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(price);
}

function getVisibleProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filtered = products.filter((product) => {
    const matchesCategory =
      activeCategory === "All" || product.category === activeCategory;
    const matchesSearch =
      !searchTerm ||
      `${product.name} ${product.category} ${product.description}`
        .toLowerCase()
        .includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  switch (sortSelect.value) {
    case "price-low":
      return filtered.sort((a, b) => a.price - b.price);
    case "price-high":
      return filtered.sort((a, b) => b.price - a.price);
    case "name":
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return filtered;
  }
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();
  productGrid.innerHTML = visibleProducts
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-image-wrap">
            <img src="${product.image}" alt="${product.alt}" loading="lazy" />
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
            <button class="quick-add" type="button" data-add="${product.id}" aria-label="Add ${product.name} to bag">
              <svg aria-hidden="true"><use href="#icon-plus"></use></svg>
              Add to bag · ${formatPrice(product.price)}
            </button>
          </div>
          <div class="product-details">
            <div>
              <button class="product-name" type="button" data-details="${product.id}">${product.name}</button>
              <p class="product-category">${product.category}</p>
            </div>
            <p class="product-price">${formatPrice(product.price)}</p>
          </div>
        </article>
      `,
    )
    .join("");

  const hasProducts = visibleProducts.length > 0;
  productGrid.hidden = !hasProducts;
  emptyResults.hidden = hasProducts;
  resultsMessage.textContent =
    activeCategory !== "All" || searchInput.value.trim()
      ? `${visibleProducts.length} ${visibleProducts.length === 1 ? "find" : "finds"}`
      : "";
}

function updateCart() {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);

  document.querySelector("#cart-count").textContent = totalItems;
  document.querySelector("#drawer-item-count").textContent =
    `(${totalItems} ${totalItems === 1 ? "item" : "items"})`;
  document.querySelector("#cart-subtotal").textContent = formatPrice(subtotal);
  const shippingNote = document.querySelector("#shipping-note");
  shippingNote.innerHTML =
    subtotal >= 75
      ? '<span aria-hidden="true">✳</span> Lovely — your order ships free!'
      : `<span aria-hidden="true">✳</span> Add ${formatPrice(75 - subtotal)} more for free shipping.`;
  cartItems.innerHTML = cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      if (!product) {
        return "";
      }

      return `
        <article class="cart-item">
          <img src="${product.image}" alt="${product.alt}" />
          <div class="cart-item-info">
            <strong>${product.name}</strong>
            <span>${formatPrice(product.price)}</span>
            <div class="quantity-control" aria-label="Quantity for ${product.name}">
              <button type="button" data-quantity="-1" data-id="${product.id}" aria-label="Decrease quantity of ${product.name}">
                <svg aria-hidden="true"><use href="#icon-minus"></use></svg>
              </button>
              <span>${item.quantity}</span>
              <button type="button" data-quantity="1" data-id="${product.id}" aria-label="Increase quantity of ${product.name}">
                <svg aria-hidden="true"><use href="#icon-plus"></use></svg>
              </button>
            </div>
          </div>
          <button class="remove-item" type="button" data-remove="${product.id}" aria-label="Remove ${product.name} from bag">
            <svg aria-hidden="true"><use href="#icon-trash"></use></svg>
          </button>
        </article>
      `;
    })
    .join("");

  const isEmpty = cart.length === 0;
  cartEmpty.classList.toggle("is-visible", isEmpty);
  drawerFooter.classList.toggle("is-hidden", isEmpty);
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }

  saveCart();
  updateCart();
  showToast(`${product.name} added to your bag.`);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

function openCart() {
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.hidden = false;
  document.body.classList.add("drawer-open");
  document.querySelector("#close-cart").focus();
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  drawerBackdrop.hidden = true;
  document.body.classList.remove("drawer-open");
  document.querySelector("#open-cart").focus();
}

function showProductDetails(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  dialogContent.innerHTML = `
    <div class="dialog-product">
      <img src="${product.image}" alt="${product.alt}" />
      <div class="dialog-product-copy">
        <span class="eyebrow">${product.category.toUpperCase()}</span>
        <h2 id="dialog-product-name">${product.name}</h2>
        <p class="dialog-price">${formatPrice(product.price)}</p>
        <p>${product.description}</p>
        <button class="button button-dark" type="button" data-dialog-add="${product.id}">
          Add to bag <svg aria-hidden="true"><use href="#icon-arrow"></use></svg>
        </button>
      </div>
    </div>
  `;
  productDialog.showModal();
}

function closeMobileNav() {
  const menuToggle = document.querySelector("#menu-toggle");
  const mobileNav = document.querySelector("#mobile-nav");
  mobileNav.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
}

document.querySelectorAll(".category-chip").forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    document.querySelectorAll(".category-chip").forEach((chip) => {
      const isActive = chip === button;
      chip.classList.toggle("is-active", isActive);
      chip.setAttribute("aria-pressed", String(isActive));
    });
    renderProducts();
  });
});

document.querySelectorAll("[data-nav-category]").forEach((link) => {
  link.addEventListener("click", () => {
    activeCategory = link.dataset.navCategory;
    document.querySelectorAll(".category-chip").forEach((chip) => {
      const isActive = chip.dataset.category === activeCategory;
      chip.classList.toggle("is-active", isActive);
      chip.setAttribute("aria-pressed", String(isActive));
    });
    renderProducts();
    closeMobileNav();
  });
});

searchInput.addEventListener("input", renderProducts);
sortSelect.addEventListener("change", renderProducts);

productGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const detailsButton = event.target.closest("[data-details]");

  if (addButton) {
    addToCart(addButton.dataset.add);
  } else if (detailsButton) {
    showProductDetails(detailsButton.dataset.details);
  }
});

cartItems.addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");

  if (quantityButton) {
    const item = cart.find((entry) => entry.id === quantityButton.dataset.id);
    if (item) {
      item.quantity += Number(quantityButton.dataset.quantity);
      if (item.quantity <= 0) {
        cart = cart.filter((entry) => entry.id !== item.id);
      }
      saveCart();
      updateCart();
    }
  } else if (removeButton) {
    cart = cart.filter((item) => item.id !== removeButton.dataset.remove);
    saveCart();
    updateCart();
  }
});

document.querySelector("#open-cart").addEventListener("click", openCart);
document.querySelector("#close-cart").addEventListener("click", closeCart);
drawerBackdrop.addEventListener("click", closeCart);
document.querySelector("#continue-shopping").addEventListener("click", closeCart);
document.querySelector("#close-dialog").addEventListener("click", () => {
  productDialog.close();
});

dialogContent.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-dialog-add]");
  if (addButton) {
    addToCart(addButton.dataset.dialogAdd);
    productDialog.close();
  }
});

productDialog.addEventListener("click", (event) => {
  if (event.target === productDialog) {
    productDialog.close();
  }
});

document.querySelector("#menu-toggle").addEventListener("click", (event) => {
  const menuToggle = event.currentTarget;
  const mobileNav = document.querySelector("#mobile-nav");
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  mobileNav.hidden = isExpanded;
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute(
    "aria-label",
    isExpanded ? "Open navigation" : "Close navigation",
  );
});

document.querySelector("#clear-filters").addEventListener("click", () => {
  activeCategory = "All";
  searchInput.value = "";
  sortSelect.value = "featured";
  document.querySelectorAll(".category-chip").forEach((chip) => {
    const isActive = chip.dataset.category === "All";
    chip.classList.toggle("is-active", isActive);
    chip.setAttribute("aria-pressed", String(isActive));
  });
  renderProducts();
});

document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#newsletter-message").textContent =
    "Thanks for stopping by — you're on the list!";
  event.currentTarget.reset();
});

document.querySelector("#checkout-button").addEventListener("click", () => {
  showToast("Checkout will be available when the store is connected.");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }

  if (event.key === "Escape" && cartDrawer.classList.contains("is-open")) {
    closeCart();
  }
});

document.querySelector("#current-year").textContent = new Date().getFullYear();
renderProducts();
updateCart();
