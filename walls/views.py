from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from walls.models import Wall


@login_required(login_url='/login/')
def index(request):
    '''Renders the home page.'''
    
    return render(request, 'walls/index.html')

@login_required(login_url='/login/')
def wall(request, pk):
    '''Renders a user's wall, selected by primary key.'''
    
    w = get_object_or_404(Wall, pk=pk)
    if(w.user == request.user):
        return render(request, 'walls/wall.html', { 'wall': w, 'username': request.user.username })
    else:
        return HttpResponseRedirect(reverse('walls.views.index'))

def newWall(request):
    '''Creates a new wall, given a title.'''
    
    user = request.user
    title = request.POST['wall']
    new = Wall(user=user, title=title)
    new.save()
    return HttpResponseRedirect(reverse('walls.views.wall', args=(new.pk,)))