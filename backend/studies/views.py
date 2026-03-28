from django.shortcuts import HttpResponse

from studies.models import StudiesEdition


# Create your views here.
def studies_editions(request):
    editions = StudiesEdition.objects.all()
    return HttpResponse(editions)