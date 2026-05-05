from django.db import models
from django.contrib.auth.models import AbstractUser


# ─────────────────────────────────────────────
#  CUSTOM USER (with role)
# ─────────────────────────────────────────────

class User(AbstractUser):
    ROLE_CHOICES = [
        ('doctor',        'Doctor'),
        ('nurse',         'Nurse'),
        ('receptionist',  'Receptionist'),
        ('radiologist',   'Radiologist'),
        ('pharmacist',    'Pharmacist'),
        ('cashier',       'Cashier'),
        ('admin',         'Admin'),
    ]
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default='receptionist')
    phone      = models.CharField(max_length=15, blank=True)
    is_active  = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


# ─────────────────────────────────────────────
#  1. PATIENT
# ─────────────────────────────────────────────

class Patient(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    BLOOD_GROUP_CHOICES = [
        ('A+','A+'),('A-','A-'),('B+','B+'),('B-','B-'),
        ('AB+','AB+'),('AB-','AB-'),('O+','O+'),('O-','O-'),('UNKNOWN','Unknown'),
    ]

    first_name        = models.CharField(max_length=100)
    last_name         = models.CharField(max_length=100)
    date_of_birth     = models.DateField()
    gender            = models.CharField(max_length=1, choices=GENDER_CHOICES)
    national_id       = models.CharField(max_length=20, unique=True, blank=True, null=True)
    phone             = models.CharField(max_length=15, blank=True)
    email             = models.EmailField(blank=True)
    address           = models.TextField(blank=True)
    blood_group       = models.CharField(max_length=10, choices=BLOOD_GROUP_CHOICES, default='UNKNOWN')
    sha_number        = models.CharField(max_length=30, blank=True, help_text="SHA / NHIF membership number")
    insurance_provider= models.CharField(max_length=50, blank=True, help_text="e.g. AIR, BRITAM, SHA, JUBILEE")
    insurance_number  = models.CharField(max_length=50, blank=True)
    next_of_kin_name  = models.CharField(max_length=100, blank=True)
    next_of_kin_phone = models.CharField(max_length=15, blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.national_id or 'No ID'})"

    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


# ─────────────────────────────────────────────
#  2. MEDICINE
# ─────────────────────────────────────────────

class Medicine(models.Model):
    DOSAGE_FORM_CHOICES = [
        ('tablet',      'Tablet'),
        ('capsule',     'Capsule'),
        ('syrup',       'Syrup'),
        ('injection',   'Injection'),
        ('cream',       'Cream'),
        ('drops',       'Drops'),
        ('inhaler',     'Inhaler'),
        ('suppository', 'Suppository'),
        ('patch',       'Patch'),
        ('other',       'Other'),
    ]

    name         = models.CharField(max_length=150)
    generic_name = models.CharField(max_length=150, blank=True)
    dosage_form  = models.CharField(max_length=20, choices=DOSAGE_FORM_CHOICES)
    strength     = models.CharField(max_length=50, help_text="e.g. 500mg, 250mg/5ml")
    stock_quantity = models.PositiveIntegerField(default=0)
    reorder_level  = models.PositiveIntegerField(default=10)
    unit_price   = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        unique_together = ['name', 'strength', 'dosage_form']

    def __str__(self):
        return f"{self.name} {self.strength} ({self.dosage_form})"

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.reorder_level


# ─────────────────────────────────────────────
#  3. VISIT
# ─────────────────────────────────────────────

class Visit(models.Model):
    VISIT_TYPE_CHOICES = [
        ('OPD',       'Outpatient (OPD)'),
        ('IPD',       'Inpatient (IPD)'),
        ('EMERGENCY', 'Emergency'),
        ('FOLLOWUP',  'Follow-up'),
    ]
    STATUS_CHOICES = [
        ('registered',  'Registered'),
        ('triage',      'In Triage'),
        ('waiting',     'Waiting for Doctor'),
        ('with_doctor', 'With Doctor'),
        ('radiology',   'Sent to Radiology'),
        ('pharmacy',    'Sent to Pharmacy'),
        ('billing',     'Sent to Billing'),
        ('completed',   'Completed'),
        ('cancelled',   'Cancelled'),
    ]

    patient          = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name='visits')
    visit_type       = models.CharField(max_length=20, choices=VISIT_TYPE_CHOICES, default='OPD')
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='registered')
    attending_doctor = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='doctor_visits', limit_choices_to={'role': 'doctor'}
    )
    registered_by    = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='receptionist_visits', limit_choices_to={'role': 'receptionist'}
    )
    visit_date       = models.DateTimeField(auto_now_add=True)
    notes            = models.TextField(blank=True)

    class Meta:
        ordering = ['-visit_date']

    def __str__(self):
        return f"Visit #{self.pk} — {self.patient.full_name} [{self.status}]"


# ─────────────────────────────────────────────
#  4. TRIAGE
# ─────────────────────────────────────────────

