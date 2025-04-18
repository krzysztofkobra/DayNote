let eventModal;
let alertModal;

function syncTimes() {
    document.getElementById('eventStartTime').value = document.getElementById('visibleStartTime').value;
    document.getElementById('eventEndTime').value = document.getElementById('visibleEndTime').value;
}

document.addEventListener('DOMContentLoaded', function() {
    flatpickr("#visibleStartTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true
    });

    flatpickr("#visibleEndTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true
    });

    eventModal = new bootstrap.Modal(document.getElementById('eventModal'));

    const alertModalHTML = `
        <div class="modal fade" id="alertModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Time Error</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p id="alertMessage"></p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertModalHTML);
    alertModal = new bootstrap.Modal(document.getElementById('alertModal'));

    document.getElementById('eventForm').addEventListener('submit', function(e) {
        const startTime = document.getElementById('visibleStartTime').value;
        const endTime = document.getElementById('visibleEndTime').value;

        if (startTime && endTime) {
            const startParts = startTime.split(':');
            const endParts = endTime.split(':');

            const startDate = new Date();
            startDate.setHours(parseInt(startParts[0]), parseInt(startParts[1]));

            const endDate = new Date();
            endDate.setHours(parseInt(endParts[0]), parseInt(endParts[1]));

            if (startDate >= endDate) {
                e.preventDefault();
                document.getElementById('alertMessage').textContent = "The start time cannot be later than or equal to the end time!";
                alertModal.show();
                return false;
            }
        }

        syncTimes();
    });
});

function navigateMonth(direction) {
    const yearInput = document.getElementById('yearInput');
    const monthInput = document.getElementById('monthInput');

    let year = parseInt(yearInput.value);
    let month = parseInt(monthInput.value);

    month += direction;

    if (month < 1) {
        month = 12;
        year -= 1;
    } else if (month > 12) {
        month = 1;
        year += 1;
    }

    yearInput.value = year;
    monthInput.value = month;

    document.getElementById('calendarForm').submit();
}

function goToToday() {
    const today = new Date();
    document.getElementById('yearInput').value = today.getFullYear();
    document.getElementById('monthInput').value = today.getMonth() + 1;
    document.getElementById('calendarForm').submit();
}

function openEventModal(date) {
    document.getElementById('eventModalLabel').textContent = 'Add Event';
    document.getElementById('eventId').value = '';
    document.getElementById('eventDate').value = date;
    document.getElementById('eventStartTime').value = '';
    document.getElementById('eventEndTime').value = '';
    document.getElementById('visibleStartTime').value = '';
    document.getElementById('visibleEndTime').value = '';
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventColor').value = 'event-blue';
    document.getElementById('deleteEventBtn').classList.add('d-none');

    eventModal.show();
}

function editEvent(e, id, title, date, color, startTime, endTime) {
    e.stopPropagation();

    document.getElementById('eventModalLabel').textContent = 'Edit Event';
    document.getElementById('eventId').value = id;
    document.getElementById('eventDate').value = date;
    document.getElementById('eventStartTime').value = startTime || '';
    document.getElementById('eventEndTime').value = endTime || '';
    document.getElementById('visibleStartTime').value = startTime || '';
    document.getElementById('visibleEndTime').value = endTime || '';
    document.getElementById('eventTitle').value = title;
    document.getElementById('eventColor').value = color;
    document.getElementById('deleteEventBtn').classList.remove('d-none');

    eventModal.show();
}

function deleteEvent() {
    const eventId = document.getElementById('eventId').value;

    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you really want to delete this event?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        showClass: {
            popup: ''
        },
        hideClass: {
            popup: ''
        }
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = deleteEventUrl + "?event_id=" + eventId;
        }
    });
}