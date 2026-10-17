import { useEffect, useMemo, useState } from "react";

import "./App.css";
  
// =========================================================

// API

// =========================================================

const PRODUCTS_API = "https://beervana.onrender.com/products";
const ORDERS_API = "https://beervana.onrender.com/orders";
const AUTH_API = "https://beervana.onrender.com/auth";
const CUSTOMER_ADDRESSES_API = "https://beervana.onrender.com/customer/addresses";
const AUTH_TOKEN_KEY = "beervana_access_token";
const CUSTOMER_KEY = "beervana_customer";
// PRODUCT IMAGES
const productImages = [
  "/images/corona.png",
  "/images/hoegaarden.png",
  "/images/budweiser.png",
  "/images/heineken.png",
  "/images/kingfisher.png",
  "/images/bira.png",
  "/images/carlsberg.png",
];
// CATEGORIES
const categories = [
  "All",
  "Lager",
  "Wheat Beer",
  "Strong Beer",
  "Craft Beer",
  "Classic",
  "Stout",
  "IPA",
  "Pilsner",
  "Others",
];
const categoryIcons = {
  All: "🍺",
  Lager: "🍻",
  "Wheat Beer": "🌾",
  "Strong Beer": "💪",
  "Craft Beer": "🌿",
  Classic: "🍺",
  Stout: "🖤",
  IPA: "🌱",
  Pilsner: "🥂",
  Others: "🍾",
};

// FALLBACK PRODUCTS

const fallbackProducts = [
  {
    id: 1,
    name: "Corona Extra",
    category: "Lager",
    description: "Classic refreshing lager",
    price: 199,
    image: "",
    stock: 20,
  },

  {
    id: 2,
    name: "Hoegaarden",
    category: "Wheat Beer",
    description: "Belgian style wheat beer",
    price: 249,
    image: "",
    stock: 15,
  },

  {

    id: 3,

    name: "Budweiser",

    category: "Strong Beer",

    description: "Smooth American lager",

    price: 179,

    image: "",

    stock: 10,

  },

  {

    id: 4,

    name: "Heineken",

    category: "Lager",

    description: "Premium quality lager",

    price: 219,

    image: "",

    stock: 20,

  },

  {

    id: 5,
    name: "Kingfisher",
    category: "Classic",
    description: "India's classic beer",
    price: 169,
    image: "",
    stock: 25,
  },

  {
    id: 6,
    name: "Bira 91",
    category: "Craft Beer",
    description: "Modern craft beer",
    price: 229,

    image: "",

    stock: 18,

  },

  {

    id: 7,

    name: "Carlsberg",

    category: "Pilsner",

    description: "Premium pilsner beer",

    price: 239,

    image: "",

    stock: 12,

  },

];

// =========================================================

// APP

// =========================================================

