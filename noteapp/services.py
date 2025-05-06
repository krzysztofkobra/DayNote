import os
import json
import openai
from django.conf import settings
from django.core.cache import cache
from dotenv import load_dotenv
from typing import Dict, List
from .models import NoteCategory, Note

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

class NoteCategorizer:
    def __init__(self):
        api_key = settings.OPENAI_API_KEY
        self.client = openai.OpenAI(api_key=api_key)
        self.available_categories = list(NoteCategory.objects.values_list('name', flat=True)) or []

    def categorize_note(self, note_content: str, max_tokens: int = 100) -> Dict:
        cache_key = f"note_category_{hash(note_content)}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        categories_str = ", ".join(self.available_categories)
        prompt = f"""
        Given the following note content, choose exactly one category from [{categories_str}].
        Return a JSON object:
        {{"category": "CATEGORY_NAME"}}

        Note content:
        "{note_content}"
        """
        response = self.client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=[
                {"role": "system", "content": "You classify notes into predefined categories."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.1
        )
        content = response.choices[0].message.content.strip()
        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            result = {"category": "Uncategorized"}
        if result.get("category") not in self.available_categories:
            result = {"category": "Uncategorized"}
        cache.set(cache_key, result, 86400)
        return result

    def batch_categorize(self, notes: List[Dict]) -> List[Dict]:
        out = []
        for note in notes:
            if not note.get('content'):
                note['category'] = 'Uncategorized'
            else:
                res = self.categorize_note(note['content'])
                note['category'] = res['category']
            out.append(note)
        return out

def categorize_note_content(content: str) -> Dict:
    return NoteCategorizer().categorize_note(content)

def recategorize_all_notes():
    categorizer = NoteCategorizer()
    for note in Note.objects.all():
        res = categorizer.categorize_note(note.content)
        try:
            cat = NoteCategory.objects.get(name=res['category'])
            note.category = cat
            note.save(update_fields=['category'])
        except NoteCategory.DoesNotExist:
            continue