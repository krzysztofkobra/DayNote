let currentNoteId;

document.addEventListener('DOMContentLoaded', function() {
    noteModal = new bootstrap.Modal(document.getElementById('noteModal'));
    const categorySelect = document.getElementById('noteCategory');

    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            displayCategoryColor(this);
        });
    }

    const newCategoryColor = document.getElementById('newCategoryColor');
    if (newCategoryColor) {
        newCategoryColor.addEventListener('change', function() {
            updateNewCategoryPreview(this);
        });
    }
});

function displayCategoryColor(select) {
    const colorBox = document.getElementById('categoryColorBox');
    const newCategoryFields = document.getElementById('newCategoryFields');

    if (select.value === 'new') {
        colorBox.style.backgroundColor = '';
        colorBox.style.display = 'none';
        newCategoryFields.classList.remove('d-none');
    } else if (select.value !== '') {
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption && selectedOption.dataset.color) {
            colorBox.style.backgroundColor = selectedOption.dataset.color;
            colorBox.style.display = 'inline-block';
        }
        newCategoryFields.classList.add('d-none');
    } else {
        colorBox.style.backgroundColor = '';
        colorBox.style.display = 'none';
        newCategoryFields.classList.add('d-none');
    }
}

function updateNewCategoryPreview(colorInput) {
    const preview = document.getElementById('newCategoryPreview');
    preview.style.backgroundColor = colorInput.value;
}

function editNote(id, title, content, categoryId, categoryColor, categoryName) {
    document.getElementById('noteModalLabel').textContent = 'Edit Note';
    document.getElementById('noteId').value = id;
    document.getElementById('noteTitle').value = title;
    document.getElementById('noteContent').value = content;
    document.getElementById('deleteNoteBtn').classList.remove('d-none');
    currentNoteId = id;

    const select = document.getElementById('noteCategory');
    select.value = categoryId || '';

    const colorBox = document.getElementById('categoryColorBox');
    if (categoryId && categoryColor) {
        colorBox.style.backgroundColor = categoryColor;
        colorBox.style.display = 'inline-block';
    } else {
        colorBox.style.backgroundColor = '';
        colorBox.style.display = 'none';
    }

    if (select.value === 'new') {
        document.getElementById('newCategoryFields').classList.remove('d-none');
    } else {
        document.getElementById('newCategoryFields').classList.add('d-none');
    }

    noteModal.show();
}

function deleteNote(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you really want to delete this note?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        showClass: { popup: '' },
        hideClass: { popup: '' }
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = deleteNoteUrl + "?note_id=" + id;
        }
    });
}

function confirmDeleteNote() {
    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you really want to delete this note?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        showClass: { popup: '' },
        hideClass: { popup: '' }
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = deleteNoteUrl + "?note_id=" + currentNoteId;
        }
    });
}

function deleteCategory(categoryId) {
    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to delete this category? All notes in this category will be moved to Uncategorized.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        showClass: { popup: '' },
        hideClass: { popup: '' }
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = deleteCategoryUrl + "?category_id=" + categoryId;
        }
    });
}

function removeCategoryFromNote(noteId) {
    Swal.fire({
        title: 'Are you sure?',
        text: 'Remove category from this note?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, remove it!',
        cancelButtonText: 'Cancel',
        showClass: { popup: '' },
        hideClass: { popup: '' }
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = removeCategoryFromNoteUrl + "?note_id=" + noteId;
        }
    });
}

var noteModal = document.getElementById('noteModal');
noteModal.addEventListener('hidden.bs.modal', function () {
    var form = document.getElementById('noteForm');
    form.reset();
    document.getElementById('noteModalLabel').textContent = 'Add Note';
    document.getElementById('deleteNoteBtn').classList.add('d-none');
    document.getElementById('categoryColorBox').style.display = 'none';
    document.getElementById('newCategoryFields').classList.add('d-none');
    document.getElementById('newCategoryPreview').style.backgroundColor = '#ff0000';
});

var cancelButton = document.querySelector('[data-bs-dismiss="modal"]');
cancelButton.addEventListener('click', function () {
    var form = document.getElementById('noteForm');
    form.reset();
    document.getElementById('categoryColorBox').style.display = 'none';
    document.getElementById('newCategoryFields').classList.add('d-none');
});