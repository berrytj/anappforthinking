from evernote.api.client import EvernoteClient
import evernote.edam.userstore.UserStore as UserStore
import evernote.edam.notestore.NoteStore as NoteStore

from django.core.urlresolvers import reverse
from django.shortcuts import render_to_response
from django.shortcuts import redirect

EN_CONSUMER_KEY = 'tberry860'
EN_CONSUMER_SECRET = 'd119b2eb6fdff221'


def get_evernote_client(token=None):
	if token:
		return EvernoteClient(token=token, sandbox=True)
	else:
		return EvernoteClient(
			consumer_key=EN_CONSUMER_KEY,
			consumer_secret=EN_CONSUMER_SECRET,
			sandbox=True
		)


def index(request):
	return render_to_response('oauth/index.html')


def view_notes(request):

	# import walls-models, save new walls, marks, and waypoints, redirect to index or wall if one notebook

	token = 'S=s1:U=55856:E=144cd4a4ec1:C=13d759922c2:P=185:A=tberry860:V=2:H=28b25404f2c504409b69e0a39b7b3359'
	client = get_evernote_client(token)
	note_store = client.get_note_store()
	notebooks = note_store.listNotebooks()
	filter = NoteStore.NoteFilter()
	note_list = note_store.findNotes(filter, 0, 10).notes
	notes = []

	for obj in note_list:
		notes.append(note_store.getNote(obj.guid, True, True, True, True))

	return render_to_response('view_notes.html', { 'notebooks': notebooks, 'notes': notes })


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

	#saveToken(token)
	return redirect('/')


def reset(request):
	return redirect('/')
