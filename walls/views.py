from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required(login_url='/login/')
def index(request):
    '''Renders the home page.'''
    
    return render(request, 'walls/index.html')

@login_required(login_url='/login/')
def wall(request, pk):
    '''Renders a user's wall, selected by primary key.'''
    
    w = get_object_or_404(Wall, pk=pk)
    return render(request, 'walls/wall.html', { 'wall': w, 'username': request.user.username })