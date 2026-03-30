from http import HTTPStatus

from django.http import JsonResponse
from django.shortcuts import HttpResponse, get_object_or_404
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response

from studies.models import StudiesEdition, Studies
from studies.serializers import StudiesSerializer, StudiesEditionDetailsSerializer, StudiesEditionCreateSerializer, \
    StudiesEditionListSerializer


class StudiesListCreateAPIView(generics.ListCreateAPIView):
    queryset = Studies.objects.all()
    serializer_class = StudiesSerializer


class StudiesRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Studies.objects.all()
    serializer_class = StudiesSerializer


class StudiesEditionListCreateAPIView(generics.ListCreateAPIView):
    queryset = StudiesEdition.objects.select_related('studies')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudiesEditionCreateSerializer
        return StudiesEditionListSerializer


class StudiesEditionRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateAPIView):
    queryset = StudiesEdition.objects.select_related('studies')
    serializer_class = StudiesEditionDetailsSerializer