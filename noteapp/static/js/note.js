let currentNoteId;

document.addEventListener('DOMContentLoaded', function() {
    noteModal = new bootstrap.Modal(document.getElementById('noteModal'));
});

function editNote(id, title, content, categoryId, categoryColor) {
    document.getElementById('noteModalLabel').textContent = 'Edit Note';
    document.getElementById('noteId').value = id;
    document.getElementById('noteTitle').value = title;
    document.getElementById('noteContent').value = content;
    document.getElementById('deleteNoteBtn').classList.remove('d-none');
    currentNoteId = id;

    const select = document.getElementById('noteCategory');
    select.value = categoryId || '';

    const selectedOption = select.querySelector(`option[value="${categoryId}"]`);
    if (selectedOption && selectedOption.dataset.color) {
        select.style.backgroundColor = selectedOption.dataset.color;
    } else {
        select.style.backgroundColor = "";
    }

    checkNewCategory(select);

    noteModal.show();
}

function deleteNote(id) {
    var deleteNoteUrl = "{% url 'delete_note' %}";
    if (confirm('Are you sure you want to delete this note?')) {
        window.location.href = deleteNoteUrl + "?note_id=" + id;
    }
}

function confirmDeleteNote() {
    if (confirm('Are you sure you want to delete this note?')) {
        window.location.href = "{% url 'delete_note' %}?note_id=" + currentNoteId;
    }
}

var noteModal = document.getElementById('noteModal');
noteModal.addEventListener('hidden.bs.modal', function () {
    var form = document.getElementById('noteForm');
    form.reset();
    const categorySelect = document.getElementById('noteCategory');
    categorySelect.value = "";
    categorySelect.style.backgroundColor = "";
    const newCategoryFields = document.getElementById('newCategoryFields');
    newCategoryFields.classList.add('d-none');
});

var cancelButton = document.querySelector('[data-bs-dismiss="modal"]');
cancelButton.addEventListener('click', function () {
    var form = document.getElementById('noteForm');
    form.reset();
    const categorySelect = document.getElementById('noteCategory');
    categorySelect.value = "";
    categorySelect.style.backgroundColor = "";
    const newCategoryFields = document.getElementById('newCategoryFields');
    newCategoryFields.classList.add('d-none');
});

function checkNewCategory(select) {
    const newCategoryFields = document.getElementById('newCategoryFields');
    if (select.value === 'new') {
        newCategoryFields.classList.remove('d-none');
    } else {
        newCategoryFields.classList.add('d-none');
    }
}
