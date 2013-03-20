from django.http import HttpResponse, HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from walls.models import Wall, TagOrder


def gallery(request):

    return render(request, 'main.html')


def index(request):
    '''Renders the home page.'''
    
    if not request.user.is_authenticated():
        return HttpResponseRedirect('/login/')

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


def sortTags(request):
    '''Accepts or returns an array specifying the wall's order of waypoint tags.'''

    if request.method == 'POST':
        wall_id = request.POST['wall_id']
        wall = get_object_or_404(Wall, pk=wall_id)
        order = TagOrder.objects.get_or_create(wall=wall)[0]
        order.text = request.POST['order']
        order.save()

    elif request.method == 'GET':
        wall_id = request.GET['wall_id']
        wall = get_object_or_404(Wall, pk=wall_id)
        order = TagOrder.objects.get_or_create(wall=wall)[0]

    return HttpResponse(order.text)




