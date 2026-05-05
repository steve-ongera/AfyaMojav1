from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Patient, Medicine, Visit, Triage, PatientMedicalRecord, SHARecord


# ─────────────────────────────────────────────
#  AUTH SERIALIZERS
# ─────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid credentials. Please try again.")
        if not user.is_active:
            raise serializers.ValidationError("Your account has been deactivated.")
        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['full_name'] = user.get_full_name()
        return {
            'access':    str(refresh.access_token),
            'refresh':   str(refresh),
            'role':      user.role,
            'full_name': user.get_full_name(),
            'user_id':   user.id,
            'username':  user.username,
        }


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'full_name', 'role', 'phone', 'is_active']
        read_only_fields = ['id']

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserCreateSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label="Confirm Password")

    class Meta:
        model  = User
        fields = ['username', 'email', 'first_name', 'last_name',
                  'role', 'phone', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ─────────────────────────────────────────────
#  PATIENT SERIALIZERS
# ─────────────────────────────────────────────

class PatientListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    age = serializers.ReadOnlyField()

    class Meta:
        model  = Patient
        fields = ['id', 'first_name', 'last_name', 'age', 'gender',
                  'phone', 'national_id', 'sha_number',
                  'insurance_provider', 'created_at']


class PatientDetailSerializer(serializers.ModelSerializer):
    """Full serializer for create / retrieve / update."""
    age      = serializers.ReadOnlyField()
    full_name= serializers.ReadOnlyField()

    class Meta:
        model  = Patient
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_national_id(self, value):
        if value:
            qs = Patient.objects.filter(national_id=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("A patient with this National ID already exists.")
        return value


# ─────────────────────────────────────────────
#  MEDICINE SERIALIZERS
# ─────────────────────────────────────────────

class MedicineSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()

    class Meta:
        model  = Medicine
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class MedicineStockUpdateSerializer(serializers.ModelSerializer):
    """Used by pharmacist to update stock only."""
    class Meta:
        model  = Medicine
        fields = ['id', 'stock_quantity']


# ─────────────────────────────────────────────
#  VISIT SERIALIZERS
# ─────────────────────────────────────────────

class VisitListSerializer(serializers.ModelSerializer):
    patient_name    = serializers.SerializerMethodField()
    doctor_name     = serializers.SerializerMethodField()

    class Meta:
        model  = Visit
        fields = ['id', 'patient', 'patient_name', 'visit_type',
                  'status', 'attending_doctor', 'doctor_name', 'visit_date']

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_doctor_name(self, obj):
        return obj.attending_doctor.get_full_name() if obj.attending_doctor else None


class VisitDetailSerializer(serializers.ModelSerializer):
    patient_name    = serializers.SerializerMethodField()
    doctor_name     = serializers.SerializerMethodField()
    registered_by_name = serializers.SerializerMethodField()
    has_triage      = serializers.SerializerMethodField()
    has_record      = serializers.SerializerMethodField()

    class Meta:
        model  = Visit
        fields = '__all__'
        read_only_fields = ['id', 'visit_date']

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_doctor_name(self, obj):
        return obj.attending_doctor.get_full_name() if obj.attending_doctor else None

    def get_registered_by_name(self, obj):
        return obj.registered_by.get_full_name() if obj.registered_by else None

    def get_has_triage(self, obj):
        return hasattr(obj, 'triage')

    def get_has_record(self, obj):
        return hasattr(obj, 'medical_record')


class VisitCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Visit
        fields = ['patient', 'visit_type', 'attending_doctor', 'registered_by', 'notes']


# ─────────────────────────────────────────────
#  TRIAGE SERIALIZERS
# ─────────────────────────────────────────────

class TriageSerializer(serializers.ModelSerializer):
    bmi            = serializers.ReadOnlyField()
    blood_pressure = serializers.ReadOnlyField()
    nurse_name     = serializers.SerializerMethodField()
    patient_name   = serializers.SerializerMethodField()

    class Meta:
        model  = Triage
        fields = '__all__'
        read_only_fields = ['id', 'triaged_at']

    def get_nurse_name(self, obj):
        return obj.nurse.get_full_name() if obj.nurse else None

    def get_patient_name(self, obj):
        return obj.visit.patient.full_name

    def validate_visit(self, value):
        if hasattr(value, 'triage') and not self.instance:
            raise serializers.ValidationError("Triage already exists for this visit.")
        return value


# ─────────────────────────────────────────────
#  PATIENT MEDICAL RECORD SERIALIZERS
# ─────────────────────────────────────────────

class PatientMedicalRecordSerializer(serializers.ModelSerializer):
    doctor_name  = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    visit_date   = serializers.SerializerMethodField()

    class Meta:
        model  = PatientMedicalRecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name() if obj.doctor else None

    def get_patient_name(self, obj):
        return obj.visit.patient.full_name

    def get_visit_date(self, obj):
        return obj.visit.visit_date

    def validate_visit(self, value):
        if hasattr(value, 'medical_record') and not self.instance:
            raise serializers.ValidationError("A medical record already exists for this visit.")
        return value


# ─────────────────────────────────────────────
#  SHA / INSURANCE RECORD SERIALIZERS
# ─────────────────────────────────────────────

class SHARecordSerializer(serializers.ModelSerializer):
    outstanding_balance  = serializers.ReadOnlyField()
    submitted_by_name    = serializers.SerializerMethodField()
    patient_name         = serializers.SerializerMethodField()
    insurance_provider_display = serializers.SerializerMethodField()
    claim_status_display       = serializers.SerializerMethodField()

    class Meta:
        model  = SHARecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_submitted_by_name(self, obj):
        return obj.submitted_by.get_full_name() if obj.submitted_by else None

    def get_patient_name(self, obj):
        return obj.patient.full_name

    def get_insurance_provider_display(self, obj):
        return obj.get_insurance_provider_display()

    def get_claim_status_display(self, obj):
        return obj.get_claim_status_display()

    def validate(self, data):
        if data.get('approved_amount', 0) > data.get('claimed_amount', 0):
            raise serializers.ValidationError(
                {"approved_amount": "Approved amount cannot exceed claimed amount."}
            )
        return data


class SHARecordStatusUpdateSerializer(serializers.ModelSerializer):
    """Cashier updates claim status only."""
    class Meta:
        model  = SHARecord
        fields = ['claim_status', 'approved_amount', 'patient_copay',
                  'claim_reference', 'rejection_reason']


# ─────────────────────────────────────────────
#  DASHBOARD STATS SERIALIZER (read-only)
# ─────────────────────────────────────────────

class DashboardStatsSerializer(serializers.Serializer):
    total_patients      = serializers.IntegerField()
    total_visits_today  = serializers.IntegerField()
    active_visits       = serializers.IntegerField()
    pending_claims      = serializers.IntegerField()
    low_stock_medicines = serializers.IntegerField()
    visits_by_type      = serializers.DictField()
    visits_by_status    = serializers.DictField()
    claims_by_provider  = serializers.DictField()