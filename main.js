/**
 * 1. INITIAL DATA FETCH
 * data.json se products fetch karke UI render karta hai.
 */
fetch("data.json", {
  method: "GET",
}).then(res => res.json()).then(data => {
  console.log("Data loaded:", data);
  data.products.forEach((product => {
    show_product(product);
  }))
});

/**
 * GLOBAL VARIABLES
 * Selected product ki details store karne ke liye.
 */
let id = null;
let selected_size = null;
let selected_color = null;
let product_name = null;
let product_price = null;
let old_price = null;
let brand = null;
let category = null;
let product_image = null;
let total_amount = 0; // Initial value 0 rakhi hai

/**
 * FUNCTION: show_product
 * Product ki UI details (images, name, price) render karta hai.
 */
function show_product(product) {
  let image_tray = document.querySelector(".container .left");
  let information_tray = document.querySelector(".container .right");

  if (!image_tray || !information_tray) return;

  image_tray.innerHTML = "";
  let thumbnailsHTML = "";

  product.images.thumbnails.forEach((thumbnail) => {
    thumbnailsHTML += `<img src="${thumbnail}" alt="thumb" class="thumb" />`;
  });

  image_tray.insertAdjacentHTML("beforeend", `
    <div class="main-img-container">
      <img src="${product.images.main}" alt="product_image" id="main-img" class="active-image" />
    </div>
    <div class="product-options">${thumbnailsHTML}</div>
  `);

  let productNameNode = information_tray.querySelector(".product-name h4");
  let descriptionNode = information_tray.querySelector(".description");
  let priceNode = information_tray.querySelector(".price");

  priceNode.querySelector(".current-price").textContent = "₹" + product.discounted_price;
  priceNode.querySelector(".old-price").textContent = "₹" + product.base_price;
  productNameNode.textContent = product.name;
  descriptionNode.textContent = product.description;

  let colorsContainer = document.querySelector(".color");
  colorsContainer.innerHTML = "";
  product.variants.forEach((variant) => {
    let span = document.createElement("span");
    span.style.backgroundColor = variant.hex;
    colorsContainer.append(span);
  });

  // Interactivity functions call
  zoom_image();
  swap_image();
  change_image_on_varient(product);

  // Global variables sync
  product_name = productNameNode.innerText;
  product_price = product.discounted_price;
  old_price = product.base_price;
  id = product.id;
  brand = product.brand;
  category = product.category;
  product_image = product.images.main;
}

/**
 * FUNCTION: swap_image
 * Thumbnail click par main image badalta hai.
 */
function swap_image() {
  let activeImage = document.querySelector(".active-image");
  let thumbs = document.querySelectorAll(".thumb");

  thumbs.forEach((image => {
    image.addEventListener("click", () => {
      activeImage.src = image.src;
      product_image = activeImage.src;
    })
  }))
}

/**
 * FUNCTION: zoom_image
 * Hover karne par image magnify karta hai.
 */
function zoom_image() {
  let activeImage = document.querySelector(".active-image");
  if (!activeImage) return;

  activeImage.addEventListener("mousemove", (e) => {
    let rect = activeImage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    activeImage.style.transformOrigin = `${(x / rect.width) * 100}% ${(y / rect.height) * 100}% `;
    activeImage.style.transform = "scale(4)";
  });

  activeImage.addEventListener("mouseleave", () => {
    activeImage.style.transform = "scale(1)";
    activeImage.style.transformOrigin = "center";
  });
}

/**
 * FUNCTION: change_image_on_varient
 * Color variant select karne par image aur sizes update karta hai.
 */
function change_image_on_varient(product) {
  let colorSpans = document.querySelectorAll(".color span");
  let activeImage = document.querySelector(".active-image");

  colorSpans.forEach((color) => {
    color.onclick = () => {
      let bgColor = window.getComputedStyle(color).backgroundColor;

      product.variants.forEach((variant) => {
        let temp = document.createElement("div");
        temp.style.backgroundColor = variant.hex;

        if (temp.style.backgroundColor === bgColor) {
          selected_color = bgColor;
          activeImage.src = variant.image;
          product_image = activeImage.src;

          let sizeContainer = document.querySelector(".size");
          sizeContainer.innerHTML = "";
          variant.sizes.forEach(size => {
            let span = document.createElement("span");
            span.innerText = size;
            sizeContainer.append(span);
            span.style.cursor = "pointer";

            span.addEventListener("click", () => {
              sizeContainer.querySelectorAll("span").forEach(s => s.classList.remove("selected"));
              selected_size = span.innerText;
              span.classList.add("selected"); // Existing class maintained
            });
          });
        }
      });
    };
  });
}

