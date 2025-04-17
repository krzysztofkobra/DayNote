let currentNoteId;

document.addEventListener('DOMContentLoaded', function() {
    noteModal = new bootstrap.Modal(document.getElementById('noteModal'));
    const categorySelect = document.getElementById('noteCategory');

    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.dataset.color && this.value !== 'new') {
                this.style.backgroundColor = selectedOption.dataset.color;
            } else {
                this.style.backgroundColor = "";
            }
            checkNewCategory(this);
        });
    }
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

    if (categoryId && categoryColor) {
        select.style.backgroundColor = categoryColor;
    } else {
        select.style.backgroundColor = "";
    }

    const clearBtn = document.getElementById('clearCategoryBtn');
    clearBtn.style.display = categoryId ? 'block' : 'none';

    checkNewCategory(select);
    noteModal.show();
}

function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        window.location.href = deleteNoteUrl + "?note_id=" + id;
    }
}

function confirmDeleteNote() {
    if (confirm('Are you sure you want to delete this note?')) {
        window.location.href = deleteNoteUrl + "?note_id=" + currentNoteId;
    }
}

function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category? All notes in this category will be moved to Uncategorized.')) {
        window.location.href = deleteCategoryUrl + "?category_id=" + categoryId;
    }
}

function clearCategory() {
    const select = document.getElementById('noteCategory');
    select.value = "";
    select.style.backgroundColor = "";
}

function removeCategoryFromNote(noteId) {
    if (confirm('Remove category from this note?')) {
        window.location.href = removeCategoryFromNoteUrl + "?note_id=" + noteId;
    }
}

function checkNewCategory(select) {
    const newCategoryFields = document.getElementById('newCategoryFields');
    const clearBtn = document.getElementById('clearCategoryBtn');

    if (select.value === 'new') {
        newCategoryFields.classList.remove('d-none');
        clearBtn.style.display = 'none';
    } else {
        newCategoryFields.classList.add('d-none');
        clearBtn.style.display = select.value ? 'block' : 'none';
    }

    if (select.value && select.value !== 'new') {
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption && selectedOption.dataset.color) {
            select.style.backgroundColor = selectedOption.dataset.color;
        }
    } else {
        select.style.backgroundColor = "";
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
    document.getElementById('clearCategoryBtn').style.display = 'none';
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
    document.getElementById('clearCategoryBtn').style.display = 'none';
});