function App() {

  // =======================================================

  // PRODUCTS

  // =======================================================

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [apiError, setApiError] = useState(false);

  // =======================================================

  // SEARCH / CATEGORY

  // =======================================================

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("All");

  // =======================================================

  // CART

  // =======================================================

  const [cart, setCart] = useState(() => {

    try {

      const savedCart = localStorage.getItem("beervana_cart");

      return savedCart

        ? JSON.parse(savedCart)

        : [];

    } catch {

      return [];

    }

  });

  const [cartOpen, setCartOpen] = useState(false);

  // =======================================================

  // AGE VERIFICATION

  // =======================================================

  const [ageVerified, setAgeVerified] = useState(

    localStorage.getItem("beervana_age_verified") === "true"

  );

  // =======================================================

  // CHECKOUT

  // =======================================================

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState(false);

  const [orderId, setOrderId] = useState("");

  const [trackOrderOpen, setTrackOrderOpen] = useState(false);

  const [trackOrderId, setTrackOrderId] = useState("");

  const [trackedOrder, setTrackedOrder] = useState(null);

  const [trackLoading, setTrackLoading] = useState(false);

  const [trackOrderError, setTrackOrderError] = useState("");

  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationExpanded, setLocationExpanded] = useState(false);

  // CUSTOMER AUTHENTICATION + SAVED ADDRESSES
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || "");
  const [loggedInCustomer, setLoggedInCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "null");
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressLabel, setAddressLabel] = useState("Home");
  const [landmark, setLandmark] = useState("");
  const [stateName, setStateName] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");


  // =======================================================

  // CUSTOMER DETAILS

  // =======================================================

  const [customerName, setCustomerName] = useState("");

  const [phone, setPhone] = useState("");

  const [address, setAddress] = useState("");

  const [city, setCity] = useState("");

  const [pincode, setPincode] = useState("");

  // =======================================================

  // PAYMENT

  // =======================================================

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [upiId, setUpiId] = useState("");

  const [cardNumber, setCardNumber] = useState("");

  const [cardName, setCardName] = useState("");

  const [cardExpiry, setCardExpiry] = useState("");

  const [cardCvv, setCardCvv] = useState("");

  // =======================================================

  // FETCH PRODUCTS

  // =======================================================

  useEffect(() => {

    const fetchProducts = async () => {

      try {

        setLoading(true);

        setApiError(false);

        const response = await fetch(PRODUCTS_API);

        if (!response.ok) {

          throw new Error("Products API failed");

        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {

          setProducts(data);

        } else {

          setProducts(fallbackProducts);

        }

      } catch (error) {

        console.error("Products API Error:", error);

        setApiError(true);

        setProducts(fallbackProducts);

      } finally {

        setLoading(false);

      }

    };

    fetchProducts();

  }, []);

  // =======================================================

  // SAVE CART

  // =======================================================

  useEffect(() => {

    localStorage.setItem(

      "beervana_cart",

      JSON.stringify(cart)

    );

  }, [cart]);

  // =======================================================

  // DISPLAY PRODUCTS WITH IMAGES

  // =======================================================

  const displayProducts = useMemo(() => {

    return products.map((product, index) => ({

      ...product,

      image:

        product.image &&

        product.image.trim() !== ""

          ? product.image

          : productImages[

              index % productImages.length

            ],

    }));

  }, [products]);

  // =======================================================

  // FILTER PRODUCTS

  // =======================================================

  const filteredProducts = useMemo(() => {

    const searchText = search

      .toLowerCase()

      .trim();

    return displayProducts.filter((product) => {

      const categoryMatch =

        category === "All" ||

        product.category === category;

      const searchMatch =

        !searchText ||

        product.name

          ?.toLowerCase()

          .includes(searchText) ||

        product.category

          ?.toLowerCase()

          .includes(searchText) ||

        product.description

          ?.toLowerCase()

          .includes(searchText);

      return categoryMatch && searchMatch;

    });

  }, [displayProducts, category, search]);

  // =======================================================

  // CART FUNCTIONS

  // =======================================================

  const getQuantity = (id) => {

    return (

      cart.find((item) => item.id === id)

        ?.quantity || 0

    );

  };

  const addToCart = (product) => {

    setCart((currentCart) => {

      const existingItem = currentCart.find(

        (item) => item.id === product.id

      );

      if (existingItem) {

        return currentCart.map((item) =>

          item.id === product.id

            ? {

                ...item,

                quantity: item.quantity + 1,

              }

            : item

        );

      }

      return [

        ...currentCart,

        {

          ...product,

          quantity: 1,

        },

      ];

    });

    setCartOpen(true);

  };

  const updateQuantity = (id, amount) => {

    setCart((currentCart) =>

      currentCart

        .map((item) => {

          if (item.id !== id) {

            return item;

          }

          const newQuantity =

            item.quantity + amount;

          const maxStock =

            Number(item.stock) || 999;

          if (newQuantity > maxStock) {

            return item;

          }

          return {

            ...item,

            quantity: newQuantity,

          };

        })

        .filter((item) => item.quantity > 0)

    );

  };

  const removeFromCart = (id) => {

    setCart((currentCart) =>

      currentCart.filter(

        (item) => item.id !== id

      )

    );

  };

  const clearCart = () => {

    setCart([]);

  };

  // =======================================================

  // CART CALCULATIONS

  // =======================================================

  const totalItems = cart.reduce(

    (total, item) =>

      total + Number(item.quantity),

    0

  );

  const subtotal = cart.reduce(

    (total, item) =>

      total +

      Number(item.price) *

        Number(item.quantity),

    0

  );

  // Current backend test uses:

  // Below ₹499 = ₹40

  // ₹499 or above = FREE

  const deliveryCharge =

    subtotal === 0

      ? 0

      : subtotal >= 499

      ? 0

      : 40;

  const grandTotal =

    subtotal + deliveryCharge;

  // =======================================================

  // AGE VERIFICATION

  // =======================================================

  const verifyAge = () => {

    localStorage.setItem(

      "beervana_age_verified",

      "true"

    );

    setAgeVerified(true);

  };

  const leaveWebsite = () => {

    window.location.href =

      "https://www.google.com";

  };

  // =======================================================

  // SCROLL

  // =======================================================

  const scrollToProducts = () => {

    document

      .getElementById("products")

      ?.scrollIntoView({

        behavior: "smooth",

      });

  };

  const scrollToCategories = () => {

    document

      .getElementById("categories")

      ?.scrollIntoView({

        behavior: "smooth",

      });

  };

  // =======================================================

  // OPEN CHECKOUT

  // =======================================================

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  });

  const loadSavedAddresses = async (token = accessToken) => {
    if (!token) {
      setSavedAddresses([]);
      return;
    }
    try {
      const response = await fetch(CUSTOMER_ADDRESSES_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Saved addresses load nahi ho paaye.");
      const rows = Array.isArray(data) ? data : (data.addresses || []);
      setSavedAddresses(rows);

      // Prefer the customer's default address; otherwise use the first saved address.
      const defaultAddress = rows.find((item) => item.is_default) || rows[0];

      if (defaultAddress) {
        // Update the selected address and header immediately. Do not call
        // applySavedAddress here because setSavedAddresses is asynchronous.
        setSelectedAddressId(String(defaultAddress.id));
        setCustomerName(defaultAddress.full_name || loggedInCustomer?.name || customerName);
        setPhone(String(defaultAddress.phone || loggedInCustomer?.phone || phone).replace(/\D/g, "").slice(0, 10));
        setAddress(defaultAddress.address_line || "");
        setCity(defaultAddress.city || "");
        setPincode(String(defaultAddress.pincode || "").replace(/\D/g, "").slice(0, 6));
        setStateName(defaultAddress.state || "");
        setLandmark(defaultAddress.landmark || "");
      } else {
        // No saved address for this account: don't show another customer's/stale address.
        setSelectedAddressId("");
        setAddress("");
        setCity("");
        setPincode("");
        setStateName("");
        setLandmark("");
      }
    } catch (error) {
      console.error("Saved address error:", error);
    }
  };

  useEffect(() => {
    if (accessToken) loadSavedAddresses(accessToken);
  }, [accessToken]);

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    try {
      const endpoint = authMode === "register" ? `${AUTH_API}/register` : `${AUTH_API}/login`;
      const payload = authMode === "register"
        ? { name: authName.trim(), email: authEmail.trim(), password: authPassword, phone: authPhone.trim() }
        : { email: authEmail.trim(), password: authPassword };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Login/register nahi ho paaya.");
      if (!data.access_token) throw new Error("Backend response mein access_token nahi mila.");
      localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(data.customer || null));
      setAccessToken(data.access_token);
      setLoggedInCustomer(data.customer || null);
      if (data.customer?.name) setCustomerName(data.customer.name);
      if (data.customer?.phone) setPhone(String(data.customer.phone).replace(/\D/g, "").slice(0, 10));
      setAuthPassword("");
      setAuthMessage("Successfully logged in.");
      await loadSavedAddresses(data.access_token);
    } catch (error) {
      setAuthMessage(error.message || "Something went wrong.");
    } finally {
      setAuthLoading(false);
    }
  };

  const logoutCustomer = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_KEY);
    setAccessToken("");
    setLoggedInCustomer(null);
    setSavedAddresses([]);
    setSelectedAddressId("");
    setAuthMessage("You have been logged out.");
  };

  const applySavedAddress = (id) => {
    setSelectedAddressId(String(id));
    const saved = savedAddresses.find((item) => String(item.id) === String(id));
    if (!saved) return;
    setCustomerName(saved.full_name || customerName);
    setPhone(String(saved.phone || phone).replace(/\D/g, "").slice(0, 10));
    setAddress(saved.address_line || "");
    setCity(saved.city || "");
    setPincode(String(saved.pincode || "").replace(/\D/g, "").slice(0, 6));
    setStateName(saved.state || "");
    setLandmark(saved.landmark || "");
  };

  const saveCurrentAddress = async () => {
    if (!accessToken) {
      setAuthMessage("Address save karne ke liye pehle login karein.");
      setAccountOpen(true);
      return;
    }
    if (!customerName.trim() || !phone.trim() || !address.trim() || !city.trim() || !stateName.trim() || pincode.replace(/\D/g, "").length !== 6) {
      alert("Address save karne ke liye name, phone, address, city, state aur 6-digit pincode bharein.");
      return;
    }
    setSavingAddress(true);
    try {
      const response = await fetch(CUSTOMER_ADDRESSES_API, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          label: addressLabel.trim() || "Home",
          full_name: customerName.trim(),
          phone: phone.replace(/\D/g, ""),
          address_line: address.trim(),
          landmark: landmark.trim() || null,
          city: city.trim(),
          state: stateName.trim(),
          pincode: pincode.replace(/\D/g, ""),
          is_default: savedAddresses.length === 0,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Address save nahi hua.");
      await loadSavedAddresses();
      const newAddress = data.address || data;
      if (newAddress?.id) setSelectedAddressId(String(newAddress.id));
      alert("Address saved successfully.");
    } catch (error) {
      alert(error.message || "Address save nahi ho paaya.");
    } finally {
      setSavingAddress(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Is browser mein GPS location supported nahi hai.");
      return;
    }
    setLocationLoading(true);
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          { headers: { Accept: "application/json" } }
        );
        if (!response.ok) throw new Error("Location address nahi mil paaya. Aap manually address bhar sakte hain.");
        const data = await response.json();
        const a = data.address || {};
        setAddress([a.house_number, a.road, a.neighbourhood, a.suburb].filter(Boolean).join(", ") || data.display_name || "");
        setCity(a.city || a.town || a.village || a.county || "");
        setStateName(a.state || "");
        setPincode(String(a.postcode || "").replace(/\D/g, "").slice(0, 6));
        setLocationMessage("Current location address fill ho gaya. Order se pehle details check kar lein.");
      } catch (error) {
        setLocationMessage(error.message || "GPS address nahi mil paaya.");
      } finally {
        setLocationLoading(false);
      }
    }, (error) => {
      setLocationLoading(false);
      setLocationMessage(error.code === 1 ? "Location permission allow karein, ya address manually bharein." : "Location nahi mil paayi. Address manually bharein.");
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  };

  const openCheckout = () => {

    if (cart.length === 0) {

      alert("Your cart is empty.");

      return;

    }

    setCartOpen(false);

    setCheckoutOpen(true);

  };

  // =======================================================

  // CARD NUMBER FORMAT

  // =======================================================

  const formatCardNumber = (value) => {

    const numbersOnly = value

      .replace(/\D/g, "")

      .slice(0, 16);

    return numbersOnly

      .replace(/(.{4})/g, "$1 ")

      .trim();

  };

  // =======================================================

  // EXPIRY FORMAT

  // =======================================================

  const formatExpiry = (value) => {

    const numbersOnly = value

      .replace(/\D/g, "")

      .slice(0, 4);

    if (numbersOnly.length >= 3) {

      return (

        numbersOnly.slice(0, 2) +

        "/" +

        numbersOnly.slice(2)

      );

    }

    return numbersOnly;

  };

  // =======================================================

  // PLACE ORDER

  // =======================================================

  const placeOrder = async () => {

    // -----------------------------------------------------

    // CART CHECK

    // -----------------------------------------------------

    if (cart.length === 0) {

      alert("Your cart is empty.");

      return;

    }

    // -----------------------------------------------------

    // NAME

    // -----------------------------------------------------

    if (!customerName.trim()) {

      alert("Please enter your name.");

      return;

    }

    // -----------------------------------------------------

    // PHONE

    // -----------------------------------------------------

    const cleanPhone =

      phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {

      alert(

        "Please enter a valid 10-digit phone number."

      );

      return;

    }

    // -----------------------------------------------------

    // ADDRESS

    // -----------------------------------------------------

    if (!address.trim()) {

      alert(

        "Please enter your delivery address."

      );

      return;

    }

    // -----------------------------------------------------

    // CITY

    // -----------------------------------------------------

    if (!city.trim()) {

      alert("Please enter your city.");

      return;

    }

    // -----------------------------------------------------

    // PINCODE

    // -----------------------------------------------------

    const cleanPincode =

      pincode.replace(/\D/g, "");

    if (cleanPincode.length !== 6) {

      alert(

        "Please enter a valid 6-digit pincode."

      );

      return;

    }

    // -----------------------------------------------------

    // UPI VALIDATION

    // -----------------------------------------------------

    if (paymentMethod === "upi") {

      if (!upiId.trim()) {

        alert("Please enter your UPI ID.");

        return;

      }

      if (!upiId.includes("@")) {

        alert("Please enter a valid UPI ID.");

        return;

      }

    }

    // -----------------------------------------------------

    // CARD VALIDATION

    // -----------------------------------------------------

    if (paymentMethod === "card") {

      const cleanCardNumber =

        cardNumber.replace(/\s/g, "");

      if (cleanCardNumber.length !== 16) {

        alert(

          "Please enter a valid 16-digit card number."

        );

        return;

      }

      if (!cardName.trim()) {

        alert(

          "Please enter card holder name."

        );

        return;

      }

      if (!cardExpiry.trim()) {

        alert("Please enter card expiry.");

        return;

      }

      const expiryParts =

        cardExpiry.split("/");

      if (

        expiryParts.length !== 2 ||

        expiryParts[0].length !== 2 ||

        expiryParts[1].length !== 2

      ) {

        alert(

          "Please enter expiry in MM/YY format."

        );

        return;

      }

      if (cardCvv.length !== 3) {

        alert(

          "Please enter a valid 3-digit CVV."

        );

        return;

      }

    }

    // =====================================================

    // ORDER DATA

    // =====================================================

    const orderData = {

      customer_name:

        customerName.trim(),

      phone: cleanPhone,

      address:

        address.trim(),

      city:

        city.trim(),

      pincode:

        cleanPincode,

      payment_method:

        paymentMethod,

      delivery_option:

        "standard",

      items: cart.map((item) => ({

        product_id: Number(item.id),

        quantity: Number(item.quantity),

      })),

    };

    // =====================================================

    // SEND ORDER TO FASTAPI

    // =====================================================

    try {

      const response = await fetch(

        ORDERS_API,

        {

          method: "POST",

          headers: {

            "Content-Type":

              "application/json",

          },

          body:

            JSON.stringify(orderData),

        }

      );

      const data =

        await response.json();

      // ---------------------------------------------------

      // BACKEND ERROR

      // ---------------------------------------------------

      if (!response.ok) {

        throw new Error(

          data.detail ||

            "Failed to place order."

        );

      }

      // ===================================================

      // SUCCESS

      // ===================================================

      setOrderId(

        data.order_id

      );

      setCheckoutOpen(false);

      setOrderSuccess(true);

      // ===================================================

      // CLEAR CART

      // ===================================================

      setCart([]);

      localStorage.removeItem(

        "beervana_cart"

      );

      // ===================================================

      // CLEAR CHECKOUT DATA

      // ===================================================

      setCustomerName("");

      setPhone("");

      setAddress("");

      setCity("");

      setPincode("");

      setUpiId("");

      setCardNumber("");

      setCardName("");

      setCardExpiry("");

      setCardCvv("");

      setPaymentMethod("cod");

    } catch (error) {

      console.error(

        "Order Error:",

        error

      );

      alert(

        error.message ||

          "Something went wrong while placing your order."

      );

    }

  };

  // =======================================================

  // CLOSE SUCCESS

  // =======================================================

  const closeSuccess = () => {

    setOrderSuccess(false);

    setOrderId("");

  };

  const handleTrackOrder = async (event) => {
    event.preventDefault();

    const id = trackOrderId.trim();
    if (!id) {
      setTrackOrderError("Please enter your Order ID.");
      return;
    }

    setTrackLoading(true);
    setTrackOrderError("");
    setTrackedOrder(null);

    try {
      const response = await fetch(
        `${ORDERS_API}/${encodeURIComponent(id)}`
      );
      const data = await response.json();

      if (!response.ok || data?.success === false) {
        const detail = data?.detail || data?.message || "Order nahi mila. Order ID check karein.";
        throw new Error(typeof detail === "string" ? detail : "Order nahi mila. Order ID check karein.");
      }

      setTrackedOrder(data?.order || data);
    } catch (error) {
      setTrackOrderError(
        error?.message || "Backend se connect nahi ho paya. FastAPI server check karein."
      );
    } finally {
      setTrackLoading(false);
    }
  };

  // =======================================================

  // RETURN

  // =======================================================

  return (

    <div className="app">

      {/* ==================================================

          NAVBAR

      ================================================== */}

      <header className="navbar">

        <div className="nav-left">

          <img

            src="/images/logo.png"

            alt="Beervana"

            className="logo"

          />

          <button
            type="button"
            className={`location-box ${locationExpanded ? "location-expanded" : ""}`}
            aria-label="Show delivery address"
            aria-expanded={locationExpanded}
            onClick={() => setLocationExpanded((open) => !open)}
          >
            <span className="location-icon">📍</span>
            <div className="location-details">
              <small>Delivering to</small>
              <strong>
                {address
                  ? `${city ? `${city}, ` : ""}${address}`
                  : "Choose delivery address"}
              </strong>
            </div>
          </button>

        </div>

        {/* SEARCH */}

        <div className="search-box">

          <span>

            🔍

          </span>

          <input

            type="text"

            placeholder="Search for beer, brands, styles, offers..."

            value={search}

            onChange={(e) =>

              setSearch(

                e.target.value

              )

            }

          />

          {search && (

            <button

              className="clear-search"

              onClick={() =>

                setSearch("")

              }

            >

              ×

            </button>

          )}

        </div>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        {/* NAV LINKS */}

        <nav className={`nav-links ${mobileMenuOpen ? "mobile-menu-open" : ""}`} onClick={(event) => {
          if (event.target.closest("button")) setMobileMenuOpen(false);
        }}>

          <button

            onClick={scrollToProducts}

          >

            🏷️ Offers

          </button>

          <button

            onClick={scrollToCategories}

          >

            📦 Categories

          </button>

          <button
            type="button"
            onClick={() => {
              setTrackOrderOpen(true);
              setTrackOrderId(orderId || "");
              setTrackedOrder(null);
              setTrackOrderError("");
            }}
          >
            📋 Track Order
          </button>

          <button
            type="button"
            onClick={() => setAccountOpen(true)}
          >
            👤 Account
          </button>

          <button

            className="cart-button"

            onClick={() =>

              setCartOpen(true)

            }

          >

            🛒 Cart

            {totalItems > 0 && (

              <span className="cart-count">

                {totalItems}

              </span>

            )}

          </button>

        </nav>

      </header>

      {/* ==================================================

          API MESSAGE

      ================================================== */}

      {apiError && (

        <div className="api-message">

          Backend products unavailable.

          Showing demo products.

        </div>

      )}

      {/* ==================================================

          HERO

      ================================================== */}

      <section className="hero">

        <img

          src="/images/hero-banner.jpg"

          alt="Premium beer collection"

          className="hero-image"

        />

        <div className="hero-overlay"></div>

        <div className="hero-content">

          <span className="eyebrow">

            PREMIUM BEERS • DELIVERED FRESH

          </span>

          <h1>

            Good Beer

            <br />

            <span>

              Better Moments

            </span>

          </h1>

          <p>

            Explore a wide range of

            premium beers from popular

            brands.

            <br />

            Chilled. Fresh. At your doorstep.

          </p>

          <button

            className="primary-btn"

            onClick={

              scrollToProducts

            }

          >

            Shop Now →

          </button>

          <div className="hero-features">

            <div>

              <span>🚚</span>

              <div>

                <strong>

                  Fast Delivery

                </strong>

                <small>

                  30–60 mins

                </small>

              </div>

            </div>

            <div>

              <span>🛡️</span>

              <div>

                <strong>

                  100% Original

                </strong>

                <small>

                  Products

                </small>

              </div>

            </div>

            <div>

              <span>❄️</span>

              <div>

                <strong>

                  Chilled & Fresh

                </strong>

                <small>

                  Delivery

                </small>

              </div>

            </div>

            <div>

              <span>🏷️</span>

              <div>

                <strong>

                  Best Prices

                </strong>

                <small>

                  Guaranteed

                </small>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ==================================================

          CATEGORIES

      ================================================== */}

      <section

        className="categories-section"

        id="categories"

      >

        <div className="category-scroll">

          {categories.map(

            (item) => (

              <button

                key={item}

                className={`category-item ${

                  category === item

                    ? "active"

                    : ""

                }`}

                onClick={() =>

                  setCategory(item)

                }

              >

                <span className="category-icon">

                  {categoryIcons[item]}

                </span>

                <span>

                  {item}

                </span>

              </button>

            )

          )}

        </div>

      </section>

      {/* ==================================================

          OFFERS

      ================================================== */}

      <section className="offers-section">

        <div className="offer-card">

          <img

            src="/images/offer1.jpg"

            alt="Top Beer Brands"

          />

          <div className="offer-content">

            <span>

              UP TO 20% OFF

            </span>

            <h3>

              Top Beer Brands

            </h3>

            <p>

              Grab the best deals on

              your favourites.

            </p>

            <button

              onClick={

                scrollToProducts

              }

            >

              View Offers →

            </button>

          </div>

        </div>

        <div className="offer-card">

          <img

            src="/images/offer2.jpg"

            alt="Chilled Beers"

          />

          <div className="offer-content">

            <span>

              FRESH • FAST • SAFE

            </span>

            <h3>

              Chilled Beers

            </h3>

            <p>

              At your doorstep.

            </p>

            <button

              onClick={

                scrollToProducts

              }

            >

              Order Now →

            </button>

          </div>

        </div>

        <div className="offer-card">

          <img

            src="/images/offer3.jpg"

            alt="Craft Beers"

          />

          <div className="offer-content">

            <span>

              DISCOVER

            </span>

            <h3>

              Craft Beers

            </h3>

            <p>

              Unique flavours for

              beer lovers.

            </p>

            <button

              onClick={

                scrollToProducts

              }

            >

              Explore Now →

            </button>

          </div>

        </div>

      </section>

      {/* ==================================================

          PRODUCTS

      ================================================== */}

      <section

        className="products-section"

        id="products"

      >

        <div className="section-heading">

          <div>

            <span>

              OUR COLLECTION

            </span>

            <h2>

              Popular Beers

            </h2>

            <p>

              Discover our curated

              collection of premium beers.

            </p>

          </div>

          <button

            onClick={() => {

              setCategory("All");

              setSearch("");

            }}

          >

            View All →

          </button>

        </div>

        {/* LOADING */}

        {loading ? (

          <div className="loading">

            <div className="loader"></div>

            <p>

              Loading premium beers...

            </p>

          </div>

        ) : filteredProducts.length === 0 ? (

          /* NO PRODUCTS */

          <div className="no-products">

            <span>

              🔍

            </span>

            <h3>

              No beers found

            </h3>

            <p>

              Try another search

              or category.

            </p>

            <button

              className="primary-btn"

              onClick={() => {

                setSearch("");

                setCategory("All");

              }}

            >

              Show All Products

            </button>

          </div>

        ) : (

          /* PRODUCT GRID */

          <div className="products-grid">

            {filteredProducts.map(

              (product, index) => {

                const quantity =

                  getQuantity(

                    product.id

                  );

                let badge = "";

                if (index === 0) {

                  badge = "Bestseller";

                } else if (index === 1) {

                  badge = "10% OFF";

                } else if (index === 2) {

                  badge = "Popular";

                }

                return (

                  <div

                    className="product-card"

                    key={product.id}

                  >

                    <div className="product-image-box">

                      <img

                        src={product.image}

                        alt={product.name}

                        className="product-image"

                      />

                      {badge && (

                        <span className="product-badge">

                          {badge}

                        </span>

                      )}

                      <button

                        className="heart-btn"

                        onClick={() =>

                          alert(

                            `${product.name} added to wishlist`

                          )

                        }

                      >

                        ♡

                      </button>

                    </div>

                    <div className="product-info">

                      <div className="product-title-row">

                        <div>

                          <h3>

                            {product.name}

                          </h3>

                          <span>

                            {product.category}

                          </span>

                          <small>

                            330 ml

                          </small>

                        </div>

                      </div>

                      <div className="product-bottom">

                        <strong>

                          ₹

                          {Number(

                            product.price

                          ).toFixed(0)}

                        </strong>

                        {quantity === 0 ? (

                          <button

                            className="add-btn"

                            onClick={() =>

                              addToCart(

                                product

                              )

                            }

                          >

                            🛒 Add

                          </button>

                        ) : (

                          <div className="quantity-control">

                            <button

                              onClick={() =>

                                updateQuantity(

                                  product.id,

                                  -1

                                )

                              }

                            >

                              −

                            </button>

                            <span>

                              {quantity}

                            </span>

                            <button

                              onClick={() =>

                                updateQuantity(

                                  product.id,

                                  1

                                )

                              }

                            >

                              +

                            </button>

                          </div>

                        )}

                      </div>

                    </div>

                  </div>

                );

              }

            )}

          </div>

        )}

      </section>

      {/* ==================================================

          BOTTOM BANNERS

      ================================================== */}

      <section className="bottom-banners">

        <div className="bottom-banner">

          <img

            src="/images/bottom-left.jpg"

            alt="Beer flavours"

          />

          <div className="bottom-content">

            <span>

              FROM CLASSICS TO CRAFTS

            </span>

            <h2>

              Explore a World

              <br />

              <b>

                of Beer Flavours

              </b>

            </h2>

            <p>

              Discover something

              special for every mood.

            </p>

            <button

              onClick={

                scrollToProducts

              }

            >

              Explore Collection →

            </button>

          </div>

        </div>

        <div className="bottom-banner">

          <img

            src="/images/bottom-right.jpg"

            alt="Beer and good times"

          />

          <div className="bottom-content">

            <h2>

              Beer &

              <br />

              <b>Good Times</b>

            </h2>

            <p>

              Because every moment

              deserves a great beer.

            </p>

            <button

              onClick={

                scrollToProducts

              }

            >

              Shop Now →

            </button>

          </div>

        </div>

      </section>

      {/* ==================================================

          FOOTER

      ================================================== */}

      <footer className="footer">

        <div className="footer-logo">

          <img

            src="/images/logo.png"

            alt="Beervana"

          />

        </div>

        <div className="footer-text">

          <p>

            Enjoy responsibly.

            For adults of legal drinking age only.

          </p>

          <small>

            © 2026 Beervana.

            All rights reserved.

          </small>

        </div>

        <div className="socials">

          <span>

            Instagram

          </span>

          <span>

            Facebook

          </span>

          <span>

            YouTube

          </span>

        </div>

      </footer>

      {/* ==================================================

          CART DRAWER

      ================================================== */}

      {cartOpen && (

        <div

          className="cart-overlay"

          onClick={() =>

            setCartOpen(false)

          }

        >

          <aside

            className="cart-drawer"

            onClick={(e) =>

              e.stopPropagation()

            }

          >

            <div className="cart-header">

              <div>

                <span>

                  BEERVANA

                </span>

                <h2>

                  Your Cart

                </h2>

              </div>

              <button

                onClick={() =>

                  setCartOpen(false)

                }

              >

                ×

              </button>

            </div>

            {cart.length === 0 ? (

              <div className="empty-cart">

                <span>

                  🛒

                </span>

                <h3>

                  Your cart is empty

                </h3>

                <p>

                  Add your favourite

                  beer to continue.

                </p>

              </div>

            ) : (

              <>

                <div className="cart-items">

                  {cart.map((item) => (

                    <div

                      className="cart-item"

                      key={item.id}

                    >

                      <img

                        src={item.image}

                        alt={item.name}

                      />

                      <div className="cart-item-info">

                        <h4>

                          {item.name}

                        </h4>

                        <span>

                          ₹

                          {Number(

                            item.price

                          ).toFixed(0)}

                        </span>

                        <div className="cart-quantity">

                          <button

                            onClick={() =>

                              updateQuantity(

                                item.id,

                                -1

                              )

                            }

                          >

                            −

                          </button>

                          <strong>

                            {item.quantity}

                          </strong>

                          <button

                            onClick={() =>

                              updateQuantity(

                                item.id,

                                1

                              )

                            }

                          >

                            +

                          </button>

                        </div>

                        <button

                          className="remove-cart-item"

                          onClick={() =>

                            removeFromCart(

                              item.id

                            )

                          }

                        >

                          Remove

                        </button>

                      </div>

                      <strong>

                        ₹

                        {(

                          Number(item.price) *

                          item.quantity

                        ).toFixed(0)}

                      </strong>

                    </div>

                  ))}

                </div>

                <div className="cart-footer">

                  <div className="cart-total">

                    <span>

                      Subtotal

                    </span>

                    <strong>

                      ₹

                      {subtotal.toFixed(0)}

                    </strong>

                  </div>

                  <div className="cart-total">

                    <span>

                      Delivery

                    </span>

                    <strong>

                      {deliveryCharge === 0

                        ? "FREE"

                        : `₹${deliveryCharge}`}

                    </strong>

                  </div>

                  {deliveryCharge > 0 && (

                    <p className="delivery-note">

                      Add ₹

                      {(

                        499 - subtotal

                      ).toFixed(0)}

                      {" "}

                      more for free delivery.

                    </p>

                  )}

                  <div className="cart-total">

                    <span>

                      Grand Total

                    </span>

                    <strong>

                      ₹

                      {grandTotal.toFixed(0)}

                    </strong>

                  </div>

                  <button

                    className="checkout-btn"

                    onClick={

                      openCheckout

                    }

                  >

                    Proceed to Checkout →

                  </button>

                  <button

                    className="clear-cart-btn"

                    onClick={

                      clearCart

                    }

                  >

                    Clear Cart

                  </button>

                </div>

              </>

            )}

          </aside>

        </div>

      )}

      {/* ==================================================

          CHECKOUT MODAL

      ================================================== */}

      {checkoutOpen && (

        <div

          className="modal-overlay"

          onClick={() =>

            setCheckoutOpen(false)

          }

        >

          <div

            className="checkout-modal"

            onClick={(e) =>

              e.stopPropagation()

            }

          >

            {/* CHECKOUT HEADER */}

            <div className="checkout-header">

              <div>

                <span>

                  BEERVANA

                </span>

                <h2>

                  Checkout

                </h2>

              </div>

              <button

                onClick={() =>

                  setCheckoutOpen(false)

                }

              >

                ×

              </button>

            </div>

            {/* CHECKOUT BODY */}

            <div className="checkout-body">

              {/* CUSTOMER DETAILS */}

              <div className="checkout-section">

                <div className="checkout-section-title">

                  <span>

                    👤

                  </span>

                  <div>

                    <h3>

                      Customer Details

                    </h3>

                    <p>

                      Enter your contact information

                    </p>

                  </div>

                </div>

                <div className="checkout-row">

                  <div className="checkout-field">

                    <label>

                      Full Name

                    </label>

                    <input

                      type="text"

                      placeholder="Enter your name"

                      value={customerName}

                      onChange={(e) =>

                        setCustomerName(

                          e.target.value

                        )

                      }

                    />

                  </div>

                  <div className="checkout-field">

                    <label>

                      Phone Number

                    </label>

                    <input

                      type="tel"

                      inputMode="numeric"

                      placeholder="10-digit mobile number"

                      value={phone}

                      maxLength={10}

                      onChange={(e) =>

                        setPhone(

                          e.target.value

                            .replace(

                              /\D/g,

                              ""

                            )

                            .slice(0, 10)

                        )

                      }

                    />

                  </div>

                </div>

              </div>

              {/* DELIVERY DETAILS */}

              <div className="checkout-section">

                <div className="checkout-section-title">

                  <span>

                    📍

                  </span>

                  <div>

                    <h3>

                      Delivery Address

                    </h3>

                    <p>

                      Where should we deliver?

                    </p>

                  </div>

                </div>

                {accessToken && savedAddresses.length > 0 && (
                  <div className="checkout-field">
                    <label>Choose saved address</label>
                    <select
                      value={selectedAddressId}
                      onChange={(event) => applySavedAddress(event.target.value)}
                    >
                      <option value="">Enter a new address</option>
                      {savedAddresses.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                          {item.label || "Address"} — {item.address_line}, {item.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  className="checkout-cancel"
                  onClick={useCurrentLocation}
                  disabled={locationLoading}
                  style={{ marginBottom: 14 }}
                >
                  {locationLoading ? "Detecting location..." : "📍 Use Current GPS Location"}
                </button>
                {locationMessage && <p role="status" style={{ marginBottom: 12, color: "#75827c" }}>{locationMessage}</p>}
                <div className="checkout-field">
                  <label>Address</label>

                  <textarea

                    rows="3"

                    placeholder="House no., street, area..."

                    value={address}

                    onChange={(e) =>

                      setAddress(

                        e.target.value

                      )

                    }

                  />

                </div>

                <div className="checkout-field">
                  <label>Landmark (optional)</label>
                  <input
                    type="text"
                    placeholder="Nearby landmark"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                  />
                </div>
                <div className="checkout-row">
                  <div className="checkout-field">
                    <label>City

                    </label>

                    <input

                      type="text"

                      placeholder="Enter city"

                      value={city}

                      onChange={(e) =>

                        setCity(

                          e.target.value

                        )

                      }

                    />

                  </div>

                  <div className="checkout-field">

                    <label>

                      Pincode

                    </label>

                    <input

                      type="text"

                      inputMode="numeric"

                      placeholder="6-digit pincode"

                      value={pincode}

                      maxLength={6}

                      onChange={(e) =>

                        setPincode(

                          e.target.value

                            .replace(

                              /\D/g,

                              ""

                            )

                            .slice(0, 6)

                        )

                      }

                    />

                  </div>

                </div>
                <div className="checkout-field">
                  <label>State</label>
                  <input
                    type="text"
                    placeholder="Enter state"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                  />
                </div>
                {accessToken && (
                  <div className="checkout-row">
                    <div className="checkout-field">
                      <label>Save address as</label>
                      <select value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)}>
                        <option>Home</option>
                        <option>Work</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="checkout-field" style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button type="button" className="checkout-cancel" onClick={saveCurrentAddress} disabled={savingAddress}>
                        {savingAddress ? "Saving..." : "Save Address"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* PAYMENT */}

              <div className="checkout-section">

                <div className="checkout-section-title">

                  <span>

                    💳

                  </span>

                  <div>

                    <h3>

                      Payment Method

                    </h3>

                    <p>

                      Choose how you want to pay

                    </p>

                  </div>

                </div>

                <div className="payment-options">

                  {/* COD */}

                  <label

                    className={`payment-option ${

                      paymentMethod === "cod"

                        ? "active"

                        : ""

                    }`}

                  >

                    <input

                      type="radio"

                      name="payment"

                      value="cod"

                      checked={

                        paymentMethod === "cod"

                      }

                      onChange={() =>

                        setPaymentMethod(

                          "cod"

                        )

                      }

                    />

                    <span className="payment-icon">

                      💵

                    </span>

                    <div>

                      <strong>

                        Cash on Delivery

                      </strong>

                      <small>

                        Pay when your order arrives

                      </small>

                    </div>

                  </label>

                  {/* UPI */}

                  <label

                    className={`payment-option ${

                      paymentMethod === "upi"

                        ? "active"

                        : ""

                    }`}

                  >

                    <input

                      type="radio"

                      name="payment"

                      value="upi"

                      checked={

                        paymentMethod === "upi"

                      }

                      onChange={() =>

                        setPaymentMethod(

                          "upi"

                        )

                      }

                    />

                    <span className="payment-icon">

                      📱

                    </span>

                    <div>

                      <strong>

                        UPI

                      </strong>

                      <small>

                        Pay using UPI ID

                      </small>

                    </div>

                  </label>

                  {/* CARD */}

                  <label

                    className={`payment-option ${

                      paymentMethod === "card"

                        ? "active"

                        : ""

                    }`}

                  >

                    <input

                      type="radio"

                      name="payment"

                      value="card"

                      checked={

                        paymentMethod === "card"

                      }

                      onChange={() =>

                        setPaymentMethod(

                          "card"

                        )

                      }

                    />

                    <span className="payment-icon">

                      💳

                    </span>

                    <div>

                      <strong>

                        Credit / Debit Card

                      </strong>

                      <small>

                        Demo card payment

                      </small>

                    </div>

                  </label>

                </div>

                {/* UPI DETAILS */}

                {paymentMethod === "upi" && (

                  <div className="payment-details">

                    <div className="payment-details-title">

                      <span>

                        📱

                      </span>

                      <div>

                        <h4>

                          UPI Payment

                        </h4>

                        <p>

                          Enter your UPI ID

                        </p>

                      </div>

                    </div>

                    <div className="checkout-field">

                      <label>

                        UPI ID

                      </label>

                      <input

                        type="text"

                        placeholder="example@upi"

                        value={upiId}

                        onChange={(e) =>

                          setUpiId(

                            e.target.value.replace(

                              /\s/g,

                              ""

                            )

                          )

                        }

                      />

                    </div>

                    <div className="payment-security">

                      🔒 Demo payment — no real

                      transaction will be processed.

                    </div>

                  </div>

                )}

                {/* CARD DETAILS */}

                {paymentMethod === "card" && (

                  <div className="payment-details">

                    <div className="payment-details-title">

                      <span>

                        💳

                      </span>

                      <div>

                        <h4>

                          Card Details

                        </h4>

                        <p>

                          Demo card information

                        </p>

                      </div>

                    </div>

                    <div className="checkout-field">

                      <label>

                        Card Number

                      </label>

                      <input

                        type="text"

                        inputMode="numeric"

                        placeholder="1234 5678 9012 3456"

                        value={cardNumber}

                        maxLength={19}

                        onChange={(e) =>

                          setCardNumber(

                            formatCardNumber(

                              e.target.value

                            )

                          )

                        }

                      />

                    </div>

                    <div className="checkout-field">

                      <label>

                        Card Holder Name

                      </label>

                      <input

                        type="text"

                        placeholder="Name on card"

                        value={cardName}

                        onChange={(e) =>

                          setCardName(

                            e.target.value

                          )

                        }

                      />

                    </div>

                    <div className="checkout-row">

                      <div className="checkout-field">

                        <label>

                          Expiry

                        </label>

                        <input

                          type="text"

                          inputMode="numeric"

                          placeholder="MM/YY"

                          value={cardExpiry}

                          maxLength={5}

                          onChange={(e) =>

                            setCardExpiry(

                              formatExpiry(

                                e.target.value

                              )

                            )

                          }

                        />

                      </div>

                      <div className="checkout-field">

                        <label>

                          CVV

                        </label>

                        <input

                          type="password"

                          inputMode="numeric"

                          placeholder="123"

                          value={cardCvv}

                          maxLength={3}

                          onChange={(e) =>

                            setCardCvv(

                              e.target.value

                                .replace(

                                  /\D/g,

                                  ""

                                )

                                .slice(0, 3)

                            )

                          }

                        />

                      </div>

                    </div>

                    <div className="payment-security">

                      🔒 Demo payment — card

                      details are not processed

                      through a real payment gateway.

                    </div>

                  </div>

                )}

              </div>

              {/* ORDER SUMMARY */}

              <div className="checkout-summary">

                <div className="summary-header">

                  <h3>

                    Order Summary

                  </h3>

                </div>

                {cart.map((item) => (

                  <div

                    className="summary-item"

                    key={item.id}

                  >

                    <span>

                      {item.name} ×{" "}

                      {item.quantity}

                    </span>

                    <strong>

                      ₹

                      {(

                        Number(item.price) *

                        item.quantity

                      ).toFixed(0)}

                    </strong>

                  </div>

                ))}

                <div className="summary-item">

                  <span>

                    Delivery

                  </span>

                  <strong>

                    {deliveryCharge === 0

                      ? "FREE"

                      : `₹${deliveryCharge}`}

                  </strong>

                </div>

                <div className="summary-total">

                  <span>

                    Total Amount

                  </span>

                  <strong>

                    ₹

                    {grandTotal.toFixed(0)}

                  </strong>

                </div>

              </div>

            </div>

            {/* CHECKOUT FOOTER */}

            <div className="checkout-footer">

              <button

                className="checkout-cancel"

                onClick={() =>

                  setCheckoutOpen(false)

                }

              >

                Cancel

              </button>

              <button

                className="checkout-place"

                onClick={

                  placeOrder

                }

              >

                Place Order · ₹

                {grandTotal.toFixed(0)}

              </button>

            </div>

          </div>

        </div>

      )}

      {trackOrderOpen && (
        <div
          className="modal-overlay"
          onClick={() => setTrackOrderOpen(false)}
        >
          <div
            className="checkout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="track-order-heading"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="checkout-header">
              <div>
                <span>BEERVANA</span>
                <h2 id="track-order-heading">Track Your Order</h2>
              </div>
              <button
                type="button"
                aria-label="Close Track Order"
                onClick={() => setTrackOrderOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="checkout-body">
              <div className="checkout-section">
                <p>Enter your Order ID to view the latest status.</p>
                <form onSubmit={handleTrackOrder}>
                  <div className="checkout-field">
                    <label htmlFor="track-order-id">Order ID</label>
                    <input
                      id="track-order-id"
                      type="text"
                      value={trackOrderId}
                      onChange={(event) => setTrackOrderId(event.target.value)}
                      placeholder="e.g. BVN-20261012014048"
                      autoComplete="off"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="checkout-place"
                    disabled={trackLoading}
                    style={{ marginTop: 14, width: "100%" }}
                  >
                    {trackLoading ? "Checking Order..." : "Track Order"}
                  </button>
                </form>

                {trackOrderError && (
                  <p role="alert" style={{ color: "#b42318", marginTop: 14 }}>
                    {trackOrderError}
                  </p>
                )}
              </div>

              {trackedOrder && (
                <div className="checkout-section">
                  <div className="checkout-section-title">
                    <span>📦</span>
                    <div>
                      <h3>Order Details</h3>
                      <p>{trackedOrder.order_id || trackOrderId}</p>
                    </div>
                  </div>

                  <div className="summary-item">
                    <span>Status</span>
                    <strong>{trackedOrder.status || "Not available"}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Subtotal</span>
                    <strong>₹{trackedOrder.subtotal ?? "—"}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Delivery fee</span>
                    <strong>₹{trackedOrder.delivery_fee ?? "—"}</strong>
                  </div>
                  <div className="summary-total">
                    <span>Total amount</span>
                    <strong>₹{trackedOrder.total_amount ?? "—"}</strong>
                  </div>

                  {trackedOrder.items?.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h4>Items</h4>
                      {trackedOrder.items.map((item, index) => (
                        <div className="summary-item" key={`${item.product_id ?? index}-${index}`}>
                          <span>{item.product_name || item.name || `Product ${item.product_id}`} × {item.quantity}</span>
                          <strong>₹{item.subtotal ?? (Number(item.price || 0) * Number(item.quantity || 0))}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {trackedOrder.address && (
                    <p style={{ marginTop: 16 }}>
                      <strong>Delivery address: </strong>
                      {trackedOrder.address}{trackedOrder.city ? `, ${trackedOrder.city}` : ""}{trackedOrder.pincode ? ` - ${trackedOrder.pincode}` : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {accountOpen && (
        <div className="modal-overlay" onClick={() => setAccountOpen(false)}>
          <div
            className="checkout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-heading"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="checkout-header">
              <div>
                <span>BEERVANA</span>
                <h2 id="account-heading">{loggedInCustomer ? "My Account" : authMode === "login" ? "Customer Login" : "Create Account"}</h2>
              </div>
              <button type="button" aria-label="Close Account" onClick={() => setAccountOpen(false)}>×</button>
            </div>
            <div className="checkout-body">
              {loggedInCustomer ? (
                <div className="checkout-section">
                  <h3>Welcome, {loggedInCustomer.name || "Customer"}!</h3>
                  <p>{loggedInCustomer.email || ""}</p>
                  <div className="summary-item"><span>Phone</span><strong>{loggedInCustomer.phone || phone || "Not added"}</strong></div>
                  <div className="summary-item"><span>Saved addresses</span><strong>{savedAddresses.length}</strong></div>
                  {savedAddresses.map((item) => (
                    <div className="summary-item" key={item.id}>
                      <span>{item.label || "Address"}</span>
                      <strong>{item.address_line}, {item.city} {item.pincode}</strong>
                    </div>
                  ))}
                  <button type="button" className="checkout-place" style={{ width: "100%", marginTop: 16 }} onClick={() => { setAccountOpen(false); setCartOpen(true); }}>Go to Cart / Checkout</button>
                  <button type="button" className="checkout-cancel" style={{ width: "100%", marginTop: 10 }} onClick={logoutCustomer}>Logout</button>
                </div>
              ) : (
                <div className="checkout-section">
                  <div className="payment-options" style={{ marginBottom: 18 }}>
                    <button type="button" className={`payment-option ${authMode === "login" ? "active" : ""}`} onClick={() => { setAuthMode("login"); setAuthMessage(""); }}>Login</button>
                    <button type="button" className={`payment-option ${authMode === "register" ? "active" : ""}`} onClick={() => { setAuthMode("register"); setAuthMessage(""); }}>Create Account</button>
                  </div>
                  <form onSubmit={submitAuth}>
                    {authMode === "register" && (
                      <>
                        <div className="checkout-field">
                          <label>Full Name</label>
                          <input value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Enter full name" required />
                        </div>
                        <div className="checkout-field">
                          <label>Phone</label>
                          <input value={authPhone} onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" maxLength={10} placeholder="10-digit phone" required />
                        </div>
                      </>
                    )}
                    <div className="checkout-field">
                      <label>Email</label>
                      <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="checkout-field">
                      <label>Password</label>
                      <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Enter password" minLength={6} required />
                    </div>
                    <button type="submit" className="checkout-place" style={{ width: "100%", marginTop: 12 }} disabled={authLoading}>
                      {authLoading ? "Please wait..." : authMode === "login" ? "Login" : "Create Account"}
                    </button>
                  </form>
                  {authMessage && <p role="status" style={{ marginTop: 14, color: "#75827c" }}>{authMessage}</p>}
                  <p style={{ marginTop: 14, color: "#75827c" }}>Login karke aap apne delivery addresses save kar sakte hain.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================

          ORDER SUCCESS

      ================================================== */}

      {orderSuccess && (

        <div className="modal-overlay">

          <div className="success-modal">

            <div className="success-icon">

              ✓

            </div>

            <h2>

              Order Placed!

            </h2>

            <p>

              Your Beervana demo order has

              been successfully placed.

            </p>

            {/* ORDER ID */}

            <div className="success-order-id">

              <span>

                Order ID

              </span>

              <strong>

                {orderId}

              </strong>

            </div>

            <small>

              Thank you for choosing Beervana.

            </small>

            <button

              className="primary-btn"

              onClick={

                closeSuccess

              }

            >

              Continue Shopping

            </button>

          </div>

        </div>

      )}

      {/* ==================================================

          AGE VERIFICATION

      ================================================== */}

      {!ageVerified && (

        <div className="age-overlay">

          <div className="age-modal">

            <div className="age-icon">

              🍺

            </div>

            <h2 className="age-question">

              Are you of legal drinking age?

            </h2>

            <p>

              You must be of legal drinking

              age in your location to enter

              Beervana.

            </p>

            <div className="age-buttons">

              <button

                className="age-yes"

                onClick={

                  verifyAge

                }

              >

                Yes, I am of legal age

              </button>

              <button

                className="age-no"

                onClick={

                  leaveWebsite

                }

              >
                No, take me back
              </button>

            </div>

            <small>
              Please drink responsibly.
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;