class Triage(models.Model):
    URGENCY_CHOICES = [
        ('green',  'Green  — Non-urgent'),
        ('yellow', 'Yellow — Urgent'),
        ('red',    'Red    — Critical'),
    ]

    visit              = models.OneToOneField(Visit, on_delete=models.CASCADE, related_name='triage')
    nurse              = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='nurse_triages', limit_choices_to={'role': 'nurse'}
    )
    temperature        = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, help_text="°C")
    blood_pressure_systolic  = models.PositiveIntegerField(null=True, blank=True, help_text="mmHg")
    blood_pressure_diastolic = models.PositiveIntegerField(null=True, blank=True, help_text="mmHg")
    pulse_rate         = models.PositiveIntegerField(null=True, blank=True, help_text="bpm")
    respiratory_rate   = models.PositiveIntegerField(null=True, blank=True, help_text="breaths/min")
    oxygen_saturation  = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, help_text="SpO2 %")
    weight             = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, help_text="kg")
    height             = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, help_text="cm")
    chief_complaint    = models.TextField()
    urgency_level      = models.CharField(max_length=10, choices=URGENCY_CHOICES, default='green')
    triaged_at         = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-triaged_at']

    def __str__(self):
        return f"Triage for Visit #{self.visit.pk} — {self.urgency_level.upper()}"

    @property
    def bmi(self):
        if self.weight and self.height:
            height_m = float(self.height) / 100
            return round(float(self.weight) / (height_m ** 2), 1)
        return None

    @property
    def blood_pressure(self):
        if self.blood_pressure_systolic and self.blood_pressure_diastolic:
            return f"{self.blood_pressure_systolic}/{self.blood_pressure_diastolic}"
        return None


# ─────────────────────────────────────────────
#  5. PATIENT MEDICAL RECORD
# ─────────────────────────────────────────────

class PatientMedicalRecord(models.Model):
    visit   = models.OneToOneField(Visit, on_delete=models.CASCADE, related_name='medical_record')
    doctor  = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='doctor_records', limit_choices_to={'role': 'doctor'}
    )

    # Clinical content
    history_of_presenting_illness = models.TextField(blank=True)
    examination_findings          = models.TextField(blank=True)
    diagnosis                     = models.CharField(max_length=255, help_text="Primary diagnosis (ICD-10 preferred)")
    secondary_diagnosis           = models.CharField(max_length=255, blank=True)
    treatment_plan                = models.TextField(blank=True)

    # Prescriptions (stored as free text in v1; v2 will link to Medicine)
    prescriptions                 = models.TextField(blank=True, help_text="Drug name, dose, frequency, duration")

    # Referrals
    referred_to_radiology         = models.BooleanField(default=False)
    radiology_request_notes       = models.TextField(blank=True)
    referred_to_pharmacy          = models.BooleanField(default=False)

    follow_up_date                = models.DateField(null=True, blank=True)
    doctor_notes                  = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Record for Visit #{self.visit.pk} — Dr. {self.doctor.get_full_name() if self.doctor else 'N/A'}"


# ─────────────────────────────────────────────
#  6. SHA / INSURANCE RECORD
# ─────────────────────────────────────────────

class SHARecord(models.Model):
    PROVIDER_CHOICES = [
        ('SHA',      'Social Health Authority (SHA)'),
        ('NHIF',     'NHIF (Legacy)'),
        ('AIR',      'AAR Insurance Kenya'),
        ('BRITAM',   'Britam Insurance'),
        ('JUBILEE',  'Jubilee Health Insurance'),
        ('MADISON',  'Madison Insurance'),
        ('RESOLUTION','Resolution Insurance'),
        ('CASH',     'Self-Pay (Cash)'),
        ('OTHER',    'Other'),
    ]
    CLAIM_STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('submitted', 'Submitted'),
        ('approved',  'Approved'),
        ('rejected',  'Rejected'),
        ('partial',   'Partially Approved'),
    ]

    visit                 = models.OneToOneField(Visit, on_delete=models.CASCADE, related_name='sha_record')
    patient               = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name='sha_records')
    insurance_provider    = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='CASH')
    member_number         = models.CharField(max_length=50, blank=True)
    pre_authorization_code= models.CharField(max_length=50, blank=True)
    total_bill            = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    claimed_amount        = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    approved_amount       = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    patient_copay         = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    claim_status          = models.CharField(max_length=20, choices=CLAIM_STATUS_CHOICES, default='pending')
    claim_reference       = models.CharField(max_length=100, blank=True, help_text="Reference number from insurer")
    rejection_reason      = models.TextField(blank=True)
    submitted_by          = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name='cashier_claims', limit_choices_to={'role': 'cashier'}
    )
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"SHA/Insurance — Visit #{self.visit.pk} | {self.insurance_provider} [{self.claim_status}]"

    @property
    def outstanding_balance(self):
        return float(self.total_bill) - float(self.approved_amount) - float(self.patient_copay)