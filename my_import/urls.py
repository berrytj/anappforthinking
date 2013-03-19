from django.conf.urls import patterns, url
#from import import views


urlpatterns = patterns('my_import.views',
    url(r'^evernote/auth/$', 'auth', name='evernote_auth'),
    url(r'^callback/$', 'callback', name='evernote_callback'),
    url(r'^reset/$', 'reset', name='evernote_auth_reset'),
)