/**
 * FUNCTION: add_to_cart & displayCart
 * Cart management handle karta hai.
 */
function add_to_cart() {
  const addToCartBtn = document.querySelector(".buy-btn");

  addToCartBtn.addEventListener("click", () => {
    // Validation check
    if (!selected_size) {
      alert("Please select a size first!");
      return;
    }

    const cartProduct = {
      id, product_name, product_price, old_price,
      selected_color, product_image, selected_size,
      brand, category, quantity: 1
    };

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push(cartProduct);
    localStorage.setItem("cart", JSON.stringify(cart));

    // UI Feedback
    addToCartBtn.innerText = "Added to Cart";
    addToCartBtn.classList.add("clicked");
    addToCartBtn.disabled = true;

    setTimeout(() => {
      addToCartBtn.innerText = "Add to Cart";
      addToCartBtn.disabled = false;
      addToCartBtn.classList.remove("clicked");
    }, 2000);

    displayCart();
  });

  function displayCart() {
    const cartContainer = document.querySelector(".cart-container");
    if (!cartContainer) return;

    cartContainer.innerHTML = "";
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
      cartContainer.innerHTML = `<p class="empty-cart-message">Your cart is empty</p>`;
      total_amount = 0;
      return;
    }

    // Table Header (Existing structure maintained)
    let tableHTML = `<table class="cart-table">
        <thead>
          <tr>
            <th>Product Image</th><th>Product Name</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th>Action</th>
          </tr>
        </thead>
        <tbody>`;

    let total = 0;
    cart.forEach((product, index) => {
      const subtotal = product.product_price * product.quantity;
      const save = (product.old_price - product.product_price) * product.quantity;
      total += subtotal;

      tableHTML += `
        <tr>
          <td align="center"><img class="product-image" src="${product.product_image}" width="80" /></td>
          <td>
            <p class="product-name">${product.product_name}</p>
            <div class="calculations">
              <strong>₹${product.old_price}</strong>
              <strong class="discount">${Math.floor((product.product_price / product.old_price) * 100)}% off</strong>
              <div class="save">SAVE - <span>₹${save}</span></div>
            </div>
            <span style="background-color:${product.selected_color}; height:10px; width:10px; display:block; border-radius: 50%;"></span>
          </td>
          <td>₹${product.product_price}</td>
          <td align="center"><input type="number" value="${product.quantity}" min="1" onchange="updateQuantity(${index}, this.value)" class="quantity" /></td>
          <td>₹${subtotal}</td>
          <td align="center"><button class="remove-button" onclick="removeItem(${index})">Remove</button></td>
        </tr>`;
    });

    total_amount = total; // Global update

    tableHTML += `</tbody>
        <tfoot>
          <tr>
            <td colspan="3" align="right"><strong>Total Amount:</strong></td>
            <td colspan="2"><strong>₹${total}</strong></td>
            <td><button class="pay-now">Pay Now</button></td>
          </tr>
        </tfoot>
      </table>`;

    cartContainer.innerHTML = tableHTML;

    // PAY NOW listener attached after creation
    const payBtn = cartContainer.querySelector(".pay-now");
    if (payBtn) {
      payBtn.onclick = () => payNow(total_amount);
    }
  }

  // Global methods for onclicks
  window.removeItem = (index) => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
  };

  window.updateQuantity = (index, qty) => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart[index].quantity = parseInt(qty);
    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
  };

  displayCart();
}

/**
 * FUNCTION: payNow
 * Razorpay Integration call.
 */
function payNow(amount) {
  if (amount <= 0) return alert("Cart empty");

  const options = {
    key: "rzp_test_SZt9H5ZanA1RRv",
    amount: amount * 100, // paise
    currency: "INR",
    name: "My Store",
    description: "Payment for Order",
    handler: function (response) {
      alert("Payment Successful! ID: " + response.razorpay_payment_id);
      localStorage.removeItem("cart");
      location.reload();
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}

// Initial Call
add_to_cart();