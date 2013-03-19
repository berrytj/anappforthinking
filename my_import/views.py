from evernote.api.client import EvernoteClient
from evernote.edam.userstore import UserStore
from evernote.edam.notestore import NoteStore

from django.core.urlresolvers import reverse
from django.shortcuts import render_to_response, redirect

from my_import.models import Token
from walls.models import Wall, Mark, Waypoint

from my_import.html2text import html2text


EN_CONSUMER_KEY = 'tberry860'
EN_CONSUMER_SECRET = 'd119b2eb6fdff221'

INIT_X = 250
INIT_Y = 260
X_SPACING = 600
Y_SPACING = 40
WP_OFFSET_X = 150
WP_OFFSET_Y = -115
MAX_NOTES = 10000


def get_evernote_client(token=None):
    if token:
        return EvernoteClient(token=token, sandbox=True)
    else:
        return EvernoteClient(
            consumer_key=EN_CONSUMER_KEY,
            consumer_secret=EN_CONSUMER_SECRET,
            sandbox=True
        )


def auth(request):
    client = get_evernote_client()
    callbackUrl = 'http://%s%s' % (
        request.get_host(), reverse('evernote_callback'))
    request_token = client.get_request_token(callbackUrl)

    # Save the request token information for later
    request.session['oauth_token'] = request_token['oauth_token']
    request.session['oauth_token_secret'] = request_token['oauth_token_secret']

    # Redirect the user to the Evernote authorization URL
    return redirect(client.get_authorize_url(request_token))


def callback(request):
    try:
        client = get_evernote_client()
        token = client.get_access_token(
            request.session['oauth_token'],
            request.session['oauth_token_secret'],
            request.GET.get('oauth_verifier', '')
        )
    except KeyError:
        return redirect('/')

    user = request.user

    new = Token(user=user, string=token, service='Evernote')
    new.save()

    client = get_evernote_client(token)
    note_store = client.get_note_store()
    notebooks = note_store.listNotebooks()

    for notebook in notebooks:
        wall = Wall(user=user, title=notebook.name, not_spaced=True)
        wall.save()
        filter = NoteStore.NoteFilter(notebookGuid=notebook.guid)
        notes = note_store.findNotes(filter, 0, MAX_NOTES).notes

        for i, note in enumerate(notes):
            x = INIT_X + (i * X_SPACING)
            wp = Waypoint(wall=wall, text=note.title, x=x+WP_OFFSET_X, y=INIT_Y+WP_OFFSET_Y)
            wp.save()
            html = note_store.getNote(note.guid, True, True, True, True).content.decode('utf-8')
            marks = html2text(html).split('\n')

            for j, mark in enumerate(marks):
                mark = mark.strip()
                if mark:
                    y = INIT_Y + j * Y_SPACING
                    mark = Mark(wall=wall, text=mark, x=x, y=y)
                    mark.save()

        if len(notebooks) == 1:
            return redirect('/' + str(wall.id))

    return redirect('/')


def index(request):
    return render_to_response('my_import/index.html')


def reset(request):
    return redirect('/')
