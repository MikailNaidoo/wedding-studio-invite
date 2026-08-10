const toastRegion = document.querySelector("[data-toast-region]");
const newModal = document.querySelector("[data-new-modal]");
const editModal = document.querySelector("[data-edit-modal]");
const deleteModal = document.querySelector("[data-delete-modal]");

const openModal = (modal) => {
  if (!modal) return;
  if (window.bootstrap?.Modal) {
    window.bootstrap.Modal.getOrCreateInstance(modal).show();
    return;
  }
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modal.querySelector("input, select, textarea, button")?.focus();
};

const closeModal = (modal) => {
  if (!modal) return;
  if (window.bootstrap?.Modal) {
    window.bootstrap.Modal.getOrCreateInstance(modal).hide();
    return;
  }
  modal.hidden = true;
  document.body.classList.remove("modal-open");
};

const showToast = (message, tone = "success") => {
  if (!toastRegion || !message) return;
  const toast = document.createElement("div");
  toast.className = `toast admin-toast admin-toast-${tone}`;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.innerHTML = `<div class="toast-body">${message}</div>`;
  toastRegion.append(toast);

  if (window.bootstrap?.Toast) {
    const bootstrapToast = new window.bootstrap.Toast(toast, { delay: 4200 });
    toast.addEventListener("hidden.bs.toast", () => toast.remove());
    bootstrapToast.show();
    return;
  }

  window.setTimeout(() => toast.classList.add("is-visible"), 20);
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 260);
  }, 4200);
};

const setField = (form, name, value) => {
  const field = form?.querySelector(`[data-edit-field="${name}"]`);
  if (field) field.value = value ?? "";
};

document.querySelector("[data-new-rsvp-button]")?.addEventListener("click", () => {
  openModal(newModal);
});

document.querySelectorAll("[data-edit-button]").forEach((button) => {
  button.addEventListener("click", () => {
    const row = button.closest("[data-rsvp-row]");
    const form = editModal?.querySelector("[data-edit-form]");
    if (!row || !form) return;

    setField(form, "id", row.dataset.id);
    setField(form, "submittedAt", row.dataset.submittedAt);
    setField(form, "fullName", row.dataset.fullName);
    setField(form, "attending", row.dataset.attending);
    setField(form, "guestCount", row.dataset.guestCount);
    setField(form, "status", row.dataset.status);
    setField(form, "dietary", row.dataset.dietary);
    setField(form, "message", row.dataset.message);
    setField(form, "adminNotes", row.dataset.adminNotes);
    openModal(editModal);
  });
});

document.querySelectorAll("[data-delete-button]").forEach((button) => {
  button.addEventListener("click", () => {
    const row = button.closest("[data-rsvp-row]");
    if (!row || !deleteModal) return;

    const idInput = deleteModal.querySelector("[data-delete-id]");
    const nameTarget = deleteModal.querySelector("[data-delete-name]");
    if (idInput) idInput.value = row.dataset.id || "";
    if (nameTarget) nameTarget.textContent = row.dataset.fullName || "this RSVP";
    openModal(deleteModal);
  });
});

document.querySelectorAll("[data-modal-close]").forEach((button) => {
  button.addEventListener("click", () => closeModal(button.closest(".modal")));
});

document.querySelectorAll(".modal[data-new-modal], .modal[data-edit-modal], .modal[data-delete-modal]").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal);
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll(".modal.show, .modal:not([hidden])").forEach(closeModal);
});

document.querySelectorAll("[data-sidebar-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const sidebar = document.querySelector("#sidebar");
    const wrapper = document.querySelector("#sidebar .sidebar-wrapper");
    sidebar?.classList.toggle("active");
    wrapper?.classList.toggle("active");
  });
});

document.querySelectorAll("[data-status-select]").forEach((select) => {
  select.addEventListener("change", async () => {
    const id = select.dataset.id;
    const status = select.value;
    const token = document.querySelector("input[name='__RequestVerificationToken']")?.value || "";
    const message = document.querySelector(`[data-status-message="${id}"]`);
    const body = new URLSearchParams({ id, status, __RequestVerificationToken: token });

    if (message) message.textContent = "Saving...";

    try {
      const response = await fetch(select.dataset.statusUrl || "?handler=Status", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          RequestVerificationToken: token,
        },
        body,
      });

      if (!response.ok) throw new Error("Status update failed");
      const result = await response.json();
      if (message) message.textContent = `Saved ${result.savedAt}`;
      select.closest("[data-rsvp-row]")?.setAttribute("data-status", status);
      showToast(`Status changed to ${status}.`, "success");
    } catch {
      if (message) message.textContent = "Could not save status";
      showToast("Could not save status. Please try again.", "error");
    }
  });
});

if (toastRegion?.dataset.toastMessage) {
  showToast(toastRegion.dataset.toastMessage, toastRegion.dataset.toastTone || "success");
}
