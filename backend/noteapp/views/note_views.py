from django.shortcuts import redirect, get_object_or_404
from django.urls import reverse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..models import Note, NoteCategory
from ..services import NoteCategorizer
from ..serializers import NoteSerializer, NoteCategorySerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notes_view(request):
    notes = Note.objects.filter(user=request.user).order_by('-updated_at')
    categories = NoteCategory.objects.filter(user=request.user)

    notes_serializer = NoteSerializer(notes, many=True)
    categories_serializer = NoteCategorySerializer(categories, many=True)

    return Response({
        'notes': notes_serializer.data,
        'categories': categories_serializer.data,
    })


@api_view(['POST', 'PUT'])
@permission_classes([IsAuthenticated])
def add_or_update_note(request, note_id=None):
    title = request.data.get('title')
    content = request.data.get('content')
    category_id = request.data.get('category')
    new_category_name = request.data.get('new_category_name')
    new_category_color = request.data.get('new_category_color')

    if category_id == 'new' and new_category_name:
        category = NoteCategory.objects.create(name=new_category_name, color=new_category_color, user=request.user)
    elif category_id == 'autocategorize':
        categorizer = NoteCategorizer(request.user)
        result = categorizer.categorize_note(content)
        cat_name = result.get('category', 'Uncategorized')
        category, _ = NoteCategory.objects.get_or_create(name=cat_name, user=request.user, defaults={'color': '#cccccc'})
    elif category_id:
        category = NoteCategory.objects.get(id=category_id, user=request.user)
    else:
        category = None

    if note_id:
        note = get_object_or_404(Note, id=note_id, user=request.user)
        note.title = title
        note.content = content
        note.category = category
        note.save()
    else:
        Note.objects.create(title=title, content=content, category=category, user=request.user)

    return Response({'status': 'ok'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_note(request, note_id):
    try:
        Note.objects.get(id=note_id, user=request.user).delete()
    except Note.DoesNotExist:
        pass
    return Response({'status': 'ok'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_category(request):
    name = request.data.get('name')
    color = request.data.get('color')
    if name and color:
        NoteCategory.objects.create(name=name, color=color, user=request.user)
        return Response({'status': 'ok'})
    return Response({'status': 'error', 'message': 'Missing name or color'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_category(request, category_id):
    try:
        category = NoteCategory.objects.get(id=category_id, user=request.user)
        Note.objects.filter(category=category, user=request.user).update(category=None)
        category.delete()
        return Response({'status': 'ok'})
    except NoteCategory.DoesNotExist:
        return Response({'status': 'error', 'message': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_category_from_note(request, note_id):
    try:
        note = Note.objects.get(id=note_id, user=request.user)
        note.category = None
        note.save()
        return Response({'status': 'ok'})
    except Note.DoesNotExist:
        return Response({'status': 'error', 'message': 'Note not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def autocategorize_all_notes(request):
    categorizer = NoteCategorizer(request.user)
    notes = Note.objects.filter(user=request.user)
    for note in notes:
        if note.category is None:
            categorizer.batch_categorize([note])
            if note.category:
                note.save(update_fields=["category"])
    return Response({'status': 'ok'})
