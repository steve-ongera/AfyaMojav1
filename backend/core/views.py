from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Patient, Medicine, Visit, Triage, PatientMedicalRecord, SHARecord
from .serializers import (
    LoginSerializer, UserSerializer, UserCreateSerializer,
    PatientListSerializer, PatientDetailSerializer,
    MedicineSerializer, MedicineStockUpdateSerializer,
    VisitListSerializer, VisitDetailSerializer, VisitCreateSerializer,
    TriageSerializer,
    PatientMedicalRecordSerializer,
    SHARecordSerializer, SHARecordStatusUpdateSerializer,
    DashboardStatsSerializer,
)


# ─────────────────────────────────────────────
#  PERMISSION HELPERS
# ─────────────────────────────────────────────

class IsRole(permissions.BasePermission):
    """Usage: IsRole(['doctor', 'nurse'])"""
    def __init__(self, roles):
        self.roles = roles

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.role in self.roles or request.user.role == 'admin')
        )


def role_permission(*roles):
    """Returns a permission class restricted to given roles + admin."""
    class RolePermission(permissions.BasePermission):
        allowed_roles = roles

        def has_permission(self, request, view):
            return (
                request.user and
                request.user.is_authenticated and
                (request.user.role in self.allowed_roles or request.user.role == 'admin')
            )
    return RolePermission


# ─────────────────────────────────────────────
#  AUTH VIEWS
# ─────────────────────────────────────────────

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# ─────────────────────────────────────────────
#  USER MANAGEMENT VIEWS (admin only)
# ─────────────────────────────────────────────

class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by('role', 'first_name')

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


# ─────────────────────────────────────────────
#  PATIENT VIEWS
# ─────────────────────────────────────────────

class PatientListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Patient.objects.all()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)  |
                Q(national_id__icontains=search)|
                Q(phone__icontains=search)      |
                Q(sha_number__icontains=search)
            )
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PatientDetailSerializer
        return PatientListSerializer


