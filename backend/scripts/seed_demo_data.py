"""Seed script populating demonstration epidemiological surveillance data.

Generates 30 symptom reports across 3 villages over 14 days:
- Kalyanpur (Hotspot): 12 reports following the cold_insomnia -> mobility_loss -> confusion sequence
                       within a 10-day window, plus 1 linked Verbal Autopsy (Babulal Yadav).
- Rampur (Baseline): 9 isolated cold_insomnia reports scattered across 14 days.
- Mohanpur (Baseline): 9 isolated cold_insomnia reports scattered across 14 days.
"""

from datetime import datetime, timedelta, timezone
import logging
import sys
import os
from uuid import uuid4

# Ensure backend package is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_sync_db
from app.models.symptom_report import ReportChannel, ReporterType, SymptomStage

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed")

VILLAGES = [
    {
        "village_name": "Kalyanpur",
        "district": "Samastipur",
        "ac_name": "Kalyanpur",
        "ac_no": 131,
        "latitude": 12.985,
        "longitude": 77.580,
        "population": 12450,
        "phc_name": "Kalyanpur Primary Health Centre"
    },
    {
        "village_name": "Rampur",
        "district": "Samastipur",
        "ac_name": "Kalyanpur",
        "ac_no": 131,
        "latitude": 13.042,
        "longitude": 77.625,
        "population": 8900,
        "phc_name": "Rampur Primary Health Centre"
    },
    {
        "village_name": "Mohanpur",
        "district": "Samastipur",
        "ac_name": "Kalyanpur",
        "ac_no": 131,
        "latitude": 12.915,
        "longitude": 77.512,
        "population": 6700,
        "phc_name": "Mohanpur Primary Health Centre"
    }
]


