// GamifyX Standalone Interactive Script for Localhost

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  if (document.getElementById('book')) {
    initBookingApp();
  }
  if (document.getElementById('filter-date') || document.querySelector('h1')?.textContent?.includes('GamifyX admin')) {
    initAdminApp();
  }
});

// 1. Theme Switcher
function initTheme() {
  const themeBtns = document.querySelectorAll('button[aria-label*="theme"], button[aria-label*="Theme"]');
  const isDark = localStorage.getItem('theme') !== 'light';
  document.documentElement.classList.toggle('dark', isDark);

  themeBtns.forEach(btn => {
    btn.onclick = () => {
      const darkNow = !document.documentElement.classList.contains('dark');
      document.documentElement.classList.toggle('dark', darkNow);
      localStorage.setItem('theme', darkNow ? 'dark' : 'light');
    };
  });
}

// Data Stores
const CONSOLES = [
  { id: 'c1', name: 'PS5 - Station 1', console_type: 'PS5' },
  { id: 'c2', name: 'PS5 - Station 2', console_type: 'PS5' },
  { id: 'c3', name: 'PS5 - Station 3', console_type: 'PS5' },
  { id: 'c4', name: 'PS4 - Station 1', console_type: 'PS4' },
  { id: 'c5', name: 'PS4 - Station 2', console_type: 'PS4' }
];

const RATES = {
  PS5: { one: 100, two: 180, half1: 70, half2: 120 },
  PS4: { one: 80, two: 150, half1: 50, half2: 100 }
};

const HOURS = Array.from({ length: 13 }, (_, i) => 10 + i); // 10 AM to 10 PM