class PatientDetailView(generics.RetrieveUpdateAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


# ─────────────────────────────────────────────
#  MEDICINE VIEWS
# ─────────────────────────────────────────────

class MedicineListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicineSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [role_permission('pharmacist')()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Medicine.objects.filter(is_active=True)
        search = self.request.query_params.get('search')
        low_stock = self.request.query_params.get('low_stock')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(generic_name__icontains=search)
            )
        if low_stock == 'true':
            qs = [m for m in qs if m.is_low_stock]
        return qs


class MedicineDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Medicine.objects.all()
    permission_classes = [role_permission('pharmacist', 'doctor', 'nurse')]

    def get_serializer_class(self):
        if self.request.method in ['PATCH', 'PUT'] and \
           self.request.query_params.get('stock_only') == 'true':
            return MedicineStockUpdateSerializer
        return MedicineSerializer


# ─────────────────────────────────────────────
#  VISIT VIEWS
# ─────────────────────────────────────────────

class VisitListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Visit.objects.select_related('patient', 'attending_doctor').all()
        patient_id = self.request.query_params.get('patient')
        status_filter = self.request.query_params.get('status')
        today = self.request.query_params.get('today')
        role = getattr(self.request.user, 'role', None)

        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if today == 'true':
            qs = qs.filter(visit_date__date=timezone.now().date())

        # Doctors see only their assigned visits
        if role == 'doctor':
            qs = qs.filter(attending_doctor=self.request.user)

        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return VisitCreateSerializer
        return VisitListSerializer


class VisitDetailView(generics.RetrieveUpdateAPIView):
    queryset = Visit.objects.select_related(
        'patient', 'attending_doctor', 'registered_by'
    ).all()
    serializer_class = VisitDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class VisitStatusUpdateView(APIView):
    """PATCH /visits/{id}/status/ — update only the status field."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            visit = Visit.objects.get(pk=pk)
        except Visit.DoesNotExist:
            return Response({"detail": "Visit not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        valid_statuses = [s[0] for s in Visit.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"detail": f"Invalid status. Choose from: {valid_statuses}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        visit.status = new_status
        visit.save()
        return Response(VisitDetailSerializer(visit).data)


# ─────────────────────────────────────────────
#  TRIAGE VIEWS
# ─────────────────────────────────────────────

class TriageListCreateView(generics.ListCreateAPIView):
    serializer_class = TriageSerializer
    permission_classes = [role_permission('nurse', 'doctor')]

    def get_queryset(self):
        qs = Triage.objects.select_related('visit', 'visit__patient', 'nurse').all()
        visit_id = self.request.query_params.get('visit')
        if visit_id:
            qs = qs.filter(visit_id=visit_id)
        return qs

    def perform_create(self, serializer):
        triage = serializer.save()
        # Auto-advance visit status to waiting_for_doctor
        visit = triage.visit
        if visit.status == 'triage':
            visit.status = 'waiting'
            visit.save()


class TriageDetailView(generics.RetrieveUpdateAPIView):
    queryset = Triage.objects.all()
    serializer_class = TriageSerializer
    permission_classes = [role_permission('nurse', 'doctor')]


# ─────────────────────────────────────────────
#  MEDICAL RECORD VIEWS
# ─────────────────────────────────────────────

class PatientMedicalRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = PatientMedicalRecordSerializer
    permission_classes = [role_permission('doctor', 'nurse')]

    def get_queryset(self):
        qs = PatientMedicalRecord.objects.select_related(
            'visit', 'visit__patient', 'doctor'
        ).all()
        visit_id = self.request.query_params.get('visit')
        patient_id = self.request.query_params.get('patient')
        if visit_id:
            qs = qs.filter(visit_id=visit_id)
        if patient_id:
            qs = qs.filter(visit__patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        record = serializer.save()
        visit = record.visit
        # Auto-advance visit status
        if record.referred_to_pharmacy:
            visit.status = 'pharmacy'
        elif record.referred_to_radiology:
            visit.status = 'radiology'
        else:
            visit.status = 'billing'
        visit.save()


class PatientMedicalRecordDetailView(generics.RetrieveUpdateAPIView):
    queryset = PatientMedicalRecord.objects.all()
    serializer_class = PatientMedicalRecordSerializer
    permission_classes = [role_permission('doctor', 'nurse')]


# ─────────────────────────────────────────────
#  SHA / INSURANCE RECORD VIEWS
# ─────────────────────────────────────────────

class SHARecordListCreateView(generics.ListCreateAPIView):
    serializer_class = SHARecordSerializer
    permission_classes = [role_permission('cashier', 'receptionist')]

    def get_queryset(self):
        qs = SHARecord.objects.select_related(
            'visit', 'patient', 'submitted_by'
        ).all()
        claim_status = self.request.query_params.get('claim_status')
        provider = self.request.query_params.get('provider')
        patient_id = self.request.query_params.get('patient')
        if claim_status:
            qs = qs.filter(claim_status=claim_status)
        if provider:
            qs = qs.filter(insurance_provider=provider)
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs


class SHARecordDetailView(generics.RetrieveUpdateAPIView):
    queryset = SHARecord.objects.all()
    permission_classes = [role_permission('cashier')]

    def get_serializer_class(self):
        if self.request.method in ['PATCH', 'PUT']:
            return SHARecordStatusUpdateSerializer
        return SHARecordSerializer


# ─────────────────────────────────────────────
#  DASHBOARD STATS VIEW
# ─────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()

        visits_by_type = dict(
            Visit.objects.values_list('visit_type')
                         .annotate(count=Count('id'))
                         .values_list('visit_type', 'count')
        )
        visits_by_status = dict(
            Visit.objects.filter(visit_date__date=today)
                         .values_list('status')
                         .annotate(count=Count('id'))
                         .values_list('status', 'count')
        )
        claims_by_provider = dict(
            SHARecord.objects.values_list('insurance_provider')
                             .annotate(count=Count('id'))
                             .values_list('insurance_provider', 'count')
        )

        data = {
            'total_patients':      Patient.objects.count(),
            'total_visits_today':  Visit.objects.filter(visit_date__date=today).count(),
            'active_visits':       Visit.objects.exclude(
                                       status__in=['completed', 'cancelled']
                                   ).count(),
            'pending_claims':      SHARecord.objects.filter(claim_status='pending').count(),
            'low_stock_medicines': sum(1 for m in Medicine.objects.filter(is_active=True) if m.is_low_stock),
            'visits_by_type':      visits_by_type,
            'visits_by_status':    visits_by_status,
            'claims_by_provider':  claims_by_provider,
        }

        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)