from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    # Auth
    LoginView, LogoutView, MeView,
    # Users
    UserListCreateView, UserDetailView,
    # Patients
    PatientListCreateView, PatientDetailView,
    # Medicines
    MedicineListCreateView, MedicineDetailView,
    # Visits
    VisitListCreateView, VisitDetailView, VisitStatusUpdateView,
    # Triage
    TriageListCreateView, TriageDetailView,
    # Medical Records
    PatientMedicalRecordListCreateView, PatientMedicalRecordDetailView,
    # SHA / Insurance
    SHARecordListCreateView, SHARecordDetailView,
    # Dashboard
    DashboardStatsView,
)

urlpatterns = [

    # ── Auth ─────────────────────────────────────────
    path('auth/login/',           LoginView.as_view(),        name='login'),
    path('auth/logout/',          LogoutView.as_view(),       name='logout'),
    path('auth/refresh/',         TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/',              MeView.as_view(),           name='me'),

    # ── Users ────────────────────────────────────────
    path('users/',                UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/',       UserDetailView.as_view(),     name='user-detail'),

    # ── Patients ─────────────────────────────────────
    path('patients/',             PatientListCreateView.as_view(), name='patient-list-create'),
    path('patients/<int:pk>/',    PatientDetailView.as_view(),     name='patient-detail'),

    # ── Medicines ────────────────────────────────────
    path('medicines/',            MedicineListCreateView.as_view(), name='medicine-list-create'),
    path('medicines/<int:pk>/',   MedicineDetailView.as_view(),     name='medicine-detail'),

    # ── Visits ───────────────────────────────────────
    path('visits/',               VisitListCreateView.as_view(),   name='visit-list-create'),
    path('visits/<int:pk>/',      VisitDetailView.as_view(),       name='visit-detail'),
    path('visits/<int:pk>/status/', VisitStatusUpdateView.as_view(), name='visit-status-update'),

    # ── Triage ───────────────────────────────────────
    path('triage/',               TriageListCreateView.as_view(),  name='triage-list-create'),
    path('triage/<int:pk>/',      TriageDetailView.as_view(),      name='triage-detail'),

    # ── Medical Records ──────────────────────────────
    path('records/',              PatientMedicalRecordListCreateView.as_view(), name='record-list-create'),
    path('records/<int:pk>/',     PatientMedicalRecordDetailView.as_view(),     name='record-detail'),

    # ── SHA / Insurance ──────────────────────────────
    path('sha-records/',          SHARecordListCreateView.as_view(), name='sha-list-create'),
    path('sha-records/<int:pk>/', SHARecordDetailView.as_view(),     name='sha-detail'),

    # ── Dashboard ────────────────────────────────────
    path('dashboard/stats/',      DashboardStatsView.as_view(),     name='dashboard-stats'),
]