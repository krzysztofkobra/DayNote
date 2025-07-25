import i18n from "i18next"
import { initReactI18next } from "react-i18next"

const resources = {
  en: {
    translation: {
      "Calendar": "Calendar",
      "Notes": "Notes",
      "Settings": "Settings",
      "My Notes": "My Notes",
      "Filter Options": "Filter Options",
      "Categories": "Categories",
      "Last Edit": "Last Edit",
      "A-Z": "A-Z",
      "Z-A": "Z-A",
      "By Category": "By Category",
      "Uncategorized": "Uncategorized",
      "Autocategorize All": "Autocategorize All",
      "Create Category": "Create Category",
      "Add Note": "Add Note",
      "Edit Note": "Edit Note",
      "Update Note": "Update Note",
      "Title": "Title",
      "Content": "Content",
      "Category": "Category",
      "None": "None",
      "+ New Category": "+ New Category",
      "Autocategorize": "Autocategorize",
      "You don't have any notes yet.": "You don't have any notes yet.",
      "No notes match your filters.": "No notes match your filters.",
      "Delete note?": "Delete note?",
      "This action cannot be undone": "This action cannot be undone",
      "Delete": "Delete",
      "Cancel": "Cancel",
      "Category name required!": "Category name required!",
      "Failed to fetch notes": "Failed to fetch notes",
      "Failed to save note": "Failed to save note",
      "Note updated 🎉": "Note updated 🎉",
      "Note created 🎉": "Note created 🎉",
      "Note deleted": "Note deleted",
      "Failed to delete note": "Failed to delete note",
      "Could not autocategorize": "Could not autocategorize",
      "All notes have been beautifully categorized! 🚀": "All notes have been beautifully categorized! 🚀",
      "Failed to autocategorize!": "Failed to autocategorize!",
      "Name": "Name",
      "Color": "Color",
      "Create": "Create",
      "Category created!": "Category created!",
      "Failed to create category": "Failed to create category",
      "Removed category from note": "Removed category from note",
      "Failed to remove category": "Failed to remove category",
      "Last updated:": "Last updated:"
    }
  },
  pl: {
    translation: {
      "Calendar": "Kalendarz",
      "Notes": "Notatki",
      "Settings": "Ustawienia",
      "My Notes": "Moje notatki",
      "Filter Options": "Opcje filtrowania",
      "Categories": "Kategorie",
      "Last Edit": "Ostatnia zmiana",
      "A-Z": "A–Z",
      "Z-A": "Z–A",
      "By Category": "Według kategorii",
      "Uncategorized": "Bez kategorii",
      "Autocategorize All": "Autokategoryzuj wszystkie",
      "Create Category": "Utwórz kategorię",
      "Add Note": "Dodaj notatkę",
      "Edit Note": "Edytuj notatkę",
      "Update Note": "Aktualizuj notatkę",
      "Title": "Tytuł",
      "Content": "Treść",
      "Category": "Kategoria",
      "None": "Brak",
      "+ New Category": "+ Nowa kategoria",
      "Autocategorize": "Autokategoryzuj",
      "You don't have any notes yet.": "Nie masz jeszcze notatek.",
      "No notes match your filters.": "Brak notatek spełniających filtry.",
      "Delete note?": "Usunąć notatkę?",
      "This action cannot be undone": "Nie da się cofnąć tej akcji",
      "Delete": "Usuń",
      "Cancel": "Anuluj",
      "Category name required!": "Wymagana nazwa kategorii!",
      "Failed to fetch notes": "Nie udało się pobrać notatek",
      "Failed to save note": "Nie udało się zapisać notatki",
      "Note updated 🎉": "Notatka zaktualizowana 🎉",
      "Note created 🎉": "Notatka utworzona 🎉",
      "Note deleted": "Notatka usunięta",
      "Failed to delete note": "Nie udało się usunąć notatki",
      "Could not autocategorize": "Nie można automatycznie pogrupować",
      "All notes have been beautifully categorized! 🚀": "Wszystkie notatki pogrupowane! 🚀",
      "Failed to autocategorize!": "Automatyzacja nie powiodła się!",
      "Name": "Nazwa",
      "Color": "Kolor",
      "Create": "Utwórz",
      "Category created!": "Kategoria utworzona!",
      "Failed to create category": "Nie udało się utworzyć kategorii",
      "Removed category from note": "Usunięto kategorię z notatki",
      "Failed to remove category": "Nie udało się usunąć kategorii",
      "Last updated:": "Ostatnia aktualizacja:"
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("language") || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
})

export default i18n