function formatTime(h) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${ampm}`;
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 2. Main Booking App
function initBookingApp() {
  let selectedDate = getTodayString();
  let selectedConsole = null;
  let selectedStartHour = null;
  let selectedHours = 1;
  let selectedPlayers = 1;

  const dateInput = document.getElementById('date');
  if (dateInput) {
    dateInput.value = selectedDate;
    dateInput.min = getTodayString();
    dateInput.onchange = (e) => {
      selectedDate = e.target.value;
      selectedConsole = null;
      selectedStartHour = null;
      renderSlots();
      updateFormState();
    };
  }

  function getBookingsAndBlocks(date) {
    const bookings = JSON.parse(localStorage.getItem('gamifyx_bookings') || '[]');
    const blocks = JSON.parse(localStorage.getItem('gamifyx_blocks') || '[]');
    
    const activeBookings = bookings.filter(b => (b.booking_date === date || b.date === date) && b.status !== 'cancelled');
    const activeBlocks = blocks.filter(b => b.block_date === date || b.date === date);
    
    return [...activeBookings, ...activeBlocks.map(b => ({ consoleId: b.console_id, startHour: b.start_hour, hours: b.hours }))];
  }

  function renderSlots() {
    const occupied = getBookingsAndBlocks(selectedDate);
    const container = document.querySelector('#book .space-y-5');
    if (!container) return;

    container.innerHTML = CONSOLES.map(c => {
      const rate = RATES[c.console_type]?.one || 0;
      const buttonsHtml = HOURS.map(h => {
        const isTaken = occupied.some(b => b.consoleId === c.id && h >= b.startHour && h < (b.startHour + b.hours));
        const isSelected = selectedConsole === c.id && selectedStartHour === h;
        
        let btnClass = "rounded-lg border px-2 py-2 text-xs font-medium transition-all ";
        if (isTaken) {
          btnClass += "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-60";
        } else if (isSelected) {
          btnClass += "border-transparent bg-primary text-primary-foreground shadow-lg font-bold scale-105";
        } else {
          btnClass += "border-border bg-background hover:border-primary hover:text-primary cursor-pointer";
        }

        return `<button type="button" ${isTaken ? 'disabled' : ''} data-console="${c.id}" data-hour="${h}" class="${btnClass}">${formatTime(h)}</button>`;
      }).join('');

      return `
        <div>
          <div class="mb-2 flex items-center gap-2">
            <span class="font-display text-sm font-semibold text-foreground">${c.name}</span>
            <span class="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">from ₹${rate}/hr</span>
          </div>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">${buttonsHtml}</div>
        </div>
      `;
    }).join('');

    // Attach slot click handlers
    container.querySelectorAll('button[data-console]').forEach(btn => {
      btn.onclick = () => {
        selectedConsole = btn.getAttribute('data-console');
        selectedStartHour = parseInt(btn.getAttribute('data-hour'), 10);
        selectedHours = 1;
        renderSlots();
        updateFormState();
      };
    });
  }

  function updateFormState() {
    const consoleObj = CONSOLES.find(c => c.id === selectedConsole);
    const summaryBox = document.querySelector('form .rounded-xl.bg-muted');
    const priceDisplay = document.querySelector('form .font-display.text-xl');
    const submitBtn = document.querySelector('form button[type="submit"]');
    
    // Duration buttons
    const durationContainer = document.querySelectorAll('form div')[2]?.querySelectorAll('button');
    if (durationContainer) {
      durationContainer.forEach((btn, idx) => {
        const hrs = idx + 1;
        btn.onclick = (e) => {
          e.preventDefault();
          selectedHours = hrs;
          updateFormState();
        };
        if (selectedHours === hrs) {
          btn.className = "inline-flex items-center justify-center gap-2 font-medium transition-colors bg-primary text-primary-foreground shadow h-8 rounded-md px-3 text-xs";
        } else {
          btn.className = "inline-flex items-center justify-center gap-2 font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent h-8 rounded-md px-3 text-xs";
        }
      });
    }

    // Players buttons
    const playersContainer = document.querySelectorAll('form div')[3]?.querySelectorAll('button');
    if (playersContainer) {
      playersContainer.forEach((btn, idx) => {
        const p = idx + 1;
        btn.onclick = (e) => {
          e.preventDefault();
          selectedPlayers = p;
          updateFormState();
        };
        if (selectedPlayers === p) {
          btn.className = "inline-flex items-center justify-center gap-2 font-medium transition-colors bg-primary text-primary-foreground shadow h-8 rounded-md px-3 text-xs";
        } else {
          btn.className = "inline-flex items-center justify-center gap-2 font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent h-8 rounded-md px-3 text-xs";
        }
      });
    }

    if (summaryBox) {
      if (consoleObj && selectedStartHour !== null) {
        summaryBox.innerHTML = `
          <p class="font-medium text-foreground">${consoleObj.name}</p>
          <p class="text-muted-foreground">${selectedDate} · ${formatTime(selectedStartHour)} · ${selectedHours}h · ${selectedPlayers} player${selectedPlayers > 1 ? 's' : ''}</p>
        `;
      } else {
        summaryBox.innerHTML = `<p class="text-muted-foreground">Select a station and time slot above.</p>`;
      }
    }

    // Price math
    let total = 0;
    if (consoleObj) {
      const rateObj = RATES[consoleObj.console_type];
      const hourly = selectedPlayers >= 2 ? rateObj.two : rateObj.one;
      total = hourly * selectedHours;
    }
    if (priceDisplay) {
      priceDisplay.textContent = `₹${total}`;
    }

    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const isValid = consoleObj && selectedStartHour !== null && nameInput?.value.trim().length >= 2 && phoneInput?.value.trim().length >= 7;

    if (submitBtn) {
      submitBtn.disabled = !isValid;
    }
  }

  // Inputs change handler
  const nameInput = document.getElementById('name');
  const phoneInput = document.getElementById('phone');
  if (nameInput) nameInput.oninput = updateFormState;
  if (phoneInput) phoneInput.oninput = updateFormState;

  // Form Submission
  const form = document.querySelector('form');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('name')?.value.trim();
      const phone = document.getElementById('phone')?.value.trim();
      const notes = document.getElementById('notes')?.value.trim();
      const consoleObj = CONSOLES.find(c => c.id === selectedConsole);

      if (!consoleObj || selectedStartHour === null || !name || !phone) return;

      const bookings = JSON.parse(localStorage.getItem('gamifyx_bookings') || '[]');
      const newBooking = {
        id: 'bk_' + Date.now(),
        consoleId: selectedConsole,
        console_id: selectedConsole,
        date: selectedDate,
        booking_date: selectedDate,
        startHour: selectedStartHour,
        start_hour: selectedStartHour,
        hours: selectedHours,
        players: selectedPlayers,
        customer_name: name,
        phone: phone,
        notes: notes,
        status: 'confirmed'
      };

      bookings.push(newBooking);
      localStorage.setItem('gamifyx_bookings', JSON.stringify(bookings));

      alert(`🎉 Booking Confirmed!\nStation: ${consoleObj.name}\nDate: ${selectedDate}\nTime: ${formatTime(selectedStartHour)}\nDuration: ${selectedHours} hr`);

      selectedConsole = null;
      selectedStartHour = null;
      if (document.getElementById('name')) document.getElementById('name').value = '';
      if (document.getElementById('phone')) document.getElementById('phone').value = '';
      if (document.getElementById('notes')) document.getElementById('notes').value = '';
      
      renderSlots();
      updateFormState();
    };
  }

  renderSlots();
  updateFormState();
}

// 3. Admin App
function initAdminApp() {
  let filterDate = getTodayString();
  let filterConsole = '';

  const dateInput = document.getElementById('filter-date');
  const consoleSelect = document.getElementById('filter-console');
  const clearBtn = document.getElementById('clear-filters');
  const blockBtn = document.getElementById('btn-block-slot');

  if (dateInput) {
    dateInput.value = filterDate;
    dateInput.onchange = (e) => { filterDate = e.target.value; renderAdmin(); };
  }
  if (consoleSelect) {
    consoleSelect.onchange = (e) => { filterConsole = e.target.value; renderAdmin(); };
  }
  if (clearBtn) {
    clearBtn.onclick = () => {
      filterDate = '';
      filterConsole = '';
      if (dateInput) dateInput.value = '';
      if (consoleSelect) consoleSelect.value = '';
      renderAdmin();
    };
  }

  if (blockBtn) {
    blockBtn.onclick = () => {
      const cId = document.getElementById('block-console')?.value || 'c1';
      const hour = parseInt(document.getElementById('block-hour')?.value || '10', 10);
      const hours = parseInt(document.getElementById('block-hours')?.value || '1', 10);
      const reason = document.getElementById('block-reason')?.value.trim() || 'Maintenance';
      const bDate = filterDate || getTodayString();

      const blocks = JSON.parse(localStorage.getItem('gamifyx_blocks') || '[]');
      const newBlock = {
        id: 'blk_' + Date.now(),
        console_id: cId,
        block_date: bDate,
        start_hour: hour,
        hours: hours,
        reason: reason
      };

      blocks.push(newBlock);
      localStorage.setItem('gamifyx_blocks', JSON.stringify(blocks));

      if (document.getElementById('block-reason')) document.getElementById('block-reason').value = '';
      alert('🚫 Slot Blocked Successfully!');
      renderAdmin();
    };
  }

  function renderAdmin() {
    // Bookings Table
    const bookings = JSON.parse(localStorage.getItem('gamifyx_bookings') || '[]');
    const tbody = document.querySelector('table tbody');
    
    let filtered = bookings;
    if (filterDate) filtered = filtered.filter(b => b.booking_date === filterDate || b.date === filterDate);
    if (filterConsole) filtered = filtered.filter(b => (b.console_id || b.consoleId) === filterConsole);

    if (tbody) {
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colSpan="8" class="px-4 py-8 text-center text-muted-foreground">No bookings found for this filter.</td></tr>`;
      } else {
        tbody.innerHTML = filtered.map(b => {
          const cObj = CONSOLES.find(c => c.id === (b.consoleId || b.console_id));
          const name = cObj ? cObj.name : (b.consoleId || b.console_id);
          const start = b.startHour || b.start_hour || 10;
          const end = start + (b.hours || 1);
          
          return `
            <tr class="border-t border-border">
              <td class="px-4 py-3">${b.booking_date || b.date}</td>
              <td class="px-4 py-3">${formatTime(start)} – ${formatTime(end)}</td>
              <td class="px-4 py-3">${name}</td>
              <td class="px-4 py-3">${b.customer_name || 'Customer'}</td>
              <td class="px-4 py-3"><a href="tel:${b.phone}" class="hover:text-primary">${b.phone}</a></td>
              <td class="px-4 py-3">${b.players || 1}</td>
              <td class="px-4 py-3 capitalize">${b.status || 'confirmed'}</td>
              <td class="px-4 py-3 text-right">
                ${b.status !== 'cancelled' ? `<button onclick="cancelBooking('${b.id}')" class="rounded px-2 py-1 text-xs border border-border hover:bg-muted text-red-400">Cancel</button>` : ''}
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Blocked Slots List
    const blocks = JSON.parse(localStorage.getItem('gamifyx_blocks') || '[]');
    const blocksContainer = document.getElementById('blocked-slots-list');
    
    let filteredBlocks = blocks;
    if (filterDate) filteredBlocks = filteredBlocks.filter(b => b.block_date === filterDate);
    if (filterConsole) filteredBlocks = filteredBlocks.filter(b => b.console_id === filterConsole);

    if (blocksContainer) {
      if (filteredBlocks.length === 0) {
        blocksContainer.innerHTML = `<p class="text-sm text-muted-foreground">No blocked slots for this filter.</p>`;
      } else {
        blocksContainer.innerHTML = filteredBlocks.map(b => {
          const cObj = CONSOLES.find(c => c.id === b.console_id);
          const cName = cObj ? cObj.name : b.console_id;
          const start = b.start_hour;
          const end = start + b.hours;
          
          return `
            <div class="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <span>
                <strong class="text-foreground">${cName}</strong>
                <span class="text-muted-foreground">${b.block_date} · ${formatTime(start)} – ${formatTime(end)} ${b.reason ? '· ' + b.reason : ''}</span>
              </span>
              <button onclick="removeBlock('${b.id}')" class="rounded p-1 text-xs hover:bg-accent text-red-400">Remove</button>
            </div>
          `;
        }).join('');
      }
    }
  }

  window.cancelBooking = function(id) {
    let bookings = JSON.parse(localStorage.getItem('gamifyx_bookings') || '[]');
    bookings = bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b);
    localStorage.setItem('gamifyx_bookings', JSON.stringify(bookings));
    renderAdmin();
  };

  window.removeBlock = function(id) {
    let blocks = JSON.parse(localStorage.getItem('gamifyx_blocks') || '[]');
    blocks = blocks.filter(b => b.id !== id);
    localStorage.setItem('gamifyx_blocks', JSON.stringify(blocks));
    renderAdmin();
  };

  renderAdmin();
}
