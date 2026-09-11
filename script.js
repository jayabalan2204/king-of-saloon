const splashScreen = document.getElementById("splashScreen");
const homeScreen = document.getElementById("homeScreen");
const newEntryScreen = document.getElementById("newEntryScreen");
const viewDataScreen = document.getElementById("viewDataScreen");
const entryForm = document.getElementById("entryForm");
const successPopup = document.getElementById("successPopup");

const screens = [homeScreen, newEntryScreen, viewDataScreen];

setTimeout(() => {
  splashScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
}, 2000);

function showScreen(screen) {
  screens.forEach(s => s.classList.add("hidden"));
  screen.classList.remove("hidden");
  window.scrollTo(0, 0);
}

function getEntries() {
  return JSON.parse(localStorage.getItem("salonEntries") || "[]");
}

function getNextSerial() {
  const entries = getEntries();
  if (!entries.length) return "001";

  const maxSerial = Math.max(
    ...entries.map(entry => Number(entry.serialNumber) || 0)
  );

  return String(maxSerial + 1).padStart(3, "0");
}

function prepareNewEntry() {
  document.getElementById("serialNumber").value = getNextSerial();

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  document.getElementById("entryDate").value = `${yyyy}-${mm}-${dd}`;
  entryForm.reset();

  // reset() clears readonly values, so set them again
  document.getElementById("serialNumber").value = getNextSerial();
  document.getElementById("entryDate").value = `${yyyy}-${mm}-${dd}`;

  document.querySelectorAll(".error").forEach(el => el.textContent = "");
}

document.getElementById("newEntryBtn").addEventListener("click", () => {
  prepareNewEntry();
  showScreen(newEntryScreen);
});

document.getElementById("viewDataBtn").addEventListener("click", () => {
  showScreen(viewDataScreen);
  renderData();
});

document.getElementById("dateRange").addEventListener("change", renderData);
document.getElementById("customerSearch").addEventListener("input", renderData);

document.querySelectorAll("[data-back]").forEach(button => {
  button.addEventListener("click", () => showScreen(homeScreen));
});

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const customerName = document.getElementById("customerName").value.trim();
  const workDescription = document.getElementById("workDescription").value.trim();
  const price = document.getElementById("price").value;
  const paymentMethod = document.getElementById("paymentMethod").value;

  let valid = true;

  const customerError = document.getElementById("customerError");
  const workError = document.getElementById("workError");
  const priceError = document.getElementById("priceError");
  const paymentError = document.getElementById("paymentError");

  customerError.textContent = "";
  workError.textContent = "";
  priceError.textContent = "";
  paymentError.textContent = "";

  if (!customerName) {
    customerError.textContent = "Customer name is required.";
    valid = false;
  } else if (!/^[A-Za-z .'-]+$/.test(customerName)) {
    customerError.textContent = "Please enter a valid name.";
    valid = false;
  }

  if (!workDescription) {
    workError.textContent = "Work description is required.";
    valid = false;
  }

  if (!price || !Number.isInteger(Number(price)) || Number(price) <= 0) {
    priceError.textContent = "Enter a valid whole-number price.";
    valid = false;
  }

  if (!paymentMethod) {
    paymentError.textContent = "Please select a payment method.";
    valid = false;
  }

  if (!valid) return;

  const entry = {
    serialNumber: document.getElementById("serialNumber").value,
    date: document.getElementById("entryDate").value,
    customerName,
    workDescription,
    price: Number(price),
    paymentMethod,
    createdAt: Date.now()
  };

  const entries = getEntries();
  entries.push(entry);
  localStorage.setItem("salonEntries", JSON.stringify(entries));

  successPopup.classList.remove("hidden");
});

document.getElementById("successOkBtn").addEventListener("click", () => {
  successPopup.classList.add("hidden");
  entryForm.reset();
  showScreen(homeScreen);
});


function formatDisplayDate(dateString) {
  const [year, month, day] = dateString.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getLocalDateOnly(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDateRangeStart(range) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (range === "today") {
    return today;
  }

  if (range === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  const days = range === "7days" ? 6 : 29;
  const start = new Date(today);
  start.setDate(start.getDate() - days);
  return start;
}

function renderData() {
  const entries = getEntries();
  const range = document.getElementById("dateRange").value;
  const search = document.getElementById("customerSearch").value.trim().toLowerCase();

  const startDate = getDateRangeStart(range);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let filtered = entries.filter(entry => {
    const entryDate = new Date(`${entry.date}T00:00:00`);
    const matchesDate = entryDate >= startDate && entryDate <= today;
    const matchesSearch = entry.customerName.toLowerCase().includes(search);
    return matchesDate && matchesSearch;
  });

  filtered.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    return dateCompare || (b.createdAt || 0) - (a.createdAt || 0);
  });

  const dataList = document.getElementById("dataList");
  const noData = document.getElementById("noData");

  document.getElementById("totalEntries").textContent = filtered.length;

  const total = filtered.reduce((sum, entry) => sum + Number(entry.price || 0), 0);
  document.getElementById("totalAmount").textContent =
    `₹${total.toLocaleString("en-IN")}`;

  const cash = filtered
    .filter(e => e.paymentMethod === "Cash")
    .reduce((sum, e) => sum + Number(e.price || 0), 0);

  const upi = filtered
    .filter(e => e.paymentMethod === "UPI")
    .reduce((sum, e) => sum + Number(e.price || 0), 0);

  const card = filtered
    .filter(e => e.paymentMethod === "Card")
    .reduce((sum, e) => sum + Number(e.price || 0), 0);

  document.getElementById("cashTotal").textContent = `₹${cash.toLocaleString("en-IN")}`;
  document.getElementById("upiTotal").textContent = `₹${upi.toLocaleString("en-IN")}`;
  document.getElementById("cardTotal").textContent = `₹${card.toLocaleString("en-IN")}`;

  dataList.innerHTML = "";

  if (!filtered.length) {
    noData.classList.remove("hidden");
    return;
  }

  noData.classList.add("hidden");

  filtered.forEach(entry => {
    const card = document.createElement("article");
    card.className = "data-card";

    card.innerHTML = `
      <div class="data-top">
        <span class="data-serial">#${escapeHtml(entry.serialNumber)}</span>
        <span class="data-date">${formatDisplayDate(entry.date)}</span>
      </div>

      <div class="data-customer">${escapeHtml(entry.customerName)}</div>
      <div class="data-work">${escapeHtml(entry.workDescription)}</div>

      <div class="data-bottom">
        <span class="data-price">₹${Number(entry.price).toLocaleString("en-IN")}</span>
        <span class="payment-badge">${escapeHtml(entry.paymentMethod)}</span>
      </div>

      <div class="data-actions">
        <button class="data-action-btn" data-action="edit" data-id="${entry.createdAt}">
          ✏️ Edit
        </button>
        <button class="data-action-btn delete" data-action="delete" data-id="${entry.createdAt}">
          🗑️ Delete
        </button>
      </div>
    `;

    dataList.appendChild(card);
  });
}

