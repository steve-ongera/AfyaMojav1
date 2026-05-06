"""
AfyaMojav1 — Seed Data Command
Usage: python manage.py seed_data
Creates realistic Kenyan demo data for all models.
Password for all accounts: password123
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
import random
from decimal import Decimal


class Command(BaseCommand):
    help = 'Seed AfyaMojav1 with realistic Kenyan demo data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Delete existing data before seeding (except superusers)',
        )

    def handle(self, *args, **options):
        from core.models import User, Patient, Medicine, Visit, Triage, PatientMedicalRecord, SHARecord

        self.stdout.write(self.style.MIGRATE_HEADING('\n🏥  AfyaMojav1 — Seeding Demo Data\n'))

        if options['flush']:
            self.stdout.write('  🗑  Flushing existing data...')
            SHARecord.objects.all().delete()
            PatientMedicalRecord.objects.all().delete()
            Triage.objects.all().delete()
            Visit.objects.all().delete()
            Patient.objects.all().delete()
            Medicine.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.WARNING('  ✓ Existing data cleared.\n'))

        # ── 1. STAFF USERS ────────────────────────────────────────
        self.stdout.write('  👤  Creating staff users...')
        PASSWORD = 'password123'

        staff_data = [
            # (username, first, last, role, email, phone)
            ('dr.wanjiku',    'Grace',    'Wanjiku',   'doctor',       'grace.wanjiku@afyamoja.co.ke',   '0712001001'),
            ('dr.omondi',     'Kevin',    'Omondi',    'doctor',       'kevin.omondi@afyamoja.co.ke',    '0712001002'),
            ('dr.kariuki',    'James',    'Kariuki',   'doctor',       'james.kariuki@afyamoja.co.ke',   '0712001003'),
            ('nurse.akinyi',  'Beatrice', 'Akinyi',    'nurse',        'b.akinyi@afyamoja.co.ke',        '0712002001'),
            ('nurse.wairimu', 'Faith',    'Wairimu',   'nurse',        'f.wairimu@afyamoja.co.ke',       '0712002002'),
            ('nurse.otieno',  'Sylvia',   'Otieno',    'nurse',        's.otieno@afyamoja.co.ke',        '0712002003'),
            ('recep.mwangi',  'Peter',    'Mwangi',    'receptionist', 'p.mwangi@afyamoja.co.ke',        '0712003001'),
            ('recep.njeri',   'Anne',     'Njeri',     'receptionist', 'a.njeri@afyamoja.co.ke',         '0712003002'),
            ('radio.kamau',   'Daniel',   'Kamau',     'radiologist',  'd.kamau@afyamoja.co.ke',         '0712004001'),
            ('radio.mutua',   'Lucy',     'Mutua',     'radiologist',  'l.mutua@afyamoja.co.ke',         '0712004002'),
            ('pharm.achieng', 'Rose',     'Achieng',   'pharmacist',   'r.achieng@afyamoja.co.ke',       '0712005001'),
            ('pharm.kimani',  'Brian',    'Kimani',    'pharmacist',   'b.kimani@afyamoja.co.ke',        '0712005002'),
            ('cashier.njeru', 'Mary',     'Njeru',     'cashier',      'm.njeru@afyamoja.co.ke',         '0712006001'),
            ('cashier.korir', 'Joseph',   'Korir',     'cashier',      'j.korir@afyamoja.co.ke',         '0712006002'),
            ('admin.system',  'System',   'Admin',     'admin',        'admin@afyamoja.co.ke',           '0712000001'),
        ]

        users = {}
        for username, first, last, role, email, phone in staff_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults=dict(
                    first_name=first, last_name=last,
                    role=role, email=email, phone=phone,
                    is_active=True,
                )
            )
            if created:
                user.set_password(PASSWORD)
                user.save()
                self.stdout.write(f'    ✓ {role.capitalize()}: {first} {last} (@{username})')
            else:
                self.stdout.write(f'    — Exists: @{username}')
            users[username] = user

        doctors       = [users['dr.wanjiku'],    users['dr.omondi'],    users['dr.kariuki']]
        nurses        = [users['nurse.akinyi'],  users['nurse.wairimu'],users['nurse.otieno']]
        receptionists = [users['recep.mwangi'],  users['recep.njeri']]
        cashiers      = [users['cashier.njeru'], users['cashier.korir']]

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(staff_data)} staff users ready.\n'))

        # ── 2. PATIENTS ───────────────────────────────────────────
        self.stdout.write('  🧑‍⚕️  Creating patients...')

        patients_data = [
            # (first, last, dob, gender, national_id, phone, blood, sha, insurance, ins_no, nok_name, nok_phone)
            ('Amina',     'Hassan',    date(1985, 3, 12), 'F', '12345678', '0721100001', 'B+',  'SHA/2023/001234', 'SHA',     'SHA001234', 'Ahmed Hassan',    '0721200001'),
            ('John',      'Kamau',     date(1979, 7, 4),  'M', '23456789', '0721100002', 'O+',  'SHA/2023/002345', 'BRITAM',  'BRT/002345','Ruth Kamau',      '0721200002'),
            ('Wanjiru',   'Muthoni',   date(1992, 11, 22),'F', '34567890', '0721100003', 'A+',  'SHA/2023/003456', 'AIR',     'AIR/003456','David Muthoni',   '0721200003'),
            ('Michael',   'Otieno',    date(1968, 5, 30), 'M', '45678901', '0721100004', 'AB-', 'SHA/2023/004567', 'JUBILEE', 'JUB/004567','Mary Otieno',     '0721200004'),
            ('Fatuma',    'Ali',       date(2001, 2, 14), 'F', '56789012', '0721100005', 'O-',  'SHA/2023/005678', 'CASH',    '',          'Omar Ali',        '0721200005'),
            ('Peter',     'Njoroge',   date(1955, 9, 8),  'M', '67890123', '0721100006', 'A-',  'SHA/2023/006789', 'SHA',     'SHA006789', 'Jane Njoroge',    '0721200006'),
            ('Grace',     'Aoko',      date(1998, 6, 18), 'F', '78901234', '0721100007', 'B-',  'SHA/2023/007890', 'MADISON', 'MAD/007890','Paul Aoko',       '0721200007'),
            ('Emmanuel',  'Kipchoge',  date(1975, 4, 25), 'M', '89012345', '0721100008', 'O+',  'SHA/2023/008901', 'SHA',     'SHA008901', 'Esther Kipchoge', '0721200008'),
            ('Aisha',     'Mohamed',   date(2010, 8, 3),  'F', '90123456', '0721100009', 'A+',  '',               'CASH',    '',          'Halima Mohamed',  '0721200009'),
            ('David',     'Mwangi',    date(1962, 12, 10),'M', '01234567', '0721100010', 'B+',  'SHA/2023/010234', 'RESOLUTION','RES/010234','Susan Mwangi',  '0721200010'),
            ('Beatrice',  'Waweru',    date(1988, 1, 27), 'F', '11223344', '0721100011', 'AB+', 'SHA/2023/011234', 'BRITAM',  'BRT/011234','Simon Waweru',    '0721200011'),
            ('Samuel',    'Nderitu',   date(1945, 10, 15),'M', '22334455', '0721100012', 'O+',  'SHA/2023/012345', 'NHIF',    'NHIF012345','Agnes Nderitu',   '0721200012'),
            ('Mercy',     'Chebet',    date(1995, 3, 7),  'F', '33445566', '0721100013', 'B+',  'SHA/2023/013456', 'SHA',     'SHA013456', 'Wilson Chebet',   '0721200013'),
            ('George',    'Odhiambo',  date(1983, 6, 19), 'M', '44556677', '0721100014', 'A+',  'SHA/2023/014567', 'AIR',     'AIR/014567','Christine Odhiambo','0721200014'),
            ('Lilian',    'Karanja',   date(1970, 9, 23), 'F', '55667788', '0721100015', 'O-',  'SHA/2023/015678', 'JUBILEE', 'JUB/015678','James Karanja',   '0721200015'),
            ('Patrick',   'Muriuki',   date(2005, 11, 11),'M', '66778899', '0721100016', 'AB+', '',               'CASH',    '',          'Anne Muriuki',    '0721200016'),
            ('Zainab',    'Omar',      date(1990, 4, 30), 'F', '77889900', '0721100017', 'B-',  'SHA/2023/017890', 'SHA',     'SHA017890', 'Yusuf Omar',      '0721200017'),
            ('Francis',   'Maina',     date(1958, 7, 16), 'M', '88990011', '0721100018', 'A-',  'SHA/2023/018901', 'BRITAM',  'BRT/018901','Catherine Maina', '0721200018'),
            ('Joyce',     'Awino',     date(2000, 1, 5),  'F', '99001122', '0721100019', 'O+',  'SHA/2023/019012', 'MADISON', 'MAD/019012','Thomas Awino',    '0721200019'),
            ('Dennis',    'Rotich',    date(1972, 8, 28), 'M', '10203040', '0721100020', 'B+',  'SHA/2023/020123', 'SHA',     'SHA020123', 'Eunice Rotich',   '0721200020'),
        ]

        patient_objs = []
        for row in patients_data:
            first, last, dob, gender, nid, phone, blood, sha, ins_prov, ins_no, nok, nok_ph = row
            p, created = Patient.objects.get_or_create(
                national_id=nid,
                defaults=dict(
                    first_name=first, last_name=last, date_of_birth=dob,
                    gender=gender, phone=phone, blood_group=blood,
                    sha_number=sha, insurance_provider=ins_prov,
                    insurance_number=ins_no, next_of_kin_name=nok,
                    next_of_kin_phone=nok_ph,
                    address=f'Nairobi, Kenya',
                )
            )
            patient_objs.append(p)
            if created:
                self.stdout.write(f'    ✓ {first} {last}')

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(patient_objs)} patients ready.\n'))

        # ── 3. MEDICINES ──────────────────────────────────────────
        self.stdout.write('  💊  Creating medicines formulary...')

        medicines_data = [
            # (name, generic, form, strength, stock, reorder, price)
            ('Amoxil',         'Amoxicillin',          'tablet',    '500mg',     200, 30,  Decimal('25.00')),
            ('Augmentin',      'Amoxicillin/Clavulanate','tablet',  '625mg',     150, 25,  Decimal('65.00')),
            ('Panadol',        'Paracetamol',           'tablet',   '500mg',     500, 50,  Decimal('5.00')),
            ('Brufen',         'Ibuprofen',             'tablet',   '400mg',     300, 40,  Decimal('10.00')),
            ('Metformin',      'Metformin HCl',         'tablet',   '500mg',     180, 30,  Decimal('12.00')),
            ('Amlodipine',     'Amlodipine Besylate',   'tablet',   '5mg',       160, 25,  Decimal('15.00')),
            ('Atorvastatin',   'Atorvastatin',          'tablet',   '20mg',      120, 20,  Decimal('30.00')),
            ('Omeprazole',     'Omeprazole',            'capsule',  '20mg',      200, 30,  Decimal('20.00')),
            ('Ciprofloxacin',  'Ciprofloxacin',         'tablet',   '500mg',      80, 20,  Decimal('35.00')),
            ('Metronidazole',  'Metronidazole',         'tablet',   '400mg',     250, 40,  Decimal('8.00')),
            ('Doxycycline',    'Doxycycline HCl',       'capsule',  '100mg',     100, 20,  Decimal('18.00')),
            ('Salbutamol',     'Salbutamol',            'inhaler',  '100mcg',     40, 10,  Decimal('350.00')),
            ('Prednisolone',   'Prednisolone',          'tablet',   '5mg',       160, 25,  Decimal('7.00')),
            ('Furosemide',     'Furosemide',            'tablet',   '40mg',       90, 15,  Decimal('6.00')),
            ('ORS Sachet',     'Oral Rehydration Salts','other',    '20.5g',     300, 50,  Decimal('15.00')),
            ('Paracetamol Syrup','Paracetamol',         'syrup',    '120mg/5ml', 100, 20,  Decimal('85.00')),
            ('Amoxicillin Syrup','Amoxicillin',         'syrup',    '125mg/5ml',  60, 15,  Decimal('120.00')),
            ('Diclofenac',     'Diclofenac Sodium',     'injection','75mg/3ml',   8,  10,  Decimal('45.00')),  # low stock
            ('Tramadol',       'Tramadol HCl',          'capsule',  '50mg',       5,  10,  Decimal('40.00')),  # low stock
            ('Gentamicin Eye Drops','Gentamicin',       'drops',    '0.3%',      30,  10,  Decimal('95.00')),
            ('Hydrocortisone Cream','Hydrocortisone',   'cream',    '1%',        45,  10,  Decimal('75.00')),
            ('Enalapril',      'Enalapril Maleate',     'tablet',   '5mg',       70,  15,  Decimal('22.00')),
            ('Glibenclamide',  'Glibenclamide',         'tablet',   '5mg',       90,  15,  Decimal('8.00')),
            ('Losartan',       'Losartan Potassium',    'tablet',   '50mg',      80,  15,  Decimal('28.00')),
            ('Cotrimoxazole',  'Sulfamethoxazole/Trimethoprim','tablet','480mg', 180, 30,  Decimal('6.00')),
        ]

        med_objs = {}
        for name, generic, form, strength, stock, reorder, price in medicines_data:
            m, created = Medicine.objects.get_or_create(
                name=name, strength=strength, dosage_form=form,
                defaults=dict(
                    generic_name=generic, stock_quantity=stock,
                    reorder_level=reorder, unit_price=price, is_active=True,
                )
            )
            med_objs[name] = m
            if created:
                status = '⚠ LOW' if m.is_low_stock else '✓'
                self.stdout.write(f'    {status} {name} {strength}')

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(medicines_data)} medicines ready.\n'))

        # ── 4. VISITS ─────────────────────────────────────────────
        self.stdout.write('  📋  Creating visits...')

        visit_scenarios = [
            # (patient_idx, doctor_idx, visit_type, status, days_ago)
            (0,  0, 'OPD',       'completed',   5),
            (1,  1, 'OPD',       'completed',   5),
            (2,  2, 'EMERGENCY', 'completed',   4),
            (3,  0, 'OPD',       'completed',   4),
            (4,  1, 'OPD',       'completed',   3),
            (5,  2, 'IPD',       'completed',   3),
            (6,  0, 'OPD',       'completed',   2),
            (7,  1, 'FOLLOWUP',  'completed',   2),
            (8,  2, 'OPD',       'completed',   1),
            (9,  0, 'OPD',       'completed',   1),
            # Today — active visits across all statuses
            (10, 1, 'OPD',       'registered',  0),
            (11, 2, 'OPD',       'triage',      0),
            (12, 0, 'EMERGENCY', 'triage',      0),
            (13, 1, 'OPD',       'waiting',     0),
            (14, 2, 'OPD',       'waiting',     0),
            (15, 0, 'OPD',       'with_doctor', 0),
            (16, 1, 'FOLLOWUP',  'with_doctor', 0),
            (17, 2, 'OPD',       'radiology',   0),
            (18, 0, 'OPD',       'pharmacy',    0),
            (19, 1, 'OPD',       'billing',     0),
        ]

        visit_objs = []
        for pat_idx, doc_idx, vtype, vstatus, days_ago in visit_scenarios:
            patient = patient_objs[pat_idx]
            doctor  = doctors[doc_idx]
            recep   = receptionists[days_ago % 2]

            v, created = Visit.objects.get_or_create(
                patient=patient,
                visit_type=vtype,
                status=vstatus,
                defaults=dict(
                    attending_doctor=doctor,
                    registered_by=recep,
                    notes=f'Patient presented with complaints. Visit type: {vtype}.',
                )
            )
            if created:
                # Adjust visit_date by backdating
                if days_ago > 0:
                    Visit.objects.filter(pk=v.pk).update(
                        visit_date=timezone.now() - timedelta(days=days_ago)
                    )
            visit_objs.append(v)
            self.stdout.write(f'    ✓ Visit #{v.pk} — {patient.full_name} [{vstatus}]')

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(visit_objs)} visits ready.\n'))

        # ── 5. TRIAGE ─────────────────────────────────────────────
        self.stdout.write('  🩺  Creating triage records...')

        triage_data = [
            # For completed + waiting + with_doctor + radiology + pharmacy + billing visits
            # (visit_idx, nurse_idx, temp, sys, dia, pulse, rr, spo2, weight, height, complaint, urgency)
            (0,  0, '37.2', 120, 80,  72,  16, '98.0', '65.0', '162.0', 'Productive cough and fever for 3 days', 'green'),
            (1,  1, '38.5', 140, 90,  88,  20, '96.0', '80.0', '175.0', 'Chest pain and shortness of breath',    'yellow'),
            (2,  2, '39.1', 160, 100, 110, 24, '92.0', '72.0', '168.0', 'Severe headache and vomiting',          'red'),
            (3,  0, '36.8', 118, 76,  68,  15, '99.0', '90.0', '180.0', 'Knee pain after a fall',                'green'),
            (4,  1, '37.5', 130, 85,  80,  18, '97.0', '55.0', '158.0', 'Abdominal pain and diarrhoea',          'yellow'),
            (5,  2, '38.0', 110, 70,  76,  16, '98.0', '78.0', '172.0', 'Difficulty breathing, known asthmatic', 'yellow'),
            (6,  0, '37.1', 122, 80,  74,  15, '99.0', '60.0', '160.0', 'Routine diabetes follow-up',            'green'),
            (7,  1, '36.9', 115, 75,  70,  14, '98.5', '85.0', '178.0', 'Post-operative wound review',           'green'),
            (8,  2, '38.8', 150, 95,  95,  22, '94.0', '45.0', '145.0', 'High fever and convulsions in child',   'red'),
            (9,  0, '37.0', 125, 82,  76,  16, '98.0', '95.0', '183.0', 'Flank pain and burning urination',      'green'),
            # Today active visits
            (13, 1, '37.3', 118, 78,  72,  15, '99.0', '68.0', '165.0', 'Persistent headache for 2 weeks',      'green'),
            (14, 2, '38.2', 135, 88,  85,  19, '96.5', '74.0', '170.0', 'Fever, chills and joint pains',        'yellow'),
            (15, 0, '37.8', 145, 92,  90,  20, '95.5', '82.0', '176.0', 'Chest tightness and palpitations',     'yellow'),
            (16, 1, '36.7', 112, 72,  66,  14, '99.0', '58.0', '155.0', 'Follow-up hypertension management',    'green'),
            (17, 2, '37.4', 128, 84,  78,  17, '98.0', '71.0', '169.0', 'Suspected appendicitis — right iliac fossa pain', 'red'),
            (18, 0, '37.0', 120, 78,  70,  15, '99.0', '65.0', '163.0', 'Upper respiratory tract infection',    'green'),
            (19, 1, '37.2', 122, 80,  74,  16, '98.5', '77.0', '173.0', 'Routine check-up and prescription refill', 'green'),
        ]

        triage_objs = []
        for vis_idx, nurse_idx, temp, sys, dia, pulse, rr, spo2, wt, ht, complaint, urgency in triage_data:
            if vis_idx >= len(visit_objs):
                continue
            visit = visit_objs[vis_idx]
            nurse = nurses[nurse_idx]

            if hasattr(visit, 'triage'):
                self.stdout.write(f'    — Triage exists for Visit #{visit.pk}')
                triage_objs.append(visit.triage)
                continue

            t = Triage.objects.create(
                visit=visit, nurse=nurse,
                temperature=Decimal(temp),
                blood_pressure_systolic=sys,
                blood_pressure_diastolic=dia,
                pulse_rate=pulse,
                respiratory_rate=rr,
                oxygen_saturation=Decimal(spo2),
                weight=Decimal(wt),
                height=Decimal(ht),
                chief_complaint=complaint,
                urgency_level=urgency,
            )
            triage_objs.append(t)
            self.stdout.write(f'    ✓ Triage Visit #{visit.pk} — {urgency.upper()} — {complaint[:40]}...')

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(triage_objs)} triage records ready.\n'))

        # ── 6. MEDICAL RECORDS ────────────────────────────────────
        self.stdout.write('  📝  Creating medical records...')

        records_data = [
            # (visit_idx, doctor_idx, hpi, exam, diagnosis, secondary_dx, treatment, prescriptions,
            #  ref_radio, radio_notes, ref_pharm, follow_up_days, notes)
            (
                0, 0,
                'Patient presents with a 3-day history of productive cough with yellowish sputum, fever up to 38.5°C, and mild dyspnoea. No haemoptysis. History of mild asthma.',
                'General: mild distress. Temp 37.2°C. Chest: reduced air entry right base, crepitations. SpO2 98% on air.',
                'J22 — Acute lower respiratory tract infection',
                'J45.0 — Mild intermittent asthma',
                'Oral antibiotics, antipyretics, bronchodilator PRN. Increase fluid intake. Rest.',
                '1. Amoxicillin 500mg PO TDS x 7 days\n2. Panadol 1g PO PRN (max QDS)\n3. Salbutamol inhaler 2 puffs PRN',
                False, '', True, 7,
                'Patient counselled on infection control. Review in 7 days or earlier if worsening.'
            ),
            (
                1, 1,
                'Patient presents with 2-hour history of central chest pain radiating to the left arm, associated with diaphoresis and nausea. BP elevated on arrival.',
                'General: anxious, diaphoretic. BP 140/90. HR 88 irregular. Chest: clear to auscultation. ECG ordered.',
                'R07.4 — Chest pain, unspecified — rule out ACS',
                'I10 — Essential hypertension',
                'Aspirin stat, GTN sublingual, oxygen, urgent cardiology review, ECG and troponin.',
                '1. Aspirin 300mg PO stat\n2. GTN 0.5mg sublingual PRN\n3. Amlodipine 5mg PO OD (continue)',
                True, 'CXR PA view — rule out cardiac enlargement and pulmonary oedema',
                True, 3,
                'Urgent referral to Cardiology. Patient admitted for monitoring.'
            ),
            (
                3, 0,
                'Patient fell from a motorcycle 6 hours ago. Right knee pain, swelling, and difficulty weight-bearing. No LOC. Tetanus status up to date.',
                'Right knee: swollen, tender over medial joint line, ROM limited 0-60°, no obvious deformity. Neurovascular intact.',
                'S83.2 — Tear of medial meniscus — to confirm on imaging',
                '',
                'Analgesia, RICE therapy, knee immobilisation, referral for X-ray.',
                '1. Brufen 400mg PO TDS with food x 5 days\n2. Diclofenac injection 75mg IM stat',
                True, 'Right knee X-ray AP and lateral views — rule out fracture',
                True, 14,
                'Patient advised no weight-bearing. Crutches provided. Follow up with orthopaedics.'
            ),
            (
                4, 1,
                '2-day history of loose watery stools (5-6 episodes/day), crampy abdominal pain, and low-grade fever. Ate street food yesterday.',
                'Mild dehydration: dry mucous membranes, skin turgor slightly reduced. Abdomen: soft, diffuse tenderness, hyperactive bowel sounds.',
                'A09 — Gastroenteritis and colitis of infectious origin',
                '',
                'Oral rehydration, bland diet, antibiotic therapy, antiemetic if needed.',
                '1. ORS Sachet — 1 sachet in 200ml water after each loose stool\n2. Metronidazole 400mg PO TDS x 5 days\n3. Panadol 500mg PO PRN for fever',
                False, '', True, 3,
                'Patient educated on hand hygiene and food safety. Warned to return if vomiting prevents ORS intake.'
            ),
            (
                6, 0,
                'Known T2DM on metformin. Presents for routine 3-monthly review. Blood sugar readings at home: fasting 6.5-9.0 mmol/L. No hypoglycaemic episodes.',
                'BP 118/76. BMI 23. Feet: no ulcers, sensation intact. Eyes: referred to ophthalmology last visit. Random glucose 8.2 mmol/L.',
                'E11.9 — Type 2 diabetes mellitus without complications',
                'I10 — Essential hypertension — well controlled',
                'Continue current medications. Dietary reinforcement. HbA1c due at next visit.',
                '1. Metformin 500mg PO BD with meals (continue)\n2. Glibenclamide 5mg PO OD (continue)\n3. Atorvastatin 20mg PO nocte (continue)',
                False, '', True, 90,
                'Good glycaemic control. Next review in 3 months. HbA1c and renal function tests due.'
            ),
            (
                7, 1,
                'Post-op day 14 review following appendectomy. Wound healing well. No fever. Resumed normal diet.',
                'Wound: clean, dry, no discharge. Sutures intact. Abdomen soft, non-tender. Bowel sounds normal.',
                'Z48.0 — Encounter for change or removal of surgical wound dressing',
                '',
                'Wound dressing change. Suture removal. Continue iron supplementation.',
                '1. Multivitamin + iron supplement PO OD x 2 weeks',
                False, '', False, 14,
                'Sutures removed. Patient discharged from surgical follow-up. GP review in 2 weeks.'
            ),
            (
                9, 0,
                'Burning on urination and right flank pain for 2 days. No haematuria. Sexually active, uses contraception.',
                'Temp 37.0°C. Right costovertebral angle tenderness. Suprapubic tenderness mild. Dipstick: leucocytes +, nitrites +.',
                'N10 — Acute pyelonephritis',
                '',
                'Antibiotic therapy, adequate hydration, analgesia. Urine MCS sent.',
                '1. Ciprofloxacin 500mg PO BD x 7 days\n2. Panadol 1g PO QDS\n3. Encourage 2-3 litres water daily',
                False, '', True, 7,
                'Urine MCS results to be reviewed at follow-up. Advise to complete antibiotic course.'
            ),
            # Today active - with_doctor
            (
                15, 0,
                'Known hypertensive presents with chest tightness and palpitations for 4 hours. BP elevated at triage.',
                'BP 145/92, HR 90, regular. Chest clear. No JVP elevation. ECG: sinus tachycardia.',
                'I10 — Essential hypertension — inadequately controlled',
                'R00.0 — Tachycardia unspecified',
                'Optimise antihypertensive therapy. Stress ECG. Lifestyle modification counselling.',
                '1. Amlodipine 10mg PO OD (increase dose)\n2. Losartan 50mg PO OD (add)\n3. Panadol 500mg PO PRN',
                True, 'CXR PA view — assess cardiac size', True, 30,
                'BP target <130/80. Advise low salt diet, 150min moderate exercise/week.'
            ),
            (
                16, 1,
                'Known hypertensive diabetic for 6-month follow-up. Feels well. No chest pain or SOB. Glucose readings improved.',
                'BP 112/72. Random glucose 7.1. Feet exam normal. Weight stable.',
                'E11.9 — Type 2 diabetes mellitus — controlled',
                'I10 — Essential hypertension — controlled',
                'Continue all medications unchanged. Book HbA1c and renal panel.',
                '1. Metformin 500mg PO BD (continue)\n2. Enalapril 5mg PO OD (continue)\n3. Atorvastatin 20mg PO nocte (continue)',
                False, '', True, 90,
                'Both conditions well managed. Next review 3 months.'
            ),
        ]

        record_objs = []
        for row in records_data:
            (vis_idx, doc_idx, hpi, exam, dx, sec_dx, tx, rx,
             ref_radio, radio_notes, ref_pharm, followup_days, notes) = row

            if vis_idx >= len(visit_objs):
                continue
            visit  = visit_objs[vis_idx]
            doctor = doctors[doc_idx]

            if hasattr(visit, 'medical_record'):
                self.stdout.write(f'    — Record exists for Visit #{visit.pk}')
                record_objs.append(visit.medical_record)
                continue

            follow_up = date.today() + timedelta(days=followup_days) if followup_days else None

            r = PatientMedicalRecord.objects.create(
                visit=visit, doctor=doctor,
                history_of_presenting_illness=hpi,
                examination_findings=exam,
                diagnosis=dx,
                secondary_diagnosis=sec_dx,
                treatment_plan=tx,
                prescriptions=rx,
                referred_to_radiology=ref_radio,
                radiology_request_notes=radio_notes,
                referred_to_pharmacy=ref_pharm,
                follow_up_date=follow_up,
                doctor_notes=notes,
            )
            record_objs.append(r)
            self.stdout.write(f'    ✓ Record Visit #{visit.pk} — {dx[:50]}')

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(record_objs)} medical records ready.\n'))

        # ── 7. SHA / INSURANCE RECORDS ────────────────────────────
        self.stdout.write('  🛡  Creating SHA / billing records...')

        sha_data = [
            # (visit_idx, provider, member_no, preauth, total, claimed, approved, copay, status, ref, rejection)
            (0,  'SHA',     'SHA001234', 'PRE/SHA/001', Decimal('2500'),  Decimal('2500'),  Decimal('2000'),  Decimal('500'),  'approved',  'SHA/APR/001', ''),
            (1,  'BRITAM',  'BRT/002345','PRE/BRT/002', Decimal('15000'), Decimal('15000'), Decimal('12000'), Decimal('3000'), 'approved',  'BRT/APR/002', ''),
            (3,  'AIR',     'AIR/003456','',            Decimal('8500'),  Decimal('8500'),  Decimal('7000'),  Decimal('1500'), 'submitted', 'AIR/SUB/003', ''),
            (4,  'CASH',    '',          '',            Decimal('1800'),  Decimal('0'),     Decimal('0'),     Decimal('1800'),'approved',  '',            ''),
            (6,  'SHA',     'SHA006789', 'PRE/SHA/006', Decimal('3200'),  Decimal('3200'),  Decimal('2800'),  Decimal('400'),  'approved',  'SHA/APR/006', ''),
            (7,  'JUBILEE', 'JUB/004567','PRE/JUB/007', Decimal('5500'),  Decimal('5500'),  Decimal('0'),     Decimal('0'),    'rejected',  '',            'Claim submitted outside validity period. Policy lapsed.'),
            (9,  'AIR',     'AIR/014567','',            Decimal('4200'),  Decimal('4200'),  Decimal('3500'),  Decimal('700'),  'partial',   'AIR/PAR/009', ''),
            (19, 'SHA',     'SHA020123', 'PRE/SHA/019', Decimal('3800'),  Decimal('3800'),  Decimal('0'),     Decimal('0'),    'pending',   '',            ''),
        ]

        sha_objs = []
        for row in sha_data:
            (vis_idx, provider, member, preauth, total, claimed,
             approved, copay, status, ref, rejection) = row

            if vis_idx >= len(visit_objs):
                continue
            visit   = visit_objs[vis_idx]
            patient = visit.patient
            cashier = cashiers[vis_idx % 2]

            if hasattr(visit, 'sha_record'):
                self.stdout.write(f'    — SHA record exists for Visit #{visit.pk}')
                sha_objs.append(visit.sha_record)
                continue

            s = SHARecord.objects.create(
                visit=visit, patient=patient,
                insurance_provider=provider,
                member_number=member,
                pre_authorization_code=preauth,
                total_bill=total,
                claimed_amount=claimed,
                approved_amount=approved,
                patient_copay=copay,
                claim_status=status,
                claim_reference=ref,
                rejection_reason=rejection,
                submitted_by=cashier,
            )
            sha_objs.append(s)
            self.stdout.write(
                f'    ✓ SHA Visit #{visit.pk} — {provider} — KES {total} [{status.upper()}]'
            )

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(sha_objs)} SHA/insurance records ready.\n'))

        # ── SUMMARY ───────────────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING('═' * 55))
        self.stdout.write(self.style.SUCCESS('  ✅  AfyaMojav1 seed complete!\n'))
        self.stdout.write(f'  👤  Staff Users  : {User.objects.filter(is_superuser=False).count()}')
        self.stdout.write(f'  🧑  Patients     : {Patient.objects.count()}')
        self.stdout.write(f'  💊  Medicines    : {Medicine.objects.count()}')
        self.stdout.write(f'  📋  Visits       : {Visit.objects.count()}')
        self.stdout.write(f'  🩺  Triage       : {Triage.objects.count()}')
        self.stdout.write(f'  📝  Med Records  : {PatientMedicalRecord.objects.count()}')
        self.stdout.write(f'  🛡   SHA Records  : {SHARecord.objects.count()}')
        self.stdout.write(self.style.MIGRATE_HEADING('═' * 55))
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('  🔑  Login credentials (all accounts):'))
        self.stdout.write(f'      Password : password123')
        self.stdout.write('')
        self.stdout.write('  Sample logins:')
        for username, first, last, role, *_ in staff_data:
            self.stdout.write(f'    {role.capitalize():<14} → @{username}')
        self.stdout.write(self.style.MIGRATE_HEADING('═' * 55))
        self.stdout.write('')