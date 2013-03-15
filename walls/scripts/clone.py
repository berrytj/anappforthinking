
from walls.models import Wall, Mark, Waypoint

hiswall = Wall.objects.filter(pk=2)
hismarks = Mark.objects.filter(wall=hiswall)
hiswaypoints = Waypoint.objects.filter(wall=hiswall)
mywall = Wall.objects.filter(pk=27)

for mark in hismarks:
	new = Mark(wall=mywall, text=mark.text, x=mark.x, y=mark.y)
	new.save()

for wp in hiswaypoints:
	new = Waypoint(wall=mywall, text=wp.text, x=wp.x, y=wp.y)
	new.save()