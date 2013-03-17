from django.conf.urls import patterns, url
#from import import views


urlpatterns = patterns('my_import.views',
	url(r'^$', 'view_notes', name='view_notes'),
    url(r'^auth/$', 'auth', name='evernote_auth'),
    url(r'^callback/$', 'callback', name='evernote_callback'),
    url(r'^reset/$', 'reset', name='evernote_auth_reset'),
)