function findEntryIndex(createdAt) {
  const entries = getEntries();
  return entries.findIndex(entry => String(entry.createdAt) === String(createdAt));
}

const editModal = document.getElementById("editModal");
const deleteModal = document.getElementById("deleteModal");
let pendingDeleteId = null;

document.getElementById("dataList").addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const index = findEntryIndex(id);
  if (index === -1) return;

  const entries = getEntries();
  const entry = entries[index];

  if (button.dataset.action === "delete") {
    pendingDeleteId = id;
    document.getElementById("deleteMessage").textContent =
      `Delete #${entry.serialNumber} — ${entry.customerName}? This cannot be undone.`;
    deleteModal.classList.remove("hidden");
    return;
  }

  if (button.dataset.action === "edit") {
    document.getElementById("editId").value = id;
    document.getElementById("editSerial").value = entry.serialNumber;
    document.getElementById("editDate").value = entry.date;
    document.getElementById("editCustomer").value = entry.customerName;
    document.getElementById("editWork").value = entry.workDescription;
    document.getElementById("editPrice").value = entry.price;
    document.getElementById("editPayment").value = entry.paymentMethod;

    document.querySelectorAll("#editForm .error").forEach(el => el.textContent = "");
    editModal.classList.remove("hidden");
  }
});

document.getElementById("closeEditBtn").addEventListener("click", () => {
  editModal.classList.add("hidden");
});

editModal.addEventListener("click", event => {
  if (event.target === editModal) {
    editModal.classList.add("hidden");
  }
});

document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
  pendingDeleteId = null;
  deleteModal.classList.add("hidden");
});

deleteModal.addEventListener("click", event => {
  if (event.target === deleteModal) {
    pendingDeleteId = null;
    deleteModal.classList.add("hidden");
  }
});

document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
  if (!pendingDeleteId) return;

  const entries = getEntries();
  const index = findEntryIndex(pendingDeleteId);

  if (index !== -1) {
    entries.splice(index, 1);
    localStorage.setItem("salonEntries", JSON.stringify(entries));
  }

  pendingDeleteId = null;
  deleteModal.classList.add("hidden");
  renderData();
});

document.getElementById("editForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = document.getElementById("editId").value;
  const entries = getEntries();
  const index = findEntryIndex(id);
  if (index === -1) return;

  const customer = document.getElementById("editCustomer").value.trim();
  const work = document.getElementById("editWork").value.trim();
  const price = document.getElementById("editPrice").value;
  const payment = document.getElementById("editPayment").value;

  const errors = {
    customer: document.getElementById("editCustomerError"),
    work: document.getElementById("editWorkError"),
    price: document.getElementById("editPriceError"),
    payment: document.getElementById("editPaymentError")
  };

  Object.values(errors).forEach(el => el.textContent = "");

  let valid = true;

  if (!customer) {
    errors.customer.textContent = "Customer name is required.";
    valid = false;
  } else if (!/^[A-Za-z .'-]+$/.test(customer)) {
    errors.customer.textContent = "Please enter a valid name.";
    valid = false;
  }

  if (!work) {
    errors.work.textContent = "Work description is required.";
    valid = false;
  }

  if (!price || !Number.isInteger(Number(price)) || Number(price) <= 0) {
    errors.price.textContent = "Enter a valid whole-number price.";
    valid = false;
  }

  if (!payment) {
    errors.payment.textContent = "Please select a payment method.";
    valid = false;
  }

  if (!valid) return;

  entries[index] = {
    ...entries[index],
    customerName: customer,
    workDescription: work,
    price: Number(price),
    paymentMethod: payment,
    updatedAt: Date.now()
  };

  localStorage.setItem("salonEntries", JSON.stringify(entries));
  editModal.classList.add("hidden");
  renderData();
});


document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    const destination = button.dataset.nav;

    if (destination === "home") {
      showScreen(homeScreen);
    } else if (destination === "new") {
      prepareNewEntry();
      showScreen(newEntryScreen);
    } else if (destination === "view") {
      showScreen(viewDataScreen);
      renderData();
    }
  });
});


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
