const seatButtons = [...document.querySelectorAll(".floor-seat[data-seat-button]")];
const seatDetail = document.querySelector("[data-seat-detail]");
const seatSummary = document.querySelector("[data-seat-summary]");
const stage = document.querySelector("[data-seating-stage]");
const floorTables = [...document.querySelectorAll("[data-floor-table]")];
const layoutUrl = stage?.dataset.layoutUrl;

const selectSeat = (seat) => {
  if (!seat || !seatDetail || !seatSummary) return;

  seatButtons.forEach((button) => button.classList.toggle("is-selected", button === seat));
  const table = seat.dataset.table;
  const seatNumber = seat.dataset.seat;
  const guest = seat.dataset.guest || "Open seat";

  seatDetail.textContent = `${guest}`;
  seatSummary.textContent = `Table ${table}, Seat ${seatNumber}. Live assignment from attending RSVPs.`;
};

const showSeatingToast = (message, type = "success") => {
  if (window.Toastify) {
    window.Toastify({
      text: message,
      duration: 2400,
      gravity: "top",
      position: "right",
      className: type === "success" ? "toast-success" : "toast-error",
    }).showToast();
    return;
  }

  console.log(message);
};

const getCsrfToken = () => document.querySelector('input[name="__RequestVerificationToken"]')?.value || "";
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getTablePosition = (table) => {
  const stageRect = stage.getBoundingClientRect();
  const tableRect = table.getBoundingClientRect();
  const tableWidthPercent = (table.offsetWidth / stageRect.width) * 100;
  const tableHeightPercent = (table.offsetHeight / stageRect.height) * 100;
  const xPercent = ((tableRect.left - stageRect.left) / stageRect.width) * 100;
  const yPercent = ((tableRect.top - stageRect.top) / stageRect.height) * 100;

  return {
    tableNumber: Number(table.dataset.table),
    xPercent: Number(clamp(xPercent, 0, 100 - tableWidthPercent).toFixed(3)),
    yPercent: Number(clamp(yPercent, 0, 100 - tableHeightPercent).toFixed(3)),
  };
};

const saveLayout = async () => {
  if (!layoutUrl || !stage) return;

  const positions = floorTables.map(getTablePosition);

  try {
    const response = await fetch(layoutUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        RequestVerificationToken: getCsrfToken(),
      },
      body: JSON.stringify({ positions }),
    });

    if (!response.ok) throw new Error("Layout save failed");
    showSeatingToast("Seating layout saved.");
  } catch (error) {
    showSeatingToast("Could not save seating layout.", "error");
  }
};

const makeTableDraggable = (table) => {
  if (!stage) return;

  let drag = null;
  let activePointerId = null;

  const finishDrag = (event) => {
    if (!drag) return;

    if (event?.pointerId != null && table.hasPointerCapture?.(event.pointerId)) {
      table.releasePointerCapture(event.pointerId);
    }

    table.classList.remove("is-dragging");
    drag = null;
    activePointerId = null;
    saveLayout();
  };

  table.addEventListener("pointerdown", (event) => {
    if (event.target.closest("[data-seat-button]")) return;

    const stageRect = stage.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();
    drag = {
      offsetX: event.clientX - tableRect.left,
      offsetY: event.clientY - tableRect.top,
      stageWidth: stageRect.width,
      stageHeight: stageRect.height,
    };

    table.classList.add("is-dragging");
    activePointerId = event.pointerId;
    table.setPointerCapture(event.pointerId);
  });

  table.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== activePointerId) return;

    const stageRect = stage.getBoundingClientRect();
    const tableWidthPercent = (table.offsetWidth / drag.stageWidth) * 100;
    const tableHeightPercent = (table.offsetHeight / drag.stageHeight) * 100;
    const nextX = ((event.clientX - stageRect.left - drag.offsetX) / drag.stageWidth) * 100;
    const nextY = ((event.clientY - stageRect.top - drag.offsetY) / drag.stageHeight) * 100;

    table.style.left = `${clamp(nextX, 0, 100 - tableWidthPercent).toFixed(3)}%`;
    table.style.top = `${clamp(nextY, 0, 100 - tableHeightPercent).toFixed(3)}%`;
  });

  table.addEventListener("pointerup", finishDrag);
  table.addEventListener("pointercancel", finishDrag);
  table.addEventListener("lostpointercapture", finishDrag);
};

seatButtons.forEach((seat) => {
  seat.addEventListener("click", () => selectSeat(seat));
  seat.addEventListener("focus", () => selectSeat(seat));
});

floorTables.forEach(makeTableDraggable);
selectSeat(seatButtons[0]);