def run_seed():
    db = get_sync_db()
    now = datetime.now(timezone.utc)
    logger.info("Connecting to Supabase to seed demonstration surveillance dataset...")

    # 1. Upsert Villages Directory
    for v in VILLAGES:
        try:
            existing = db.select("villages_directory", params={"village_name": f"eq.{v['village_name']}"})
            if not existing:
                db.insert("villages_directory", v)
                logger.info("Inserted village: %s", v["village_name"])
            else:
                logger.info("Village %s already present.", v["village_name"])
        except Exception as e:
            logger.warning("Villages check error: %s", e)

    # 2. Clean existing mock data in symptom_reports & verbal_autopsies for fresh demo
    try:
        db.delete("alerts_log", {"channel": "in.(telegram,email)"})
        db.delete("clusters", {"village_name": "in.(Kalyanpur,Rampur,Mohanpur)"})
        db.delete("verbal_autopsies", {"village_name": "in.(Kalyanpur,Rampur,Mohanpur)"})
        db.delete("symptom_reports", {"village_name": "in.(Kalyanpur,Rampur,Mohanpur)"})
        logger.info("Cleared previous demo records.")
    except Exception as e:
        logger.warning("Could not clear prior records: %s", e)

    # 3. Generate Kalyanpur Outbreak Cluster (12 reports over 10-day window)
    # Sequence: cold_insomnia -> mobility_loss -> confusion
    kalyanpur_reports = [
        # Days 10 to 8: cold_insomnia
        {
            "offset_days": 10, "subject": "Deepak Sah",
            "stage": SymptomStage.COLD_INSOMNIA.value,
            "raw": "Mera sharir kaanp raha hai aur 3 din se neend nahi aa rahi hai, sar phat raha hai.",
            "symptoms": ["chills", "insomnia", "frontal_headache", "fever"], "channel": ReportChannel.TELEGRAM_VOICE.value
        },
        {
            "offset_days": 10, "subject": "Suresh Patel",
            "stage": SymptomStage.COLD_INSOMNIA.value,
            "raw": "Cannot sleep since Tuesday, severe shivering, eye ache and burning forehead.",
            "symptoms": ["insomnia", "retro_orbital_pain", "shivering"], "channel": ReportChannel.ICON_APP.value
        },
        {
            "offset_days": 9, "subject": "Anita Devi",
            "stage": SymptomStage.COLD_INSOMNIA.value,
            "raw": "Raat bhar kaanpte rahe, thand lag rahi hai aur neend bilkul gayab ho gayi hai.",
            "symptoms": ["severe_chills", "insomnia", "body_aches"], "channel": ReportChannel.TELEGRAM_VOICE.value
        },
        {
            "offset_days": 9, "subject": "Prakash Kumar",
            "stage": SymptomStage.COLD_INSOMNIA.value,
            "raw": "High temperature, teeth chattering chills and 48 hours without any sleep.",
            "symptoms": ["fever_with_rigors", "insomnia"], "channel": ReportChannel.ICON_APP.value
        },
        {
            "offset_days": 8, "subject": "Raju Paswan",
            "stage": SymptomStage.COLD_INSOMNIA.value,
            "raw": "Severe shivering and inability to sleep for last three nights with joint ache.",
            "symptoms": ["shivering", "insomnia", "joint_pain"], "channel": ReportChannel.TELEGRAM_VOICE.value
        },
        # Days 7 to 4: mobility_loss
        {
            "offset_days": 7, "subject": "Rameshwar Singh",
            "stage": SymptomStage.MOBILITY_LOSS.value,
            "raw": "Pair me achanak jaan khatam ho gayi, chal nahi paa rahe, baithne me bhi taklif hai.",
            "symptoms": ["lower_limb_weakness", "unable_to_walk", "motor_instability"], "channel": ReportChannel.TELEGRAM_VOICE.value
        },
        {
            "offset_days": 6, "subject": "Manju Kumari",
            "stage": SymptomStage.MOBILITY_LOSS.value,
            "raw": "Legs feel completely numb and heavy, patient unable to stand without two people supporting.",
            "symptoms": ["bilateral_leg_weakness", "inability_to_stand"], "channel": ReportChannel.ICON_APP.value
        },
        {
            "offset_days": 5, "subject": "Gopal Prasad",
            "stage": SymptomStage.MOBILITY_LOSS.value,
            "raw": "Subah se dono pair kaam nahi kar rahe, khade hone par gir ja rahe hain.",
            "symptoms": ["ascending_weakness", "mobility_loss", "muscle_flaccidity"], "channel": ReportChannel.TELEGRAM_VOICE.value
        },
        {
            "offset_days": 5, "subject": "Sunita Sharma",
            "stage": SymptomStage.MOBILITY_LOSS.value,
            "raw": "Unable to walk to the toilet, profound fatigue with weakness in hands and legs.",
            "symptoms": ["motor_paralysis", "extreme_fatigue"], "channel": ReportChannel.ICON_APP.value
        },
        {
            "offset_days": 4, "subject": "Kamlesh Bind",
            "stage": SymptomStage.MOBILITY_LOSS.value,
            "raw": "Complete lower body weakness, cannot move legs since yesterday evening.",
            "symptoms": ["flaccid_paralysis", "mobility_loss"], "channel": ReportChannel.TELEGRAM_VOICE.value
        },
        # Days 3 to 1: confusion & delirium
        {
            "offset_days": 3, "subject": "Vikram Verma",
            "stage": SymptomStage.CONFUSION.value,
            "raw": "Bimar vyakti behosh jaise hain, ajeeb batein bol rahe hain aur gharwalo ko nahi pehchaan rahe.",
            "symptoms": ["acute_delirium", "disorientation", "hallucinations"], "channel": ReportChannel.TELEGRAM_VOICE.value
        },
        {
            "offset_days": 1, "subject": "Babulal Yadav",
            "stage": SymptomStage.CONFUSION.value,
            "raw": "Delirious state, high spiking fever, tremors in hands, severe confusion.",
            "symptoms": ["severe_delirium", "tremors", "confusion", "high_fever"], "channel": ReportChannel.TELEGRAM_VOICE.value
        }
    ]

    seeded_reports = []
    babulal_report_id = None

    for r in kalyanpur_reports:
        rep_id = str(uuid4())
        rep_time = now - timedelta(days=r["offset_days"], hours=3)
        if r["subject"] == "Babulal Yadav":
            babulal_report_id = rep_id

        doc = {
            "id": rep_id,
            "village_name": "Kalyanpur",
            "subject_name": r["subject"],
            "ward_or_area": "Ward 1 - Outbreak Zone",
            "symptom_stage": r["stage"],
            "raw_transcript": r["raw"],
            "structured_symptoms": {
                "gemini_extracted": True,
                "primary_symptoms": r["symptoms"],
                "syndromic_pattern": "Neuro-invasive Febrile Syndrome",
                "cluster_risk_indicator": 0.94 if r["stage"] == SymptomStage.CONFUSION.value else 0.85
            },
            "report_channel": r["channel"],
            "reporter_type": ReporterType.SELF.value if r["channel"] == ReportChannel.TELEGRAM_VOICE.value else ReporterType.ASHA_WORKER.value,
            "reported_at": rep_time.isoformat(),
            "created_at": rep_time.isoformat(),
            "district": "Samastipur",
            "ac_name": "Kalyanpur",
            "ac_no": 131,
            "biometric_verified": True
        }
        seeded_reports.append(doc)

    # 4. Generate Rampur Baseline Reports (9 isolated cold_insomnia cases over 14 days)
    rampur_names = ["Rajesh", "Pooja", "Vinod", "Rekha", "Manoj", "Kiran", "Amit", "Geeta", "Sanjay"]
    for i, name in enumerate(rampur_names):
        rep_time = now - timedelta(days=13 - i, hours=i + 1)
        doc = {
            "id": str(uuid4()),
            "village_name": "Rampur",
            "subject_name": f"{name} Sah",
            "ward_or_area": f"Sector {i % 3 + 1}",
            "symptom_stage": SymptomStage.COLD_INSOMNIA.value,
            "raw_transcript": f"Mild chills and trouble sleeping for 1 night, no weakness.",
            "structured_symptoms": {
                "gemini_extracted": True,
                "primary_symptoms": ["mild_chills", "mild_insomnia"],
                "syndromic_pattern": "Mild Seasonal Chills",
                "cluster_risk_indicator": 0.20
            },
            "report_channel": ReportChannel.ICON_APP.value if i % 2 == 0 else ReportChannel.TELEGRAM_VOICE.value,
            "reporter_type": ReporterType.SELF.value,
            "reported_at": rep_time.isoformat(),
            "created_at": rep_time.isoformat(),
            "district": "Samastipur",
            "ac_name": "Kalyanpur",
            "ac_no": 131,
            "biometric_verified": False
        }
        seeded_reports.append(doc)

    # 5. Generate Mohanpur Baseline Reports (9 isolated cold_insomnia cases over 14 days)
    mohanpur_names = ["Arjun", "Sarita", "Naresh", "Sunil", "Asha", "Mahesh", "Pushpa", "Ravi", "Seema"]
    for i, name in enumerate(mohanpur_names):
        rep_time = now - timedelta(days=14 - i, hours=i * 2 + 1)
        doc = {
            "id": str(uuid4()),
            "village_name": "Mohanpur",
            "subject_name": f"{name} Devi",
            "ward_or_area": f"Ward {i % 4 + 1}",
            "symptom_stage": SymptomStage.COLD_INSOMNIA.value,
            "raw_transcript": f"General slight shivering after field work, rest helped.",
            "structured_symptoms": {
                "gemini_extracted": True,
                "primary_symptoms": ["slight_shivering"],
                "syndromic_pattern": "Exertional shivering",
                "cluster_risk_indicator": 0.15
            },
            "report_channel": ReportChannel.TELEGRAM_VOICE.value,
            "reporter_type": ReporterType.SELF.value,
            "reported_at": rep_time.isoformat(),
            "created_at": rep_time.isoformat(),
            "district": "Samastipur",
            "ac_name": "Kalyanpur",
            "ac_no": 131,
            "biometric_verified": False
        }
        seeded_reports.append(doc)

    # Batch insert reports into Supabase in smaller chunks for reliability
    for i in range(0, len(seeded_reports), 10):
        chunk = seeded_reports[i:i + 10]
        db.insert("symptom_reports", chunk)
    logger.info("Successfully seeded %d symptom reports across 3 villages.", len(seeded_reports))

    # 6. Insert Linked Verbal Autopsy for Babulal Yadav in Kalyanpur
    va_id = str(uuid4())
    death_date = (now - timedelta(days=1)).date()
    va_record = {
        "id": va_id,
        "linked_symptom_report_id": babulal_report_id,
        "deceased_name": "Babulal Yadav",
        "village_name": "Kalyanpur",
        "interview_raw_transcript": (
            "Patient developed fever and severe sleeplessness 10 days prior. Within 4 days lost ability to walk. "
            "Delirium followed on Day 7, followed by seizures. Deceased on 9th day."
        ),
        "who_va_structured_data": {
            "gender": "Male",
            "age_years": 44,
            "place_of_death": "District Hospital en-route",
            "who_va_version": "2022_v1.5.3",
            "terminal_symptoms": [
                "fever_with_rigors",
                "severe_insomnia_5_days",
                "ascending_motor_paralysis",
                "confusion_and_delirium",
                "terminal_seizures"
            ],
            "progression_sequence": [
                {"day": 1, "stage": "cold_insomnia", "description": "Fever, rigors, and persistent insomnia"},
                {"day": 5, "stage": "mobility_loss", "description": "Unable to walk, flaccid motor weakness"},
                {"day": 8, "stage": "confusion", "description": "Acute delirium and terminal decline"}
            ],
            "duration_of_terminal_illness_days": 10
        },
        "probable_cause_category": "Acute Encephalitic Syndrome (Probable Arboviral etiology - non-diagnostic)",
        "interview_conducted_by": "asha_worker",
        "date_of_death": death_date.isoformat(),
        "civil_registration_prompted": True,
        "created_at": now.isoformat(),
        "biometric_verified": True
    }

    db.insert("verbal_autopsies", va_record)
    logger.info("Successfully seeded linked Verbal Autopsy for Babulal Yadav (%s).", va_id)
    logger.info("Database seeding completed successfully! Total 30 reports + 1 VA.")


if __name__ == "__main__":
    run_seed()